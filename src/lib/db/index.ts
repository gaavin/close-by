import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/lib/db/schema";

const db = drizzle(env.d1, { schema });

export { db, schema };
