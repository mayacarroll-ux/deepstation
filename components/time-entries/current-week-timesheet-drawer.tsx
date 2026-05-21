"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
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
    <>
      <Button className="h-11 px-4" onClick={() => setIsOpen(true)} type="button">
        Generate week
      </Button>

      <div
        aria-hidden={!isOpen}
        className="fixed inset-0 z-50"
      >
        <button
          aria-label="Close timesheet generator"
          className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${
            isOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={() => setIsOpen(false)}
          tabIndex={isOpen ? 0 : -1}
          type="button"
        />
        <aside
          className={`absolute right-0 top-0 flex h-dvh w-full max-w-none flex-col border-l border-[var(--border)] bg-[var(--panel)] shadow-2xl transition-transform duration-200 sm:w-[min(100vw,42rem)] ${
            isOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <div className="grid gap-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                Current week
              </p>
              <p className="text-sm font-semibold text-[var(--foreground)]">{preview.weekLabel}</p>
            </div>
            <Button className="h-9 px-3" onClick={() => setIsOpen(false)} variant="secondary">
              Close
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <CurrentWeekTimesheetGenerator
              action={action}
              preview={preview}
              returnToPath={returnToPath}
              statusMessage={statusMessage}
            />
          </div>
        </aside>
      </div>
    </>
  );
}
