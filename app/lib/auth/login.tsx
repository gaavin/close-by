import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";

import { verifyPassword } from "~/lib/auth/hashing";
import { schema } from "~/lib/db/schema";

export const login = async ({
  drizzle,
  email,
  password,
}: {
  drizzle: DrizzleD1Database<typeof schema>;
  email: string;
  password: string;
}) => {
  const user = await drizzle.query.users.findFirst({
    where: eq(schema.users.email, email),
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (!verifyPassword({ password, storedHash: user.passwordHash })) {
    throw new Error("Invalid password");
  }

  return user;
};
