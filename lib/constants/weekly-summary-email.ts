export const weeklySummaryScheduleTimeZone = "America/New_York";
export const weeklySummaryScheduleDefaultDayOfWeek = 5;
export const weeklySummaryScheduleDefaultTimeOfDay = "17:00";

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

export type WeeklySummaryEmailScheduleDefaults = {
  enabled: boolean;
  dayOfWeek: number;
  timeOfDay: string;
  timeZone: string;
};

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
