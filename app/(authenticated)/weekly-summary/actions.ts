"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  ensureCurrentUserExists,
  getCurrentWorkbookOwnerId
} from "@/lib/services/current-user";
import {
  saveWeeklySummaryEmailSettings,
  sendWeeklySummaryEmail,
  type WeeklySummaryEmailSendResult
} from "@/lib/services/weekly-summary-email";

function getSearchParamValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function getSelectedWeekNumber(formData: FormData) {
  const weekNumber = Number(getSearchParamValue(formData, "weekNumber"));

  return Number.isInteger(weekNumber) && weekNumber >= 1 && weekNumber <= 53 ? weekNumber : 1;
}

function getSelectedWeekYear(formData: FormData) {
  const weekYear = Number(getSearchParamValue(formData, "weekYear"));

  return Number.isInteger(weekYear) && weekYear >= 2000 && weekYear <= 2100
    ? weekYear
    : new Date().getFullYear();
}

function redirectBack(weekNumber: number, weekYear: number, emailStatus: string) {
  redirect(`/weekly-summary?week=${weekNumber}&year=${weekYear}&emailStatus=${emailStatus}`);
}

export async function saveWeeklySummaryEmailSettingsAction(formData: FormData) {
  const ownerId = await getCurrentWorkbookOwnerId();
  const weekNumber = getSelectedWeekNumber(formData);
  const weekYear = getSelectedWeekYear(formData);

  await ensureCurrentUserExists();

  try {
    await saveWeeklySummaryEmailSettings(ownerId, formData);
  } catch {
    redirectBack(weekNumber, weekYear, "settings-error");
  }

  revalidatePath("/weekly-summary");
  redirectBack(weekNumber, weekYear, "settings-saved");
}

export async function sendWeeklySummaryEmailAction(formData: FormData) {
  const ownerId = await getCurrentWorkbookOwnerId();
  const weekNumber = getSelectedWeekNumber(formData);
  const weekYear = getSelectedWeekYear(formData);
  const allowResend = formData.get("allowResend") === "true";

  await ensureCurrentUserExists();

  let sendResult: WeeklySummaryEmailSendResult | undefined;

  try {
    sendResult = await sendWeeklySummaryEmail(ownerId, weekNumber, weekYear, allowResend);
  } catch {
    redirectBack(weekNumber, weekYear, "send-error");
  }

  revalidatePath("/weekly-summary");

  if (sendResult?.duplicateBlocked) {
    redirectBack(weekNumber, weekYear, "needs-confirmation");
  }

  redirectBack(weekNumber, weekYear, "sent");
}
