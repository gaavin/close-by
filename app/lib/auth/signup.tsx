import { DrizzleD1Database } from "drizzle-orm/d1";
import { hashPassword } from "~/lib/auth/hashing";
import * as schema from "~/lib/schema";

export const signup = async ({
  drizzle,
  email,
  password,
}: {
  drizzle: DrizzleD1Database<typeof schema>;
  email: string;
  password: string;
}) => {
  const hashedPassword = await hashPassword(password);
  return await drizzle
    .insert(schema.users)
    .values({
      email,
      passwordHash: hashedPassword,
    })
    .returning();
};
