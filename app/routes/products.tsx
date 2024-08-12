import type { MetaFunction } from "@remix-run/cloudflare";
import { Await } from "@remix-run/react";
import { Suspense } from "react";

import { useQueries } from "~/root";

export const meta: MetaFunction = () => {
  return [
    { title: "Products Route" },
    {
      name: "description",
      content: "Welcome to Remix on Cloudflare!",
    },
  ];
};

export default function ProductsRoute() {
  const { getProducts } = useQueries();
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
