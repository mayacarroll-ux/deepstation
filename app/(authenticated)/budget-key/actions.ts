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

function getReturnToPath(formData: FormData) {
  return String(formData.get("returnTo") ?? "/budget-key");
}

function redirectBackWithStatus(returnToPath: string, status: string, message?: string) {
  const queryParameters = new URLSearchParams();
  queryParameters.set("budgetKeyStatus", status);

  if (message) {
    queryParameters.set("budgetKeyMessage", message);
  }

  const separator = returnToPath.includes("?") ? "&" : "?";

  redirect(`${returnToPath}${separator}${queryParameters.toString()}`);
}

export async function createBudgetMappingAction(formData: FormData) {
  const ownerId = await getCurrentWorkbookOwnerId();
  const returnToPath = getReturnToPath(formData);

  await ensureCurrentUserExists();
  const result = await createBudgetMapping(ownerId, formData);
  revalidatePath("/budget-key");
  redirectBackWithStatus(
    returnToPath,
    result.duplicate ? "duplicate" : "created",
    result.duplicate ? "This budget key already exists." : "Budget key created."
  );
}

export async function updateBudgetMappingAction(budgetMappingId: string, formData: FormData) {
  const ownerId = await getCurrentWorkbookOwnerId();
  const returnToPath = getReturnToPath(formData);

  await ensureCurrentUserExists();
  const result = await updateBudgetMapping(ownerId, budgetMappingId, formData);
  revalidatePath("/budget-key");
  redirectBackWithStatus(
    returnToPath,
    result.duplicate ? "duplicate" : "updated",
    result.duplicate ? "This budget key already exists." : "Budget key updated."
  );
}

export async function deleteBudgetMappingAction(budgetMappingId: string, formData: FormData) {
  const ownerId = await getCurrentWorkbookOwnerId();
  const returnToPath = getReturnToPath(formData);

  await ensureCurrentUserExists();
  await deleteBudgetMapping(ownerId, budgetMappingId);
  revalidatePath("/budget-key");
  redirectBackWithStatus(returnToPath, "deleted", "Budget key deleted.");
}
