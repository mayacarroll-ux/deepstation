"use client";

import { faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import type { TimeEntryRecord } from "@/lib/services/time-tracking";

type DeleteTimeEntryButtonProps = {
  deleteAction: (timeEntryId: string, formData: FormData) => Promise<void>;
  entry: TimeEntryRecord;
  returnToPath: string;
};

export function DeleteTimeEntryButton({
  deleteAction,
  entry,
  returnToPath
}: DeleteTimeEntryButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        className="h-10 px-3"
        onClick={() => setIsOpen(true)}
        type="button"
        variant="destructive"
      >
        <span className="mr-2 inline-flex items-center">
          <FontAwesomeIcon className="h-3.5 w-3.5" icon={faTrash} />
        </span>
        Delete
      </Button>

      <Dialog onOpenChange={setIsOpen} open={isOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="border-b border-[var(--border)] px-5 py-4">
            <DialogTitle>Delete time entry?</DialogTitle>
            <DialogDescription>
              This will permanently delete the selected row from your timesheet.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 px-5 py-4 text-sm">
            <div className="grid gap-1 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                Date
              </p>
              <p className="font-semibold text-[var(--foreground)]">{entry.entryDate}</p>
            </div>
            <div className="grid gap-1 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                Task description
              </p>
              <p className="font-semibold text-[var(--foreground)]">{entry.taskDescription}</p>
            </div>
            <div className="grid gap-1 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                Hours
              </p>
              <p className="font-semibold text-[var(--foreground)]">
                {Number(entry.hoursWorked).toFixed(2)} hrs
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--border)] px-5 py-4">
            <Button onClick={() => setIsOpen(false)} type="button" variant="secondary">
              <span className="mr-2 inline-flex items-center">
                <FontAwesomeIcon className="h-3.5 w-3.5" icon={faXmark} />
              </span>
              Cancel
            </Button>
            <form action={deleteAction.bind(null, entry.id)}>
              <input name="returnTo" type="hidden" value={returnToPath} />
              <Button type="submit" variant="destructive">
                <span className="mr-2 inline-flex items-center">
                  <FontAwesomeIcon className="h-3.5 w-3.5" icon={faTrash} />
                </span>
                Delete entry
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
