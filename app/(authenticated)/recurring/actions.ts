"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  ensureCurrentUserExists,
  getCurrentWorkbookOwnerId
} from "@/lib/services/current-user";
import {
  applyRecurringTemplates,
  createRecurringTemplate,
  setRecurringTemplateActive,
  updateRecurringTemplate
} from "@/lib/services/recurring";

function getSearchParamValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function getSelectedWeekNumber(formData: FormData) {
  const weekNumber = Number(getSearchParamValue(formData, "week"));

  return Number.isInteger(weekNumber) && weekNumber >= 1 && weekNumber <= 53 ? weekNumber : 1;
}

function getSelectedWeekYear(formData: FormData) {
  const weekYear = Number(getSearchParamValue(formData, "year"));

  return Number.isInteger(weekYear) && weekYear >= 2000 && weekYear <= 2100
    ? weekYear
    : new Date().getFullYear();
}

function getReturnToPath(formData: FormData) {
  const returnToPath = getSearchParamValue(formData, "returnTo");

  return returnToPath.startsWith("/") ? returnToPath : "/time-entries";
}

export async function createRecurringTemplateAction(formData: FormData) {
  const ownerId = await getCurrentWorkbookOwnerId();
  const returnToPath = getReturnToPath(formData);

  await ensureCurrentUserExists();
  await createRecurringTemplate(ownerId, formData);
  revalidatePath("/recurring");
  revalidatePath("/time-entries");
  redirect(returnToPath);
}

export async function updateRecurringTemplateAction(templateId: string, formData: FormData) {
  const ownerId = await getCurrentWorkbookOwnerId();
  const returnToPath = getReturnToPath(formData);

  await ensureCurrentUserExists();
  await updateRecurringTemplate(ownerId, templateId, formData);
  revalidatePath("/recurring");
  revalidatePath("/time-entries");
  redirect(returnToPath);
}

export async function toggleRecurringTemplateActiveAction(templateId: string, formData: FormData) {
  const ownerId = await getCurrentWorkbookOwnerId();
  const isActive = formData.get("isActive") === "true";
  const returnToPath = getReturnToPath(formData);

  await ensureCurrentUserExists();
  await setRecurringTemplateActive(ownerId, templateId, isActive);
  revalidatePath("/recurring");
  revalidatePath("/time-entries");
  redirect(returnToPath);
}

export async function applyRecurringTemplatesAction(formData: FormData) {
  const ownerId = await getCurrentWorkbookOwnerId();
  const selectedWeekNumber = getSelectedWeekNumber(formData);
  const selectedWeekYear = getSelectedWeekYear(formData);
  const returnToPath = getReturnToPath(formData);

  await ensureCurrentUserExists();
  const applyResult = await applyRecurringTemplates(ownerId, selectedWeekNumber, selectedWeekYear);
  revalidatePath("/dashboard");
  revalidatePath("/time-entries");
  revalidatePath("/weekly-summary");
  revalidatePath("/workday");
  revalidatePath("/recurring");
  redirect(
    `${returnToPath}?recurringWeek=${applyResult.selectedWeekNumber}&recurringYear=${applyResult.selectedWeekYear}&recurringAdded=${applyResult.insertedCount}&recurringSkipped=${applyResult.skippedCount}`
  );
}
