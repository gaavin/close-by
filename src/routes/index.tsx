import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: App });

function App() {
	return (
		<main>
			<h1>Close By</h1>
		</main>
	);
}
