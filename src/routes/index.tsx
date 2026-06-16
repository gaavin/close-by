import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { renderServerComponent } from "@tanstack/react-start/rsc";

const getRscIntro = createServerFn().handler(async () => {
	const Intro = await renderServerComponent(
		<p>This paragraph was rendered as a React Server Component.</p>,
	);

	return { Intro };
});

export const Route = createFileRoute("/")({
	loader: async () => getRscIntro(),
	component: Index,
});

function Index() {
	const { Intro } = Route.useLoaderData();

	return (
		<main>
			<h1>Close By</h1>
			{Intro}
		</main>
	);
}
