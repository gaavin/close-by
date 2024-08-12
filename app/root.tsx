import { LoaderFunctionArgs, defer } from "@remix-run/cloudflare";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { createContext, useContext } from "react";
import invariant from "tiny-invariant";

import { Queries } from "~/lib/db/types";
import "~/tailwind.css";

const QueryContext = createContext<Queries | undefined>(undefined);

export const useQueries = () => {
  const queries = useContext(QueryContext);
  invariant(queries, "useQuery must be used within a QueryContext");
  return queries;
};

export function loader({ context }: LoaderFunctionArgs) {
  const queries: Queries = context.queries;

  // 🚀 Here we return our database query promises which can be resolved on the frontend
  // Use a suspense boundary or use() resolve the data
  // https://remix.run/docs/en/main/guides/streaming
  return defer({ ...queries });
}

export const Layout = ({ children }: { children: React.ReactNode }) => {
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

export default function App() {
  const queries = useLoaderData<typeof loader>();
  return (
    <QueryContext.Provider value={queries}>
      <Outlet />
    </QueryContext.Provider>
  );
}
