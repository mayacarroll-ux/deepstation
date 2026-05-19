"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createBudgetMapping,
  deleteBudgetMapping,
  updateBudgetMapping
} from "@/lib/services/time-tracking";
import {
  ensureCurrentUserExists,
  getCurrentWorkbookOwnerId
} from "@/lib/services/current-user";

export async function createBudgetMappingAction(formData: FormData) {
  const ownerId = await getCurrentWorkbookOwnerId();

  await ensureCurrentUserExists();
  await createBudgetMapping(ownerId, formData);
  revalidatePath("/budget-key");
}

export async function updateBudgetMappingAction(budgetMappingId: string, formData: FormData) {
  const ownerId = await getCurrentWorkbookOwnerId();

  await ensureCurrentUserExists();
  await updateBudgetMapping(ownerId, budgetMappingId, formData);
  revalidatePath("/budget-key");
  redirect("/budget-key");
}

export async function deleteBudgetMappingAction(budgetMappingId: string) {
  const ownerId = await getCurrentWorkbookOwnerId();

  await ensureCurrentUserExists();
  await deleteBudgetMapping(ownerId, budgetMappingId);
  revalidatePath("/budget-key");
}
