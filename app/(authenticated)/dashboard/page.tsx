import { WeeklyHoursPieChart } from "@/components/dashboard/weekly-hours-pie-chart";
import { WeekEntriesReveal } from "@/components/dashboard/week-entries-reveal";
import { WeekSelector } from "@/components/shared/week-selector";
import { getCurrentWorkbookOwnerId } from "@/lib/services/current-user";
import { listTimeEntries, getWeeklySummaryForYear } from "@/lib/services/time-tracking";
import { formatWeekLabel, getIsoWeekNumber, getIsoWeekYear, getTodayInputValue } from "@/lib/utils/dates";

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchParamValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
}

function getRequestedWeekNumber(searchParams: Record<string, string | string[] | undefined>) {
  const weekValue = getSearchParamValue(searchParams, "week");
  const weekNumber = Number(weekValue);

  return Number.isInteger(weekNumber) && weekNumber >= 1 && weekNumber <= 53 ? weekNumber : null;
}

function getRequestedWeekYear(searchParams: Record<string, string | string[] | undefined>) {
  const yearValue = getSearchParamValue(searchParams, "year");
  const weekYear = Number(yearValue);

  return Number.isInteger(weekYear) && weekYear >= 2000 && weekYear <= 2100 ? weekYear : null;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedSearchParams = await searchParams;
  const ownerId = await getCurrentWorkbookOwnerId();
  const requestedWeekNumber = getRequestedWeekNumber(resolvedSearchParams);
  const requestedWeekYear = getRequestedWeekYear(resolvedSearchParams);
  const currentIsoWeekNumber = getIsoWeekNumber(getTodayInputValue());
  const currentIsoWeekYear = getIsoWeekYear(getTodayInputValue());
  const selectedWeekNumber = requestedWeekNumber ?? currentIsoWeekNumber;
  const selectedWeekYear = requestedWeekYear ?? currentIsoWeekYear;
  const weeklySummary = await getWeeklySummaryForYear(
    ownerId,
    selectedWeekNumber,
    selectedWeekYear
  );
  const selectedWeekTimeEntries = await listTimeEntries(ownerId, {
    weekNumber: selectedWeekNumber,
    weekYear: selectedWeekYear
  });
  const selectedWeekLabel = formatWeekLabel(selectedWeekNumber, selectedWeekYear);
  const serializedSelectedWeekEntries = selectedWeekTimeEntries.map((timeEntry) => ({
    id: timeEntry.id,
    entryDate: timeEntry.entryDate,
    taskDescription: timeEntry.taskDescription,
    productName: timeEntry.productName,
    budgetName: timeEntry.budgetName,
    budgetNumber: timeEntry.budgetNumber,
    hoursWorked: timeEntry.hoursWorked,
    notes: timeEntry.notes
  }));

  return (
    <section className="py-8">
      <div className="mb-6 grid gap-3">
        <WeekSelector
          actionLabel="View week"
          defaultWeekNumber={selectedWeekNumber}
          defaultWeekYear={selectedWeekYear}
        />
      </div>

      <WeeklyHoursPieChart
        groupedHours={weeklySummary.groupedHours}
        totalHours={weeklySummary.totalHours}
        weekNumber={selectedWeekNumber}
        weekYear={selectedWeekYear}
      />
      <WeekEntriesReveal entries={serializedSelectedWeekEntries} weekLabel={selectedWeekLabel} />
    </section>
  );
}
