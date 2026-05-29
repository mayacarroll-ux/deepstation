"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  ensureCurrentUserExists,
  getCurrentWorkbookOwnerId
} from "@/lib/services/current-user";
import {
  saveWeeklySummaryEmailSchedule,
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

function redirectBack(
  weekNumber: number,
  weekYear: number,
  emailStatus: string,
  view: string | undefined
) {
  const queryParameters = new URLSearchParams({
    week: String(weekNumber),
    year: String(weekYear),
    emailStatus
  });

  if (view) {
    queryParameters.set("view", view);
  }

  redirect(`/weekly-summary?${queryParameters.toString()}`);
}

function redirectBackWithError(
  weekNumber: number,
  weekYear: number,
  emailStatus: string,
  errorMessage: string,
  view: string | undefined
) {
  const queryParameters = new URLSearchParams({
    week: String(weekNumber),
    year: String(weekYear),
    emailStatus,
    emailError: errorMessage
  });

  if (view) {
    queryParameters.set("view", view);
  }

  redirect(`/weekly-summary?${queryParameters.toString()}`);
}

function redirectBackWithScheduleStatus(
  weekNumber: number,
  weekYear: number,
  scheduleStatus: string,
  scheduleError?: string,
  view?: string
) {
  const queryParameters = new URLSearchParams({
    week: String(weekNumber),
    year: String(weekYear),
    scheduleStatus
  });

  if (scheduleError) {
    queryParameters.set("scheduleError", scheduleError);
  }

  if (view) {
    queryParameters.set("view", view);
  }

  redirect(`/weekly-summary?${queryParameters.toString()}`);
}

function getSafeWeeklySummaryEmailErrorMessage(error: unknown) {
  const errorMessage = error instanceof Error ? error.message : "";

  if (errorMessage.includes("RESEND_API_KEY")) {
    return "Missing Resend API key.";
  }

  if (
    errorMessage.includes("EMAIL_FROM") ||
    errorMessage.includes("RESEND_FROM_EMAIL") ||
    errorMessage.includes("verified Resend sender")
  ) {
    return "Missing verified sender email.";
  }

  if (errorMessage.includes("Save a manager email and at least one accounting email")) {
    return "No recipients configured.";
  }

  if (errorMessage.includes("No summary lines are available")) {
    return "No billable hours for this week.";
  }

  if (errorMessage.includes("Could not save email recipients")) {
    return "Could not save email recipients.";
  }

  if (errorMessage.includes("Could not save weekly summary schedule")) {
    return "Could not save weekly summary schedule.";
  }

  if (errorMessage.includes("Resend rejected")) {
    return "Resend rejected the email.";
  }

  return "Could not send weekly summary email.";
}

export async function saveWeeklySummaryEmailSettingsAction(formData: FormData) {
  const ownerId = await getCurrentWorkbookOwnerId();
  const weekNumber = getSelectedWeekNumber(formData);
  const weekYear = getSelectedWeekYear(formData);
  const view = String(formData.get("view") ?? "") || undefined;

  await ensureCurrentUserExists();

  try {
    await saveWeeklySummaryEmailSettings(ownerId, formData);
  } catch (error) {
    const errorMessage = getSafeWeeklySummaryEmailErrorMessage(error);
    redirectBackWithError(weekNumber, weekYear, "settings-error", errorMessage, view);
  }

  revalidatePath("/weekly-summary");
  redirectBack(weekNumber, weekYear, "settings-saved", view);
}

export async function saveWeeklySummaryEmailScheduleAction(formData: FormData) {
  const ownerId = await getCurrentWorkbookOwnerId();
  const weekNumber = getSelectedWeekNumber(formData);
  const weekYear = getSelectedWeekYear(formData);
  const view = String(formData.get("view") ?? "") || undefined;

  await ensureCurrentUserExists();

  try {
    await saveWeeklySummaryEmailSchedule(ownerId, formData);
  } catch (error) {
    const errorMessage = getSafeWeeklySummaryEmailErrorMessage(error);
    redirectBackWithScheduleStatus(weekNumber, weekYear, "error", errorMessage, view);
  }

  revalidatePath("/weekly-summary");
  redirectBackWithScheduleStatus(weekNumber, weekYear, "saved", undefined, view);
}

export async function sendWeeklySummaryEmailAction(formData: FormData) {
  const ownerId = await getCurrentWorkbookOwnerId();
  const weekNumber = getSelectedWeekNumber(formData);
  const weekYear = getSelectedWeekYear(formData);
  const view = String(formData.get("view") ?? "") || undefined;
  const allowResend = formData.get("allowResend") === "true";

  await ensureCurrentUserExists();

  let sendResult: WeeklySummaryEmailSendResult | undefined;

  try {
    sendResult = await sendWeeklySummaryEmail(ownerId, weekNumber, weekYear, allowResend);
  } catch (error) {
    const errorMessage = getSafeWeeklySummaryEmailErrorMessage(error);
    redirectBackWithError(weekNumber, weekYear, "send-error", errorMessage, view);
  }

  revalidatePath("/weekly-summary");

  if (sendResult?.duplicateBlocked) {
    redirectBack(weekNumber, weekYear, "needs-confirmation", view);
  }

  redirectBack(weekNumber, weekYear, "sent", view);
}
