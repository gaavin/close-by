import {
  LoaderFunctionArgs,
  type MetaFunction,
  defer,
} from "@remix-run/cloudflare";
import { Await, useLoaderData } from "@remix-run/react";
import { Suspense } from "react";

import { ScrollArea } from "~/components/ui/scroll-area";
import { withPagination } from "~/lib/db/queries";

export const meta: MetaFunction = () => {
  return [
    { title: "Products Route" },
    {
      name: "description",
      content: "Welcome to Remix on Cloudflare!",
    },
  ];
};

// 👇 This function is a loader that runs on the backend, and is *not* bundled with the client
// We intentionally avoid an arrow function here, since types seem to be inferred incorrectly in useLoaderData otherwise
export function loader({ context }: LoaderFunctionArgs) {
  const { queries } = context;

  const products = withPagination(queries.products, {
    page: 1,
    pageSize: 5,
  }).all();

  // 🚀 Here we return our database query promises which can be resolved on the frontend
  // We can use a suspense boundary or use() to resolve the promises
  // https://remix.run/docs/en/main/guides/streaming
  return defer({ products });
}

export default function ProductsRoute() {
  const { products } = useLoaderData<typeof loader>();

  return (
    <ScrollArea className="flex flex-col gap-[5rem]">
      <Suspense>
        <Await resolve={products}>
          {(products) => {
            return products.map((product) => {
              return <div key={product.id}>{product.name}</div>;
            });
          }}
        </Await>
      </Suspense>
    </ScrollArea>
  );
}
