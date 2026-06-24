import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginTailwindcss } from "@rsbuild/plugin-tailwindcss";
import { tanstackStart } from "@tanstack/react-start/plugin/rsbuild";
import { cloudflareMiniflare } from "./plugins/cloudflare-miniflare";

export default defineConfig({
	plugins: [
		// NOTE: reactCompiler is disabled because @rsbuild/plugin-react requires
		// @rspack/core >= 2.1.0, which no published @rsbuild/core ships yet
		// (2.0.15 pins ~2.0.8). Re-enable once the rsbuild/rspack stack catches up.
		pluginReact(),
		pluginTailwindcss(),
		tanstackStart({
			rsc: { enabled: true },
			// We serve SSR through Miniflare/workerd, not TanStack's Node middleware.
			rsbuild: { installDevServerMiddleware: false },
		}),
		// Must come last so its SSR (workerd) overrides win the config merge.
		cloudflareMiniflare(),
	],
});
