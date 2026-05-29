"use client";

import { faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import type { BudgetMappingRecord } from "@/lib/types/time-tracking";

import { TimeEntryForm } from "./time-entry-form";

type NewTimeEntryDialogProps = {
  action: (formData: FormData) => Promise<void>;
  budgetMappings: BudgetMappingRecord[];
  defaultOpen?: boolean;
  returnToPath: string;
  showTrigger?: boolean;
};

export function NewTimeEntryDialog({
  action,
  budgetMappings,
  defaultOpen = false,
  returnToPath,
  showTrigger = true
}: NewTimeEntryDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setIsOpen(true);
      return;
    }

    if (defaultOpen) {
      router.push(returnToPath);
      return;
    }

    setIsOpen(false);
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={isOpen}>
      {showTrigger ? (
        <Button className="h-11 px-4" onClick={() => setIsOpen(true)} type="button">
          <span className="mr-2 inline-flex items-center">
            <FontAwesomeIcon className="h-3.5 w-3.5" icon={faPlus} />
          </span>
          New time entry
        </Button>
      ) : null}
      <DialogContent className="max-h-[calc(100vh-2rem)] max-w-4xl overflow-y-auto">
        <DialogHeader className="border-b border-[var(--border)] px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="grid gap-1">
              <DialogTitle>New time entry</DialogTitle>
              <DialogDescription>
                Add a workbook row. Start and end times can auto-calculate hours, and the entry
                can optionally become a recurring weekly template.
              </DialogDescription>
            </div>
            <button
              aria-label="Close new time entry dialog"
              className="inline-flex h-9 w-9 items-center justify-center border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-muted)]"
              onClick={() => handleOpenChange(false)}
              type="button"
            >
              <FontAwesomeIcon className="h-4 w-4" icon={faXmark} />
            </button>
          </div>
        </DialogHeader>

        <div className="p-5">
          <TimeEntryForm
            action={action}
            budgetMappings={budgetMappings}
            className="border-0 bg-transparent p-0"
            returnToPath={returnToPath}
            showRepeatWeekly
            submitLabel="Save time entry"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
