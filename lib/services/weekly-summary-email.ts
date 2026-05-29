import { and, eq } from "drizzle-orm";
import { Resend } from "resend";
import { z } from "zod";

import { database } from "@/db";
import {
  weeklySummaryEmailSettings,
  weeklySummaryEmailSchedules,
  weeklySummaryEmailStatuses
} from "@/db/schema";
import { isProduction, serverEnvironment } from "@/lib/config";
import {
  singleUserName,
  weeklySummaryDefaultBccEmail,
  weeklySummaryDefaultCcEmail
} from "@/lib/constants";
import { getIsoWeekDateRange } from "@/lib/utils/dates";
import { formatBillingSummaryText } from "@/lib/utils/format";

import { getWeeklySummaryForYear, requireDatabase } from "./time-tracking";

export const weeklySummaryEmailSettingsFormSchema = z.object({
  managerEmail: z.string().trim().email("Manager email is required."),
  accountingEmails: z.string().trim().min(1, "Accounting email(s) are required."),
  ccEmails: z.string().trim().optional(),
  bccEmails: z.string().trim().optional()
});

export const weeklySummaryEmailScheduleFormSchema = z.object({
  scheduleEnabled: z
    .string()
    .optional()
    .transform((value) => value === "on" || value === "true"),
  dayOfWeek: z.coerce
    .number()
    .int("Day of week must be a whole number.")
    .min(1, "Day of week is required.")
    .max(7, "Day of week cannot be greater than 7."),
  timeOfDay: z
    .string()
    .trim()
    .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Time must use 24-hour HH:MM format.")
});

export type WeeklySummaryEmailSettingsRecord =
  typeof weeklySummaryEmailSettings.$inferSelect;

export type WeeklySummaryEmailScheduleRecord =
  typeof weeklySummaryEmailSchedules.$inferSelect;

export type WeeklySummaryEmailStatusRecord =
  typeof weeklySummaryEmailStatuses.$inferSelect;

export type WeeklySummaryEmailScheduleDefaults = {
  enabled: boolean;
  dayOfWeek: number;
  timeOfDay: string;
  timeZone: string;
};

export type WeeklySummaryEmailPreview = {
  subject: string;
  bodyText: string;
  toRecipients: string[];
  ccRecipients: string[];
  bccRecipients: string[];
};

export type WeeklySummaryEmailSendResult = {
  sent: boolean;
  duplicateBlocked: boolean;
  weekNumber: number;
  weekYear: number;
  messageId: string | null;
  recipientCount: number;
};

export type WeeklySummaryEmailSendMode = "manual" | "resend" | "auto";
type WeeklySummaryEmailRecipientSettings = {
  managerEmail: string;
  accountingEmails: string[];
  ccEmails: string[];
  bccEmails: string[];
};

const weeklySummaryScheduleTimeZone = "America/New_York";
const weeklySummaryScheduleDefaultDayOfWeek = 5;
const weeklySummaryScheduleDefaultTimeOfDay = "17:00";
const weekdayLabelsByDayOfWeek = [
  "",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
] as const;
const weekdayShortToDayOfWeek = new Map([
  ["Mon", 1],
  ["Tue", 2],
  ["Wed", 3],
  ["Thu", 4],
  ["Fri", 5],
  ["Sat", 6],
  ["Sun", 7]
]);

function parseEmailList(rawEmails: string | null | undefined) {
  return String(rawEmails ?? "")
    .split(/[\n,]+/g)
    .map((email) => email.trim())
    .filter((email) => email.length > 0);
}

const emailListSchema = z.array(z.string().email());

function dedupeEmails(emails: string[]) {
  return Array.from(new Set(emails.map((email) => email.trim().toLowerCase())))
    .filter((email) => email.length > 0);
}

function formatSubjectDateRange(weekNumber: number, weekYear: number) {
  const { startDate, endDate } = getIsoWeekDateRange(weekNumber, weekYear);
  const startDateValue = new Date(`${startDate}T00:00:00.000Z`);
  const endDateValue = new Date(`${endDate}T00:00:00.000Z`);
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  });

  return `${dateFormatter.format(startDateValue)}-${dateFormatter.format(endDateValue)}`;
}

export function buildWeeklySummaryEmailSubject(weekNumber: number, weekYear: number) {
  return `${singleUserName} Time tracking - Week ${weekNumber} - ${formatSubjectDateRange(
    weekNumber,
    weekYear
  )}`;
}

function normalizeSendMode(sendMode: string) {
  return sendMode.trim().toLowerCase();
}

function toRecipientSnapshot(recipients: string[]) {
  return recipients.map((recipient) => recipient.trim().toLowerCase());
}

function getDefaultWeeklySummaryCcRecipients() {
  return [weeklySummaryDefaultCcEmail];
}

function getDefaultWeeklySummaryBccRecipients() {
  return [weeklySummaryDefaultBccEmail];
}

function getEffectiveCcRecipients(rawCcRecipients: string[]) {
  return dedupeEmails([...rawCcRecipients, ...getDefaultWeeklySummaryCcRecipients()]);
}

function getEffectiveBccRecipients(rawBccRecipients: string[]) {
  return dedupeEmails([...rawBccRecipients, ...getDefaultWeeklySummaryBccRecipients()]);
}

function buildWeeklySummaryEmailRecipients(settings: WeeklySummaryEmailRecipientSettings) {
  const toRecipients = dedupeEmails([settings.managerEmail, ...settings.accountingEmails]);
  const ccRecipients = getEffectiveCcRecipients(settings.ccEmails).filter(
    (email) => !toRecipients.includes(email)
  );
  const bccRecipients = getEffectiveBccRecipients(settings.bccEmails).filter(
    (email) => !toRecipients.includes(email) && !ccRecipients.includes(email)
  );

  return {
    toRecipients,
    ccRecipients,
    bccRecipients
  };
}

export function getDefaultWeeklySummaryEmailSchedule(): WeeklySummaryEmailScheduleDefaults {
  return {
    enabled: serverEnvironment.WEEKLY_SUMMARY_AUTOMATION_ENABLED === "true",
    dayOfWeek: weeklySummaryScheduleDefaultDayOfWeek,
    timeOfDay: weeklySummaryScheduleDefaultTimeOfDay,
    timeZone: weeklySummaryScheduleTimeZone
  };
}

export function formatWeeklySummaryEmailScheduleDayLabel(dayOfWeek: number) {
  return weekdayLabelsByDayOfWeek[dayOfWeek] ?? "Unknown day";
}

export function formatWeeklySummaryEmailScheduleTimeLabel(timeOfDay: string) {
  const [hourValue, minuteValue] = timeOfDay.split(":").map(Number);

  if (
    !Number.isInteger(hourValue) ||
    !Number.isInteger(minuteValue) ||
    hourValue < 0 ||
    hourValue > 23 ||
    minuteValue < 0 ||
    minuteValue > 59
  ) {
    return timeOfDay;
  }

  const timeValue = new Date(Date.UTC(2000, 0, 1, hourValue, minuteValue));

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC"
  }).format(timeValue);
}

export function getWeeklySummaryEmailScheduleLabel(schedule: WeeklySummaryEmailScheduleDefaults) {
  const dayLabel = formatWeeklySummaryEmailScheduleDayLabel(schedule.dayOfWeek);
  const timeLabel = formatWeeklySummaryEmailScheduleTimeLabel(schedule.timeOfDay);
  const timezoneLabel =
    schedule.timeZone === weeklySummaryScheduleTimeZone ? "Eastern" : schedule.timeZone;

  return `Scheduled to send every ${dayLabel} at ${timeLabel} ${timezoneLabel}.`;
}

function formatWeekdayShort(weekday: string) {
  return weekdayShortToDayOfWeek.get(weekday);
}

function getDateTimePartsInTimeZone(currentDate: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  const partEntries = formatter.formatToParts(currentDate).map((part) => [part.type, part.value]);
  const parts = Object.fromEntries(partEntries) as Record<string, string>;
  const dayOfWeek = formatWeekdayShort(parts.weekday);

  return {
    dayOfWeek,
    hour: Number(parts.hour),
    minute: Number(parts.minute)
  };
}

export function doesWeeklySummaryScheduleMatch(
  currentDate: Date,
  schedule: WeeklySummaryEmailScheduleDefaults
) {
  if (!schedule.enabled) {
    return false;
  }

  const timeParts = getDateTimePartsInTimeZone(currentDate, schedule.timeZone);
  const [scheduledHourValue, scheduledMinuteValue] = schedule.timeOfDay.split(":").map(Number);

  return (
    timeParts.dayOfWeek === schedule.dayOfWeek &&
    timeParts.hour === scheduledHourValue &&
    timeParts.minute === scheduledMinuteValue
  );
}

export async function getWeeklySummaryEmailSchedule(ownerId: string) {
  if (!database) {
    if (isProduction) {
      throw new Error("DATABASE_URL is required to load weekly summary email schedule in production.");
    }

    return null;
  }

  const [schedule] = await database
    .select()
    .from(weeklySummaryEmailSchedules)
    .where(eq(weeklySummaryEmailSchedules.ownerId, ownerId))
    .limit(1);

  return schedule ?? null;
}

export async function saveWeeklySummaryEmailSchedule(
  ownerId: string,
  formData: FormData
) {
  const writableDatabase = requireDatabase();
  const parsedSchedule = weeklySummaryEmailScheduleFormSchema.parse({
    scheduleEnabled: formData.get("scheduleEnabled"),
    dayOfWeek: formData.get("dayOfWeek"),
    timeOfDay: formData.get("timeOfDay")
  });

  await writableDatabase
    .insert(weeklySummaryEmailSchedules)
    .values({
      ownerId,
      enabled: parsedSchedule.scheduleEnabled,
      dayOfWeek: parsedSchedule.dayOfWeek,
      timeOfDay: parsedSchedule.timeOfDay,
      timeZone: weeklySummaryScheduleTimeZone,
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: weeklySummaryEmailSchedules.ownerId,
      set: {
        enabled: parsedSchedule.scheduleEnabled,
        dayOfWeek: parsedSchedule.dayOfWeek,
        timeOfDay: parsedSchedule.timeOfDay,
        timeZone: weeklySummaryScheduleTimeZone,
        updatedAt: new Date()
      }
    });
}

function getResendClient() {
  const resendApiKey = serverEnvironment.RESEND_API_KEY;

  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is required to send weekly summary emails.");
  }

  return new Resend(resendApiKey);
}

function getResendFromEmail() {
  const fromEmail = serverEnvironment.EMAIL_FROM ?? serverEnvironment.RESEND_FROM_EMAIL;

  if (!fromEmail) {
    throw new Error(
      "Set EMAIL_FROM or RESEND_FROM_EMAIL to a verified Resend sender before sending weekly summary emails."
    );
  }

  return fromEmail;
}

function buildEmailHtml(bodyText: string) {
  const escapedBodyText = bodyText
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  return `
    <html>
      <body style="font-family: ui-sans-serif, system-ui, sans-serif; line-height: 1.6; color: #111;">
        <pre style="white-space: pre-wrap; margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${escapedBodyText}</pre>
      </body>
    </html>
  `;
}

export async function getWeeklySummaryEmailSettings(ownerId: string) {
  if (!database) {
    if (isProduction) {
      throw new Error("DATABASE_URL is required to load weekly summary email settings in production.");
    }

    return null;
  }

  const [settings] = await database
    .select()
    .from(weeklySummaryEmailSettings)
    .where(eq(weeklySummaryEmailSettings.ownerId, ownerId))
    .limit(1);

  return settings ?? null;
}

export async function getWeeklySummaryEmailStatus(
  ownerId: string,
  weekYear: number,
  weekNumber: number
) {
  if (!database) {
    if (isProduction) {
      throw new Error("DATABASE_URL is required to load weekly summary email status in production.");
    }

    return null;
  }

  const [status] = await database
    .select()
    .from(weeklySummaryEmailStatuses)
    .where(
      and(
        eq(weeklySummaryEmailStatuses.ownerId, ownerId),
        eq(weeklySummaryEmailStatuses.weekYear, weekYear),
        eq(weeklySummaryEmailStatuses.weekNumber, weekNumber)
      )
    )
    .limit(1);

  return status ?? null;
}

export async function saveWeeklySummaryEmailSettings(
  ownerId: string,
  formData: FormData
) {
  const writableDatabase = requireDatabase();
  const parsedSettings = weeklySummaryEmailSettingsFormSchema.parse({
    managerEmail: formData.get("managerEmail"),
    accountingEmails: formData.get("accountingEmails"),
    ccEmails: formData.get("ccEmails"),
    bccEmails: formData.get("bccEmails")
  });
  const accountingEmails = dedupeEmails(parseEmailList(parsedSettings.accountingEmails));
  const ccEmails = getEffectiveCcRecipients(parseEmailList(parsedSettings.ccEmails));
  const bccEmails = getEffectiveBccRecipients(parseEmailList(parsedSettings.bccEmails));
  const validatedAccountingEmails = emailListSchema.parse(accountingEmails);
  const validatedCcEmails = emailListSchema.parse(ccEmails);
  const validatedBccEmails = emailListSchema.parse(bccEmails);

  if (validatedAccountingEmails.length === 0) {
    throw new Error("At least one accounting email is required.");
  }

  await writableDatabase
    .insert(weeklySummaryEmailSettings)
    .values({
      ownerId,
      managerEmail: parsedSettings.managerEmail.trim().toLowerCase(),
      accountingEmails: validatedAccountingEmails,
      ccEmails: validatedCcEmails,
      bccEmails: validatedBccEmails,
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: weeklySummaryEmailSettings.ownerId,
      set: {
        managerEmail: parsedSettings.managerEmail.trim().toLowerCase(),
        accountingEmails: validatedAccountingEmails,
        ccEmails: validatedCcEmails,
        bccEmails: validatedBccEmails,
        updatedAt: new Date()
      }
    });
}

export async function buildWeeklySummaryEmailPreview(
  ownerId: string,
  weekNumber: number,
  weekYear: number
): Promise<WeeklySummaryEmailPreview> {
  const summary = await getWeeklySummaryForYear(ownerId, weekNumber, weekYear);
  const settings = await getWeeklySummaryEmailSettings(ownerId);
  const recipientLists = buildWeeklySummaryEmailRecipients(
    settings ?? {
      managerEmail: "",
      accountingEmails: [],
      ccEmails: [],
      bccEmails: []
    }
  );

  return {
    subject: buildWeeklySummaryEmailSubject(weekNumber, weekYear),
    bodyText: formatBillingSummaryText(summary.groupedHours, summary.totalHours),
    toRecipients: recipientLists.toRecipients,
    ccRecipients: recipientLists.ccRecipients,
    bccRecipients: recipientLists.bccRecipients
  };
}

export async function sendWeeklySummaryEmail(
  ownerId: string,
  weekNumber: number,
  weekYear: number,
  allowResend: boolean,
  sendMode: WeeklySummaryEmailSendMode = "manual"
): Promise<WeeklySummaryEmailSendResult> {
  const writableDatabase = requireDatabase();
  const weeklySummary = await getWeeklySummaryForYear(ownerId, weekNumber, weekYear);
  const settings = await getWeeklySummaryEmailSettings(ownerId);

  if (!weeklySummary.groupedHours.length) {
    throw new Error("No summary lines are available for this week.");
  }

  if (!settings?.managerEmail || settings.accountingEmails.length === 0) {
    throw new Error("Save a manager email and at least one accounting email before sending.");
  }

  const existingStatus = await getWeeklySummaryEmailStatus(ownerId, weekYear, weekNumber);

  if (existingStatus && !allowResend) {
    return {
      sent: false,
      duplicateBlocked: true,
      weekNumber,
      weekYear,
      messageId: existingStatus.lastMessageId ?? null,
      recipientCount:
        existingStatus.toRecipients.length +
        existingStatus.ccRecipients.length +
        getEffectiveBccRecipients(settings?.bccEmails ?? []).filter(
          (email) =>
            !existingStatus.toRecipients.includes(email) &&
            !existingStatus.ccRecipients.includes(email)
        ).length
    };
  }

  const recipientLists = buildWeeklySummaryEmailRecipients(settings);
  const toRecipients = recipientLists.toRecipients;
  const ccRecipients = recipientLists.ccRecipients;
  const bccRecipients = recipientLists.bccRecipients;
  const summaryText = formatBillingSummaryText(weeklySummary.groupedHours, weeklySummary.totalHours);
  const subject = buildWeeklySummaryEmailSubject(weekNumber, weekYear);
  const resend = getResendClient();
  const fromEmail = getResendFromEmail();
  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: toRecipients,
    cc: ccRecipients.length > 0 ? ccRecipients : undefined,
    bcc: bccRecipients.length > 0 ? bccRecipients : undefined,
    subject,
    text: summaryText,
    html: buildEmailHtml(summaryText)
  });

  if (error) {
    console.error("Weekly summary email send failed.", {
      weekYear,
      weekNumber,
      recipientCount: toRecipients.length + ccRecipients.length,
      resendErrorName: error.name,
      resendStatusCode: error.statusCode,
      resendErrorMessage: error.message
    });

    throw new Error(
      `Resend rejected the weekly summary email: ${error.message}`
    );
  }

  const now = new Date();
  await writableDatabase
    .insert(weeklySummaryEmailStatuses)
    .values({
      ownerId,
      weekYear,
      weekNumber,
      lastSentAt: now,
      lastMessageId: data?.id ?? null,
      lastSendMode: normalizeSendMode(existingStatus ? "resend" : sendMode),
      toRecipients: toRecipientSnapshot(toRecipients),
      ccRecipients: toRecipientSnapshot(ccRecipients),
      sendCount: existingStatus ? existingStatus.sendCount + 1 : 1,
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: [
        weeklySummaryEmailStatuses.ownerId,
        weeklySummaryEmailStatuses.weekYear,
        weeklySummaryEmailStatuses.weekNumber
      ],
      set: {
        lastSentAt: now,
        lastMessageId: data?.id ?? null,
        lastSendMode: normalizeSendMode(existingStatus ? "resend" : sendMode),
        toRecipients: toRecipientSnapshot(toRecipients),
        ccRecipients: toRecipientSnapshot(ccRecipients),
        sendCount: existingStatus ? existingStatus.sendCount + 1 : 1,
        updatedAt: now
      }
    });

  return {
    sent: true,
    duplicateBlocked: false,
    weekNumber,
    weekYear,
    messageId: data?.id ?? null,
    recipientCount: toRecipients.length + ccRecipients.length + bccRecipients.length
  };
}
