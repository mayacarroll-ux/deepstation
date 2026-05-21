"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  ensureCurrentUserExists,
  getCurrentWorkbookOwnerId
} from "@/lib/services/current-user";
import { createRecurringTemplateFromTimeEntry } from "@/lib/services/recurring";
import {
  createTimeEntry,
  deleteTimeEntry,
  updateTimeEntry
} from "@/lib/services/time-tracking";

export async function createTimeEntryAction(formData: FormData) {
  const ownerId = await getCurrentWorkbookOwnerId();

  await ensureCurrentUserExists();
  await createTimeEntry(ownerId, formData);
  revalidatePath("/dashboard");
  revalidatePath("/time-entries");
  revalidatePath("/weekly-summary");
  revalidatePath("/workday");
  redirect("/time-entries");
}

export async function updateTimeEntryAction(timeEntryId: string, formData: FormData) {
  const ownerId = await getCurrentWorkbookOwnerId();

  await ensureCurrentUserExists();
  await updateTimeEntry(ownerId, timeEntryId, formData);
  revalidatePath("/dashboard");
  revalidatePath("/time-entries");
  revalidatePath("/weekly-summary");
  revalidatePath("/workday");
  redirect("/time-entries");
}

export async function deleteTimeEntryAction(timeEntryId: string) {
  const ownerId = await getCurrentWorkbookOwnerId();

  await ensureCurrentUserExists();
  await deleteTimeEntry(ownerId, timeEntryId);
  revalidatePath("/dashboard");
  revalidatePath("/time-entries");
  revalidatePath("/weekly-summary");
  revalidatePath("/workday");
}

function redirectBackWithStatus(returnToPath: string, statusKey: string, statusValue: string) {
  const separator = returnToPath.includes("?") ? "&" : "?";

  redirect(`${returnToPath}${separator}${statusKey}=${statusValue}`);
}

export async function makeRecurringTemplateAction(timeEntryId: string, formData: FormData) {
  const ownerId = await getCurrentWorkbookOwnerId();
  const returnToPath = String(formData.get("returnTo") ?? "/time-entries");

  await ensureCurrentUserExists();
  const result = await createRecurringTemplateFromTimeEntry(ownerId, timeEntryId);
  revalidatePath("/dashboard");
  revalidatePath("/time-entries");
  revalidatePath("/weekly-summary");
  revalidatePath("/workday");
  revalidatePath("/recurring");

  redirectBackWithStatus(
    returnToPath,
    "recurringTemplateStatus",
    result.created ? "created" : "existing"
  );
}
