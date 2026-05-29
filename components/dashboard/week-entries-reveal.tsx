"use client";

import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatHours } from "@/lib/utils/format";

type WeekEntryRecord = {
  id: string;
  entryDate: string;
  taskDescription: string;
  productName: string;
  budgetName: string;
  budgetNumber: string;
  hoursWorked: string;
  notes: string | null;
};

type WeekEntriesRevealProps = {
  entries: WeekEntryRecord[];
  weekLabel: string;
};

function formatReadableDate(dateInputValue: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${dateInputValue}T00:00:00`));
}

export function WeekEntriesReveal({ entries, weekLabel }: WeekEntriesRevealProps) {
  const [isOpen, setIsOpen] = useState(false);

  const orderedEntries = useMemo(
    () => [...entries].sort((firstEntry, secondEntry) => secondEntry.entryDate.localeCompare(firstEntry.entryDate)),
    [entries]
  );

  const totalHours = useMemo(
    () => orderedEntries.reduce((currentTotalHours, entry) => currentTotalHours + Number(entry.hoursWorked), 0),
    [orderedEntries]
  );

  return (
    <section className="mt-3 border border-[var(--border)] bg-[var(--panel)] sm:mt-4">
      <div className="flex flex-col gap-3 border-b border-[var(--border)] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3">
        <div>
          <h3 className="text-sm font-semibold">Week entries</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {weekLabel} · {orderedEntries.length} {orderedEntries.length === 1 ? "entry" : "entries"} ·{" "}
            {formatHours(totalHours)} hrs
          </p>
        </div>
        <Button
          className="h-9 w-full px-3 sm:w-auto"
          onClick={() => setIsOpen((currentValue) => !currentValue)}
          type="button"
          variant="secondary"
        >
          <span className="mr-2 inline-flex items-center">
            <FontAwesomeIcon className="h-3.5 w-3.5" icon={isOpen ? faEyeSlash : faEye} />
          </span>
          {isOpen ? "Hide week entries" : "Show week entries"}
        </Button>
      </div>

      {isOpen ? (
        <div className="grid gap-3 p-3 sm:p-4">
          {orderedEntries.length > 0 ? (
            orderedEntries.map((entry) => (
              <article
                className="grid gap-2 border border-[var(--border)] bg-[var(--surface)] p-3 sm:grid-cols-[8rem_minmax(0,1fr)_6rem] sm:gap-3 sm:p-4"
                key={entry.id}
              >
                <div className="grid gap-1">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {formatReadableDate(entry.entryDate)}
                  </p>
                  <p className="text-xs text-[var(--muted)]">{entry.productName}</p>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold">{entry.taskDescription}</p>
                  <p className="mt-1 truncate text-xs text-[var(--muted)]">
                    {entry.budgetName} · {entry.budgetNumber}
                  </p>
                  {entry.notes ? (
                    <p className="mt-2 max-h-14 overflow-hidden break-words text-sm text-[var(--muted)]">
                      {entry.notes}
                    </p>
                  ) : null}
                </div>
                <p className="text-right text-sm font-semibold tabular-nums text-[var(--foreground)]">
                  {formatHours(Number(entry.hoursWorked))} hrs
                </p>
              </article>
            ))
          ) : (
            <div className="border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">
              No entries saved for this week.
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
