import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { defaults } from "@/lib/db/schema/helpers";

export const users = sqliteTable("users", {
	...defaults,
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" })
		.notNull()
		.default(false),
	emailVerificationToken: text("email_verification_token").notNull(),
	passwordHash: text("password_hash").notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
});
