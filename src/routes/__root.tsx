import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { createServerFn } from "@tanstack/react-start";
import {
	CompositeComponent,
	createCompositeComponent,
} from "@tanstack/react-start/rsc";
import type { ReactNode } from "react";
import styles from "@/styles.css?url";

const getRootDocument = createServerFn().handler(async () => {
	const src = await createCompositeComponent(
		(props: { children?: ReactNode; HeadContent: () => ReactNode }) => (
			<html lang="en">
				<head>{props.HeadContent()}</head>
				<body>{props.children}</body>
			</html>
		),
	);

	return { src };
});

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Close By",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: styles,
			},
		],
	}),
	loader: async () => getRootDocument(),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	const { src } = Route.useLoaderData();

	return (
		<CompositeComponent src={src} HeadContent={() => <HeadContent />}>
			{children}
			<TanStackDevtools
				config={{
					position: "bottom-right",
				}}
				plugins={[
					{
						name: "Tanstack Router",
						render: <TanStackRouterDevtoolsPanel />,
					},
				]}
			/>
			<Scripts />
		</CompositeComponent>
	);
}
