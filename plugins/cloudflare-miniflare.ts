import * as fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { builtinModules, createRequire } from "node:module";
import * as path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { RsbuildPlugin } from "@rsbuild/core";
import type {
	Log as LogType,
	Miniflare,
	MiniflareOptions,
	Request as MiniflareRequest,
} from "miniflare";
import type { Unstable_Config } from "wrangler";

type MiniflareModule = typeof import("miniflare");
type WranglerModule = typeof import("wrangler");

export interface CloudflareMiniflareOptions {
	/** Path to the Wrangler config, relative to the project root. */
	configPath?: string;
	/** Name of the TanStack Start server (worker) environment. */
	environmentName?: string;
	/** Cloudflare environment (wrangler env) to load. */
	cloudflareEnv?: string;
	/** Disable local state persistence, or override its directory. */
	persistState?: boolean | { path: string };
	/** Inspector port for the Worker, or `false` to disable. */
	inspectorPort?: number | false;
}

const SSR_ENVIRONMENT_NAME = "ssr";

const CLOUDFLARE_BUILTIN_MODULES = [
	"cloudflare:email",
	"cloudflare:node",
	"cloudflare:sockets",
	"cloudflare:workers",
	"cloudflare:workflows",
];

/**
 * External module map for the Workers build. Node built-ins are provided at
 * runtime by the `nodejs_compat` flag and Cloudflare runtime modules by
 * workerd itself, so both are externalized as ESM imports (`module <id>`)
 * instead of being bundled into the worker.
 */
const WORKERD_EXTERNALS: Record<string, string> = (() => {
	const externals: Record<string, string> = {};
	for (const moduleName of CLOUDFLARE_BUILTIN_MODULES) {
		externals[moduleName] = `module ${moduleName}`;
	}
	for (const name of builtinModules) {
		externals[name] = `module node:${name}`;
		externals[`node:${name}`] = `module node:${name}`;
	}
	return externals;
})();

/**
 * Resolve conditions that mirror the Cloudflare Workers runtime so packages
 * pick their workerd/browser builds instead of Node builds. The RSC `rsc`
 * layer added by TanStack Start extends this list with `react-server` via the
 * `"..."` token in its own rule.
 */
const WORKERD_CONDITION_NAMES = [
	"workerd",
	"worker",
	"browser",
	"module",
	"import",
	"require",
	"default",
];

/**
 * Load `miniflare`/`wrangler` via Node's native `require`, bypassing jiti's
 * loader. jiti both mis-resolves their CommonJS interop on a static import and
 * cannot service a dynamic `import()` (no VM import callback) when it evaluates
 * the config. Both packages are CommonJS, so `createRequire` loads them safely.
 */
const requireFromHere = createRequire(import.meta.url);
const loadMiniflare = (): MiniflareModule =>
	requireFromHere("miniflare") as MiniflareModule;
const loadWrangler = (): WranglerModule =>
	requireFromHere("wrangler") as WranglerModule;

async function toRequest(req: IncomingMessage): Promise<MiniflareRequest> {
	const { Request } = await loadMiniflare();
	const host = req.headers.host ?? "localhost";
	const protocol =
		(req.socket as { encrypted?: boolean }).encrypted === true
			? "https"
			: "http";
	const url = new URL(req.url ?? "/", `${protocol}://${host}`);
	const headers: [string, string][] = [];
	for (const [key, value] of Object.entries(req.headers)) {
		if (value === undefined) continue;
		if (Array.isArray(value)) {
			for (const item of value) headers.push([key, item]);
		} else {
			headers.push([key, value]);
		}
	}
	if (host && !headers.some(([k]) => k.toLowerCase() === "x-forwarded-host")) {
		headers.push(["x-forwarded-host", host]);
	}
	return new Request(url, {
		method: req.method,
		headers,
		body:
			req.method === "GET" || req.method === "HEAD"
				? undefined
				: (Readable.toWeb(req) as never),
		duplex: "half",
	});
}

async function writeResponse(
	res: ServerResponse,
	response: Response,
): Promise<void> {
	res.statusCode = response.status;
	res.statusMessage = response.statusText;
	const setCookies = response.headers.getSetCookie();
	if (setCookies.length > 0) res.setHeader("set-cookie", setCookies);
	response.headers.forEach((value, key) => {
		if (key.toLowerCase() === "set-cookie") return;
		res.setHeader(key, value);
	});
	if (!response.body) {
		res.end();
		return;
	}
	await pipeline(Readable.fromWeb(response.body as never), res);
}

class MiniflareController {
	#miniflare: Miniflare | undefined;

	async startOrUpdate(options: MiniflareOptions): Promise<void> {
		if (this.#miniflare) {
			await this.#miniflare.setOptions(options);
		} else {
			const { Miniflare } = await loadMiniflare();
			this.#miniflare = new Miniflare(options);
		}
	}

	async dispatchFetch(request: MiniflareRequest): Promise<Response> {
		if (!this.#miniflare) {
			return new Response("Cloudflare Worker is still compiling.", {
				status: 503,
			});
		}
		return this.#miniflare.dispatchFetch(request as never, {
			redirect: "manual",
		}) as unknown as Promise<Response>;
	}

	async dispose(): Promise<void> {
		await this.#miniflare?.dispose();
		this.#miniflare = undefined;
	}
}

function listFiles(rootPath: string, currentPath = ""): string[] {
	const absolutePath = path.join(rootPath, currentPath);
	return fs.readdirSync(absolutePath, { withFileTypes: true }).flatMap((d) => {
		const modulePath = path.join(currentPath, d.name);
		if (d.isDirectory()) return listFiles(rootPath, modulePath);
		return d.isFile() ? [modulePath] : [];
	});
}

function getWorkerModules(mainPath: string) {
	const rootPath = path.dirname(mainPath);
	const entryPath = path.basename(mainPath);
	const additional = fs.existsSync(rootPath)
		? listFiles(rootPath).filter(
				(p) => p !== entryPath && (p.endsWith(".js") || p.endsWith(".mjs")),
			)
		: [];
	return {
		rootPath,
		modules: [
			{ type: "ESModule" as const, path: entryPath },
			...additional.map((p) => ({ type: "ESModule" as const, path: p })),
		],
	};
}

function getPersistenceRoot(
	root: string,
	persistState: CloudflareMiniflareOptions["persistState"],
): string | undefined {
	if (persistState === false) return undefined;
	const dir =
		typeof persistState === "object" ? persistState.path : ".wrangler/state";
	return path.resolve(root, dir, "v3");
}

async function createMiniflareOptions(
	wranglerConfig: Unstable_Config,
	mainPath: string,
	opts: {
		root: string;
		cloudflareEnv?: string;
		persistState: CloudflareMiniflareOptions["persistState"];
		inspectorPort?: number | false;
	},
): Promise<MiniflareOptions> {
	const [{ Log, LogLevel }, { unstable_getMiniflareWorkerOptions }] =
		await Promise.all([loadMiniflare(), loadWrangler()]);

	const runtimeConfig: Unstable_Config = {
		...wranglerConfig,
		main: mainPath,
		no_bundle: true,
		rules: [{ type: "ESModule", globs: ["**/*.js", "**/*.mjs"] }],
		// Static assets are served by the Rsbuild dev middleware, not Miniflare.
		assets: undefined as never,
	};

	const miniflareWorkerOptions = unstable_getMiniflareWorkerOptions(
		runtimeConfig,
		opts.cloudflareEnv,
	);
	const { modulesRules: _modulesRules, ...workerOptions } =
		miniflareWorkerOptions.workerOptions;

	const worker = {
		...workerOptions,
		name: workerOptions.name ?? wranglerConfig.name ?? "worker",
		...getWorkerModules(mainPath),
	};

	const log: LogType = new Log(LogLevel.WARN);

	return {
		log,
		inspectorPort:
			opts.inspectorPort === false ? undefined : opts.inspectorPort,
		defaultPersistRoot: getPersistenceRoot(opts.root, opts.persistState),
		telemetry: { enabled: false },
		workers: [worker, ...miniflareWorkerOptions.externalWorkers],
	} as MiniflareOptions;
}

/**
 * Bridges TanStack Start's rsbuild `ssr` environment with the Cloudflare
 * Workers runtime:
 *
 * - Emits the `ssr` environment as an ESM module worker with `cloudflare:*`
 *   and Node built-ins (via `nodejs_compat`) left external and workerd resolve
 *   conditions applied.
 * - In dev, runs the compiled `ssr` bundle inside Miniflare and proxies
 *   requests to it, so `cloudflare:workers` bindings (e.g. D1) work locally.
 *
 * Must be registered AFTER `tanstackStart()` so its config overrides win the
 * merge for the `ssr` environment.
 */
export function cloudflareMiniflare(
	options: CloudflareMiniflareOptions = {},
): RsbuildPlugin {
	const ssrEnvName = options.environmentName ?? SSR_ENVIRONMENT_NAME;
	const persistState = options.persistState ?? true;
	const miniflareController = new MiniflareController();

	let root = process.cwd();
	let wranglerConfigPath = "wrangler.jsonc";

	return {
		name: "cloudflare-miniflare",
		setup(api) {
			root = api.context.rootPath;
			wranglerConfigPath = path.resolve(
				root,
				options.configPath ?? "wrangler.jsonc",
			);

			// Configure the SSR environment for the Workers runtime. We keep
			// the `node` target (TanStack's default) so Node built-ins resolve
			// as externals provided by `nodejs_compat`, instead of erroring as
			// they do under the `web-worker` target. The worker is still emitted
			// as an ESM module (see modifyRspackConfig below).
			api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
				return mergeRsbuildConfig(config, {
					environments: {
						[ssrEnvName]: {
							output: {
								// Cloudflare runtime + Node built-ins (via
								// nodejs_compat) are provided at runtime.
								externals: WORKERD_EXTERNALS,
							},
							resolve: {
								conditionNames: WORKERD_CONDITION_NAMES,
							},
						},
					},
					dev: {
						// Miniflare reads the compiled worker from disk.
						writeToDisk: true,
					},
					server: {
						// The returned callback registers our proxy AFTER
						// rsbuild's built-in asset middleware, so client JS/CSS
						// are served directly and only SSR/server-fn/page
						// requests fall through to the Worker in Miniflare.
						setup: ({ server }) => {
							return () => {
								server.middlewares.use(
									async (req, res, next) => {
										try {
											const request = await toRequest(
												req as IncomingMessage,
											);
											const response =
												await miniflareController.dispatchFetch(
													request,
												);
											await writeResponse(
												res as ServerResponse,
												response,
											);
										} catch (error) {
											next(error);
										}
									},
								);
							};
						},
					},
				});
			});

			api.modifyRspackConfig((rspackConfig, utils) => {
				if (utils.environment.name !== ssrEnvName) return;

				rspackConfig.externalsType = "module";
				rspackConfig.experiments ??= {};
				(rspackConfig.experiments as { outputModule?: boolean }).outputModule =
					true;
				rspackConfig.output ??= {};
				rspackConfig.output.module = true;
				rspackConfig.output.chunkFormat = "module";
				rspackConfig.output.chunkLoading = "import";
				rspackConfig.output.workerChunkLoading = "import";
				rspackConfig.output.library = { type: "module" };
				rspackConfig.optimization ??= {};
				rspackConfig.optimization.runtimeChunk = false;
			});

			const resolveSsrEntry = (): string => {
				const config = api.getRsbuildConfig();
				const distPath = config.environments?.[ssrEnvName]?.output?.distPath;
				const distRoot =
					typeof distPath === "string" ? distPath : distPath?.root;
				const resolvedRoot = distRoot
					? path.resolve(root, distRoot)
					: path.resolve(root, "dist/server");
				return path.join(resolvedRoot, "index.js");
			};

			api.onAfterDevCompile(async ({ environments }) => {
				if (!environments[ssrEnvName]) return;
				const mainPath = resolveSsrEntry();
				if (!fs.existsSync(mainPath)) return;
				const { unstable_readConfig } = await loadWrangler();
				const wranglerConfig = unstable_readConfig(
					{ config: wranglerConfigPath, env: options.cloudflareEnv },
					{ preserveOriginalMain: true },
				);
				await miniflareController.startOrUpdate(
					await createMiniflareOptions(wranglerConfig, mainPath, {
						root,
						cloudflareEnv: options.cloudflareEnv,
						persistState,
						inspectorPort: options.inspectorPort,
					}),
				);
			});

			api.onCloseDevServer(async () => {
				await miniflareController.dispose();
			});
		},
	};
}
