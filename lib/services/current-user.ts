import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { database } from "@/db";
import { users } from "@/db/schema";
import { assertProductionServerEnvironment, isProduction } from "@/lib/config";
import { singleUserEmail, singleUserId, singleUserName } from "@/lib/constants";

export async function getCurrentWorkbookOwnerId() {
  if (!isProduction) {
    return singleUserId;
  }

  assertProductionServerEnvironment();

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return singleUserId;
}

export async function requireCurrentWorkbookOwnerId() {
  const ownerId = await getCurrentWorkbookOwnerId();

  if (!ownerId) {
    throw new Error("A signed-in user is required for this workflow.");
  }

  return ownerId;
}

export async function ensureCurrentUserExists() {
  await ensureSingleUserExists();
}

export async function ensureSingleUserExists() {
  if (!database) {
    return;
  }

  const [existingUser] = await database
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, singleUserId))
    .limit(1);

  if (existingUser) {
    return;
  }

  await database.insert(users).values({
    id: singleUserId,
    name: singleUserName,
    email: singleUserEmail
  });
}
