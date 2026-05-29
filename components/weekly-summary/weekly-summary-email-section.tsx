import { faEnvelope, faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { WeeklySummarySendButton } from "@/components/weekly-summary/weekly-summary-send-button";
import { weeklySummaryDefaultBccEmail } from "@/lib/constants";
import {
  formatWeeklySummaryEmailScheduleDayLabel,
  formatWeeklySummaryEmailScheduleTimeLabel,
  getWeeklySummaryEmailScheduleLabel
} from "@/lib/constants/weekly-summary-email";
import type {
  WeeklySummaryEmailScheduleRecord,
  WeeklySummaryEmailSettingsRecord,
  WeeklySummaryEmailStatusRecord
} from "@/lib/services/weekly-summary-email";
import type { WeeklySummaryEmailScheduleDefaults } from "@/lib/constants/weekly-summary-email";

type WeeklySummaryEmailSectionProps = {
  bodyText: string;
  defaultEmailSchedule: WeeklySummaryEmailScheduleDefaults;
  emailSettings: WeeklySummaryEmailSettingsRecord | null;
  emailSchedule: WeeklySummaryEmailScheduleRecord | null;
  emailStatus: WeeklySummaryEmailStatusRecord | null;
  onSaveScheduleAction: (formData: FormData) => Promise<void>;
  onSaveSettingsAction: (formData: FormData) => Promise<void>;
  onSendEmailAction: (formData: FormData) => Promise<void>;
  selectedWeekNumber: number;
  selectedWeekYear: number;
  scheduleStatusMessage: string | null;
  scheduleStatusDetail: string | null;
  statusMessage: string | null;
  statusDetail: string | null;
  subject: string;
};

const weekDayOptions = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" }
] as const;

function formatRecipientList(recipients: string[]) {
  const uniqueRecipients = Array.from(new Set(recipients.map((recipient) => recipient.trim()))).filter(
    (recipient) => recipient.length > 0
  );

  return uniqueRecipients.length > 0 ? uniqueRecipients.join(", ") : "Not set";
}

function formatLastSentAt(lastSentAt: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(lastSentAt);
}

export function WeeklySummaryEmailSection({
  bodyText,
  defaultEmailSchedule,
  emailSettings,
  emailSchedule,
  emailStatus,
  onSaveScheduleAction,
  onSaveSettingsAction,
  onSendEmailAction,
  selectedWeekNumber,
  selectedWeekYear,
  scheduleStatusMessage,
  scheduleStatusDetail,
  statusMessage,
  statusDetail,
  subject
}: WeeklySummaryEmailSectionProps) {
  const hasConfiguredRecipients = Boolean(
    emailSettings?.managerEmail && emailSettings.accountingEmails.length > 0
  );
  const sendButtonLabel = emailStatus
    ? "Resend weekly summary email"
    : "Send weekly summary email";
  const canSendSummary = bodyText.length > 0 && hasConfiguredRecipients;
  const effectiveEmailSchedule = emailSchedule ?? {
    id: "",
    ownerId: "",
    enabled: defaultEmailSchedule.enabled,
    dayOfWeek: defaultEmailSchedule.dayOfWeek,
    timeOfDay: defaultEmailSchedule.timeOfDay,
    timeZone: defaultEmailSchedule.timeZone,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const scheduleStatusLabel = effectiveEmailSchedule.enabled ? "On" : "Off";
  const scheduleDescription = effectiveEmailSchedule.enabled
    ? getWeeklySummaryEmailScheduleLabel(effectiveEmailSchedule)
    : "Scheduled send is off. You can still send manually.";

  return (
    <section
      id="email-settings"
      className="grid gap-4 border border-[var(--border)] bg-[var(--panel)] p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-xl font-semibold">
            <FontAwesomeIcon className="h-4 w-4 text-[var(--accent)]" icon={faEnvelope} />
            Email weekly summary
          </h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Save recipients, preview the exact email body, and send this week manually.
          </p>
        </div>
      </div>

      {statusMessage ? (
        <div className="border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)]">
          <p>{statusMessage}</p>
          {statusDetail ? (
            <p className="mt-1 text-xs text-[var(--muted)]">{statusDetail}</p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <form
          action={onSaveSettingsAction}
          className="grid gap-4 border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5"
        >
          <input name="view" type="hidden" value="email" />
          <input name="weekNumber" type="hidden" value={selectedWeekNumber} />
          <input name="weekYear" type="hidden" value={selectedWeekYear} />
          <div>
            <h4 className="text-lg font-semibold">Recipient settings</h4>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Separate multiple accounting or CC emails with commas or new lines.
            </p>
          </div>
          <label className="grid gap-2 text-sm font-semibold">
            Manager email
            <input
              className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
              defaultValue={emailSettings?.managerEmail ?? ""}
              name="managerEmail"
              required
              type="email"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Accounting email(s)
            <textarea
              className="min-h-24 resize-y border border-[var(--border)] p-3 font-normal outline-none focus:border-[var(--accent)]"
              defaultValue={emailSettings?.accountingEmails.join("\n") ?? ""}
              name="accountingEmails"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            CC optional
            <textarea
              className="min-h-20 resize-y border border-[var(--border)] p-3 font-normal outline-none focus:border-[var(--accent)]"
              defaultValue={emailSettings?.ccEmails.join("\n") ?? ""}
              name="ccEmails"
            />
            <span className="text-xs font-normal text-[var(--muted)]">
              maya.carroll@ja.org is included automatically.
            </span>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            BCC optional
            <textarea
              className="min-h-20 resize-y border border-[var(--border)] p-3 font-normal outline-none focus:border-[var(--accent)]"
              defaultValue={
                emailSettings?.bccEmails.length
                  ? emailSettings.bccEmails.join("\n")
                  : weeklySummaryDefaultBccEmail
              }
              name="bccEmails"
            />
            <span className="text-xs font-normal text-[var(--muted)]">
              {weeklySummaryDefaultBccEmail} is included automatically and stays separate from To
              and CC.
            </span>
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button className="w-full sm:w-auto" type="submit" variant="secondary">
              <span className="mr-2 inline-flex items-center">
                <FontAwesomeIcon className="h-3.5 w-3.5" icon={faFloppyDisk} />
              </span>
              Save recipients
            </Button>
            <p className="text-xs text-[var(--muted)]">
              Email automation remains disabled until you explicitly enable it.
            </p>
          </div>
        </form>

        <section className="grid gap-4 border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h4 className="text-lg font-semibold">Scheduled send</h4>
              <p className="mt-1 text-sm text-[var(--muted)]">{scheduleDescription}</p>
              {!emailSchedule ? (
                <p className="mt-1 text-xs text-[var(--muted)]">
                  No saved schedule yet. The defaults below are shown until you save one.
                </p>
              ) : null}
            </div>
            <div className="grid gap-1 text-left text-xs text-[var(--muted)] sm:text-right">
              <p>Scheduled send</p>
              <p className="font-semibold text-[var(--foreground)]">{scheduleStatusLabel}</p>
              <p>
                Day{" "}
                <span className="font-semibold text-[var(--foreground)]">
                  {formatWeeklySummaryEmailScheduleDayLabel(effectiveEmailSchedule.dayOfWeek)}
                </span>
              </p>
              <p>
                Time{" "}
                <span className="font-semibold text-[var(--foreground)]">
                  {formatWeeklySummaryEmailScheduleTimeLabel(effectiveEmailSchedule.timeOfDay)}
                </span>
              </p>
              <p>
                Timezone{" "}
                <span className="font-semibold text-[var(--foreground)]">
                  {effectiveEmailSchedule.timeZone}
                </span>
              </p>
            </div>
          </div>

          {scheduleStatusMessage ? (
            <div className="border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--foreground)]">
              <p>{scheduleStatusMessage}</p>
              {scheduleStatusDetail ? (
                <p className="mt-1 text-xs text-[var(--muted)]">{scheduleStatusDetail}</p>
              ) : null}
            </div>
          ) : null}

          <form action={onSaveScheduleAction} className="grid gap-4 border-t border-[var(--border)] pt-4">
            <input name="view" type="hidden" value="email" />
            <input name="weekNumber" type="hidden" value={selectedWeekNumber} />
            <input name="weekYear" type="hidden" value={selectedWeekYear} />
            <input name="timeZone" type="hidden" value={effectiveEmailSchedule.timeZone} />
            <label className="flex items-center gap-3 text-sm font-semibold">
              <Checkbox
                defaultChecked={effectiveEmailSchedule.enabled}
                name="scheduleEnabled"
                value="on"
              />
              Schedule send
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="grid gap-2 text-sm font-semibold">
                <span className="min-h-5">Day</span>
                <Select defaultValue={String(effectiveEmailSchedule.dayOfWeek)} name="dayOfWeek">
                  {weekDayOptions.map((dayOption) => (
                    <option key={dayOption.value} value={dayOption.value}>
                      {dayOption.label}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                <span className="min-h-5">Time</span>
                <input
                  className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
                  defaultValue={effectiveEmailSchedule.timeOfDay}
                  name="timeOfDay"
                  step="60"
                  type="time"
                />
              </label>
              <div className="grid gap-2 text-sm font-semibold">
                <span className="min-h-5">Timezone</span>
                <div className="flex h-11 items-center border border-[var(--border)] bg-[var(--panel)] px-3 font-normal">
                  {effectiveEmailSchedule.timeZone}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button className="w-full sm:w-auto" type="submit">
                <span className="mr-2 inline-flex items-center">
                  <FontAwesomeIcon className="h-3.5 w-3.5" icon={faFloppyDisk} />
                </span>
                Save schedule
              </Button>
              <p className="text-xs text-[var(--muted)]">
                Scheduled sends still require automation to be enabled in Vercel.
              </p>
            </div>
          </form>
        </section>

        <section className="grid gap-4 border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h4 className="text-lg font-semibold">Email preview</h4>
              <p className="mt-1 text-sm text-[var(--muted)]">
                This is the exact summary body that will be sent.
              </p>
            </div>
            {emailStatus ? (
              <div className="text-left text-xs text-[var(--muted)] sm:text-right">
                <p>Last sent</p>
                <p className="font-semibold text-[var(--foreground)]">
                  {formatLastSentAt(emailStatus.lastSentAt)}
                </p>
                {emailStatus.lastMessageId ? (
                  <p className="mt-1">
                    Message ID{" "}
                    <span className="font-semibold text-[var(--foreground)]">
                      {emailStatus.lastMessageId}
                    </span>
                  </p>
                ) : null}
                <p className="mt-1">
                  Mode{" "}
                  <span className="font-semibold text-[var(--foreground)]">
                    {emailStatus.lastSendMode}
                  </span>
                </p>
              </div>
            ) : null}
          </div>

          <div className="grid gap-2 text-xs sm:text-sm">
            <p>
              <span className="font-semibold">Email subject:</span> {subject}
            </p>
            <p>
              <span className="font-semibold">To:</span>{" "}
              {formatRecipientList(
                emailSettings ? [emailSettings.managerEmail, ...emailSettings.accountingEmails] : []
              )}
            </p>
            <p>
              <span className="font-semibold">CC:</span>{" "}
              {formatRecipientList(emailSettings?.ccEmails ?? [])}
            </p>
            <p>
              <span className="font-semibold">BCC:</span>{" "}
              {formatRecipientList(
                emailSettings?.bccEmails.length ? emailSettings.bccEmails : [weeklySummaryDefaultBccEmail]
              )}
            </p>
          </div>

          <pre className="min-h-44 overflow-x-auto whitespace-pre-wrap break-words border border-[var(--border)] bg-[var(--panel)] p-3 font-mono text-xs leading-6 text-[var(--foreground)] sm:p-4 sm:text-sm sm:leading-7">
            {bodyText || "No billable summary lines for this week."}
          </pre>

          <form action={onSendEmailAction} className="grid gap-3 border-t border-[var(--border)] pt-4">
            <input name="view" type="hidden" value="email" />
            <input name="weekNumber" type="hidden" value={selectedWeekNumber} />
            <input name="weekYear" type="hidden" value={selectedWeekYear} />
            <label className="flex items-start gap-3 text-sm font-semibold">
              <input name="allowResend" type="checkbox" value="true" />
              I understand this will resend the selected week if it was already emailed.
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <WeeklySummarySendButton disabled={!canSendSummary} idleLabel={sendButtonLabel} />
            </div>
            {!hasConfiguredRecipients ? (
              <p className="text-xs text-[var(--warning)]">
                Save a manager email and at least one accounting email before sending.
              </p>
            ) : null}
            {!bodyText ? (
              <p className="text-xs text-[var(--warning)]">
                There is no billable summary text for this week, so sending is disabled.
              </p>
            ) : null}
            {emailStatus ? (
              <p className="text-xs text-[var(--muted)]">
                {emailStatus.sendCount} send{emailStatus.sendCount === 1 ? "" : "s"} recorded for
                this week.
              </p>
            ) : null}
          </form>
        </section>
      </div>
    </section>
  );
}
