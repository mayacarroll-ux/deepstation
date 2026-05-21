"use client";

import {
  faCheck,
  faFloppyDisk,
  faPlay,
  faStop,
  faTrash,
  faXmark
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { RepeatWeeklyFields } from "@/components/time-entries/repeat-weekly-fields";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { BudgetMappingRecord } from "@/lib/services/time-tracking";
import { getIsoDayOfWeek, getIsoWeekNumber, getTodayInputValue } from "@/lib/utils/dates";
import { formatHours, formatHourUnit, formatTimeInput } from "@/lib/utils/format";

import type { QuickTimerSaveState } from "@/app/(authenticated)/time-entries/actions";

const quickTimerStorageKey = "deepstation.quick-timer.v1";

type QuickTimerDraft = {
  budgetMappingId: string;
  productName: string;
  budgetName: string;
  budgetNumber: string;
  taskDescription: string;
  notes: string;
  repeatWeekly: boolean;
  recurringDayOfWeek: string;
  recurringStartDate: string;
  recurringEndDate: string;
};

type QuickTimerState =
  | {
      mode: "idle";
    }
  | {
      mode: "running";
      entryDate: string;
      startTime: string;
      startedAtIso: string;
    }
  | {
      mode: "pending";
      entryDate: string;
      startTime: string;
      startedAtIso: string;
      stoppedAtIso: string;
      endTime: string;
      draft: QuickTimerDraft;
    };

type QuickTimerStoredState = QuickTimerState;

type HeaderQuickTimerProps = {
  budgetMappings: BudgetMappingRecord[];
  saveAction: (
    previousState: QuickTimerSaveState,
    formData: FormData
  ) => Promise<QuickTimerSaveState>;
};

type TimeMappingSelection = {
  budgetMappingId: string;
  budgetName: string;
  budgetNumber: string;
};

function getCurrentTimeInputValue(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatReadableDate(dateInputValue: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full"
  }).format(new Date(`${dateInputValue}T00:00:00`));
}

function formatElapsedTime(totalSeconds: number) {
  const safeTotalSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeTotalSeconds / 3600);
  const minutes = Math.floor((safeTotalSeconds % 3600) / 60);
  const seconds = safeTotalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;
}

function roundToQuarterHour(hours: number) {
  return Math.round(hours * 4) / 4;
}

function readStoredQuickTimerState(): QuickTimerStoredState {
  if (typeof window === "undefined") {
    return { mode: "idle" };
  }

  try {
    const storedState = window.localStorage.getItem(quickTimerStorageKey);

    if (!storedState) {
      return { mode: "idle" };
    }

    const parsedState = JSON.parse(storedState) as QuickTimerStoredState;

    if (!parsedState || typeof parsedState !== "object" || !("mode" in parsedState)) {
      return { mode: "idle" };
    }

    if (parsedState.mode === "running") {
      if (
        typeof parsedState.entryDate === "string" &&
        typeof parsedState.startTime === "string" &&
        typeof parsedState.startedAtIso === "string"
      ) {
        return parsedState;
      }

      return { mode: "idle" };
    }

    if (parsedState.mode === "pending") {
      if (
        typeof parsedState.entryDate === "string" &&
        typeof parsedState.startTime === "string" &&
        typeof parsedState.startedAtIso === "string" &&
        typeof parsedState.stoppedAtIso === "string" &&
        typeof parsedState.endTime === "string" &&
        parsedState.draft &&
        typeof parsedState.draft.budgetMappingId === "string" &&
        typeof parsedState.draft.productName === "string" &&
        typeof parsedState.draft.budgetName === "string" &&
        typeof parsedState.draft.budgetNumber === "string" &&
        typeof parsedState.draft.taskDescription === "string" &&
        typeof parsedState.draft.notes === "string"
      ) {
        return {
          ...parsedState,
          draft: {
            ...getDefaultDraft(parsedState.entryDate),
            ...parsedState.draft,
            repeatWeekly: parsedState.draft.repeatWeekly ?? false,
            recurringDayOfWeek:
              parsedState.draft.recurringDayOfWeek ?? String(getIsoDayOfWeek(parsedState.entryDate)),
            recurringStartDate:
              parsedState.draft.recurringStartDate ?? parsedState.entryDate,
            recurringEndDate: parsedState.draft.recurringEndDate ?? ""
          }
        };
      }

      return { mode: "idle" };
    }

    return { mode: "idle" };
  } catch {
    return { mode: "idle" };
  }
}

function getBudgetMappingSelection(
  budgetMappings: BudgetMappingRecord[],
  selectedProductName: string
): TimeMappingSelection[] {
  const normalizedProductName = selectedProductName.trim().toLowerCase();

  return budgetMappings
    .filter((budgetMapping) => budgetMapping.productName.trim().toLowerCase() === normalizedProductName)
    .map((budgetMapping) => ({
      budgetMappingId: budgetMapping.id,
      budgetName: budgetMapping.budgetName,
      budgetNumber: budgetMapping.budgetNumber
    }));
}

function getProductNames(budgetMappings: BudgetMappingRecord[]) {
  return Array.from(
    new Set(
      budgetMappings
        .map((budgetMapping) => budgetMapping.productName.trim())
        .filter((productName) => productName.length > 0)
    )
  ).sort((firstProductName, secondProductName) =>
    firstProductName.localeCompare(secondProductName)
  );
}

function getQuarterHourHours(startedAtIso: string, stoppedAtIso: string) {
  return roundToQuarterHour(
    (new Date(stoppedAtIso).getTime() - new Date(startedAtIso).getTime()) / (1000 * 60 * 60)
  );
}

function getDefaultDraft(entryDate: string): QuickTimerDraft {
  return {
    budgetMappingId: "",
    productName: "",
    budgetName: "",
    budgetNumber: "",
    taskDescription: "",
    notes: "",
    repeatWeekly: false,
    recurringDayOfWeek: String(getIsoDayOfWeek(entryDate)),
    recurringStartDate: entryDate,
    recurringEndDate: ""
  };
}

export function HeaderQuickTimer({ budgetMappings, saveAction }: HeaderQuickTimerProps) {
  const router = useRouter();
  const [timerState, setTimerState] = useState<QuickTimerState>({ mode: "idle" });
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(Date.now());
  const [currentSessionSubmitCount, setCurrentSessionSubmitCount] = useState(0);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [saveState, formAction, isPending] = useActionState(saveAction, { status: "idle" });

  const productNames = useMemo(() => getProductNames(budgetMappings), [budgetMappings]);
  const selectedProductBudgetMappings = useMemo(
    () =>
      timerState.mode === "pending"
        ? getBudgetMappingSelection(budgetMappings, timerState.draft.productName)
        : [],
    [budgetMappings, timerState]
  );
  const calculatedHoursWorked =
    timerState.mode === "pending"
      ? getQuarterHourHours(timerState.startedAtIso, timerState.stoppedAtIso)
      : null;

  useEffect(() => {
    setTimerState(readStoredQuickTimerState());
  }, []);

  useEffect(() => {
    function handleStorageChange(event: StorageEvent) {
      if (event.key !== quickTimerStorageKey) {
        return;
      }

      setTimerState(readStoredQuickTimerState());
    }

    window.addEventListener("storage", handleStorageChange);

    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    if (timerState.mode !== "running" && timerState.mode !== "pending") {
      window.localStorage.removeItem(quickTimerStorageKey);
      return;
    }

    window.localStorage.setItem(quickTimerStorageKey, JSON.stringify(timerState));
  }, [timerState]);

  useEffect(() => {
    if (timerState.mode !== "running") {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [timerState]);

  useEffect(() => {
    if (timerState.mode === "pending") {
      setIsFinishModalOpen(true);
      setIsDiscardConfirmOpen(false);
      setCurrentSessionSubmitCount(0);
    }
  }, [timerState.mode]);

  useEffect(() => {
    if (saveState.status !== "success") {
      return;
    }

    if (saveState.message) {
      setSaveNotice(saveState.message);
      const timeoutId = window.setTimeout(() => setSaveNotice(null), 4500);

      setTimerState({ mode: "idle" });
      setIsFinishModalOpen(false);
      setIsDiscardConfirmOpen(false);
      router.refresh();

      return () => window.clearTimeout(timeoutId);
    }

    setTimerState({ mode: "idle" });
    setIsFinishModalOpen(false);
    setIsDiscardConfirmOpen(false);
    router.refresh();
  }, [router, saveState.message, saveState.status]);

  useEffect(() => {
    if (saveState.status === "error") {
      setSaveNotice(null);
    }
  }, [saveState.status]);

  function handleStartTimer() {
    setSaveNotice(null);
    const startedAt = new Date();

    setTimerState({
      mode: "running",
      entryDate: getTodayInputValue(),
      startTime: getCurrentTimeInputValue(startedAt),
      startedAtIso: startedAt.toISOString()
    });
  }

  function handleStopTimer() {
    if (timerState.mode !== "running") {
      return;
    }

    const stoppedAt = new Date();

    setTimerState({
      mode: "pending",
      entryDate: timerState.entryDate,
      startTime: timerState.startTime,
      startedAtIso: timerState.startedAtIso,
      stoppedAtIso: stoppedAt.toISOString(),
      endTime: getCurrentTimeInputValue(stoppedAt),
      draft: getDefaultDraft(timerState.entryDate)
    });
    setCurrentSessionSubmitCount(0);
    setIsFinishModalOpen(true);
  }

  function handleOpenFinishModal() {
    if (timerState.mode === "pending") {
      setIsFinishModalOpen(true);
    }
  }

  function updateDraftField(fieldName: keyof QuickTimerDraft, value: string) {
    if (timerState.mode !== "pending") {
      return;
    }

    setTimerState({
      ...timerState,
      draft: {
        ...timerState.draft,
        [fieldName]: value
      }
    });
  }

  function toggleRepeatWeekly(nextEnabled: boolean) {
    if (timerState.mode !== "pending") {
      return;
    }

    setTimerState({
      ...timerState,
      draft: {
        ...timerState.draft,
        repeatWeekly: nextEnabled,
        recurringDayOfWeek: nextEnabled
          ? String(getIsoDayOfWeek(timerState.entryDate))
          : timerState.draft.recurringDayOfWeek,
        recurringStartDate: nextEnabled ? timerState.entryDate : timerState.draft.recurringStartDate
      }
    });
  }

  function handleProductChange(nextProductName: string) {
    if (timerState.mode !== "pending") {
      return;
    }

    const matchedBudgetMappings = getBudgetMappingSelection(budgetMappings, nextProductName);

    if (matchedBudgetMappings.length === 1) {
      const [selectedBudgetMapping] = matchedBudgetMappings;

      setTimerState({
        ...timerState,
        draft: {
          ...timerState.draft,
          budgetMappingId: selectedBudgetMapping.budgetMappingId,
          productName: nextProductName,
          budgetName: selectedBudgetMapping.budgetName,
          budgetNumber: selectedBudgetMapping.budgetNumber
        }
      });
      return;
    }

    setTimerState({
      ...timerState,
      draft: {
        ...timerState.draft,
        budgetMappingId: "",
        productName: nextProductName,
        budgetName: "",
        budgetNumber: ""
      }
    });
  }

  function handleBudgetMappingChange(nextBudgetMappingId: string) {
    if (timerState.mode !== "pending") {
      return;
    }

    const selectedBudgetMapping = budgetMappings.find(
      (budgetMapping) => budgetMapping.id === nextBudgetMappingId
    );

    if (!selectedBudgetMapping) {
      return;
    }

    setTimerState({
      ...timerState,
      draft: {
        ...timerState.draft,
        budgetMappingId: selectedBudgetMapping.id,
        productName: selectedBudgetMapping.productName,
        budgetName: selectedBudgetMapping.budgetName,
        budgetNumber: selectedBudgetMapping.budgetNumber
      }
    });
  }

  function handleClearQuickTimer() {
    setTimerState({ mode: "idle" });
    setIsFinishModalOpen(false);
    setIsDiscardConfirmOpen(false);
    setCurrentSessionSubmitCount(0);
    setSaveNotice(null);
    window.localStorage.removeItem(quickTimerStorageKey);
  }

  const elapsedSeconds =
    timerState.mode === "running"
      ? Math.max(0, Math.floor((currentTimeMs - new Date(timerState.startedAtIso).getTime()) / 1000))
      : 0;
  const elapsedLabel = formatElapsedTime(elapsedSeconds);
  const pendingDurationLabel =
    calculatedHoursWorked !== null
      ? `${formatHours(calculatedHoursWorked)} ${formatHourUnit(calculatedHoursWorked)}`
      : elapsedLabel;
  const timerSummaryLabel =
    timerState.mode === "running"
      ? "Running"
      : timerState.mode === "pending"
        ? "Ready to finish"
        : "Start timer";
  const canShowBudgetMappingSelect = selectedProductBudgetMappings.length > 1;
  const timerWeekNumber =
    timerState.mode === "pending"
      ? getIsoWeekNumber(timerState.entryDate)
      : timerState.mode === "running"
        ? getIsoWeekNumber(timerState.entryDate)
        : null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {timerState.mode === "idle" ? (
          <Button className="h-10 px-4" onClick={handleStartTimer} type="button">
            <span className="mr-2 inline-flex items-center">
              <FontAwesomeIcon className="h-3.5 w-3.5" icon={faPlay} />
            </span>
            Start timer
          </Button>
        ) : timerState.mode === "running" ? (
          <>
            <div className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]">
              <span className="font-semibold">{elapsedLabel}</span>
              <span className="ml-2 text-[var(--muted)]">{timerSummaryLabel}</span>
            </div>
            <Button className="h-10 px-4" onClick={handleStopTimer} type="button">
              <span className="mr-2 inline-flex items-center">
                <FontAwesomeIcon className="h-3.5 w-3.5" icon={faStop} />
              </span>
              Stop
            </Button>
          </>
        ) : (
          <>
            <div className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]">
              <span className="font-semibold">{pendingDurationLabel}</span>
              <span className="ml-2 text-[var(--muted)]">{timerSummaryLabel}</span>
            </div>
            <Button className="h-10 px-4" onClick={handleOpenFinishModal} type="button">
              <span className="mr-2 inline-flex items-center">
                <FontAwesomeIcon className="h-3.5 w-3.5" icon={faCheck} />
              </span>
              Finish time entry
            </Button>
          </>
        )}
      </div>

      {saveNotice ? (
        <p className="mt-2 text-xs font-semibold text-[var(--accent)]">{saveNotice}</p>
      ) : null}

      <Dialog onOpenChange={setIsFinishModalOpen} open={isFinishModalOpen}>
        <DialogContent className="max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto">
          <DialogHeader className="border-b border-[var(--border)] px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="grid gap-1">
                <DialogTitle>Finish time entry</DialogTitle>
                <DialogDescription>
                  Review the captured timer details, complete the workbook fields, and save the
                  entry.
                </DialogDescription>
              </div>
              <button
                aria-label="Close finish time entry dialog"
                className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-muted)]"
                onClick={() => setIsFinishModalOpen(false)}
                type="button"
              >
                <span className="mr-2 inline-flex items-center">
                  <FontAwesomeIcon className="h-3.5 w-3.5" icon={faXmark} />
                </span>
                Close
              </button>
            </div>
          </DialogHeader>

          <form
            action={formAction}
            className="grid gap-5 px-5 py-4"
            onSubmit={() => setCurrentSessionSubmitCount((currentCount) => currentCount + 1)}
          >
            <input name="entryDate" type="hidden" value={timerState.mode === "pending" ? timerState.entryDate : ""} />
            <input name="startTime" type="hidden" value={timerState.mode === "pending" ? timerState.startTime : ""} />
            <input name="endTime" type="hidden" value={timerState.mode === "pending" ? timerState.endTime : ""} />
            <input
              name="hoursWorked"
              type="hidden"
              value={timerState.mode === "pending" && calculatedHoursWorked !== null ? calculatedHoursWorked.toFixed(2) : ""}
            />
            <input
              name="weekNumber"
              type="hidden"
              value={timerWeekNumber !== null ? String(timerWeekNumber) : ""}
            />
            <input
              name="budgetMappingId"
              type="hidden"
              value={timerState.mode === "pending" ? timerState.draft.budgetMappingId : ""}
            />

            <section className="grid gap-3 border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Date</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                    {timerState.mode === "pending" ? formatReadableDate(timerState.entryDate) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Hours worked</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                    {timerState.mode === "pending" && calculatedHoursWorked !== null
                      ? `${formatHours(calculatedHoursWorked)} ${formatHourUnit(calculatedHoursWorked)}`
                      : "—"}
                  </p>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Start Time</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                    {timerState.mode === "pending" ? formatTimeInput(timerState.startTime) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--muted)]">End Time</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                    {timerState.mode === "pending" ? formatTimeInput(timerState.endTime) : "—"}
                  </p>
                </div>
              </div>
              {timerState.mode === "pending" && calculatedHoursWorked !== null ? (
                <p className="text-xs text-[var(--muted)]">
                  Calculated from {formatTimeInput(timerState.startTime)} -{" "}
                  {formatTimeInput(timerState.endTime)}
                </p>
              ) : null}
            </section>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2 text-sm font-semibold md:col-span-3">
                Product Name
                {productNames.length > 0 ? (
                  <Select
                    name="productName"
                    onChange={(event) => handleProductChange(event.target.value)}
                    required
                    value={timerState.mode === "pending" ? timerState.draft.productName : ""}
                  >
                    <option value="">Choose a product</option>
                    {productNames.map((productName) => (
                      <option key={productName} value={productName}>
                        {productName}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    name="productName"
                    onChange={(event) => handleProductChange(event.target.value)}
                    required
                    value={timerState.mode === "pending" ? timerState.draft.productName : ""}
                  />
                )}
                <span className="text-xs font-normal text-[var(--muted)]">
                  Add new products on the Budget key page.
                </span>
              </label>

              {canShowBudgetMappingSelect ? (
                <label className="grid gap-2 text-sm font-semibold md:col-span-3">
                  Matching budget
                  <Select
                    onChange={(event) => handleBudgetMappingChange(event.target.value)}
                    required
                    value={timerState.mode === "pending" ? timerState.draft.budgetMappingId : ""}
                  >
                    <option value="">Choose a budget for this product</option>
                    {selectedProductBudgetMappings.map((budgetMapping) => (
                      <option key={budgetMapping.budgetMappingId} value={budgetMapping.budgetMappingId}>
                        {budgetMapping.budgetName} — {budgetMapping.budgetNumber}
                      </option>
                    ))}
                  </Select>
                </label>
              ) : null}

              <label className="grid gap-2 text-sm font-semibold">
                Budget Name
                <Input
                  name="budgetName"
                  onChange={(event) => updateDraftField("budgetName", event.target.value)}
                  required
                  value={timerState.mode === "pending" ? timerState.draft.budgetName : ""}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Budget #
                <Input
                  name="budgetNumber"
                  onChange={(event) => updateDraftField("budgetNumber", event.target.value)}
                  required
                  value={timerState.mode === "pending" ? timerState.draft.budgetNumber : ""}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold md:col-span-3">
                Task Description
                <Input
                  name="taskDescription"
                  onChange={(event) => updateDraftField("taskDescription", event.target.value)}
                  required
                  value={timerState.mode === "pending" ? timerState.draft.taskDescription : ""}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold md:col-span-3">
                Notes
                <Textarea
                  name="notes"
                  onChange={(event) => updateDraftField("notes", event.target.value)}
                  value={timerState.mode === "pending" ? timerState.draft.notes : ""}
                />
              </label>
            </div>

            {timerState.mode === "pending" ? (
              <RepeatWeeklyFields
                dayOfWeek={timerState.draft.recurringDayOfWeek}
                enabled={timerState.draft.repeatWeekly}
                endDate={timerState.draft.recurringEndDate}
                onDayOfWeekChange={(nextDayOfWeek) =>
                  updateDraftField("recurringDayOfWeek", nextDayOfWeek)
                }
                onEnabledChange={toggleRepeatWeekly}
                onEndDateChange={(nextEndDate) => updateDraftField("recurringEndDate", nextEndDate)}
                onStartDateChange={(nextStartDate) =>
                  updateDraftField("recurringStartDate", nextStartDate)
                }
                startDate={timerState.draft.recurringStartDate}
              />
            ) : null}

            {currentSessionSubmitCount > 0 && saveState.status === "error" ? (
              <p className="text-sm text-[var(--warning)]">{saveState.message ?? "Could not save time entry."}</p>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
              <Button
                onClick={() => {
                  setIsFinishModalOpen(false);
                  setIsDiscardConfirmOpen(true);
                }}
                type="button"
                variant="secondary"
              >
                <span className="mr-2 inline-flex items-center">
                  <FontAwesomeIcon className="h-3.5 w-3.5" icon={faTrash} />
                </span>
                Discard
              </Button>
              <Button disabled={isPending || timerState.mode !== "pending"} type="submit">
                <span className="mr-2 inline-flex items-center">
                  <FontAwesomeIcon className="h-3.5 w-3.5" icon={faFloppyDisk} />
                </span>
                Save time entry
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setIsDiscardConfirmOpen} open={isDiscardConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="border-b border-[var(--border)] px-5 py-4">
            <DialogTitle>Discard unfinished time entry?</DialogTitle>
            <DialogDescription>
              This will remove the stopped timer details from your browser and close the finish
              form.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap items-center justify-end gap-3 px-5 py-4">
            <Button
              onClick={() => {
                setIsDiscardConfirmOpen(false);
                if (timerState.mode === "pending") {
                  setIsFinishModalOpen(true);
                }
              }}
              type="button"
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              className="text-white"
              onClick={handleClearQuickTimer}
              type="button"
              variant="destructive"
            >
              <span className="mr-2 inline-flex items-center">
                <FontAwesomeIcon className="h-3.5 w-3.5" icon={faTrash} />
              </span>
              Discard time entry
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
