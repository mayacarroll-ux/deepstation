import { getIsoWeekNumber, getIsoWeekYear, getTodayInputValue, getIsoWeekDateRange, formatWeekLabel } from "@/lib/utils/dates";
import { splitHoursEvenlyAcrossRows } from "@/lib/utils/format";

import { getRecurringApplyPreview } from "./recurring";
import { listBudgetMappings, listTimeEntries } from "./time-tracking";
import type {
  CurrentWeekTimesheetPreview
} from "@/lib/types/current-week-timesheet";
import type { BudgetMappingRecord, TimeEntryRecord } from "@/lib/types/time-tracking";
import type { RecurringPreviewEntry } from "@/lib/types/recurring";

export type {
  CurrentWeekAllocationSuggestion,
  CurrentWeekTimesheetPreview
} from "@/lib/types/current-week-timesheet";

export const weeklyTimesheetCapHours = 20;

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function toHoursValue(hours: number) {
  return Math.round(hours * 100) / 100;
}

function getWeekStartAndEndLabel(weekNumber: number, weekYear: number) {
  const { startDate, endDate } = getIsoWeekDateRange(weekNumber, weekYear);

  return { startDate, endDate };
}

function buildManualSourceRows(timeEntries: TimeEntryRecord[]) {
  const uniqueRowsByKey = new Map<
    string,
    {
      id: string;
      budgetMappingId: string | null;
      taskDescription: string;
      notes: string | null;
    }
  >();

  for (const timeEntry of timeEntries) {
    if (timeEntry.recurringTemplateId || timeEntry.allocationBatchId) {
      continue;
    }

    const rowKey = [
      timeEntry.budgetMappingId ?? "",
      normalizeText(timeEntry.taskDescription).toLowerCase(),
      normalizeText(timeEntry.notes ?? "").toLowerCase()
    ].join("\u0000");

    if (!uniqueRowsByKey.has(rowKey)) {
      uniqueRowsByKey.set(rowKey, {
        id: rowKey,
        budgetMappingId: timeEntry.budgetMappingId,
        taskDescription: normalizeText(timeEntry.taskDescription),
        notes: timeEntry.notes ? normalizeText(timeEntry.notes) : null
      });
    }
  }

  return Array.from(uniqueRowsByKey.values());
}

function getSavedEntrySource(timeEntry: TimeEntryRecord) {
  if (timeEntry.allocationBatchId) {
    return "allocation" as const;
  }

  if (timeEntry.recurringTemplateId) {
    return "recurring" as const;
  }

  return "manual" as const;
}

function buildFallbackAllocationSuggestions(
  budgetMappings: BudgetMappingRecord[],
  manualSourceRows: Array<{
    budgetMappingId: string | null;
    taskDescription: string;
    notes: string | null;
  }>,
  remainingHours: number
) {
  const defaultBudgetMappingId = budgetMappings[0]?.id ?? null;
  const candidateRows =
    manualSourceRows.length > 0
      ? manualSourceRows
      : defaultBudgetMappingId
        ? [
            {
              budgetMappingId: defaultBudgetMappingId,
              taskDescription: "",
              notes: null
            }
          ]
        : [];

  const hoursByRow = splitHoursEvenlyAcrossRows(remainingHours, candidateRows.length);

  return candidateRows
    .map((row, rowIndex) => ({
      budgetMappingId: row.budgetMappingId ?? defaultBudgetMappingId ?? "",
      taskDescription: row.taskDescription,
      notes: row.notes ?? "",
      hoursWorked: hoursByRow[rowIndex] ?? 0
    }))
    .filter((row) => row.budgetMappingId.length > 0);
}

export async function getCurrentWeekTimesheetPreview(
  ownerId: string,
  selectedWeekNumber?: number,
  selectedWeekYear?: number
): Promise<CurrentWeekTimesheetPreview> {
  const currentWeekNumber = getIsoWeekNumber(getTodayInputValue());
  const currentWeekYear = getIsoWeekYear(getTodayInputValue());
  const previewWeekNumber = selectedWeekNumber ?? currentWeekNumber;
  const previewWeekYear = selectedWeekYear ?? currentWeekYear;
  const [timeEntries, budgetMappings, recurringPreview] = await Promise.all([
    listTimeEntries(ownerId, {
      weekNumber: previewWeekNumber,
      weekYear: previewWeekYear
    }),
    listBudgetMappings(ownerId),
    getRecurringApplyPreview(ownerId, previewWeekNumber, previewWeekYear)
  ]);
  const savedHours = toHoursValue(
    timeEntries.reduce((totalHours, timeEntry) => totalHours + Number(timeEntry.hoursWorked), 0)
  );
  const recurringExistingHours = toHoursValue(recurringPreview.existingHours);
  const recurringPendingHours = toHoursValue(recurringPreview.pendingHours);
  const remainingHoursAfterRecurring = toHoursValue(
    Math.max(0, weeklyTimesheetCapHours - savedHours - recurringPendingHours)
  );
  const manualSourceRows = buildManualSourceRows(timeEntries);
  const savedEntries = timeEntries.map((timeEntry) => ({
    id: timeEntry.id,
    entryDate: timeEntry.entryDate,
    productName: timeEntry.productName,
    budgetName: timeEntry.budgetName,
    budgetNumber: timeEntry.budgetNumber,
    taskDescription: timeEntry.taskDescription,
    hoursWorked: Number(timeEntry.hoursWorked),
    notes: timeEntry.notes,
    source: getSavedEntrySource(timeEntry)
  }));
  const allocationSuggestions = buildFallbackAllocationSuggestions(
    budgetMappings,
    manualSourceRows,
    remainingHoursAfterRecurring
  );
  const allocationSuggestedHours = toHoursValue(
    allocationSuggestions.reduce((totalHours, row) => totalHours + row.hoursWorked, 0)
  );
  const totalPreviewHours = toHoursValue(
    savedHours + recurringPendingHours + allocationSuggestedHours
  );
  const { startDate, endDate } = getWeekStartAndEndLabel(previewWeekNumber, previewWeekYear);
  const warningMessage =
    totalPreviewHours === weeklyTimesheetCapHours
      ? null
      : totalPreviewHours > weeklyTimesheetCapHours
        ? "The preview is over the 20 hour cap. Review the existing entries before approving."
        : "The preview is under the 20 hour cap. Add or adjust allocation rows before approving.";

  return {
    weekNumber: previewWeekNumber,
    weekYear: previewWeekYear,
    weekLabel: formatWeekLabel(previewWeekNumber, previewWeekYear),
    weekStartDate: startDate,
    weekEndDate: endDate,
    capHours: weeklyTimesheetCapHours,
    savedHours,
    recurringExistingHours,
    recurringPendingHours,
    remainingHoursAfterRecurring,
    totalPreviewHours,
    recurringExistingEntries: recurringPreview.existingEntries,
    recurringPendingEntries: recurringPreview.pendingEntries,
    savedEntries,
    allocationSuggestions,
    manualSourceRows,
    budgetMappings,
    warningMessage
  };
}
