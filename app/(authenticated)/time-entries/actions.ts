"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  ensureCurrentUserExists,
  getCurrentWorkbookOwnerId
} from "@/lib/services/current-user";
import {
  applyRecurringTemplates,
  createRecurringTemplateFromTimeEntry
} from "@/lib/services/recurring";
import { createWeeklyAllocationEntries } from "@/lib/services/weekly-allocation";
import {
  createTimeEntry,
  deleteTimeEntry,
  updateTimeEntry
} from "@/lib/services/time-tracking";
import { getIsoWeekNumber, getIsoWeekYear, getTodayInputValue } from "@/lib/utils/dates";

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

function buildDeleteReturnToPath(returnToPath: string) {
  return returnToPath.includes("?")
    ? `${returnToPath}&deleteStatus=deleted`
    : `${returnToPath}?deleteStatus=deleted`;
}

export async function deleteTimeEntryAction(timeEntryId: string, formData: FormData) {
  const ownerId = await getCurrentWorkbookOwnerId();
  const returnToPath = String(formData.get("returnTo") ?? "/time-entries");

  await ensureCurrentUserExists();
  await deleteTimeEntry(ownerId, timeEntryId);
  revalidatePath("/dashboard");
  revalidatePath("/time-entries");
  revalidatePath("/weekly-summary");
  revalidatePath("/workday");
  redirect(buildDeleteReturnToPath(returnToPath));
}

function redirectBackWithStatus(returnToPath: string, statusKey: string, statusValue: string) {
  const separator = returnToPath.includes("?") ? "&" : "?";

  redirect(`${returnToPath}${separator}${statusKey}=${statusValue}`);
}

function redirectBackWithQueryParameters(
  returnToPath: string,
  queryParameters: Record<string, string | number | undefined>
) {
  const urlSearchParameters = new URLSearchParams();

  for (const [key, value] of Object.entries(queryParameters)) {
    if (value !== undefined) {
      urlSearchParameters.set(key, String(value));
    }
  }

  const separator = returnToPath.includes("?") ? "&" : "?";

  redirect(`${returnToPath}${separator}${urlSearchParameters.toString()}`);
}

function getCurrentWeekYearAndNumber() {
  const todayInputValue = getTodayInputValue();

  return {
    weekNumber: getIsoWeekNumber(todayInputValue),
    weekYear: getIsoWeekYear(todayInputValue)
  };
}

function getSelectedWeekYearAndNumber(formData: FormData) {
  const allocationWeekNumber = Number(formData.get("allocationWeek"));
  const allocationWeekYear = Number(formData.get("allocationYear"));

  if (
    Number.isInteger(allocationWeekNumber) &&
    allocationWeekNumber >= 1 &&
    allocationWeekNumber <= 53 &&
    Number.isInteger(allocationWeekYear) &&
    allocationWeekYear >= 2000 &&
    allocationWeekYear <= 2100
  ) {
    return {
      weekNumber: allocationWeekNumber,
      weekYear: allocationWeekYear
    };
  }

  return getCurrentWeekYearAndNumber();
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

export async function createWeeklyAllocationEntriesAction(formData: FormData) {
  const ownerId = await getCurrentWorkbookOwnerId();
  const returnToPath = String(formData.get("returnTo") ?? "/time-entries");
  const weekNumber = Number(formData.get("allocationWeek"));
  const weekYear = Number(formData.get("allocationYear"));

  await ensureCurrentUserExists();

  if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 53) {
    redirectBackWithQueryParameters(returnToPath, {
      allocationStatus: "error",
      allocationMessage: "Select a valid ISO week before saving allocation entries."
    });
  }

  if (!Number.isInteger(weekYear) || weekYear < 2000 || weekYear > 2100) {
    redirectBackWithQueryParameters(returnToPath, {
      allocationStatus: "error",
      allocationMessage: "Select a valid year before saving allocation entries."
    });
  }

  try {
    const result = await createWeeklyAllocationEntries(ownerId, weekNumber, weekYear, formData);

    revalidatePath("/dashboard");
    revalidatePath("/time-entries");
    revalidatePath("/weekly-summary");
    revalidatePath("/workday");

    redirectBackWithQueryParameters(returnToPath, {
      allocationStatus: result.duplicateBlocked ? "duplicate" : "created",
      allocationAdded: result.insertedCount,
      allocationSkipped: result.duplicateBlocked ? 1 : 0,
      allocationWeek: result.selectedWeekNumber,
      allocationYear: result.selectedWeekYear
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Allocation failed.";

    redirectBackWithQueryParameters(returnToPath, {
      allocationStatus: "error",
      allocationMessage: message,
      allocationWeek: weekNumber,
      allocationYear: weekYear
    });
  }
}

export async function generateCurrentWeekTimesheetAction(formData: FormData) {
  const ownerId = await getCurrentWorkbookOwnerId();
  const returnToPath = String(formData.get("returnTo") ?? "/time-entries");
  const { weekNumber, weekYear } = getSelectedWeekYearAndNumber(formData);
  const excludedRecurringTemplateIds = JSON.parse(
    String(formData.get("excludedRecurringTemplateIds") ?? "[]")
  ) as string[];
  const allocationPlan = JSON.parse(String(formData.get("allocationPlan") ?? "[]")) as Array<{
    included?: boolean;
  }>;
  const hasAllocationRows = allocationPlan.some((row) => row.included);

  await ensureCurrentUserExists();

  try {
    const recurringResult = await applyRecurringTemplates(
      ownerId,
      weekNumber,
      weekYear,
      excludedRecurringTemplateIds
    );
    const allocationResult = hasAllocationRows
      ? await createWeeklyAllocationEntries(ownerId, weekNumber, weekYear, formData)
      : {
          created: false,
          duplicateBlocked: false,
          insertedCount: 0,
          selectedWeekNumber: weekNumber,
          selectedWeekYear: weekYear
        };

    revalidatePath("/dashboard");
    revalidatePath("/time-entries");
    revalidatePath("/weekly-summary");
    revalidatePath("/workday");

    redirectBackWithQueryParameters(returnToPath, {
      currentWeekTimesheetStatus:
        recurringResult.insertedCount > 0 || allocationResult.created ? "created" : "duplicate",
      currentWeekRecurringAdded: recurringResult.insertedCount,
      currentWeekRecurringSkipped: recurringResult.skippedCount,
      currentWeekAllocationAdded: allocationResult.insertedCount,
      currentWeekAllocationSkipped: allocationResult.duplicateBlocked ? 1 : 0,
      currentWeekWeek: weekNumber,
      currentWeekYear: weekYear
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Timesheet generation failed.";

    redirectBackWithQueryParameters(returnToPath, {
      currentWeekTimesheetStatus: "error",
      currentWeekTimesheetMessage: message
    });
  }
}
