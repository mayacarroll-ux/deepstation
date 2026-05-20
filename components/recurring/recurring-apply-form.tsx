import { Button } from "@/components/ui/button";
import { formatWeekLabel } from "@/lib/utils/dates";

type RecurringApplyFormProps = {
  action: (formData: FormData) => Promise<void>;
  defaultWeekNumber: number;
  defaultWeekYear: number;
};

export function RecurringApplyForm({
  action,
  defaultWeekNumber,
  defaultWeekYear
}: RecurringApplyFormProps) {
  const weekLabel = formatWeekLabel(defaultWeekNumber, defaultWeekYear);

  return (
    <form action={action} className="grid gap-4 border border-[var(--border)] bg-[var(--panel)] p-6">
      <div>
        <h3 className="text-xl font-semibold">Apply recurring entries</h3>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Generate active templates for a selected ISO week. Re-running the same week is safe.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-[8rem_8rem_auto] sm:items-end">
        <label className="grid gap-2 text-sm font-semibold">
          Year
          <input
            className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
            defaultValue={defaultWeekYear}
            max="2100"
            min="2000"
            name="year"
            required
            type="number"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Week Number
          <input
            className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
            defaultValue={defaultWeekNumber}
            max="53"
            min="1"
            name="week"
            required
            type="number"
          />
          <span className="text-xs font-normal text-[var(--muted)]">{weekLabel}</span>
        </label>
        <Button className="h-11 px-5 !text-neutral-950" type="submit">
          Apply recurring entries
        </Button>
      </div>
    </form>
  );
}
