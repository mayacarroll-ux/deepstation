import { WeeklyHoursPieChart } from "@/components/dashboard/weekly-hours-pie-chart";
import { ButtonLink } from "@/components/ui/button";
import { WeekSelector } from "@/components/shared/week-selector";
import { getCurrentWorkbookOwnerId } from "@/lib/services/current-user";
import {
  getDashboardStats,
  getWeeklySummaryForYear
} from "@/lib/services/time-tracking";
import { formatWeekLabel } from "@/lib/utils/dates";
import { formatHours } from "@/lib/utils/format";

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
  const dashboardStats = await getDashboardStats(ownerId);
  const requestedWeekNumber = getRequestedWeekNumber(resolvedSearchParams);
  const requestedWeekYear = getRequestedWeekYear(resolvedSearchParams);
  const selectedWeekNumber = requestedWeekNumber ?? dashboardStats.currentWeekNumber;
  const selectedWeekYear = requestedWeekYear ?? dashboardStats.currentWeekYear;
  const weeklySummary = await getWeeklySummaryForYear(
    ownerId,
    selectedWeekNumber,
    selectedWeekYear
  );
  const selectedWeekLabel = formatWeekLabel(selectedWeekNumber, selectedWeekYear);

  return (
    <section className="py-8">
      <div className="mb-6 flex flex-wrap items-start justify-end gap-3">
        <WeekSelector
          actionLabel="View week"
          defaultWeekNumber={selectedWeekNumber}
          defaultWeekYear={selectedWeekYear}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <article className="border border-[var(--border)] bg-[var(--panel)] p-5">
          <p className="text-sm text-[var(--muted)]">Weekly total</p>
          <p className="mt-3 text-3xl font-semibold">
            {formatHours(weeklySummary.totalHours)} hrs
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">{selectedWeekLabel}</p>
        </article>
      </div>

      <WeeklyHoursPieChart
        groupedHours={weeklySummary.groupedHours}
        totalHours={weeklySummary.totalHours}
        weekNumber={selectedWeekNumber}
        weekYear={selectedWeekYear}
      />

      <div className="mt-6 flex justify-end">
        <ButtonLink href="/time-entries" variant="secondary">
          View time entries
        </ButtonLink>
      </div>
    </section>
  );
}
