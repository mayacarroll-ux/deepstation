import type { CurrentWeekTimesheetPreview } from "@/lib/services/current-week-timesheet";
import { formatHours } from "@/lib/utils/format";

import { WeeklyAllocationBuilder } from "./weekly-allocation-builder";

type CurrentWeekTimesheetGeneratorProps = {
  action: (formData: FormData) => Promise<void>;
  preview: CurrentWeekTimesheetPreview;
  returnToPath: string;
  statusMessage: string | null;
};

function formatRecurringPreviewLabel(status: "existing" | "pending") {
  return status === "existing" ? "Already saved" : "Will create";
}

export function CurrentWeekTimesheetGenerator({
  action,
  preview,
  returnToPath,
  statusMessage
}: CurrentWeekTimesheetGeneratorProps) {
  const allocationExistingHours = preview.savedHours + preview.recurringPendingHours;

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
            {formatHours(preview.totalPreviewHours)} hrs previewed
          </p>
          <p>{formatHours(preview.savedHours)} hrs already saved</p>
          <p>{formatHours(preview.recurringPendingHours)} hrs recurring to create</p>
          <p>{formatHours(preview.remainingHoursAfterRecurring)} hrs left for allocation</p>
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

      {preview.recurringPendingEntries.length > 0 ? (
        <div className="grid gap-3">
          <h4 className="text-sm font-semibold text-[var(--foreground)]">Recurring entries to create</h4>
          <div className="grid gap-2">
            {preview.recurringPendingEntries.map((entry) => (
              <article
                className="grid gap-1 border border-[var(--border)] bg-[var(--surface)] p-4 text-sm"
                key={`${entry.recurringTemplateId}-${entry.entryDate}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold">{entry.taskDescription}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
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

      {preview.warningMessage ? (
        <div className="border border-[var(--accent)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)]">
          {preview.warningMessage}
        </div>
      ) : null}

      <WeeklyAllocationBuilder
        action={action}
        budgetMappings={preview.budgetMappings}
        defaultEntryDate={preview.weekStartDate}
        existingHours={allocationExistingHours}
        initialRows={preview.allocationSuggestions}
        remainingHours={preview.remainingHoursAfterRecurring}
        returnToPath={returnToPath}
        selectedWeekNumber={preview.weekNumber}
        selectedWeekYear={preview.weekYear}
        submitLabel="Approve and save generated entries"
      />
    </section>
  );
}
