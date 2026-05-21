"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import type { CurrentWeekTimesheetPreview } from "@/lib/services/current-week-timesheet";

import { CurrentWeekTimesheetGenerator } from "./current-week-timesheet-generator";

type CurrentWeekTimesheetDrawerProps = {
  action: (formData: FormData) => Promise<void>;
  preview: CurrentWeekTimesheetPreview;
  returnToPath: string;
  statusMessage: string | null;
};

export function CurrentWeekTimesheetDrawer({
  action,
  preview,
  returnToPath,
  statusMessage
}: CurrentWeekTimesheetDrawerProps) {
  const [isOpen, setIsOpen] = useState(Boolean(statusMessage));

  useEffect(() => {
    if (statusMessage) {
      setIsOpen(true);
    }
  }, [statusMessage]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <Button className="h-11 px-4" onClick={() => setIsOpen(true)} type="button">
        Generate week
      </Button>
      <SheetContent className="w-full sm:w-[min(100vw,42rem)]">
        <SheetHeader className="border-b border-[var(--border)] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="grid gap-1">
              <SheetTitle className="text-sm uppercase tracking-wide text-[var(--muted)]">
                Selected week
              </SheetTitle>
              <SheetDescription className="text-sm font-semibold text-[var(--foreground)]">
                {preview.weekLabel}
              </SheetDescription>
            </div>
            <Button className="h-9 px-3" onClick={() => setIsOpen(false)} variant="secondary">
              Close
            </Button>
          </div>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <CurrentWeekTimesheetGenerator
            action={action}
            preview={preview}
            returnToPath={returnToPath}
            statusMessage={statusMessage}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
