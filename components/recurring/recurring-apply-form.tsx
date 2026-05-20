import { WeekSelector } from "@/components/shared/week-selector";

type RecurringApplyFormProps = {
  action: (formData: FormData) => Promise<void>;
  returnToPath: string;
  defaultWeekNumber: number;
  defaultWeekYear: number;
};

export function RecurringApplyForm({
  action,
  returnToPath,
  defaultWeekNumber,
  defaultWeekYear
}: RecurringApplyFormProps) {
  return (
    <section className="grid gap-4 border border-[var(--border)] bg-[var(--panel)] p-6">
      <div>
        <h3 className="text-xl font-semibold">Apply recurring entries</h3>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Generate active templates for a selected ISO week. Re-running the same week is safe.
        </p>
      </div>

      <WeekSelector
        actionLabel="Apply recurring entries"
        defaultWeekNumber={defaultWeekNumber}
        defaultWeekYear={defaultWeekYear}
        hiddenFields={{ returnTo: returnToPath }}
        formAction={action}
        onSubmitButtonVariant="primary"
      />
    </section>
  );
}
