import { faCalendarWeek } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Button } from "@/components/ui/button";
import { formatWeekLabel } from "@/lib/utils/dates";

type WeekSelectorProps = {
  actionLabel: string;
  defaultWeekNumber: number;
  defaultWeekYear: number;
  weekFieldName?: string;
  yearFieldName?: string;
  hiddenFields?: Record<string, string>;
  formAction?: string | ((formData: FormData) => Promise<void>);
  onSubmitButtonVariant?: "primary" | "secondary";
};

export function WeekSelector({
  actionLabel,
  defaultWeekNumber,
  defaultWeekYear,
  weekFieldName = "week",
  yearFieldName = "year",
  hiddenFields,
  formAction,
  onSubmitButtonVariant = "primary"
}: WeekSelectorProps) {
  const selectedWeekLabel = formatWeekLabel(defaultWeekNumber, defaultWeekYear);

  return (
    <form
      action={formAction}
      className="grid gap-3 border border-[var(--border)] bg-[var(--panel)] p-4 sm:grid-cols-[8rem_10rem_auto] sm:items-end"
    >
      {hiddenFields
        ? Object.entries(hiddenFields).map(([fieldName, fieldValue]) => (
            <input key={fieldName} name={fieldName} type="hidden" value={fieldValue} />
          ))
        : null}
      <label className="grid gap-2 text-sm font-semibold">
        <span className="min-h-5">Year</span>
        <input
          className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
          defaultValue={defaultWeekYear}
          max="2100"
          min="2000"
          name={yearFieldName}
          required
          type="number"
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        <span className="min-h-5">Week Number</span>
        <input
          className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
          defaultValue={defaultWeekNumber}
          max="53"
          min="1"
          name={weekFieldName}
          required
          type="number"
        />
        <span className="min-h-4 text-xs font-normal text-[var(--muted)]">{selectedWeekLabel}</span>
      </label>
      <Button
        className="h-11 self-end px-5 !text-neutral-950"
        type="submit"
        variant={onSubmitButtonVariant}
      >
        <span className="mr-2 inline-flex items-center">
          <FontAwesomeIcon className="h-3.5 w-3.5" icon={faCalendarWeek} />
        </span>
        {actionLabel}
      </Button>
    </form>
  );
}
