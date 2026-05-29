import { WeekSelector } from "@/components/shared/week-selector";
import { getIsoWeekDateRange } from "@/lib/utils/dates";
import type { BudgetMappingRecord } from "@/lib/types/time-tracking";
import { formatHours } from "@/lib/utils/format";

import { WeeklyAllocationBuilder } from "./weekly-allocation-builder";

type WeeklyAllocationSectionProps = {
  action: (formData: FormData) => Promise<void>;
  allocationHiddenFields: Record<string, string>;
  budgetMappings: BudgetMappingRecord[];
  existingHours: number;
  remainingHours: number;
  selectedWeekLabel: string;
  selectedWeekNumber: number;
  selectedWeekYear: number;
  statusMessage: string | null;
  returnToPath: string;
};

export function WeeklyAllocationSection({
  action,
  allocationHiddenFields,
  budgetMappings,
  existingHours,
  remainingHours,
  selectedWeekLabel,
  selectedWeekNumber,
  selectedWeekYear,
  statusMessage,
  returnToPath
}: WeeklyAllocationSectionProps) {
  const { startDate } = getIsoWeekDateRange(selectedWeekNumber, selectedWeekYear);

  return (
    <section className="grid gap-4 border border-[var(--border)] bg-[var(--panel)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">Weekly allocation</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Allocate the remaining time for the selected week across project and task rows.
          </p>
        </div>
        <div className="grid gap-1 text-right text-sm text-[var(--muted)]">
          <p className="font-semibold text-[var(--foreground)]">{selectedWeekLabel}</p>
          <p>{formatHours(existingHours)} hrs existing</p>
          <p>{formatHours(remainingHours)} hrs remaining</p>
        </div>
      </div>

      <WeekSelector
        actionLabel="Load allocation week"
        defaultWeekNumber={selectedWeekNumber}
        defaultWeekYear={selectedWeekYear}
        hiddenFields={allocationHiddenFields}
        onSubmitButtonVariant="secondary"
        weekFieldName="allocationWeek"
        yearFieldName="allocationYear"
      />

      <div className="grid gap-3 md:grid-cols-3">
        <article className="border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm text-[var(--muted)]">Weekly cap</p>
          <p className="mt-2 text-2xl font-semibold">20 hrs</p>
        </article>
        <article className="border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm text-[var(--muted)]">Existing hours</p>
          <p className="mt-2 text-2xl font-semibold">{formatHours(existingHours)} hrs</p>
        </article>
        <article className="border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm text-[var(--muted)]">Remaining hours</p>
          <p className="mt-2 text-2xl font-semibold">{formatHours(remainingHours)} hrs</p>
        </article>
      </div>

      {statusMessage ? (
        <div className="border border-[var(--accent)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)]">
          {statusMessage}
        </div>
      ) : null}

      {remainingHours <= 0 ? (
        <div className="border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
          This week already has 20 hours or more saved. Allocation is disabled for {selectedWeekLabel}
          .
        </div>
      ) : null}

      <WeeklyAllocationBuilder
        action={action}
        budgetMappings={budgetMappings}
        defaultEntryDate={startDate}
        existingHours={existingHours}
        remainingHours={remainingHours}
        returnToPath={returnToPath}
        selectedWeekNumber={selectedWeekNumber}
        selectedWeekYear={selectedWeekYear}
      />
    </section>
  );
}
