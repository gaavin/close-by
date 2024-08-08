import { AppLoadContext } from "@remix-run/cloudflare";
import { DrizzleD1Database, drizzle } from "drizzle-orm/d1";
import { type PlatformProxy } from "wrangler";

import * as schema from "./app/lib/schema";

type Cloudflare = Omit<PlatformProxy<Env>, "dispose">;

declare module "@remix-run/cloudflare" {
  interface AppLoadContext {
    cloudflare: Cloudflare;
    drizzle: DrizzleD1Database<typeof schema>;
  }
}

type GetLoadContext = (args: {
  request: Request;
  context: { cloudflare: Cloudflare }; // load context _before_ augmentation
}) => AppLoadContext;

// Shared implementation compatible with Vite, Wrangler, and Cloudflare Pages
export const getLoadContext: GetLoadContext = ({ context }) => {
  return {
    ...context,
    drizzle: drizzle(context.cloudflare.env.DB, {
      schema,
    }),
  };
};
