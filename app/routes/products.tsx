import {
  type LoaderFunction,
  type MetaFunction,
  json,
} from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";

import { ScrollArea } from "~/components/ui/scroll-area";
import * as schema from "~/lib/schema";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    {
      name: "description",
      content: "Welcome to Remix on Cloudflare!",
    },
  ];
};

export const loader: LoaderFunction = async ({ context }) => {
  const { drizzle } = context;
  const products = await drizzle.query.products.findMany();
  return json({ products });
};

const ProductsRoute = () => {
  const {products} = useLoaderData<typeof loader>();

  return (
    <ScrollArea className="flex flex-col gap-[5rem]">
      {products.map((product) => (
        <div key={product.id}>
          <div>{product.name}</div>
          <div>{product.price}</div>
          <Link to={product.id.toString()}>View</Link>
        </div>
      ))}
    </ScrollArea>
  );
};

export default ProductsRoute;
