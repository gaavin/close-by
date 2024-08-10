import { LoaderFunction, json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { eq } from "drizzle-orm";

import * as schema from "~/lib/schema";

// 👇 This runs on the backend, and state is not shared with the client
export const loader: LoaderFunction = async ({ context, params }) => {
  const { drizzle } = context;
  const product = await drizzle.query.products.findFirst({
    where: eq(schema.products.id, Number(params.id)),
  });

  // ⏳ A loader function should return a ReturnType<RRLoaderFunction> ,
  // ♨️ which can be a json object, a redirect, deferred data - useDeferredValue,
  //) - which is a promise that gets awaired in a React Suspense on the frontend
  return json({ product });
};

export const ProductRoute = () => {
  const { product } = useLoaderData<typeof loader>();

  return (
    <div key={product.id}>
      <div>{product.name}</div>
      <div>{product.price}</div>
      <Link to={product.id.toString()}>View</Link>
    </div>
  );
};
