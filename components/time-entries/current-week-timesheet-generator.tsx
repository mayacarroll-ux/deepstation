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

type PreviewRecurringEntry = Omit<
  CurrentWeekTimesheetPreview["recurringPendingEntries"][number],
  "status"
> & {
  status: "existing" | "pending" | "excluded";
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

function getSavedEntrySourceLabel(source: CurrentWeekTimesheetPreview["savedEntries"][number]["source"]) {
  if (source === "allocation") {
    return "Allocation";
  }

  if (source === "recurring") {
    return "Recurring";
  }

  return "Manual";
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

function CompactSavedEntryCard({
  entry,
  muted = false
}: {
  entry: CurrentWeekTimesheetPreview["savedEntries"][number];
  muted?: boolean;
}) {
  return (
    <article
      className={`grid gap-2 border border-[var(--border)] bg-[var(--surface)] p-4 text-sm ${
        muted ? "opacity-70" : ""
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 font-semibold">{entry.taskDescription}</p>
        <p className="rounded-full border border-[var(--border)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
          {getSavedEntrySourceLabel(entry.source)}
        </p>
      </div>
      <p className="text-xs text-[var(--muted)]">
        {entry.entryDate} · {entry.productName} · {entry.budgetName} · {entry.budgetNumber}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold tabular-nums">{formatHours(entry.hoursWorked)} hrs</p>
        {entry.notes ? <p className="text-xs text-[var(--muted)]">{entry.notes}</p> : null}
      </div>
    </article>
  );
}

function PreviewRecurringRow({
  entry,
  isExcluded,
  onToggleExcluded
}: {
  entry: PreviewRecurringEntry;
  isExcluded: boolean;
  onToggleExcluded: () => void;
}) {
  return (
    <article
      className={`grid gap-2 border border-[var(--border)] bg-[var(--surface)] p-4 text-sm ${
        isExcluded ? "opacity-65" : ""
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 font-semibold">{entry.taskDescription}</p>
        <p
          className={`text-xs font-semibold uppercase tracking-wide ${
            isExcluded ? "text-[var(--muted)]" : "text-[var(--accent)]"
          }`}
        >
          {formatRecurringPreviewLabel(isExcluded ? "excluded" : entry.status)}
        </p>
      </div>
      <p className="text-xs text-[var(--muted)]">
        {entry.entryDate} · {entry.productName} · {entry.budgetName} · {entry.budgetNumber}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold tabular-nums">{formatHours(entry.hoursWorked)} hrs</p>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-[var(--muted)]">
            {isExcluded
              ? "Excluded from this week only."
              : "Will be created when you approve the week."}
          </p>
          <Button className="h-10 px-3" onClick={onToggleExcluded} type="button" variant="secondary">
            {isExcluded ? "Include in preview" : "Exclude from preview"}
          </Button>
        </div>
      </div>
    </article>
  );
}

function RecurringOnlyApprovalCard({
  action,
  excludedRecurringTemplateIds,
  hasRecurringEntriesToCreate,
  preview,
  returnToPath
}: {
  action: (formData: FormData) => Promise<void>;
  excludedRecurringTemplateIds: string[];
  hasRecurringEntriesToCreate: boolean;
  preview: CurrentWeekTimesheetPreview;
  returnToPath: string;
}) {
  const hiddenFields = {
    excludedRecurringTemplateIds: JSON.stringify(excludedRecurringTemplateIds)
  };

  return (
    <div className="grid gap-4 border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="grid gap-1">
        <h4 className="text-sm font-semibold text-[var(--foreground)]">Allocation suggestions</h4>
        <p className="text-xs text-[var(--muted)]">
          No remaining hours to allocate. This week already totals 20 hrs.
        </p>
      </div>

      <div className="grid gap-2 border border-[var(--border)] bg-[var(--panel)] p-4 text-sm">
        <p className="font-semibold text-[var(--foreground)]">Approval</p>
        <p className="text-xs text-[var(--muted)]">
          Recurring rows can still be created without adding allocation rows.
        </p>
        <form action={action} className="flex flex-wrap items-center gap-3">
          {Object.entries(hiddenFields).map(([fieldName, fieldValue]) => (
            <input key={fieldName} name={fieldName} type="hidden" value={fieldValue} />
          ))}
          <input name="allocationWeek" type="hidden" value={preview.weekNumber} />
          <input name="allocationYear" type="hidden" value={preview.weekYear} />
          <input name="allocationPlan" type="hidden" value="[]" />
          <input name="entryDate" type="hidden" value={preview.weekStartDate} />
          <input name="returnTo" type="hidden" value={returnToPath} />
          <Button disabled={!hasRecurringEntriesToCreate} type="submit">
            {hasRecurringEntriesToCreate ? "Approve recurring entries" : "Nothing new to save"}
          </Button>
        </form>
      </div>
    </div>
  );
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

  const visibleRecurringPendingEntries: PreviewRecurringEntry[] = preview.recurringPendingEntries.map(
    (entry) => ({
      ...entry,
      status: excludedRecurringTemplateIdSet.has(entry.recurringTemplateId)
        ? ("excluded" as const)
        : entry.status
    })
  );

  const includedRecurringEntries = visibleRecurringPendingEntries.filter(
    (entry) => entry.status !== "excluded"
  );
  const excludedRecurringEntries = visibleRecurringPendingEntries.filter(
    (entry) => entry.status === "excluded"
  );
  const recurringPendingHours = roundToTwoDecimals(
    includedRecurringEntries.reduce(
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
  const hasRecurringEntriesToCreate = includedRecurringEntries.length > 0;
  const hasAllocationRowsToCreate = remainingHoursAfterRecurring > 0 && allocationRows.length > 0;
  const hasAnythingNewToSave = hasRecurringEntriesToCreate || hasAllocationRowsToCreate;
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
          <p>{formatHours(recurringPendingHours)} hrs recurring to add</p>
          <p>{formatHours(remainingHoursAfterRecurring)} hrs remaining to allocate</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="grid gap-1 border border-[var(--border)] bg-[var(--surface)] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Weekly cap</p>
          <p className="text-lg font-semibold text-[var(--foreground)]">{formatHours(preview.capHours)} hrs</p>
        </div>
        <div className="grid gap-1 border border-[var(--border)] bg-[var(--surface)] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Already saved</p>
          <p className="text-lg font-semibold text-[var(--foreground)]">{formatHours(preview.savedHours)} hrs</p>
        </div>
        <div className="grid gap-1 border border-[var(--border)] bg-[var(--surface)] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Recurring to add</p>
          <p className="text-lg font-semibold text-[var(--foreground)]">
            {formatHours(recurringPendingHours)} hrs
          </p>
        </div>
        <div className="grid gap-1 border border-[var(--border)] bg-[var(--surface)] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Remaining to allocate</p>
          <p className="text-lg font-semibold text-[var(--foreground)]">
            {formatHours(remainingHoursAfterRecurring)} hrs
          </p>
        </div>
        <div className="grid gap-1 border border-[var(--border)] bg-[var(--surface)] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Final preview total</p>
          <p className="text-lg font-semibold text-[var(--foreground)]">
            {formatHours(totalPreviewHours)} hrs
          </p>
        </div>
      </div>

      {statusMessage ? (
        <div className="border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)]">
          {statusMessage}
        </div>
      ) : null}

      <div className="grid gap-4 border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-1">
            <h4 className="text-sm font-semibold text-[var(--foreground)]">Already saved entries</h4>
            <p className="text-xs text-[var(--muted)]">
              These rows are already in the week and will not be recreated.
            </p>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            {preview.savedEntries.length} {preview.savedEntries.length === 1 ? "entry" : "entries"}
          </p>
        </div>

        {preview.savedEntries.length > 0 ? (
          <div className="grid gap-2">
            {preview.savedEntries.map((entry) => (
              <CompactSavedEntryCard entry={entry} key={entry.id} />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)]">
            No saved entries for this week yet.
          </div>
        )}
      </div>

      <div className="grid gap-4 border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-1">
            <h4 className="text-sm font-semibold text-[var(--foreground)]">Entries to create</h4>
            <p className="text-xs text-[var(--muted)]">
              Exclude any recurring rows you do not want to create for this week.
            </p>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            {hasRecurringEntriesToCreate
              ? `${includedRecurringEntries.length} will create`
              : "No entries to create"}
          </p>
        </div>

        {includedRecurringEntries.length > 0 ? (
          <div className="grid gap-2">
            {includedRecurringEntries.map((entry) => (
              <PreviewRecurringRow
                entry={entry}
                isExcluded={false}
                key={`${entry.recurringTemplateId}-${entry.entryDate}`}
                onToggleExcluded={() =>
                  setExcludedRecurringTemplateIds((currentIds) => [
                    ...currentIds,
                    entry.recurringTemplateId
                  ])
                }
              />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)]">
            No recurring entries will be created for this week.
          </div>
        )}

        {excludedRecurringEntries.length > 0 ? (
          <details className="border border-[var(--border)] bg-[var(--panel)] p-3">
            <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--muted)]">
              Excluded this week ({excludedRecurringEntries.length})
            </summary>
            <div className="mt-3 grid gap-2">
              {excludedRecurringEntries.map((entry) => (
                <PreviewRecurringRow
                  entry={entry}
                  isExcluded
                  key={`${entry.recurringTemplateId}-${entry.entryDate}`}
                  onToggleExcluded={() =>
                    setExcludedRecurringTemplateIds((currentIds) =>
                      currentIds.filter(
                        (templateId) => templateId !== entry.recurringTemplateId
                      )
                    )
                  }
                />
              ))}
            </div>
          </details>
        ) : null}
      </div>

      {warningMessage ? (
        <div className="border border-[var(--accent)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)]">
          {warningMessage}
        </div>
      ) : null}

      {remainingHoursAfterRecurring > 0 ? (
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
      ) : (
        <RecurringOnlyApprovalCard
          action={action}
          excludedRecurringTemplateIds={excludedRecurringTemplateIds}
          hasRecurringEntriesToCreate={hasAnythingNewToSave}
          preview={preview}
          returnToPath={returnToPath}
        />
      )}
    </section>
  );
}
