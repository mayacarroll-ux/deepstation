export function formatHours(hours: number) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(hours) ? 0 : 1
  }).format(hours);
}

export function formatHourUnit(hours: number) {
  return hours === 1 ? "hr" : "hrs";
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
