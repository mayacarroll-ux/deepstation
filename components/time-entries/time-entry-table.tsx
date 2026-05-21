import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type { TimeEntryRecord } from "@/lib/services/time-tracking";
import { formatWeekLabel, getIsoWeekYear } from "@/lib/utils/dates";
import { formatHours } from "@/lib/utils/format";

type TimeEntryTableProps = {
  deleteAction: (timeEntryId: string) => Promise<void>;
  makeRecurringAction: (timeEntryId: string, formData: FormData) => Promise<void>;
  recurringTemplateSourceTimeEntryIds: string[];
  returnToPath: string;
  timeEntries: TimeEntryRecord[];
};

type WeeklyTimeEntryGroup = {
  weekYear: number;
  weekNumber: number;
  entries: TimeEntryRecord[];
  totalHours: number;
};

function groupTimeEntriesByWeek(timeEntries: TimeEntryRecord[]) {
  const weeklyGroupsByKey = new Map<string, WeeklyTimeEntryGroup>();

  for (const timeEntry of timeEntries) {
    const weekYear = getIsoWeekYear(timeEntry.entryDate);
    const weekNumber = timeEntry.weekNumber;
    const weekKey = `${weekYear}-${String(weekNumber).padStart(2, "0")}`;
    const existingGroup = weeklyGroupsByKey.get(weekKey);
    const hoursWorked = Number(timeEntry.hoursWorked);

    if (existingGroup) {
      existingGroup.entries.push(timeEntry);
      existingGroup.totalHours += hoursWorked;
      continue;
    }

    weeklyGroupsByKey.set(weekKey, {
      weekYear,
      weekNumber,
      entries: [timeEntry],
      totalHours: hoursWorked
    });
  }

  return Array.from(weeklyGroupsByKey.values()).sort((firstGroup, secondGroup) => {
    if (firstGroup.weekYear !== secondGroup.weekYear) {
      return secondGroup.weekYear - firstGroup.weekYear;
    }

    return secondGroup.weekNumber - firstGroup.weekNumber;
  });
}

function sortEntriesWithinWeek(entries: TimeEntryRecord[]) {
  return [...entries].sort((firstEntry, secondEntry) => {
    const dateComparison = secondEntry.entryDate.localeCompare(firstEntry.entryDate);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    return secondEntry.createdAt.getTime() - firstEntry.createdAt.getTime();
  });
}

export function TimeEntryTable({
  deleteAction,
  makeRecurringAction,
  recurringTemplateSourceTimeEntryIds,
  returnToPath,
  timeEntries
}: TimeEntryTableProps) {
  if (timeEntries.length === 0) {
    return (
      <div className="border border-[var(--border)] bg-[var(--panel)] p-6 text-[var(--muted)]">
        No time entries match the current filters.
      </div>
    );
  }

  const weeklyGroups = groupTimeEntriesByWeek(timeEntries);
  const recurringTemplateSourceTimeEntryIdSet = new Set(recurringTemplateSourceTimeEntryIds);

  return (
    <div className="grid gap-4">
      {weeklyGroups.map((weeklyGroup) => {
        const orderedEntries = sortEntriesWithinWeek(weeklyGroup.entries);
        const weekLabel = formatWeekLabel(weeklyGroup.weekNumber, weeklyGroup.weekYear);

        return (
          <section
            className="overflow-hidden border border-[var(--border)] bg-[var(--panel)]"
            key={`${weeklyGroup.weekYear}-${weeklyGroup.weekNumber}`}
          >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
              <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
                  {weekLabel}
                </h3>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {orderedEntries.length} {orderedEntries.length === 1 ? "entry" : "entries"} in
                  this week
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums text-[var(--foreground)]">
                {formatHours(weeklyGroup.totalHours)} hrs
              </p>
            </div>
            <div className="overflow-x-auto">
              <Table className="min-w-[1160px] text-left text-sm">
                <TableHeader className="border-b border-[var(--border)] text-[var(--foreground)]">
                  <tr>
                    <TableHead className="px-4 py-3">Date</TableHead>
                    <TableHead className="px-4 py-3">Product Name</TableHead>
                    <TableHead className="px-4 py-3">Budget Name</TableHead>
                    <TableHead className="px-4 py-3">Budget #</TableHead>
                    <TableHead className="px-4 py-3">Task Description</TableHead>
                    <TableHead className="px-4 py-3">Hours</TableHead>
                    <TableHead className="px-4 py-3">Week</TableHead>
                    <TableHead className="px-4 py-3">Source</TableHead>
                    <TableHead className="px-4 py-3">Notes</TableHead>
                    <TableHead className="px-4 py-3 text-right">Actions</TableHead>
                  </tr>
                </TableHeader>
                <TableBody className="divide-y divide-[var(--border)]">
                  {orderedEntries.map((timeEntry) => (
                    <tr className="transition-colors hover:bg-[var(--surface)]" key={timeEntry.id}>
                      <TableCell className="px-4 py-3">{timeEntry.entryDate}</TableCell>
                      <TableCell className="px-4 py-3 font-semibold">{timeEntry.productName}</TableCell>
                      <TableCell className="px-4 py-3">{timeEntry.budgetName}</TableCell>
                      <TableCell className="px-4 py-3">{timeEntry.budgetNumber}</TableCell>
                      <TableCell className="px-4 py-3">{timeEntry.taskDescription}</TableCell>
                      <TableCell className="px-4 py-3 tabular-nums">
                        {formatHours(Number(timeEntry.hoursWorked))}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {formatWeekLabel(timeEntry.weekNumber, getIsoWeekYear(timeEntry.entryDate))}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {timeEntry.allocationBatchId ? (
                          <Badge>
                            Allocation
                          </Badge>
                        ) : timeEntry.recurringTemplateId ? (
                          <Badge>
                            Recurring
                          </Badge>
                        ) : (
                          <span className="text-xs font-semibold text-[var(--muted)]">Manual</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-[var(--muted)]">{timeEntry.notes}</TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {timeEntry.recurringTemplateId ||
                          recurringTemplateSourceTimeEntryIdSet.has(timeEntry.id) ? (
                            <span className="px-3 py-2 text-sm font-semibold text-[var(--accent)]">
                              Recurring
                            </span>
                          ) : (
                            <form action={makeRecurringAction.bind(null, timeEntry.id)}>
                              <input name="returnTo" type="hidden" value={returnToPath} />
                              <Button type="submit" variant="secondary">
                                Make recurring
                              </Button>
                            </form>
                          )}
                          <Link
                            className="px-3 py-2 font-semibold hover:underline"
                            href={`/time-entries/${timeEntry.id}/edit`}
                          >
                            Edit
                          </Link>
                          <form action={deleteAction.bind(null, timeEntry.id)}>
                            <Button type="submit" variant="secondary">
                              Delete
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
