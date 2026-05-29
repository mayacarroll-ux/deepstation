import { NextRequest, NextResponse } from "next/server";

import { singleUserId } from "@/lib/constants";
import { serverEnvironment } from "@/lib/config";
import { getIsoWeekNumber, getIsoWeekYear } from "@/lib/utils/dates";

import {
  getDefaultWeeklySummaryEmailSchedule,
  getWeeklySummaryEmailSchedule,
  getWeeklySummaryEmailSettings,
  sendWeeklySummaryEmail
} from "@/lib/services/weekly-summary-email";
import { getWeeklySummaryForYear } from "@/lib/services/time-tracking";
import { doesWeeklySummaryScheduleMatch } from "@/lib/constants/weekly-summary-email";

function getDatePartsInTimeZone(currentDate: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const partEntries = formatter.formatToParts(currentDate).map((part) => [part.type, part.value]);
  const parts = Object.fromEntries(partEntries) as Record<string, string>;

  return {
    dateInputValue: `${parts.year}-${parts.month}-${parts.day}`
  };
}

function isAuthorizedCronRequest(request: NextRequest) {
  const cronSecret = serverEnvironment.CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (serverEnvironment.WEEKLY_SUMMARY_AUTOMATION_ENABLED !== "true") {
    console.log("Weekly summary cron skipped because automation is disabled.");

    return NextResponse.json(
      {
        status: "skipped",
        reason: "automation_disabled"
      },
      { status: 200 }
    );
  }

  if (!serverEnvironment.CRON_SECRET) {
    console.error("Weekly summary cron misconfigured: CRON_SECRET is missing.");

    return NextResponse.json(
      {
        status: "error",
        message: "CRON_SECRET is required when weekly summary automation is enabled."
      },
      { status: 500 }
    );
  }

  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json(
      {
        status: "unauthorized"
      },
      { status: 401 }
    );
  }

  const ownerId = singleUserId;
  const savedSchedule = await getWeeklySummaryEmailSchedule(ownerId);
  const currentDate = new Date();
  const effectiveSchedule = savedSchedule ?? getDefaultWeeklySummaryEmailSchedule();

  if (!effectiveSchedule.enabled) {
    console.log("Weekly summary cron skipped because scheduled send is off.", {
      timezone: effectiveSchedule.timeZone,
      dayOfWeek: effectiveSchedule.dayOfWeek,
      timeOfDay: effectiveSchedule.timeOfDay
    });

    return NextResponse.json(
      {
        status: "skipped",
        reason: "scheduled_send_off"
      },
      { status: 200 }
    );
  }

  if (!doesWeeklySummaryScheduleMatch(currentDate, effectiveSchedule)) {
    console.log("Weekly summary cron skipped outside configured send window.", {
      timezone: effectiveSchedule.timeZone,
      dayOfWeek: effectiveSchedule.dayOfWeek,
      timeOfDay: effectiveSchedule.timeOfDay
    });

    return NextResponse.json(
      {
        status: "skipped",
        reason: "outside_scheduled_window",
        timezone: effectiveSchedule.timeZone,
        dayOfWeek: effectiveSchedule.dayOfWeek,
        timeOfDay: effectiveSchedule.timeOfDay
      },
      { status: 200 }
    );
  }

  const { dateInputValue } = getDatePartsInTimeZone(currentDate, effectiveSchedule.timeZone);
  const weekNumber = getIsoWeekNumber(dateInputValue);
  const weekYear = getIsoWeekYear(dateInputValue);

  const [emailSettings, weeklySummary] = await Promise.all([
    getWeeklySummaryEmailSettings(ownerId),
    getWeeklySummaryForYear(ownerId, weekNumber, weekYear)
  ]);

  if (!emailSettings?.managerEmail || emailSettings.accountingEmails.length === 0) {
    console.error("Weekly summary cron skipped because recipient settings are missing.", {
      weekYear,
      weekNumber
    });

    return NextResponse.json(
      {
        status: "error",
        message: "Manager and accounting recipients must be configured before automation can send."
      },
      { status: 500 }
    );
  }

  if (!weeklySummary.groupedHours.length) {
    console.log("Weekly summary cron skipped because there are no billable hours for the week.", {
      weekYear,
      weekNumber
    });

    return NextResponse.json(
      {
        status: "skipped",
        reason: "no_billable_summary",
        weekYear,
        weekNumber
      },
      { status: 200 }
    );
  }

  try {
    const sendResult = await sendWeeklySummaryEmail(ownerId, weekNumber, weekYear, false, "auto");

    if (sendResult.duplicateBlocked) {
      console.log("Weekly summary cron skipped because the week was already emailed.", {
        weekYear,
        weekNumber,
        recipientCount: sendResult.recipientCount
      });

      return NextResponse.json(
        {
          status: "skipped",
          reason: "duplicate_week",
          weekYear,
          weekNumber,
          recipientCount: sendResult.recipientCount
        },
        { status: 200 }
      );
    }

    console.log("Weekly summary cron sent email.", {
      weekYear,
      weekNumber,
      messageId: sendResult.messageId,
      recipientCount: sendResult.recipientCount
    });

    return NextResponse.json(
      {
        status: "sent",
        weekYear,
        weekNumber,
        messageId: sendResult.messageId,
        recipientCount: sendResult.recipientCount
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown cron send error.";

    console.error("Weekly summary cron send failed.", {
      weekYear,
      weekNumber,
      errorMessage
    });

    return NextResponse.json(
      {
        status: "error",
        message: errorMessage
      },
      { status: 502 }
    );
  }
}
