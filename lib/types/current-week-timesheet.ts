import type { BudgetMappingRecord } from "@/lib/types/time-tracking";
import type { RecurringPreviewEntry } from "@/lib/types/recurring";

export type CurrentWeekAllocationSuggestion = {
  budgetMappingId: string;
  taskDescription: string;
  notes: string;
  hoursWorked: number;
};

export type CurrentWeekTimesheetPreview = {
  weekNumber: number;
  weekYear: number;
  weekLabel: string;
  weekStartDate: string;
  weekEndDate: string;
  capHours: number;
  savedHours: number;
  recurringExistingHours: number;
  recurringPendingHours: number;
  remainingHoursAfterRecurring: number;
  totalPreviewHours: number;
  recurringExistingEntries: RecurringPreviewEntry[];
  recurringPendingEntries: RecurringPreviewEntry[];
  savedEntries: Array<{
    id: string;
    entryDate: string;
    productName: string;
    budgetName: string;
    budgetNumber: string;
    taskDescription: string;
    hoursWorked: number;
    notes: string | null;
    source: "manual" | "recurring" | "allocation";
  }>;
  allocationSuggestions: CurrentWeekAllocationSuggestion[];
  manualSourceRows: Array<{
    id: string;
    budgetMappingId: string | null;
    taskDescription: string;
    notes: string | null;
  }>;
  budgetMappings: BudgetMappingRecord[];
  warningMessage: string | null;
};
