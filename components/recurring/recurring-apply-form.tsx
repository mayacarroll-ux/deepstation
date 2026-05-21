import { WeekSelector } from "@/components/shared/week-selector";

type RecurringApplyFormProps = {
  action: (formData: FormData) => Promise<void>;
  returnToPath: string;
  defaultWeekNumber: number;
  defaultWeekYear: number;
  nextWeekNumber: number;
  nextWeekYear: number;
};

export function RecurringApplyForm({
  action,
  returnToPath,
  defaultWeekNumber,
  defaultWeekYear,
  nextWeekNumber,
  nextWeekYear
}: RecurringApplyFormProps) {
  return (
    <section className="grid gap-4 border border-[var(--border)] bg-[var(--panel)] p-6">
      <div>
        <h3 className="text-xl font-semibold">Apply recurring entries</h3>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Generate active templates for a selected ISO week. Re-running the same week is safe.
        </p>
      </div>

      <div className="grid gap-4">
        <WeekSelector
          actionLabel="Apply recurring entries"
          defaultWeekNumber={defaultWeekNumber}
          defaultWeekYear={defaultWeekYear}
          hiddenFields={{ returnTo: returnToPath }}
          formAction={action}
          onSubmitButtonVariant="primary"
        />

        <form className="grid gap-3 border border-[var(--border)] bg-[var(--surface)] p-4" action={action}>
          <input name="week" type="hidden" value={nextWeekNumber} />
          <input name="year" type="hidden" value={nextWeekYear} />
          <input name="returnTo" type="hidden" value={returnToPath} />
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">Quick apply next week</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {nextWeekYear} Week {nextWeekNumber}
            </p>
          </div>
          <button
            className="h-11 border border-[var(--accent)] bg-[var(--accent)] px-5 text-sm font-semibold !text-neutral-950 transition-colors hover:bg-[var(--accent-hover)]"
            type="submit"
          >
            Apply next week
          </button>
        </form>
      </div>
    </section>
  );
}
