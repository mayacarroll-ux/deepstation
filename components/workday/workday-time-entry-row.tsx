"use client";

import { faCopy, faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { TimeEntryRecord } from "@/lib/types/time-tracking";
import { calculateHoursFromTimeRange, formatHours, formatTimeRange } from "@/lib/utils/format";

type WorkdayTimeEntryRowProps = {
  entry: TimeEntryRecord;
  returnToPath: string;
  updateAction: (timeEntryId: string, formData: FormData) => Promise<void>;
};

function roundToTwoDecimals(hours: number) {
  return Math.round(hours * 100) / 100;
}

export function WorkdayTimeEntryRow({
  entry,
  returnToPath,
  updateAction
}: WorkdayTimeEntryRowProps) {
  const [startTime, setStartTime] = useState(entry.startTime ?? "");
  const [endTime, setEndTime] = useState(entry.endTime ?? "");
  const [isUsingDuration, setIsUsingDuration] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy project + task");

  const calculatedHours = useMemo(
    () => calculateHoursFromTimeRange(startTime, endTime),
    [endTime, startTime]
  );
  const formattedTimeRange = startTime && endTime ? formatTimeRange(startTime, endTime) : "—";
  const calculatedDurationLabel = calculatedHours
    ? `${roundToTwoDecimals(calculatedHours)} hrs`
    : null;

  async function copyProjectAndTask() {
    await navigator.clipboard.writeText(`${entry.productName}: ${entry.taskDescription}`);
    setCopyLabel("Copied");
    window.setTimeout(() => setCopyLabel("Copy project + task"), 1500);
  }

  return (
    <form action={updateAction.bind(null, entry.id)} className="grid gap-4 border border-[var(--border)] bg-[var(--surface)] p-4">
      <input name="returnTo" type="hidden" value={returnToPath} />
      <input name="budgetMappingId" type="hidden" value={entry.budgetMappingId ?? ""} />
      <input name="entryDate" type="hidden" value={entry.entryDate} />
      <input name="productName" type="hidden" value={entry.productName} />
      <input name="budgetName" type="hidden" value={entry.budgetName} />
      <input name="budgetNumber" type="hidden" value={entry.budgetNumber} />
      <input name="taskDescription" type="hidden" value={entry.taskDescription} />
      <input name="hoursWorked" type="hidden" value={entry.hoursWorked} />
      <input name="weekNumber" type="hidden" value={entry.weekNumber} />
      <input name="notes" type="hidden" value={entry.notes ?? ""} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-[var(--foreground)]">{entry.productName}</p>
            <Button
              className="h-8 px-3"
              onClick={copyProjectAndTask}
              type="button"
              variant="secondary"
            >
              <span className="mr-2 inline-flex items-center">
                <FontAwesomeIcon className="h-3.5 w-3.5" icon={faCopy} />
              </span>
              {copyLabel}
            </Button>
          </div>
          <p className="text-sm text-[var(--muted)]">{entry.taskDescription}</p>
          <p className="text-xs text-[var(--muted)]">
            {entry.budgetName} · {entry.budgetNumber}
          </p>
        </div>
          <div className="grid gap-1 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Time</p>
          <p className="text-sm font-semibold text-[var(--foreground)]">{formattedTimeRange}</p>
          <p className="text-xs text-[var(--muted)]">
            {entry.startTime && entry.endTime ? `Current duration: ${formatDurationText(calculatedHours)}` : "Add both times to calculate a duration."}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[10rem_10rem_auto_12rem]">
        <label className="grid gap-2 text-sm font-semibold">
          <span className="min-h-5">Start Time</span>
          <input
            className="h-11 border border-[var(--border)] bg-[var(--panel)] px-3 font-normal outline-none focus:border-[var(--accent)]"
            name="startTime"
            onChange={(event) => setStartTime(event.target.value)}
            step="60"
            type="time"
            value={startTime}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          <span className="min-h-5">End Time</span>
          <input
            className="h-11 border border-[var(--border)] bg-[var(--panel)] px-3 font-normal outline-none focus:border-[var(--accent)]"
            name="endTime"
            onChange={(event) => setEndTime(event.target.value)}
            step="60"
            type="time"
            value={endTime}
          />
        </label>
        <div className="grid gap-2 text-sm font-semibold">
          <span className="min-h-5">Hours Worked</span>
          <div className="flex h-11 items-center border border-[var(--border)] bg-[var(--panel)] px-3">
            {formatHours(Number(entry.hoursWorked))} hrs
          </div>
          {calculatedDurationLabel ? (
            <p className="text-xs text-[var(--muted)]">
              Calculated duration: {calculatedDurationLabel}
            </p>
          ) : null}
        </div>
        <label className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <input
            disabled={!calculatedHours}
            checked={isUsingDuration}
            className="h-4 w-4 border-[var(--border)] accent-[var(--accent)]"
            name="recalculateHoursWorked"
            onChange={(event) => setIsUsingDuration(event.target.checked)}
            type="checkbox"
            value="true"
          />
          Update Hours Worked to duration
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-3">
        <p className="text-xs text-[var(--muted)]">
          Saving times keeps the row editable in the timesheet. Hours Worked only changes if you
          choose to apply the calculated duration.
        </p>
        <Button className="h-10 px-4" type="submit">
          <span className="mr-2 inline-flex items-center">
            <FontAwesomeIcon className="h-3.5 w-3.5" icon={faFloppyDisk} />
          </span>
          Save time
        </Button>
      </div>
    </form>
  );
}

function formatDurationText(hours?: number | null) {
  if (hours == null) {
    return "—";
  }

  const roundedHours = roundToTwoDecimals(hours);
  const wholeHours = Math.floor(roundedHours);
  const minutes = Math.round((roundedHours - wholeHours) * 60);
  const hourLabel = wholeHours > 0 ? `${wholeHours} ${wholeHours === 1 ? "hour" : "hours"}` : "";
  const minuteLabel = minutes > 0 ? `${minutes} ${minutes === 1 ? "minute" : "minutes"}` : "";

  if (hourLabel && minuteLabel) {
    return `${hourLabel} ${minuteLabel}`;
  }

  return hourLabel || minuteLabel || "0 minutes";
}
