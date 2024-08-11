import { SQLiteSelect } from "drizzle-orm/sqlite-core";

import { schema } from "./schema";
import type { Database, PaginationOptions } from "./types";

export const withPagination = <T extends SQLiteSelect>(
  qb: T,
  options?: PaginationOptions
) => {
  return options
    ? qb.limit(options.pageSize).offset((options.page - 1) * options.pageSize)
    : qb;
};

export const queryFactory = (db: Database) => ({
  users: db.select().from(schema.users).$dynamic(),
  products: db.select().from(schema.products).$dynamic(),
});
