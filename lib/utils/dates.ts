export function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function getIsoWeekNumber(dateInputValue: string) {
  const date = new Date(`${dateInputValue}T00:00:00`);
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = utcDate.getUTCDay() || 7;

  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNumber);

  const yearStartDate = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(
    ((utcDate.getTime() - yearStartDate.getTime()) / 86400000 + 1) / 7
  );

  return weekNumber;
}

export function getIsoWeekYear(dateInputValue: string) {
  const date = new Date(`${dateInputValue}T00:00:00`);
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = utcDate.getUTCDay() || 7;

  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNumber);

  return utcDate.getUTCFullYear();
}

function formatWeekRangeDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  }).format(date);
}

export function getIsoWeekDateRange(weekNumber: number, weekYear: number) {
  const fourthOfJanuary = new Date(Date.UTC(weekYear, 0, 4));
  const fourthOfJanuaryDayNumber = fourthOfJanuary.getUTCDay() || 7;
  const firstIsoWeekMonday = new Date(fourthOfJanuary);

  firstIsoWeekMonday.setUTCDate(fourthOfJanuary.getUTCDate() - fourthOfJanuaryDayNumber + 1);

  const weekStartDate = new Date(firstIsoWeekMonday);
  weekStartDate.setUTCDate(firstIsoWeekMonday.getUTCDate() + (weekNumber - 1) * 7);

  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setUTCDate(weekStartDate.getUTCDate() + 6);

  return {
    startDate: weekStartDate.toISOString().slice(0, 10),
    endDate: weekEndDate.toISOString().slice(0, 10),
    label: `${formatWeekRangeDate(weekStartDate)} - ${formatWeekRangeDate(weekEndDate)}`
  };
}

export function formatWeekLabel(weekNumber: number, weekYear: number) {
  return `Week ${weekNumber} · ${getIsoWeekDateRange(weekNumber, weekYear).label}`;
}
