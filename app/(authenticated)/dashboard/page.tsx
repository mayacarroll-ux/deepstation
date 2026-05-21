import { WeeklyHoursPieChart } from "@/components/dashboard/weekly-hours-pie-chart";
import { ButtonLink } from "@/components/ui/button";
import { WeekSelector } from "@/components/shared/week-selector";
import { getCurrentWorkbookOwnerId } from "@/lib/services/current-user";
import {
  getDashboardStats,
  getWeeklySummaryForYear,
  listTimeEntries
} from "@/lib/services/time-tracking";
import { formatWeekLabel, getIsoWeekYear } from "@/lib/utils/dates";
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
  const selectedWeekEntries = await listTimeEntries(ownerId, {
    weekNumber: selectedWeekNumber,
    weekYear: selectedWeekYear
  });
  const selectedWeekLabel = formatWeekLabel(selectedWeekNumber, selectedWeekYear);

  return (
    <section className="py-8">
      <div className="mb-6 flex flex-wrap items-end justify-end gap-3">
        <WeekSelector
          actionLabel="View week"
          defaultWeekNumber={selectedWeekNumber}
          defaultWeekYear={selectedWeekYear}
        />
        <ButtonLink className="text-neutral-950" href="/time-entries/new">
          New time entry
        </ButtonLink>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 lg:gap-5">
        <article className="border border-[var(--border)] bg-[var(--panel)] p-5">
          <p className="text-sm text-[var(--muted)]">Selected week</p>
          <p className="mt-3 text-2xl font-semibold">{selectedWeekLabel}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{selectedWeekYear}</p>
        </article>
        <article className="border border-[var(--border)] bg-[var(--panel)] p-5">
          <p className="text-sm text-[var(--muted)]">Week total</p>
          <p className="mt-3 text-3xl font-semibold">
            {formatHours(weeklySummary.totalHours)} hrs
          </p>
        </article>
        <article className="border border-[var(--border)] bg-[var(--panel)] p-5">
          <p className="text-sm text-[var(--muted)]">Entries in selected week</p>
          <p className="mt-3 text-3xl font-semibold">
            {selectedWeekEntries.length}
          </p>
        </article>
      </div>

      <WeeklyHoursPieChart
        groupedHours={weeklySummary.groupedHours}
        totalHours={weeklySummary.totalHours}
        weekNumber={selectedWeekNumber}
        weekYear={selectedWeekYear}
      />

      <section className="mt-6 border border-[var(--border)] bg-[var(--panel)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">Selected week entries</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              The most recent saved rows within the selected week.
            </p>
          </div>
          <ButtonLink href="/time-entries" variant="secondary">
            View all
          </ButtonLink>
        </div>
        <div className="mt-5 divide-y divide-[var(--border)]">
          {selectedWeekEntries.length === 0 ? (
            <p className="py-4 text-[var(--muted)]">No entries yet.</p>
          ) : (
            selectedWeekEntries.map((timeEntry) => (
              <article className="grid gap-2 py-4" key={timeEntry.id}>
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <h4 className="font-semibold">{timeEntry.taskDescription}</h4>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {timeEntry.productName} · {timeEntry.budgetName}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums">
                    {formatHours(Number(timeEntry.hoursWorked))} hrs
                  </p>
                </div>
                <p className="text-sm text-[var(--muted)]">
                  {timeEntry.entryDate} ·{" "}
                  {formatWeekLabel(timeEntry.weekNumber, getIsoWeekYear(timeEntry.entryDate))}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  );
}
