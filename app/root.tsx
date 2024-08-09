import {
  LoaderFunction,
  LoaderFunctionArgs,
  defer,
} from "@remix-run/cloudflare";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import {
  PreventFlashOnWrongTheme,
  ThemeProvider,
  useTheme,
} from "remix-themes";
import clsx from "clsx";

import "~/tailwind.css";
import { themeSessionResolver } from "./sessions.server";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const { getTheme } = await themeSessionResolver(context);
  return {
    theme: getTheme(),
  };
};

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const loaderData = useLoaderData<typeof loader>();
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
};

const App = () => {
  return <Outlet />;
};

export default App;
