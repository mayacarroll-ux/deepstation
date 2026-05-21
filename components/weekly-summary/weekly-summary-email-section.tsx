import { faEnvelope, faFloppyDisk, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Button } from "@/components/ui/button";
import type {
  WeeklySummaryEmailSettingsRecord,
  WeeklySummaryEmailStatusRecord
} from "@/lib/services/weekly-summary-email";

type WeeklySummaryEmailSectionProps = {
  bodyText: string;
  emailSettings: WeeklySummaryEmailSettingsRecord | null;
  emailStatus: WeeklySummaryEmailStatusRecord | null;
  onSaveSettingsAction: (formData: FormData) => Promise<void>;
  onSendEmailAction: (formData: FormData) => Promise<void>;
  selectedWeekNumber: number;
  selectedWeekYear: number;
  statusMessage: string | null;
  statusDetail: string | null;
  subject: string;
};

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
  emailSettings,
  emailStatus,
  onSaveSettingsAction,
  onSendEmailAction,
  selectedWeekNumber,
  selectedWeekYear,
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

  return (
    <section id="email-settings" className="grid gap-4 border border-[var(--border)] bg-[var(--panel)] p-6">
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
        <form action={onSaveSettingsAction} className="grid gap-4 border border-[var(--border)] bg-[var(--surface)] p-5">
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
          <div className="flex items-center gap-3">
            <Button type="submit" variant="secondary">
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

        <section className="grid gap-4 border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h4 className="text-lg font-semibold">Email preview</h4>
              <p className="mt-1 text-sm text-[var(--muted)]">
                This is the exact summary body that will be sent.
              </p>
            </div>
            {emailStatus ? (
              <div className="text-right text-xs text-[var(--muted)]">
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

          <div className="grid gap-2 text-sm">
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
          </div>

          <pre className="min-h-44 whitespace-pre-wrap border border-[var(--border)] bg-[var(--panel)] p-4 font-mono text-sm leading-7 text-[var(--foreground)]">
            {bodyText || "No billable summary lines for this week."}
          </pre>

          <form action={onSendEmailAction} className="grid gap-3 border-t border-[var(--border)] pt-4">
            <input name="weekNumber" type="hidden" value={selectedWeekNumber} />
            <input name="weekYear" type="hidden" value={selectedWeekYear} />
            <label className="flex items-center gap-3 text-sm font-semibold">
              <input name="allowResend" type="checkbox" value="true" />
              I understand this will resend the selected week if it was already emailed.
            </label>
            <Button disabled={!canSendSummary} type="submit">
              <span className="mr-2 inline-flex items-center">
                <FontAwesomeIcon className="h-3.5 w-3.5" icon={faPaperPlane} />
              </span>
              {sendButtonLabel}
            </Button>
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
