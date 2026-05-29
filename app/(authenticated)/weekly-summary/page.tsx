import Link from "next/link";
import { faCopy, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { WeeklySummaryEmailSection } from "@/components/weekly-summary/weekly-summary-email-section";
import { WeeklySummaryCopy } from "@/components/weekly-summary/weekly-summary-copy";
import { WeekSelector } from "@/components/shared/week-selector";
import { Toast } from "@/components/ui/toast";
import { getCurrentWorkbookOwnerId } from "@/lib/services/current-user";
import { getWeeklySummaryForYear } from "@/lib/services/time-tracking";
import {
  buildWeeklySummaryEmailSubject,
  getDefaultWeeklySummaryEmailSchedule,
  getWeeklySummaryEmailSchedule,
  getWeeklySummaryEmailSettings,
  getWeeklySummaryEmailStatus
} from "@/lib/services/weekly-summary-email";
import {
  formatWeekLabel,
  getIsoWeekNumber,
  getIsoWeekYear,
  getTodayInputValue
} from "@/lib/utils/dates";
import { formatBillingSummaryText, formatHours } from "@/lib/utils/format";

import {
  saveWeeklySummaryEmailSettingsAction,
  saveWeeklySummaryEmailScheduleAction,
  sendWeeklySummaryEmailAction
} from "./actions";

type WeeklySummaryPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type WeeklySummaryView = "copy" | "email";

function getRequestedWeekNumber(searchParams: Record<string, string | string[] | undefined>) {
  const weekValue = searchParams.week;
  const weekNumber = Number(Array.isArray(weekValue) ? weekValue[0] : weekValue);

  return Number.isInteger(weekNumber) && weekNumber >= 1 && weekNumber <= 53 ? weekNumber : null;
}

function getRequestedWeekYear(searchParams: Record<string, string | string[] | undefined>) {
  const yearValue = searchParams.year;
  const weekYear = Number(Array.isArray(yearValue) ? yearValue[0] : yearValue);

  return Number.isInteger(weekYear) && weekYear >= 2000 && weekYear <= 2100 ? weekYear : null;
}

function getSearchParamValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
}

function getEmailStatus(searchParams: Record<string, string | string[] | undefined>) {
  const emailStatusValue = searchParams.emailStatus;

  return Array.isArray(emailStatusValue) ? emailStatusValue[0] : emailStatusValue;
}

function getEmailError(searchParams: Record<string, string | string[] | undefined>) {
  const emailErrorValue = searchParams.emailError;

  return Array.isArray(emailErrorValue) ? emailErrorValue[0] : emailErrorValue;
}

function getSelectedView(searchParams: Record<string, string | string[] | undefined>): WeeklySummaryView {
  const viewValue = searchParams.view;
  const selectedView = Array.isArray(viewValue) ? viewValue[0] : viewValue;

  return selectedView === "email" ? "email" : "copy";
}

function buildWeeklySummaryHref(
  searchParams: Record<string, string | string[] | undefined>,
  overrides: Record<string, string | undefined>
) {
  const queryParameters = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "view") {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((queryValue) => {
        if (queryValue) {
          queryParameters.append(key, queryValue);
        }
      });
      continue;
    }

    if (value) {
      queryParameters.set(key, value);
    }
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      queryParameters.delete(key);
      continue;
    }

    queryParameters.set(key, value);
  }

  const queryString = queryParameters.toString();

  return queryString ? `/weekly-summary?${queryString}` : "/weekly-summary";
}

export default async function WeeklySummaryPage({ searchParams }: WeeklySummaryPageProps) {
  const resolvedSearchParams = await searchParams;
  const ownerId = await getCurrentWorkbookOwnerId();
  const requestedWeekNumber = getRequestedWeekNumber(resolvedSearchParams);
  const requestedWeekYear = getRequestedWeekYear(resolvedSearchParams);
  const currentIsoWeekInputValue = getTodayInputValue();
  const selectedWeekNumber =
    requestedWeekNumber ?? getIsoWeekNumber(currentIsoWeekInputValue);
  const selectedWeekYear = requestedWeekYear ?? getIsoWeekYear(currentIsoWeekInputValue);
  const [weeklySummary, emailSettings, emailSchedule, emailStatus] = await Promise.all([
    getWeeklySummaryForYear(ownerId, selectedWeekNumber, selectedWeekYear),
    getWeeklySummaryEmailSettings(ownerId),
    getWeeklySummaryEmailSchedule(ownerId),
    getWeeklySummaryEmailStatus(ownerId, selectedWeekYear, selectedWeekNumber)
  ]);
  const selectedWeekLabel = formatWeekLabel(selectedWeekNumber, selectedWeekYear);
  const selectedView = getSelectedView(resolvedSearchParams);
  const selectedWeekEmailSubject = buildWeeklySummaryEmailSubject(
    selectedWeekNumber,
    selectedWeekYear
  );
  const summaryText = formatBillingSummaryText(
    weeklySummary.groupedHours,
    weeklySummary.totalHours
  );
  const emailStatusValue = getEmailStatus(resolvedSearchParams);
  const emailErrorValue = getEmailError(resolvedSearchParams);
  const scheduleStatusValue = getSearchParamValue(resolvedSearchParams, "scheduleStatus");
  const scheduleErrorValue = getSearchParamValue(resolvedSearchParams, "scheduleError");
  const defaultEmailSchedule = getDefaultWeeklySummaryEmailSchedule();
  const emailStatusMessage =
    emailStatusValue === "settings-saved"
      ? "Email recipients saved."
      : emailStatusValue === "sent"
        ? "Weekly summary email sent."
        : emailStatusValue === "needs-confirmation"
          ? "This week was already emailed. Check the resend confirmation box and try again."
          : emailStatusValue === "settings-error"
            ? "Could not save email recipients."
          : emailStatusValue === "send-error"
              ? "Could not send weekly summary email."
              : null;
  const scheduleStatusMessage =
    scheduleStatusValue === "saved"
      ? "Weekly summary schedule updated."
      : scheduleStatusValue === "error"
        ? "Could not save weekly summary schedule."
        : null;
  const weeklySummaryToast =
    emailStatusValue === "sent"
      ? {
          message: "Weekly summary email sent.",
          detail: emailStatus?.lastMessageId ? "Message ID saved." : undefined,
          tone: "success" as const
        }
      : emailStatusValue === "needs-confirmation"
        ? {
            message:
              "This week was already emailed. Check resend confirmation to send it again.",
            tone: "warning" as const
          }
        : emailStatusValue === "send-error"
          ? {
              message: "Weekly summary email was not sent.",
              detail: emailErrorValue ?? "Could not send weekly summary email.",
              tone: "error" as const
            }
          : scheduleStatusValue === "saved"
            ? {
                message: "Weekly summary schedule updated.",
                tone: "success" as const
              }
            : scheduleStatusValue === "error"
              ? {
                  message: "Weekly summary schedule was not saved.",
                  detail: scheduleErrorValue ?? "Could not save weekly summary schedule.",
                  tone: "error" as const
                }
              : null;

  return (
    <section className="py-8">
      {weeklySummaryToast ? (
        <Toast
          clearQueryParams={["emailStatus", "emailError", "scheduleStatus", "scheduleError"]}
          detail={weeklySummaryToast.detail}
          message={weeklySummaryToast.message}
          tone={weeklySummaryToast.tone}
        />
      ) : null}

      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Weekly billing summary</h2>
        <p className="mt-2 text-[var(--muted)]">
          Select a week and switch between copy/export and email workflows.
        </p>
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
        <WeekSelector
          actionLabel="View week"
          defaultWeekNumber={selectedWeekNumber}
          defaultWeekYear={selectedWeekYear}
          hiddenFields={{ view: selectedView }}
        />
        <div className="grid grid-cols-2 gap-1 rounded-md border border-[var(--border)] bg-[var(--panel)] p-1">
          <Link
            aria-current={selectedView === "copy" ? "page" : undefined}
            className={
              selectedView === "copy"
                ? "border border-[var(--accent)] bg-[var(--accent)] px-3 py-2.5 text-xs font-semibold !text-neutral-950 shadow-[0_0_0_1px_var(--accent)] sm:px-4 sm:py-3 sm:text-sm"
                : "border border-transparent bg-[var(--surface)] px-3 py-2.5 text-xs font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-muted)] sm:px-4 sm:py-3 sm:text-sm"
            }
            href={buildWeeklySummaryHref(resolvedSearchParams, { view: "copy" })}
          >
            <span className="flex min-w-0 items-center justify-center gap-2">
              <FontAwesomeIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" icon={faCopy} />
              <span>Copy / export</span>
            </span>
          </Link>
          <Link
            aria-current={selectedView === "email" ? "page" : undefined}
            className={
              selectedView === "email"
                ? "border border-[var(--accent)] bg-[var(--accent)] px-3 py-2.5 text-xs font-semibold !text-neutral-950 shadow-[0_0_0_1px_var(--accent)] sm:px-4 sm:py-3 sm:text-sm"
                : "border border-transparent bg-[var(--surface)] px-3 py-2.5 text-xs font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-muted)] sm:px-4 sm:py-3 sm:text-sm"
            }
            href={buildWeeklySummaryHref(resolvedSearchParams, { view: "email" })}
          >
            <span className="flex min-w-0 items-center justify-center gap-2">
              <FontAwesomeIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" icon={faEnvelope} />
              <span>Email</span>
            </span>
          </Link>
        </div>
      </div>

      {selectedView === "copy" ? (
        <div className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
          <section className="border border-[var(--border)] bg-[var(--panel)] p-4 sm:p-6">
            <div className="border-t border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
              <p className="text-sm text-[var(--muted)]">Total hours</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--accent)] sm:text-4xl">
                {formatHours(weeklySummary.totalHours)} hrs
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">{selectedWeekLabel}</p>
            </div>
          </section>

          <section className="border border-[var(--border)] bg-[var(--panel-elevated)] p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold sm:text-xl">Ready to send</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {selectedWeekLabel}, formatted for billing copy/export.
                </p>
              </div>
              <WeeklySummaryCopy summaryText={summaryText} weekNumber={selectedWeekNumber} />
            </div>
            <pre className="mt-4 min-h-40 overflow-x-auto whitespace-pre-wrap break-words border border-[var(--border)] bg-[var(--surface)] p-3 font-mono text-xs leading-6 text-[var(--foreground)] sm:mt-5 sm:p-4 sm:text-sm sm:leading-7">
              {summaryText || "No billable summary lines for this week."}
            </pre>
          </section>
        </div>
      ) : (
        <WeeklySummaryEmailSection
          bodyText={summaryText}
          defaultEmailSchedule={defaultEmailSchedule}
          emailSettings={emailSettings}
          emailSchedule={emailSchedule}
          emailStatus={emailStatus}
          onSaveScheduleAction={saveWeeklySummaryEmailScheduleAction}
          onSaveSettingsAction={saveWeeklySummaryEmailSettingsAction}
          onSendEmailAction={sendWeeklySummaryEmailAction}
          selectedWeekNumber={selectedWeekNumber}
          selectedWeekYear={selectedWeekYear}
          scheduleStatusMessage={scheduleStatusMessage}
          scheduleStatusDetail={scheduleErrorValue ?? null}
          statusMessage={emailStatusMessage}
          statusDetail={
            emailStatusValue === "sent" && emailStatus?.lastMessageId
              ? "Message ID saved."
              : emailErrorValue ?? null
          }
          subject={selectedWeekEmailSubject}
        />
      )}
    </section>
  );
}
