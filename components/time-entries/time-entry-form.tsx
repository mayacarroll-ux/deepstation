"use client";

import { useEffect, useMemo, useState } from "react";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  BudgetMappingRecord,
  TimeEntryRecord
} from "@/lib/services/time-tracking";
import { RepeatWeeklyFields } from "@/components/time-entries/repeat-weekly-fields";
import {
  getIsoDayOfWeek,
  formatWeekLabel,
  getIsoWeekNumber,
  getIsoWeekYear,
  getTodayInputValue
} from "@/lib/utils/dates";
import {
  calculateHoursFromTimeRange,
  formatHours,
  formatHourUnit,
  formatTimeRange
} from "@/lib/utils/format";

type TimeEntryFormProps = {
  action: (formData: FormData) => Promise<void>;
  budgetMappings: BudgetMappingRecord[];
  className?: string;
  returnToPath?: string;
  timeEntry?: TimeEntryRecord;
  showRepeatWeekly?: boolean;
  submitLabel: string;
};

export function TimeEntryForm({
  action,
  budgetMappings,
  className,
  returnToPath,
  timeEntry,
  showRepeatWeekly = false,
  submitLabel
}: TimeEntryFormProps) {
  const initialEntryDate = timeEntry?.entryDate ?? getTodayInputValue();
  const [entryDate, setEntryDate] = useState(initialEntryDate);
  const [startTime, setStartTime] = useState(timeEntry?.startTime ?? "");
  const [endTime, setEndTime] = useState(timeEntry?.endTime ?? "");
  const [productName, setProductName] = useState(timeEntry?.productName ?? "");
  const [budgetName, setBudgetName] = useState(timeEntry?.budgetName ?? "");
  const [budgetNumber, setBudgetNumber] = useState(timeEntry?.budgetNumber ?? "");
  const [budgetMappingId, setBudgetMappingId] = useState(timeEntry?.budgetMappingId ?? "");
  const [hoursWorked, setHoursWorked] = useState(String(timeEntry?.hoursWorked ?? ""));
  const [hoursWorkedManuallyEdited, setHoursWorkedManuallyEdited] = useState(false);
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [recurringDayOfWeek, setRecurringDayOfWeek] = useState(String(getIsoDayOfWeek(initialEntryDate)));
  const [recurringStartDate, setRecurringStartDate] = useState(initialEntryDate);
  const [recurringEndDate, setRecurringEndDate] = useState("");
  const [weekNumber, setWeekNumber] = useState(
    String(timeEntry?.weekNumber ?? getIsoWeekNumber(initialEntryDate))
  );
  const parsedWeekNumber = Number(weekNumber);
  const weekLabel =
    Number.isInteger(parsedWeekNumber) && parsedWeekNumber >= 1 && parsedWeekNumber <= 53
      ? formatWeekLabel(parsedWeekNumber, getIsoWeekYear(entryDate))
      : null;
  const currentProductName = timeEntry?.productName ?? "";

  const productNames = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...budgetMappings.map((budgetMapping) => budgetMapping.productName),
            currentProductName
          ].filter((availableProductName) => availableProductName.trim().length > 0)
        )
      ).sort((firstProductName, secondProductName) =>
        firstProductName.localeCompare(secondProductName)
      ),
    [budgetMappings, currentProductName]
  );

  const matchingBudgetMappings = useMemo(
    () =>
      budgetMappings.filter(
        (budgetMapping) =>
          budgetMapping.productName.toLowerCase() === productName.trim().toLowerCase()
      ),
    [budgetMappings, productName]
  );

  const calculatedHoursWorked = useMemo(
    () => {
      const rawCalculatedHours = calculateHoursFromTimeRange(startTime, endTime);

      return rawCalculatedHours === null ? null : roundToQuarterHour(rawCalculatedHours);
    },
    [endTime, startTime]
  );

  const calculatedTimeRangeLabel =
    calculatedHoursWorked !== null ? formatTimeRange(startTime, endTime) : null;
  const durationHint = calculatedHoursWorked
    ? `${formatHours(calculatedHoursWorked)} ${formatHourUnit(calculatedHoursWorked)}`
    : null;
  const invalidTimeRangeMessage =
    startTime || endTime
      ? "Enter a valid time range with End Time after Start Time to auto-calculate hours."
      : null;

  useEffect(() => {
    if (calculatedHoursWorked !== null && !hoursWorkedManuallyEdited) {
      setHoursWorked(String(calculatedHoursWorked));
    }
  }, [calculatedHoursWorked, hoursWorkedManuallyEdited]);

  function applyProductName(nextProductName: string) {
    setProductName(nextProductName);

    const exactMatches = budgetMappings.filter(
      (budgetMapping) =>
        budgetMapping.productName.toLowerCase() === nextProductName.trim().toLowerCase()
    );

    if (exactMatches.length === 1) {
      const [budgetMapping] = exactMatches;
      setBudgetMappingId(budgetMapping.id);
      setBudgetName(budgetMapping.budgetName);
      setBudgetNumber(budgetMapping.budgetNumber);
    } else {
      setBudgetMappingId("");
      setBudgetName("");
      setBudgetNumber("");
    }
  }

  function applyBudgetMapping(nextBudgetMappingId: string) {
    setBudgetMappingId(nextBudgetMappingId);

    const selectedBudgetMapping = budgetMappings.find(
      (budgetMapping) => budgetMapping.id === nextBudgetMappingId
    );

    if (selectedBudgetMapping) {
      setProductName(selectedBudgetMapping.productName);
      setBudgetName(selectedBudgetMapping.budgetName);
      setBudgetNumber(selectedBudgetMapping.budgetNumber);
    }
  }

  function applyEntryDate(nextEntryDate: string) {
    setEntryDate(nextEntryDate);
    setWeekNumber(String(getIsoWeekNumber(nextEntryDate)));

    if (repeatWeekly) {
      setRecurringDayOfWeek(String(getIsoDayOfWeek(nextEntryDate)));
      setRecurringStartDate(nextEntryDate);
    }
  }

function roundToQuarterHour(hours: number) {
  return Math.round(hours * 4) / 4;
}

  return (
    <form action={action} className={`grid gap-5 border border-[var(--border)] bg-[var(--panel)] p-6 ${className ?? ""}`}>
      <input name="budgetMappingId" type="hidden" value={budgetMappingId} />
      {returnToPath ? <input name="returnTo" type="hidden" value={returnToPath} /> : null}

      <section className="grid gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">When</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-semibold">
            Date
            <Input
              name="entryDate"
              onChange={(event) => applyEntryDate(event.target.value)}
              required
              type="date"
              value={entryDate}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Week Number
            <Input
              max="53"
              min="1"
              name="weekNumber"
              onChange={(event) => setWeekNumber(event.target.value)}
              required
              type="number"
              value={weekNumber}
            />
            {weekLabel ? (
              <span className="text-xs font-normal text-[var(--muted)]">{weekLabel}</span>
            ) : null}
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Start Time
            <Input
              name="startTime"
              onChange={(event) => {
                setStartTime(event.target.value);
                setHoursWorkedManuallyEdited(false);
              }}
              type="time"
              value={startTime}
            />
            <span className="text-xs font-normal text-[var(--muted)]">
              Optional. Use 24-hour time like 09:00.
            </span>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            End Time
            <Input
              name="endTime"
              onChange={(event) => {
                setEndTime(event.target.value);
                setHoursWorkedManuallyEdited(false);
              }}
              type="time"
              value={endTime}
            />
            <span className="text-xs font-normal text-[var(--muted)]">
              Optional. Fill both fields to auto-calculate hours.
            </span>
          </label>
          <label className="grid gap-2 text-sm font-semibold md:col-span-2">
            Hours Worked
            <Input
              max="999.99"
              min="0.01"
              name="hoursWorked"
              onChange={(event) => {
                setHoursWorked(event.target.value);
                setHoursWorkedManuallyEdited(true);
              }}
              required
              step="0.01"
              type="number"
              value={hoursWorked}
            />
            <span className="text-xs font-normal text-[var(--muted)]">
              Decimal hours: 0.25 = 15 minutes, 0.5 = 30 minutes, 0.75 = 45 minutes, 1.0 = 1 hour.
            </span>
            {calculatedTimeRangeLabel ? (
              <span className="text-xs font-normal text-[var(--muted)]">
                Calculated from {calculatedTimeRangeLabel}
              </span>
            ) : null}
            {durationHint ? (
              <span className="text-xs font-normal text-[var(--muted)]">
                Calculated duration: {durationHint}
              </span>
            ) : null}
            {!calculatedHoursWorked && invalidTimeRangeMessage ? (
              <span className="text-xs font-normal text-[var(--warning)]">
                {invalidTimeRangeMessage}
              </span>
            ) : null}
          </label>
        </div>
      </section>

      <section className="grid gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Project
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">
            Product Name
            <Select
              name="productName"
              onChange={(event) => applyProductName(event.target.value)}
              required
              value={productName}
            >
              <option value="">Choose a product</option>
              {productNames.map((availableProductName) => (
                <option key={availableProductName} value={availableProductName}>
                  {availableProductName}
                </option>
              ))}
            </Select>
            <span className="text-xs font-normal text-[var(--muted)]">
              Add new products on the Budget key page.
            </span>
          </label>
          {matchingBudgetMappings.length > 1 ? (
            <label className="grid gap-2 text-sm font-semibold">
              Matching budget
              <Select
                onChange={(event) => applyBudgetMapping(event.target.value)}
                required
                value={budgetMappingId}
              >
                <option value="">Choose a budget for this product</option>
                {matchingBudgetMappings.map((budgetMapping) => (
                  <option key={budgetMapping.id} value={budgetMapping.id}>
                    {budgetMapping.budgetName} — {budgetMapping.budgetNumber}
                  </option>
                ))}
              </Select>
            </label>
          ) : null}
          <label className="grid gap-2 text-sm font-semibold">
            Budget Name
            <input
              className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
              name="budgetName"
              onChange={(event) => setBudgetName(event.target.value)}
              required
              value={budgetName}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Budget #
            <input
              className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
              name="budgetNumber"
              onChange={(event) => setBudgetNumber(event.target.value)}
              required
              value={budgetNumber}
            />
          </label>
        </div>
      </section>

      <section className="grid gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Details
        </h3>
        <label className="grid gap-2 text-sm font-semibold">
          Task Description
          <Input defaultValue={timeEntry?.taskDescription} name="taskDescription" required />
        </label>

        <label className="grid gap-2 text-sm font-semibold">
          Notes
          <Textarea defaultValue={timeEntry?.notes ?? ""} name="notes" />
        </label>
      </section>

      {showRepeatWeekly ? (
        <RepeatWeeklyFields
          dayOfWeek={recurringDayOfWeek}
          enabled={repeatWeekly}
          endDate={recurringEndDate}
          onDayOfWeekChange={setRecurringDayOfWeek}
          onEnabledChange={(nextEnabled) => {
            setRepeatWeekly(nextEnabled);

            if (nextEnabled) {
              setRecurringDayOfWeek(String(getIsoDayOfWeek(entryDate)));
              setRecurringStartDate(entryDate);
            }
          }}
          onEndDateChange={setRecurringEndDate}
          onStartDateChange={setRecurringStartDate}
          startDate={recurringStartDate}
        />
      ) : null}

      <div>
        <Button type="submit">
          <span className="mr-2 inline-flex items-center">
            <FontAwesomeIcon className="h-3.5 w-3.5" icon={faFloppyDisk} />
          </span>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
