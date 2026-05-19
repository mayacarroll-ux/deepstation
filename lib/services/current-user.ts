import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { database } from "@/db";
import { users } from "@/db/schema";
import { assertProductionServerEnvironment, isProduction } from "@/lib/config";

export const singleUserId = "single-user";

export async function getCurrentWorkbookOwnerId() {
  if (!isProduction) {
    return singleUserId;
  }

  assertProductionServerEnvironment();

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user.id;
}

export async function requireCurrentWorkbookOwnerId() {
  const ownerId = await getCurrentWorkbookOwnerId();

  if (!ownerId) {
    throw new Error("A signed-in user is required for this workflow.");
  }

  return ownerId;
}

export async function ensureCurrentUserExists() {
  if (isProduction) {
    return;
  }

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
    name: "Maya Carroll",
    email: "single-user@deepstation.local"
  });
}
