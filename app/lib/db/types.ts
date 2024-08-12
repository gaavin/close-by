import { DrizzleD1Database } from "drizzle-orm/d1";

import { queryFactory } from "./queries";
import { schema } from "./schema";

export type Database = DrizzleD1Database<typeof schema>;

export type PaginationOptions = {
  page: number;
  limit: number;
};

export type Queries = ReturnType<typeof queryFactory>;
