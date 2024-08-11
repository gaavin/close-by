import { sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export * as schema from "./schema";

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (users) => ({
    ixId: uniqueIndex("ix_users_id").on(users.id),
    ixEmail: uniqueIndex("ix_users_email").on(users.email),
  })
);

export const products = sqliteTable(
  "products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    price: integer("price").notNull(),
  },
  (products) => ({
    ixId: uniqueIndex("ix_products_id").on(products.id),
  })
);
