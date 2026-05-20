export function formatHours(hours: number) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(hours) ? 0 : 1
  }).format(hours);
}

export function formatHourUnit(hours: number) {
  return hours === 1 ? "hr" : "hrs";
}

function parseTimeInputValue(timeInputValue: string) {
  const timeMatch = /^([01]\d|2[0-3]):[0-5]\d$/.exec(timeInputValue.trim());

  if (!timeMatch) {
    return null;
  }

  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);

  return hours * 60 + minutes;
}

export function formatTimeInput(timeInputValue: string) {
  const timeMatch = /^([01]\d|2[0-3]):[0-5]\d$/.exec(timeInputValue.trim());

  if (!timeMatch) {
    return timeInputValue;
  }

  const hours = Number(timeMatch[1]);
  const minutes = timeMatch[2];
  const displayHours = hours % 12 || 12;
  const meridiem = hours >= 12 ? "PM" : "AM";

  return `${displayHours}:${minutes} ${meridiem}`;
}

export function calculateHoursFromTimeRange(startTime: string, endTime: string) {
  const startMinutes = parseTimeInputValue(startTime);
  const endMinutes = parseTimeInputValue(endTime);

  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return null;
  }

  return Math.round(((endMinutes - startMinutes) / 60) * 100) / 100;
}

export function formatTimeRange(startTime: string, endTime: string) {
  return `${formatTimeInput(startTime)} - ${formatTimeInput(endTime)}`;
}

export function formatBillingSummaryLine(hours: number, projectName: string) {
  return `${formatHours(hours)} ${formatHourUnit(hours)} – ${projectName}`;
}

export function formatBillingSummaryText(
  groupedHours: Array<{ projectName: string; totalHours: number }>,
  totalHours: number
) {
  const summaryLines = groupedHours
    .filter((groupedHour) => groupedHour.totalHours > 0)
    .map((groupedHour) =>
      formatBillingSummaryLine(groupedHour.totalHours, groupedHour.projectName)
    );

  if (summaryLines.length === 0) {
    return "";
  }

  return [...summaryLines, "", `${formatHours(totalHours)} ${formatHourUnit(totalHours)} total`].join(
    "\n"
  );
}
