import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import { integer, text } from "drizzle-orm/sqlite-core";

export const defaults = {
	id: text("id")
		.$defaultFn(() => createId())
		.primaryKey()
		.notNull(),
	createdAt: integer("created_at", { mode: "timestamp" })
		.default(sql`(CURRENT_TIMESTAMP)`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.default(sql`(CURRENT_TIMESTAMP)`)
		.notNull(),
};
