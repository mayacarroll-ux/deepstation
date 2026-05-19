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
