import { and, eq, gte, lte } from "drizzle-orm";

import { database } from "@/db";
import { workdayDayStatuses, workdayWeekStatuses } from "@/db/schema";
import { isProduction } from "@/lib/config";
import { formatHours, formatHourUnit } from "@/lib/utils/format";
import { getIsoWeekDateRange } from "@/lib/utils/dates";

import { listTimeEntries, requireDatabase, type TimeEntryRecord } from "./time-tracking";

export const workdayTimeType = "382694: Junior Achievement";

export type WorkdayDay = {
  date: string;
  entries: TimeEntryRecord[];
  totalHours: number;
  commentText: string;
  isEntered: boolean;
};

export type WorkdayWeek = {
  weekNumber: number;
  weekYear: number;
  weekLabel: string;
  days: WorkdayDay[];
  totalHours: number;
  isEntered: boolean;
};

function getWeekDates(weekNumber: number, weekYear: number) {
  const { startDate } = getIsoWeekDateRange(weekNumber, weekYear);
  const weekStartDate = new Date(`${startDate}T00:00:00.000Z`);

  return Array.from({ length: 7 }, (_, dayIndex) => {
    const weekDate = new Date(weekStartDate);
    weekDate.setUTCDate(weekStartDate.getUTCDate() + dayIndex);

    return weekDate.toISOString().slice(0, 10);
  });
}

function buildWorkdayComment(entries: TimeEntryRecord[]) {
  return entries
    .map((timeEntry) => {
      const hoursWorked = Number(timeEntry.hoursWorked);
      const taskDetail = `${timeEntry.productName}: ${timeEntry.taskDescription}`;

      return `${taskDetail} (${formatHours(hoursWorked)} ${formatHourUnit(hoursWorked)})`;
    })
    .join("; ");
}

async function listDayStatuses(ownerId: string, startDate: string, endDate: string) {
  if (!database) {
    if (isProduction) {
      throw new Error("DATABASE_URL is required to load Workday day statuses in production.");
    }

    return [];
  }

  return database
    .select()
    .from(workdayDayStatuses)
    .where(
      and(
        eq(workdayDayStatuses.ownerId, ownerId),
        gte(workdayDayStatuses.entryDate, startDate),
        lte(workdayDayStatuses.entryDate, endDate)
      )
    );
}

async function getWeekStatus(ownerId: string, weekNumber: number, weekYear: number) {
  if (!database) {
    if (isProduction) {
      throw new Error("DATABASE_URL is required to load Workday week status in production.");
    }

    return null;
  }

  const [weekStatus] = await database
    .select()
    .from(workdayWeekStatuses)
    .where(
      and(
        eq(workdayWeekStatuses.ownerId, ownerId),
        eq(workdayWeekStatuses.weekNumber, weekNumber),
        eq(workdayWeekStatuses.weekYear, weekYear)
      )
    )
    .limit(1);

  return weekStatus ?? null;
}

export async function getWorkdayWeek(
  ownerId: string,
  weekNumber: number,
  weekYear: number
): Promise<WorkdayWeek> {
  const weekDateRange = getIsoWeekDateRange(weekNumber, weekYear);
  const [weekTimeEntries, dayStatuses, weekStatus] = await Promise.all([
    listTimeEntries(ownerId, {
      startDate: weekDateRange.startDate,
      endDate: weekDateRange.endDate
    }),
    listDayStatuses(ownerId, weekDateRange.startDate, weekDateRange.endDate),
    getWeekStatus(ownerId, weekNumber, weekYear)
  ]);
  const dayStatusesByDate = new Map(
    dayStatuses.map((dayStatus) => [dayStatus.entryDate, dayStatus])
  );
  const timeEntriesByDate = new Map<string, TimeEntryRecord[]>();

  for (const timeEntry of weekTimeEntries) {
    const existingEntries = timeEntriesByDate.get(timeEntry.entryDate) ?? [];
    timeEntriesByDate.set(timeEntry.entryDate, [...existingEntries, timeEntry]);
  }

  const days = getWeekDates(weekNumber, weekYear).map((date) => {
    const entries = timeEntriesByDate.get(date) ?? [];
    const totalHours = entries.reduce(
      (currentTotalHours, timeEntry) => currentTotalHours + Number(timeEntry.hoursWorked),
      0
    );

    return {
      date,
      entries,
      totalHours,
      commentText: buildWorkdayComment(entries),
      isEntered: dayStatusesByDate.get(date)?.isEntered ?? false
    };
  });

  return {
    weekNumber,
    weekYear,
    weekLabel: `Week ${weekNumber} · ${weekDateRange.label}`,
    days,
    totalHours: days.reduce((currentTotalHours, day) => currentTotalHours + day.totalHours, 0),
    isEntered: weekStatus?.isEntered ?? false
  };
}

export async function setWorkdayDayEntered(
  ownerId: string,
  entryDate: string,
  isEntered: boolean
) {
  const writableDatabase = requireDatabase();
  const now = new Date();

  await writableDatabase
    .insert(workdayDayStatuses)
    .values({
      ownerId,
      entryDate,
      isEntered,
      enteredAt: isEntered ? now : null,
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: [workdayDayStatuses.ownerId, workdayDayStatuses.entryDate],
      set: {
        isEntered,
        enteredAt: isEntered ? now : null,
        updatedAt: now
      }
    });
}

export async function setWorkdayWeekEntered(
  ownerId: string,
  weekNumber: number,
  weekYear: number,
  isEntered: boolean
) {
  const writableDatabase = requireDatabase();
  const now = new Date();

  await writableDatabase
    .insert(workdayWeekStatuses)
    .values({
      ownerId,
      weekNumber,
      weekYear,
      isEntered,
      enteredAt: isEntered ? now : null,
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: [
        workdayWeekStatuses.ownerId,
        workdayWeekStatuses.weekYear,
        workdayWeekStatuses.weekNumber
      ],
      set: {
        isEntered,
        enteredAt: isEntered ? now : null,
        updatedAt: now
      }
    });
}
