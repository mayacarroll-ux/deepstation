"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { BudgetMappingRecord } from "@/lib/services/time-tracking";
import { splitHoursEvenlyAcrossRows, formatHours } from "@/lib/utils/format";

type AllocationRowDraft = {
  id: string;
  included: boolean;
  budgetMappingId: string;
  taskDescription: string;
  notes: string;
  hoursWorked: number;
};

type WeeklyAllocationBuilderProps = {
  action: (formData: FormData) => Promise<void>;
  budgetMappings: BudgetMappingRecord[];
  defaultEntryDate: string;
  existingHours: number;
  initialRows?: Array<
    Pick<AllocationRowDraft, "budgetMappingId" | "taskDescription" | "notes" | "hoursWorked"> & {
      included?: boolean;
    }
  >;
  remainingHours: number;
  returnToPath: string;
  selectedWeekNumber: number;
  selectedWeekYear: number;
  submitLabel?: string;
};

function roundToTwoDecimals(hours: number) {
  return Math.round(hours * 100) / 100;
}

function createAllocationRow(budgetMappingId: string): AllocationRowDraft {
  return {
    id: crypto.randomUUID(),
    included: true,
    budgetMappingId,
    taskDescription: "",
    notes: "",
    hoursWorked: 0
  };
}

function distributeHoursAcrossIncludedRows(
  rows: AllocationRowDraft[],
  remainingHours: number
): AllocationRowDraft[] {
  const includedRowCount = rows.filter((row) => row.included).length;
  const suggestedHours = splitHoursEvenlyAcrossRows(remainingHours, includedRowCount);
  let includedRowIndex = 0;

  return rows.map((row) =>
    row.included
      ? {
          ...row,
          hoursWorked: suggestedHours[includedRowIndex++] ?? 0
        }
      : row
  );
}

function getInitialRows(firstBudgetMappingId: string, remainingHours: number) {
  return distributeHoursAcrossIncludedRows([createAllocationRow(firstBudgetMappingId)], remainingHours);
}

function getBudgetMappingLabel(budgetMapping: BudgetMappingRecord) {
  return `${budgetMapping.productName} · ${budgetMapping.budgetName} · ${budgetMapping.budgetNumber}`;
}

export function WeeklyAllocationBuilder({
  action,
  budgetMappings,
  defaultEntryDate,
  existingHours,
  initialRows,
  remainingHours,
  returnToPath,
  selectedWeekNumber,
  selectedWeekYear,
  submitLabel = "Save allocation entries"
}: WeeklyAllocationBuilderProps) {
  const firstBudgetMappingId = budgetMappings[0]?.id ?? "";
  const [allocationRows, setAllocationRows] = useState<AllocationRowDraft[]>(
    () =>
      initialRows && initialRows.length > 0
        ? initialRows.map((row) => ({
            id: crypto.randomUUID(),
            included: row.included ?? true,
            budgetMappingId: row.budgetMappingId,
            taskDescription: row.taskDescription,
            notes: row.notes,
            hoursWorked: row.hoursWorked
          }))
        : firstBudgetMappingId
          ? getInitialRows(firstBudgetMappingId, remainingHours)
          : []
  );
  const selectedRows = allocationRows.filter((row) => row.included);
  const selectedRowsTotalHours = roundToTwoDecimals(
    selectedRows.reduce((currentTotalHours, row) => currentTotalHours + row.hoursWorked, 0)
  );
  const allocationDifferenceHours = roundToTwoDecimals(remainingHours - selectedRowsTotalHours);
  const totalAfterAllocationHours = roundToTwoDecimals(existingHours + selectedRowsTotalHours);
  const allocationIsOpen = remainingHours > 0.01;

  const serializedAllocationPlan = useMemo(
    () =>
      JSON.stringify(
        allocationRows.map((row) => ({
          included: row.included,
          budgetMappingId: row.budgetMappingId,
          taskDescription: row.taskDescription,
          notes: row.notes,
          hoursWorked: row.hoursWorked
        }))
      ),
    [allocationRows]
  );

  function updateRows(updater: (rows: AllocationRowDraft[]) => AllocationRowDraft[]) {
    setAllocationRows((currentRows) => updater(currentRows));
  }

  function recalculateIncludedRows(rows: AllocationRowDraft[]) {
    if (rows.length === 0) {
      return rows;
    }

    return distributeHoursAcrossIncludedRows(rows, remainingHours);
  }

  function addRow() {
    if (!firstBudgetMappingId) {
      return;
    }

    updateRows((currentRows) =>
      recalculateIncludedRows([...currentRows, createAllocationRow(firstBudgetMappingId)])
    );
  }

  function removeRow(rowId: string) {
    updateRows((currentRows) => {
      const nextRows = currentRows.filter((row) => row.id !== rowId);

      return nextRows.length > 0 ? recalculateIncludedRows(nextRows) : nextRows;
    });
  }

  function updateRowField<RowKey extends keyof AllocationRowDraft>(
    rowId: string,
    fieldName: RowKey,
    fieldValue: AllocationRowDraft[RowKey]
  ) {
    updateRows((currentRows) =>
      currentRows.map((row) => (row.id === rowId ? { ...row, [fieldName]: fieldValue } : row))
    );
  }

  function toggleIncluded(rowId: string) {
    updateRows((currentRows) => {
      const nextRows = currentRows.map((row) =>
        row.id === rowId ? { ...row, included: !row.included } : row
      );

      return recalculateIncludedRows(nextRows);
    });
  }

  function normalizeHoursInput(value: string) {
    const parsedHours = Number(value);

    return Number.isFinite(parsedHours) && parsedHours >= 0 ? roundToTwoDecimals(parsedHours) : 0;
  }

  const canSave =
    budgetMappings.length > 0 &&
    allocationRows.some((row) => row.included) &&
    selectedRowsTotalHours > 0 &&
    Math.abs(allocationDifferenceHours) < 0.01 &&
    allocationRows.every((row) => !row.included || row.budgetMappingId.length > 0) &&
    allocationRows.every((row) => !row.included || row.taskDescription.trim().length > 0);

  if (budgetMappings.length === 0) {
    return (
      <div className="border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
        Add budget mappings first. The allocation builder uses existing project mappings to create
        new time entries.
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-4">
      <input name="allocationWeek" type="hidden" value={selectedWeekNumber} />
      <input name="allocationYear" type="hidden" value={selectedWeekYear} />
      <input name="entryDate" type="hidden" value={defaultEntryDate} />
      <input name="returnTo" type="hidden" value={returnToPath} />
      <input name="allocationPlan" type="hidden" value={serializedAllocationPlan} />

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold">
          <span className="min-h-5">Entry date</span>
          <input
            className="h-11 border border-[var(--border)] bg-[var(--surface)] px-3 font-normal outline-none focus:border-[var(--accent)]"
            defaultValue={defaultEntryDate}
            name="entryDate"
            type="date"
          />
          <span className="text-xs font-normal text-[var(--muted)]">
            Generated rows use this date and can be edited later.
          </span>
        </label>
        <div className="grid gap-2 text-sm font-semibold">
          <span className="min-h-5">Weekly cap</span>
          <div className="flex h-11 items-center border border-[var(--border)] bg-[var(--surface)] px-3">
            {formatHours(20)} hrs
          </div>
        </div>
        <div className="grid gap-2 text-sm font-semibold">
          <span className="min-h-5">Selected week total</span>
          <div className="flex h-11 items-center border border-[var(--border)] bg-[var(--surface)] px-3">
            {formatHours(totalAfterAllocationHours)} hrs
          </div>
        </div>
      </div>

      <div className="grid gap-3 border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-[var(--foreground)]">Allocation rows</h4>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Split the remaining {formatHours(remainingHours)} hrs across the rows you select.
              Quarter-hour rounding is applied automatically.
            </p>
          </div>
          <Button
            className="h-10 px-4"
            onClick={() => addRow()}
            disabled={!allocationIsOpen}
            type="button"
            variant="secondary"
          >
            Add row
          </Button>
        </div>

        <div className="grid gap-3">
          {allocationRows.map((row, rowIndex) => (
            <div
              className="grid gap-3 border border-[var(--border)] bg-[var(--panel)] p-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1.3fr)_minmax(0,1.1fr)_7rem_7rem_6.5rem]"
              key={row.id}
            >
              <label className="grid min-w-0 gap-2 text-sm font-semibold">
                <span className="min-h-5">Project / task</span>
                <select
                  className="h-11 min-w-0 border border-[var(--border)] bg-[var(--surface)] px-3 font-normal outline-none focus:border-[var(--accent)]"
                  onChange={(event) =>
                    updateRowField(row.id, "budgetMappingId", event.target.value)
                  }
                  value={row.budgetMappingId}
                >
                  {budgetMappings.map((budgetMapping) => (
                    <option key={budgetMapping.id} value={budgetMapping.id}>
                      {getBudgetMappingLabel(budgetMapping)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid min-w-0 gap-2 text-sm font-semibold">
                <span className="min-h-5">Task description</span>
                <input
                  className="h-11 min-w-0 border border-[var(--border)] bg-[var(--surface)] px-3 font-normal outline-none focus:border-[var(--accent)]"
                  onChange={(event) =>
                    updateRowField(row.id, "taskDescription", event.target.value)
                  }
                  placeholder="Wireframes, review, prep..."
                  value={row.taskDescription}
                />
              </label>
              <label className="grid min-w-0 gap-2 text-sm font-semibold xl:col-span-1">
                <span className="min-h-5">Notes</span>
                <input
                  className="h-11 min-w-0 border border-[var(--border)] bg-[var(--surface)] px-3 font-normal outline-none focus:border-[var(--accent)]"
                  onChange={(event) => updateRowField(row.id, "notes", event.target.value)}
                  placeholder="Optional"
                  value={row.notes}
                />
              </label>
              <label className="grid min-w-0 gap-2 text-sm font-semibold">
                <span className="min-h-5">Hours</span>
                <input
                  className="h-11 min-w-0 border border-[var(--border)] bg-[var(--surface)] px-3 font-normal tabular-nums outline-none focus:border-[var(--accent)]"
                  inputMode="decimal"
                  min="0"
                  onChange={(event) =>
                    updateRowField(
                      row.id,
                      "hoursWorked",
                      normalizeHoursInput(event.target.value)
                    )
                  }
                  step="0.25"
                  type="number"
                  value={row.hoursWorked}
                />
              </label>
              <label className="flex min-w-0 items-end gap-2 text-sm font-semibold">
                <input
                  checked={row.included}
                  className="h-4 w-4 border-[var(--border)] accent-[var(--accent)]"
                  onChange={() => toggleIncluded(row.id)}
                  type="checkbox"
                />
                Include
              </label>
              <div className="flex min-w-0 items-end justify-start xl:justify-end">
                <Button
                  className="h-10 px-3"
                  onClick={() => removeRow(row.id)}
                  type="button"
                  variant="secondary"
                >
                  Remove
                </Button>
              </div>

              {rowIndex === 0 ? (
                <p className="text-xs text-[var(--muted)] md:col-span-2 xl:col-span-6">
                  Adjust the first row or add more rows to split the remaining hours across multiple
                  project/task entries.
                </p>
              ) : null}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-3 text-sm">
          <div className="grid gap-1">
            <p className="font-semibold text-[var(--foreground)]">
              Allocation total: {formatHours(selectedRowsTotalHours)} hrs
            </p>
            <p className="text-xs text-[var(--muted)]">
              Difference from remaining: {formatHours(Math.abs(allocationDifferenceHours))} hrs
              {allocationDifferenceHours === 0 ? "" : allocationDifferenceHours > 0 ? " short" : " over"}
            </p>
          </div>
          <Button
            className="h-11 px-5"
            disabled={!canSave}
            type="submit"
          >
            {submitLabel}
          </Button>
        </div>

        <p className="text-xs text-[var(--muted)]">
          Generated rows are saved as normal time entries. They remain editable and are marked as
          allocation-generated in the table.
        </p>
        {!allocationIsOpen ? (
          <p className="text-xs text-[var(--muted)]">
            No remaining hours are available for this week.
          </p>
        ) : null}
      </div>
    </form>
  );
}
