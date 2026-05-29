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
  const weeklySummary = await getWeeklySummaryForYear(
    ownerId,
    selectedWeekNumber,
    selectedWeekYear
  );
  const [emailSettings, emailStatus] = await Promise.all([
    getWeeklySummaryEmailSettings(ownerId),
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
          : null;

  return (
    <section className="py-8">
      {weeklySummaryToast ? (
        <Toast
          clearQueryParams={["emailStatus", "emailError"]}
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
        <div className="grid gap-2 rounded-md border border-[var(--border)] bg-[var(--panel)] p-1 sm:grid-cols-2">
          <Link
            aria-current={selectedView === "copy" ? "page" : undefined}
            className={
              selectedView === "copy"
                ? "border border-[var(--accent)] bg-[var(--accent)] px-4 py-3 text-sm font-semibold !text-neutral-950 shadow-[0_0_0_1px_var(--accent)]"
                : "border border-transparent bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-muted)]"
            }
            href={buildWeeklySummaryHref(resolvedSearchParams, { view: "copy" })}
          >
            <span className="flex items-center gap-2">
              <FontAwesomeIcon className="h-3.5 w-3.5" icon={faCopy} />
              <span>Copy / export</span>
            </span>
          </Link>
          <Link
            aria-current={selectedView === "email" ? "page" : undefined}
            className={
              selectedView === "email"
                ? "border border-[var(--accent)] bg-[var(--accent)] px-4 py-3 text-sm font-semibold !text-neutral-950 shadow-[0_0_0_1px_var(--accent)]"
                : "border border-transparent bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-muted)]"
            }
            href={buildWeeklySummaryHref(resolvedSearchParams, { view: "email" })}
          >
            <span className="flex items-center gap-2">
              <FontAwesomeIcon className="h-3.5 w-3.5" icon={faEnvelope} />
              <span>Email</span>
            </span>
          </Link>
        </div>
      </div>

      {selectedView === "copy" ? (
        <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <section className="border border-[var(--border)] bg-[var(--panel)] p-6">
            <div className="border-t border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="text-sm text-[var(--muted)]">Total hours</p>
              <p className="mt-2 text-4xl font-semibold text-[var(--accent)]">
                {formatHours(weeklySummary.totalHours)} hrs
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">{selectedWeekLabel}</p>
            </div>
          </section>

          <section className="border border-[var(--border)] bg-[var(--panel-elevated)] p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">Ready to send</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {selectedWeekLabel}, formatted for billing copy/export.
                </p>
              </div>
              <WeeklySummaryCopy summaryText={summaryText} weekNumber={selectedWeekNumber} />
            </div>
            <pre className="mt-5 min-h-40 whitespace-pre-wrap border border-[var(--border)] bg-[var(--surface)] p-4 font-mono text-sm leading-7 text-[var(--foreground)]">
              {summaryText || "No billable summary lines for this week."}
            </pre>
          </section>
        </div>
      ) : (
        <WeeklySummaryEmailSection
          bodyText={summaryText}
          emailSettings={emailSettings}
          emailStatus={emailStatus}
          onSaveSettingsAction={saveWeeklySummaryEmailSettingsAction}
          onSendEmailAction={sendWeeklySummaryEmailAction}
          selectedWeekNumber={selectedWeekNumber}
          selectedWeekYear={selectedWeekYear}
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
