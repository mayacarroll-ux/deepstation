import Link from "next/link";
import { faFloppyDisk, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Button } from "@/components/ui/button";
import { recurringDayOptions } from "@/lib/constants/recurring";
import type { RecurringTemplateRecord } from "@/lib/types/recurring";

type RecurringTemplateFormProps = {
  action: (formData: FormData) => Promise<void>;
  returnToPath: string;
  cancelHref: string;
  recurringTemplate?: RecurringTemplateRecord;
  submitLabel: string;
};

export function RecurringTemplateForm({
  action,
  returnToPath,
  cancelHref,
  recurringTemplate,
  submitLabel
}: RecurringTemplateFormProps) {
  return (
    <form action={action} className="grid gap-5 border border-[var(--border)] bg-[var(--panel)] p-6">
      <input name="templateId" type="hidden" value={recurringTemplate?.id ?? ""} />
      <input name="returnTo" type="hidden" value={returnToPath} />

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold md:col-span-3">
          Title / task description
          <input
            className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
            defaultValue={recurringTemplate?.taskDescription}
            name="taskDescription"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Product Name
          <input
            className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
            defaultValue={recurringTemplate?.productName}
            name="productName"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Budget Name
          <input
            className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
            defaultValue={recurringTemplate?.budgetName}
            name="budgetName"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Budget #
          <input
            className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
            defaultValue={recurringTemplate?.budgetNumber}
            name="budgetNumber"
            required
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold">
          Day of week
          <select
            className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
            defaultValue={String(recurringTemplate?.dayOfWeek ?? 1)}
            name="dayOfWeek"
            required
          >
            {recurringDayOptions.map((dayOption) => (
              <option key={dayOption.value} value={dayOption.value}>
                {dayOption.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Hours Worked
          <input
            className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
            defaultValue={recurringTemplate?.hoursWorked ?? ""}
            min="0.01"
            name="hoursWorked"
            required
            step="0.01"
            type="number"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Start date
          <input
            className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
            defaultValue={recurringTemplate?.startDate}
            name="startDate"
            required
            type="date"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="grid gap-2 text-sm font-semibold">
          End date
          <input
            className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
            defaultValue={recurringTemplate?.endDate ?? ""}
            name="endDate"
            type="date"
          />
        </label>
        <label className="flex items-center gap-3 text-sm font-semibold">
          <input
            defaultChecked={recurringTemplate?.isActive ?? true}
            name="isActive"
            type="checkbox"
          />
          Active
        </label>
        <div className="flex items-center gap-3">
          <Button type="submit">
            <span className="mr-2 inline-flex items-center">
              <FontAwesomeIcon className="h-3.5 w-3.5" icon={faFloppyDisk} />
            </span>
            {submitLabel}
          </Button>
          {recurringTemplate ? (
            <Link className="text-sm font-semibold text-[var(--muted)] hover:underline" href={cancelHref}>
              <span className="mr-1 inline-flex items-center">
                <FontAwesomeIcon className="h-3 w-3" icon={faXmark} />
              </span>
              Cancel edit
            </Link>
          ) : null}
        </div>
      </div>

      <label className="grid gap-2 text-sm font-semibold">
        Notes
        <textarea
          className="min-h-24 resize-y border border-[var(--border)] p-3 font-normal outline-none focus:border-[var(--accent)]"
          defaultValue={recurringTemplate?.notes ?? ""}
          name="notes"
        />
      </label>
    </form>
  );
}
