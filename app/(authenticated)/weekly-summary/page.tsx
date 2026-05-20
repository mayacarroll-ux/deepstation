import { WeeklySummaryEmailSection } from "@/components/weekly-summary/weekly-summary-email-section";
import { WeeklySummaryCopy } from "@/components/weekly-summary/weekly-summary-copy";
import { getCurrentWorkbookOwnerId } from "@/lib/services/current-user";
import { getDashboardStats, getWeeklySummaryForYear } from "@/lib/services/time-tracking";
import {
  buildWeeklySummaryEmailSubject,
  getWeeklySummaryEmailSettings,
  getWeeklySummaryEmailStatus
} from "@/lib/services/weekly-summary-email";
import { formatWeekLabel, getIsoWeekYear, getTodayInputValue } from "@/lib/utils/dates";
import { formatBillingSummaryText, formatHours } from "@/lib/utils/format";

import {
  saveWeeklySummaryEmailSettingsAction,
  sendWeeklySummaryEmailAction
} from "./actions";

type WeeklySummaryPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

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

export default async function WeeklySummaryPage({ searchParams }: WeeklySummaryPageProps) {
  const resolvedSearchParams = await searchParams;
  const ownerId = await getCurrentWorkbookOwnerId();
  const requestedWeekNumber = getRequestedWeekNumber(resolvedSearchParams);
  const requestedWeekYear = getRequestedWeekYear(resolvedSearchParams);
  const dashboardStats = requestedWeekNumber ? null : await getDashboardStats(ownerId);
  const selectedWeekNumber = requestedWeekNumber ?? dashboardStats?.currentWeekNumber ?? 1;
  const selectedWeekYear = requestedWeekYear ?? getIsoWeekYear(getTodayInputValue());
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

  return (
    <section className="py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Weekly billing summary</h2>
        <p className="mt-2 text-[var(--muted)]">
          Select a week and copy a clean billing summary grouped by accounting project name.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
        <section className="border border-[var(--border)] bg-[var(--panel)] p-6">
          <form className="grid gap-4">
            <label className="grid gap-2 text-sm font-semibold">
              Year
              <input
                className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
                defaultValue={selectedWeekYear}
                max="2100"
                min="2000"
                name="year"
                required
                type="number"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Week Number
              <input
                className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
                defaultValue={selectedWeekNumber}
                max="53"
                min="1"
                name="week"
                required
                type="number"
              />
            </label>
            <button
              className="h-11 border border-[var(--accent)] bg-[var(--accent)] px-5 text-sm font-semibold !text-neutral-950 transition-colors hover:bg-[var(--accent-hover)]"
              type="submit"
            >
              View week
            </button>
          </form>
          <div className="mt-6 border-t border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-sm text-[var(--muted)]">Total hours</p>
            <p className="mt-2 text-4xl font-semibold text-[var(--accent)]">
              {formatHours(weeklySummary.totalHours)} hrs
            </p>
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

      <div className="mt-6">
        <WeeklySummaryEmailSection
          bodyText={summaryText}
          emailSettings={emailSettings}
          emailStatus={emailStatus}
          onSaveSettingsAction={saveWeeklySummaryEmailSettingsAction}
          onSendEmailAction={sendWeeklySummaryEmailAction}
          selectedWeekNumber={selectedWeekNumber}
          selectedWeekYear={selectedWeekYear}
          statusMessage={emailStatusMessage}
          statusDetail={emailErrorValue ?? null}
          subject={selectedWeekEmailSubject}
        />
      </div>
    </section>
  );
}
