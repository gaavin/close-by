import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { BackendResponseError, BackendResponseSuccess } from "~/lib/types";
import * as schema from "~/lib/schema";
import { verifyPassword } from "./hashing";

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
    return {
      success: false,
      message: "User not found",
    } satisfies BackendResponseError;
  }

  if (!verifyPassword({ password, storedHash: user.passwordHash })) {
    return {
      success: false,
      message: "Invalid password",
    } satisfies BackendResponseError;
  }

  return {
    success: true,
    message: "Logged in successfully",
    data: user,
  } satisfies BackendResponseSuccess<typeof user>;
};