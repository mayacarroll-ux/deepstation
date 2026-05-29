import Link from "next/link";
import { faPenToSquare, faToggleOn } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Button } from "@/components/ui/button";
import { recurringDayOptions } from "@/lib/constants/recurring";
import type { RecurringTemplateRecord } from "@/lib/types/recurring";

type RecurringTemplateTableProps = {
  recurringTemplates: RecurringTemplateRecord[];
  basePath: string;
  toggleActiveAction: (templateId: string, formData: FormData) => Promise<void>;
};

function getRecurringDayLabel(dayOfWeek: number) {
  return recurringDayOptions.find((dayOption) => dayOption.value === dayOfWeek)?.label ?? "Unknown";
}

export function RecurringTemplateTable({
  recurringTemplates,
  basePath,
  toggleActiveAction
}: RecurringTemplateTableProps) {
  if (recurringTemplates.length === 0) {
    return (
      <div className="border border-[var(--border)] bg-[var(--panel)] p-6 text-[var(--muted)]">
        No recurring templates yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-[var(--border)] bg-[var(--panel)]">
      <table className="w-full min-w-[1280px] border-collapse text-left text-sm">
        <thead className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)]">
          <tr>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Title / task description</th>
            <th className="px-4 py-3">Product Name</th>
            <th className="px-4 py-3">Budget Name</th>
            <th className="px-4 py-3">Budget #</th>
            <th className="px-4 py-3">Day</th>
            <th className="px-4 py-3">Hours</th>
            <th className="px-4 py-3">Start</th>
            <th className="px-4 py-3">End</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {recurringTemplates.map((recurringTemplate) => (
            <tr className="transition-colors hover:bg-[var(--surface)]" key={recurringTemplate.id}>
              <td className="px-4 py-3">
                <span
                  className={
                    recurringTemplate.isActive
                      ? "rounded-full border border-[var(--accent)] px-2 py-1 text-xs font-semibold text-[var(--accent)]"
                      : "rounded-full border border-[var(--border)] px-2 py-1 text-xs font-semibold text-[var(--muted)]"
                  }
                >
                  {recurringTemplate.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-4 py-3 font-semibold">{recurringTemplate.taskDescription}</td>
              <td className="px-4 py-3">{recurringTemplate.productName}</td>
              <td className="px-4 py-3">{recurringTemplate.budgetName}</td>
              <td className="px-4 py-3">{recurringTemplate.budgetNumber}</td>
              <td className="px-4 py-3">{getRecurringDayLabel(recurringTemplate.dayOfWeek)}</td>
              <td className="px-4 py-3 tabular-nums">{recurringTemplate.hoursWorked}</td>
              <td className="px-4 py-3">{recurringTemplate.startDate}</td>
              <td className="px-4 py-3">{recurringTemplate.endDate ?? "Open ended"}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Link
                    className="px-3 py-2 font-semibold hover:underline"
                    href={`${basePath}?recurringEdit=${recurringTemplate.id}`}
                  >
                    <span className="mr-2 inline-flex items-center">
                      <FontAwesomeIcon className="h-3.5 w-3.5" icon={faPenToSquare} />
                    </span>
                    Edit
                  </Link>
                  <form action={toggleActiveAction.bind(null, recurringTemplate.id)}>
                    <input
                      name="returnTo"
                      type="hidden"
                      value={basePath}
                    />
                    <input
                      name="isActive"
                      type="hidden"
                      value={recurringTemplate.isActive ? "false" : "true"}
                    />
                    <Button type="submit" variant="secondary">
                      <span className="mr-2 inline-flex items-center">
                        <FontAwesomeIcon className="h-3.5 w-3.5" icon={faToggleOn} />
                      </span>
                      {recurringTemplate.isActive ? "Deactivate" : "Activate"}
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
