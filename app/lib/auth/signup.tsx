import { DrizzleD1Database } from "drizzle-orm/d1";

import { hashPassword } from "~/lib/auth/hashing";
import { schema } from "~/lib/db/schema";

export const signup = async ({
  drizzle,
  email,
  password,
}: {
  drizzle: DrizzleD1Database<typeof schema>;
  email: string;
  password: string;
}) =>
  drizzle
    .insert(schema.users)
    .values({
      email,
      passwordHash: await hashPassword(password),
    })
    .returning();
