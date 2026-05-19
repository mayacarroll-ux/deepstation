export function formatHours(hours: number) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(hours) ? 0 : 1
  }).format(hours);
}

export function formatBillingSummaryLine(hours: number, budgetName: string) {
  return `${formatHours(hours)} hrs — ${budgetName}`;
}
