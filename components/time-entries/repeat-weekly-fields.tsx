"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const recurringDayOptions = [
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
  { label: "Sunday", value: 7 }
] as const;

type RepeatWeeklyFieldsProps = {
  enabled: boolean;
  onEnabledChange: (nextEnabled: boolean) => void;
  dayOfWeek: string;
  onDayOfWeekChange: (nextDayOfWeek: string) => void;
  startDate: string;
  onStartDateChange: (nextStartDate: string) => void;
  endDate: string;
  onEndDateChange: (nextEndDate: string) => void;
};

export function RepeatWeeklyFields({
  enabled,
  onEnabledChange,
  dayOfWeek,
  onDayOfWeekChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange
}: RepeatWeeklyFieldsProps) {
  return (
    <section className="grid gap-4 border border-[var(--border)] bg-[var(--surface)] p-4">
      <input name="repeatWeekly" type="hidden" value={enabled ? "on" : ""} />
      <label className="flex items-center gap-3 text-sm font-semibold">
        <Checkbox checked={enabled} onChange={(event) => onEnabledChange(event.target.checked)} />
        Repeat weekly
      </label>
      <p className="text-xs text-[var(--muted)]">
        When enabled, saving this entry also creates a recurring weekly template.
      </p>

      {enabled ? (
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-semibold">
            Day of week
            <Select
              name="recurringDayOfWeek"
              onChange={(event) => onDayOfWeekChange(event.target.value)}
              required={enabled}
              value={dayOfWeek}
            >
              {recurringDayOptions.map((dayOption) => (
                <option key={dayOption.value} value={String(dayOption.value)}>
                  {dayOption.label}
                </option>
              ))}
            </Select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Start date
            <Input
              name="recurringStartDate"
              onChange={(event) => onStartDateChange(event.target.value)}
              required={enabled}
              type="date"
              value={startDate}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            End date
            <Input
              name="recurringEndDate"
              onChange={(event) => onEndDateChange(event.target.value)}
              type="date"
              value={endDate}
            />
          </label>
        </div>
      ) : null}
    </section>
  );
}
