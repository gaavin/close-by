import {
  type LoaderFunction,
  type MetaFunction,
  json,
} from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";

import { ScrollArea } from "~/components/ui/scroll-area";

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

const Index = () => {
  const loaderData = useLoaderData<typeof loader>();
};

export default Index;
