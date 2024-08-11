import { DrizzleD1Database } from "drizzle-orm/d1";

import { schema } from "./schema";

export type Database = DrizzleD1Database<typeof schema>;

export type PaginationOptions = {
  page: number;
  pageSize: number;
};