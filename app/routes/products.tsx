import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { defer } from "@remix-run/cloudflare";
import { Await, useLoaderData } from "@remix-run/react";
import { Suspense } from "react";

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
  const { getProducts } = queries;

  // 🚀 Here we return our database query promises which can be resolved on the frontend
  // Use a suspense boundary or use() resolve the data
  // https://remix.run/docs/en/main/guides/streaming
  return defer({ getProducts });
}

export default function ProductsRoute() {
  const { getProducts } = useLoaderData<typeof loader>();

  return (
    <div className="p-5 flex flex-row gap-10 w-min whitespace-nowrap rounded-md border">
      <Suspense>
        <Await resolve={getProducts}>
          {(products) =>
            products.map((product) => (
              <div key={product.id} className="flex flex-col gap-1">
                <div className="text-xl">{product.name}</div>
                <div className="text-md">{product.description}</div>
                <div className="text-md font-bold">${product.price}</div>
              </div>
            ))
          }
        </Await>
      </Suspense>
    </div>
  );
}
