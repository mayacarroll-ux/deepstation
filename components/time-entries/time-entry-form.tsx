"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type {
  BudgetMappingRecord,
  TimeEntryRecord
} from "@/lib/services/time-tracking";
import {
  formatWeekLabel,
  getIsoWeekNumber,
  getIsoWeekYear,
  getTodayInputValue
} from "@/lib/utils/dates";
import {
  calculateHoursFromTimeRange,
  formatHours,
  formatHourUnit
} from "@/lib/utils/format";

type TimeEntryFormProps = {
  action: (formData: FormData) => Promise<void>;
  budgetMappings: BudgetMappingRecord[];
  timeEntry?: TimeEntryRecord;
  submitLabel: string;
};

export function TimeEntryForm({
  action,
  budgetMappings,
  timeEntry,
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
    () => calculateHoursFromTimeRange(startTime, endTime),
    [endTime, startTime]
  );

  const durationHint = calculatedHoursWorked
    ? `${formatHours(calculatedHoursWorked)} ${formatHourUnit(calculatedHoursWorked)}`
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
  }

  return (
    <form action={action} className="grid gap-5 border border-[var(--border)] bg-[var(--panel)] p-6">
      <input name="budgetMappingId" type="hidden" value={budgetMappingId} />

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold">
          Date
          <input
            className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
            name="entryDate"
            onChange={(event) => applyEntryDate(event.target.value)}
            required
            type="date"
            value={entryDate}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Product Name
          <select
            className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
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
          </select>
          <span className="text-xs font-normal text-[var(--muted)]">
            Add new products on the Budget key page.
          </span>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Week Number
          <input
            className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
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
      </div>

      {matchingBudgetMappings.length > 1 ? (
        <label className="grid gap-2 text-sm font-semibold">
          Matching budget
          <select
            className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
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
          </select>
        </label>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold">
          Start Time
          <input
            className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
            name="startTime"
            onChange={(event) => setStartTime(event.target.value)}
            type="time"
            value={startTime}
          />
          <span className="text-xs font-normal text-[var(--muted)]">
            Optional. Use 24-hour time like 09:00.
          </span>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          End Time
          <input
            className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
            name="endTime"
            onChange={(event) => setEndTime(event.target.value)}
            type="time"
            value={endTime}
          />
          <span className="text-xs font-normal text-[var(--muted)]">
            Optional. Fill both fields to auto-calculate hours.
          </span>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Hours Worked
          <input
            className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
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
          {durationHint ? (
            <span className="text-xs font-normal text-[var(--muted)]">
              Calculated duration: {durationHint}
            </span>
          ) : null}
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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

      <label className="grid gap-2 text-sm font-semibold">
        Task Description
        <input
          className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
          defaultValue={timeEntry?.taskDescription}
          name="taskDescription"
          required
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold">
        Notes
        <textarea
          className="min-h-24 resize-y border border-[var(--border)] p-3 font-normal outline-none focus:border-[var(--accent)]"
          defaultValue={timeEntry?.notes ?? ""}
          name="notes"
        />
      </label>

      <div>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
