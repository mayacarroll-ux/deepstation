"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  ensureCurrentUserExists,
  getCurrentWorkbookOwnerId
} from "@/lib/services/current-user";
import {
  setWorkdayDayEntered,
  setWorkdayWeekEntered
} from "@/lib/services/workday";
import { calculateHoursFromTimeRange } from "@/lib/utils/format";
import { updateTimeEntry } from "@/lib/services/time-tracking";

function getBooleanFormValue(formData: FormData, key: string) {
  return formData.get(key) === "true";
}

function redirectBackWithStatus(returnToPath: string, statusMessage: string) {
  const urlSearchParameters = new URLSearchParams();
  urlSearchParameters.set("workdayEntryMessage", statusMessage);
  const separator = returnToPath.includes("?") ? "&" : "?";

  redirect(`${returnToPath}${separator}${urlSearchParameters.toString()}`);
}

export async function setWorkdayDayEnteredAction(formData: FormData) {
  const ownerId = await getCurrentWorkbookOwnerId();
  const entryDate = String(formData.get("entryDate") ?? "");
  const isEntered = getBooleanFormValue(formData, "isEntered");

  await ensureCurrentUserExists();
  await setWorkdayDayEntered(ownerId, entryDate, isEntered);
  revalidatePath("/workday");
}

export async function setWorkdayWeekEnteredAction(formData: FormData) {
  const ownerId = await getCurrentWorkbookOwnerId();
  const weekNumber = Number(formData.get("weekNumber"));
  const weekYear = Number(formData.get("weekYear"));
  const isEntered = getBooleanFormValue(formData, "isEntered");

  await ensureCurrentUserExists();
  await setWorkdayWeekEntered(ownerId, weekNumber, weekYear, isEntered);
  revalidatePath("/workday");
}

export async function updateWorkdayTimeEntryAction(timeEntryId: string, formData: FormData) {
  const ownerId = await getCurrentWorkbookOwnerId();
  const returnToPath = String(formData.get("returnTo") ?? "/workday");
  const shouldRecalculateHoursWorked = getBooleanFormValue(formData, "recalculateHoursWorked");
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");

  await ensureCurrentUserExists();

  if (shouldRecalculateHoursWorked) {
    const recalculatedHoursWorked = calculateHoursFromTimeRange(startTime, endTime);

    if (recalculatedHoursWorked == null) {
      redirectBackWithStatus(
        returnToPath,
        "Select a valid start and end time before recalculating hours worked."
      );
      return;
    }

    const mutableFormData = new FormData();
    for (const [key, value] of formData.entries()) {
      if (key !== "hoursWorked") {
        mutableFormData.set(key, String(value));
      }
    }
    mutableFormData.set("hoursWorked", recalculatedHoursWorked.toFixed(2));

    await updateTimeEntry(ownerId, timeEntryId, mutableFormData);
    revalidatePath("/dashboard");
    revalidatePath("/time-entries");
    revalidatePath("/weekly-summary");
    revalidatePath("/workday");
    redirectBackWithStatus(returnToPath, "Workday times and hours updated.");
    return;
  }

  await updateTimeEntry(ownerId, timeEntryId, formData);
  revalidatePath("/dashboard");
  revalidatePath("/time-entries");
  revalidatePath("/weekly-summary");
  revalidatePath("/workday");
  redirectBackWithStatus(returnToPath, "Workday times updated.");
}
