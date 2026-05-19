import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { TimeEntryRecord } from "@/lib/services/time-tracking";
import { formatHours } from "@/lib/utils/format";

type TimeEntryTableProps = {
  deleteAction: (timeEntryId: string) => Promise<void>;
  timeEntries: TimeEntryRecord[];
};

export function TimeEntryTable({ deleteAction, timeEntries }: TimeEntryTableProps) {
  if (timeEntries.length === 0) {
    return (
      <div className="border border-[var(--border)] bg-[var(--panel)] p-6 text-[var(--muted)]">
        No time entries match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-[var(--border)] bg-[var(--panel)]">
      <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
        <thead className="border-b border-[var(--border)] bg-[#eef1eb]">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Product Name</th>
            <th className="px-4 py-3">Budget Name</th>
            <th className="px-4 py-3">Budget #</th>
            <th className="px-4 py-3">Task Description</th>
            <th className="px-4 py-3">Hours</th>
            <th className="px-4 py-3">Week</th>
            <th className="px-4 py-3">Notes</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {timeEntries.map((timeEntry) => (
            <tr key={timeEntry.id}>
              <td className="px-4 py-3">{timeEntry.entryDate}</td>
              <td className="px-4 py-3 font-semibold">{timeEntry.productName}</td>
              <td className="px-4 py-3">{timeEntry.budgetName}</td>
              <td className="px-4 py-3">{timeEntry.budgetNumber}</td>
              <td className="px-4 py-3">{timeEntry.taskDescription}</td>
              <td className="px-4 py-3 tabular-nums">
                {formatHours(Number(timeEntry.hoursWorked))}
              </td>
              <td className="px-4 py-3">{timeEntry.weekNumber}</td>
              <td className="px-4 py-3 text-[var(--muted)]">{timeEntry.notes}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
