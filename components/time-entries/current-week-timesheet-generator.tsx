"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { CurrentWeekTimesheetPreview } from "@/lib/services/current-week-timesheet";
import { formatHours, splitHoursEvenlyAcrossRows } from "@/lib/utils/format";

import { WeeklyAllocationBuilder } from "./weekly-allocation-builder";

type CurrentWeekTimesheetGeneratorProps = {
  action: (formData: FormData) => Promise<void>;
  preview: CurrentWeekTimesheetPreview;
  returnToPath: string;
  statusMessage: string | null;
};

type AllocationRowDraft = {
  budgetMappingId: string;
  taskDescription: string;
  notes: string;
  hoursWorked: number;
};

function roundToTwoDecimals(hours: number) {
  return Math.round(hours * 100) / 100;
}

function formatRecurringPreviewLabel(status: "existing" | "pending" | "excluded") {
  if (status === "existing") {
    return "Already exists";
  }

  if (status === "excluded") {
    return "Excluded";
  }

  return "Will create";
}

function buildAllocationRows(
  manualSourceRows: CurrentWeekTimesheetPreview["manualSourceRows"],
  budgetMappings: CurrentWeekTimesheetPreview["budgetMappings"],
  remainingHours: number
) {
  if (remainingHours <= 0) {
    return [];
  }

  const defaultBudgetMappingId = budgetMappings[0]?.id ?? "";
  const sourceRows =
    manualSourceRows.length > 0
      ? manualSourceRows
      : defaultBudgetMappingId
        ? [
            {
              id: defaultBudgetMappingId,
              budgetMappingId: defaultBudgetMappingId,
              taskDescription: "",
              notes: null
            }
          ]
        : [];
  const hoursByRow = splitHoursEvenlyAcrossRows(remainingHours, sourceRows.length);

  return sourceRows
    .map(
      (sourceRow, rowIndex): AllocationRowDraft => ({
        budgetMappingId: sourceRow.budgetMappingId ?? defaultBudgetMappingId,
        taskDescription: sourceRow.taskDescription,
        notes: sourceRow.notes ?? "",
        hoursWorked: hoursByRow[rowIndex] ?? 0
      })
    )
    .filter((row) => row.budgetMappingId.length > 0);
}

export function CurrentWeekTimesheetGenerator({
  action,
  preview,
  returnToPath,
  statusMessage
}: CurrentWeekTimesheetGeneratorProps) {
  const [excludedRecurringTemplateIds, setExcludedRecurringTemplateIds] = useState<string[]>([]);

  const excludedRecurringTemplateIdSet = useMemo(
    () => new Set(excludedRecurringTemplateIds),
    [excludedRecurringTemplateIds]
  );

  const visibleRecurringPendingEntries = preview.recurringPendingEntries.map((entry) => ({
    ...entry,
    status: excludedRecurringTemplateIdSet.has(entry.recurringTemplateId)
      ? ("excluded" as const)
      : entry.status
  }));

  const activeRecurringPendingEntries = visibleRecurringPendingEntries.filter(
    (entry) => entry.status !== "excluded"
  );
  const recurringPendingHours = roundToTwoDecimals(
    activeRecurringPendingEntries.reduce(
      (currentTotalHours, entry) => currentTotalHours + entry.hoursWorked,
      0
    )
  );
  const remainingHoursAfterRecurring = roundToTwoDecimals(
    Math.max(0, preview.capHours - preview.savedHours - recurringPendingHours)
  );
  const allocationRows = buildAllocationRows(
    preview.manualSourceRows,
    preview.budgetMappings,
    remainingHoursAfterRecurring
  );
  const allocationSuggestedHours = roundToTwoDecimals(
    allocationRows.reduce((currentTotalHours, row) => currentTotalHours + row.hoursWorked, 0)
  );
  const totalPreviewHours = roundToTwoDecimals(
    preview.savedHours + recurringPendingHours + allocationSuggestedHours
  );
  const warningMessage =
    totalPreviewHours === preview.capHours
      ? null
      : totalPreviewHours > preview.capHours
        ? "The preview is over the 20 hour cap. Review the existing entries before approving."
        : "The preview is under the 20 hour cap. Add or adjust allocation rows before approving.";

  const allocationResetKey = `${excludedRecurringTemplateIds.join(",")}:${remainingHoursAfterRecurring}`;
  const allocationHiddenFields = {
    excludedRecurringTemplateIds: JSON.stringify(excludedRecurringTemplateIds)
  };

  return (
    <section className="grid gap-5 border border-[var(--border)] bg-[var(--panel)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-2">
          <div>
            <h3 className="text-xl font-semibold">Generate current week timesheet</h3>
            <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">
              Review what is already saved, what recurring rows will be created, and the suggested
              allocation rows before approving the full week.
            </p>
          </div>
          <p className="text-sm font-semibold text-[var(--foreground)]">{preview.weekLabel}</p>
          <p className="text-xs text-[var(--muted)]">
            {preview.weekStartDate} to {preview.weekEndDate}
          </p>
        </div>
        <div className="grid gap-1 text-right text-sm text-[var(--muted)]">
          <p className="font-semibold text-[var(--foreground)]">
            {formatHours(totalPreviewHours)} hrs previewed
          </p>
          <p>{formatHours(preview.savedHours)} hrs already saved</p>
          <p>{formatHours(recurringPendingHours)} hrs recurring to create</p>
          <p>{formatHours(remainingHoursAfterRecurring)} hrs left for allocation</p>
        </div>
      </div>

      {statusMessage ? (
        <div className="border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)]">
          {statusMessage}
        </div>
      ) : null}

      {preview.recurringExistingEntries.length > 0 ? (
        <div className="grid gap-3">
          <h4 className="text-sm font-semibold text-[var(--foreground)]">Recurring entries already saved</h4>
          <div className="grid gap-2">
            {preview.recurringExistingEntries.map((entry) => (
              <article
                className="grid gap-1 border border-[var(--border)] bg-[var(--surface)] p-4 text-sm"
                key={`${entry.recurringTemplateId}-${entry.entryDate}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold">{entry.taskDescription}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    {formatRecurringPreviewLabel(entry.status)}
                  </p>
                </div>
                <p className="text-xs text-[var(--muted)]">
                  {entry.entryDate} · {entry.productName} · {entry.budgetName} · {entry.budgetNumber}
                </p>
                <p className="text-sm font-semibold tabular-nums">
                  {formatHours(entry.hoursWorked)} hrs
                </p>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {visibleRecurringPendingEntries.length > 0 ? (
        <div className="grid gap-3">
          <h4 className="text-sm font-semibold text-[var(--foreground)]">Recurring entries to review</h4>
          <div className="grid gap-2">
            {visibleRecurringPendingEntries.map((entry) => {
              const isExcluded = entry.status === "excluded";

              return (
                <article
                  className={`grid gap-2 border border-[var(--border)] bg-[var(--surface)] p-4 text-sm ${
                    isExcluded ? "opacity-70" : ""
                  }`}
                  key={`${entry.recurringTemplateId}-${entry.entryDate}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold">{entry.taskDescription}</p>
                    <p
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        isExcluded ? "text-[var(--muted)]" : "text-[var(--accent)]"
                      }`}
                    >
                      {formatRecurringPreviewLabel(entry.status)}
                    </p>
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    {entry.entryDate} · {entry.productName} · {entry.budgetName} · {entry.budgetNumber}
                  </p>
                  <p className="text-sm font-semibold tabular-nums">
                    {formatHours(entry.hoursWorked)} hrs
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-[var(--muted)]">
                      {isExcluded
                        ? "This row will not be created when you approve the week."
                        : "This row will be created when you approve the week."}
                    </p>
                    <Button
                      className="h-10 px-3"
                      onClick={() =>
                        setExcludedRecurringTemplateIds((currentIds) =>
                          isExcluded
                            ? currentIds.filter(
                                (templateId) => templateId !== entry.recurringTemplateId
                              )
                            : [...currentIds, entry.recurringTemplateId]
                        )
                      }
                      type="button"
                      variant="secondary"
                    >
                      {isExcluded ? "Include in preview" : "Exclude from preview"}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      {warningMessage ? (
        <div className="border border-[var(--accent)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)]">
          {warningMessage}
        </div>
      ) : null}

      <WeeklyAllocationBuilder
        action={action}
        allowEmptyInitialRows={remainingHoursAfterRecurring === 0}
        budgetMappings={preview.budgetMappings}
        defaultEntryDate={preview.weekStartDate}
        existingHours={preview.savedHours + recurringPendingHours}
        hiddenFields={allocationHiddenFields}
        initialRows={allocationRows}
        key={allocationResetKey}
        remainingHours={remainingHoursAfterRecurring}
        returnToPath={returnToPath}
        selectedWeekNumber={preview.weekNumber}
        selectedWeekYear={preview.weekYear}
        submitLabel="Approve and save generated entries"
      />
    </section>
  );
}
