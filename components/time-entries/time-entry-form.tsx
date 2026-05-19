"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type {
  BudgetMappingRecord,
  TimeEntryRecord
} from "@/lib/services/time-tracking";
import { getIsoWeekNumber, getTodayInputValue } from "@/lib/utils/dates";

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
  const [productName, setProductName] = useState(timeEntry?.productName ?? "");
  const [budgetName, setBudgetName] = useState(timeEntry?.budgetName ?? "");
  const [budgetNumber, setBudgetNumber] = useState(timeEntry?.budgetNumber ?? "");
  const [budgetMappingId, setBudgetMappingId] = useState(timeEntry?.budgetMappingId ?? "");
  const [weekNumber, setWeekNumber] = useState(
    String(timeEntry?.weekNumber ?? getIsoWeekNumber(initialEntryDate))
  );

  const productNames = useMemo(
    () =>
      Array.from(new Set(budgetMappings.map((budgetMapping) => budgetMapping.productName))).sort(),
    [budgetMappings]
  );

  const matchingBudgetMappings = useMemo(
    () =>
      budgetMappings.filter(
        (budgetMapping) =>
          budgetMapping.productName.toLowerCase() === productName.trim().toLowerCase()
      ),
    [budgetMappings, productName]
  );

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
      <datalist id="product-name-options">
        {productNames.map((availableProductName) => (
          <option key={availableProductName} value={availableProductName} />
        ))}
      </datalist>

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
          <input
            className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
            list="product-name-options"
            name="productName"
            onChange={(event) => applyProductName(event.target.value)}
            required
            value={productName}
          />
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
        <label className="grid gap-2 text-sm font-semibold">
          Hours Worked
          <input
            className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
            defaultValue={timeEntry?.hoursWorked ?? ""}
            min="0.01"
            name="hoursWorked"
            required
            step="0.01"
            type="number"
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
