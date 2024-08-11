import { SQLiteSelect } from "drizzle-orm/sqlite-core";

import { schema } from "./schema";
import type { Database, PaginationOptions } from "./types";

export const withPagination = <T extends SQLiteSelect>(
  qb: T,
  options?: PaginationOptions
) => {
  return options
    ? qb.limit(options.limit).offset((options.page - 1) * options.limit)
    : qb;
};

export const queryFactory = (request: Request, db: Database) => {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page")) || undefined;
  const limit = Number(searchParams.get("limit")) || undefined;

  const paginationOptions =
    page && limit
      ? {
          page,
          limit,
        }
      : (undefined satisfies PaginationOptions | undefined);

  return {
    getUsers: withPagination(
      db.select().from(schema.users).$dynamic(),
      paginationOptions
    )
      .prepare()
      .all(),
    getProducts: withPagination(
      db.select().from(schema.products).$dynamic(),
      paginationOptions
    )
      .prepare()
      .all(),
  };
};
