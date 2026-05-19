import { WeeklyHoursPieChart } from "@/components/dashboard/weekly-hours-pie-chart";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentWorkbookOwnerId } from "@/lib/services/current-user";
import { getDashboardStats, getWeeklySummaryForYear } from "@/lib/services/time-tracking";
import { formatHours } from "@/lib/utils/format";

export default async function DashboardPage() {
  const ownerId = await getCurrentWorkbookOwnerId();
  const dashboardStats = await getDashboardStats(ownerId);
  const weeklySummary = await getWeeklySummaryForYear(
    ownerId,
    dashboardStats.currentWeekNumber,
    dashboardStats.currentWeekYear
  );

  return (
    <section className="py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Dashboard</h2>
          <p className="mt-2 text-[var(--muted)]">
            Current week totals and the latest workbook entries.
          </p>
        </div>
        <ButtonLink href="/time-entries/new">New time entry</ButtonLink>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="border border-[var(--border)] bg-[var(--panel)] p-5">
          <p className="text-sm text-[var(--muted)]">Current week</p>
          <p className="mt-3 text-3xl font-semibold">{dashboardStats.currentWeekNumber}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{dashboardStats.currentWeekYear}</p>
        </article>
        <article className="border border-[var(--border)] bg-[var(--panel)] p-5">
          <p className="text-sm text-[var(--muted)]">Week total</p>
          <p className="mt-3 text-3xl font-semibold">
            {formatHours(dashboardStats.currentWeekTotalHours)} hrs
          </p>
        </article>
        <article className="border border-[var(--border)] bg-[var(--panel)] p-5">
          <p className="text-sm text-[var(--muted)]">Recent entries</p>
          <p className="mt-3 text-3xl font-semibold">
            {dashboardStats.recentEntries.length}
          </p>
        </article>
      </div>

      <WeeklyHoursPieChart
        groupedHours={weeklySummary.groupedHours}
        totalHours={weeklySummary.totalHours}
        weekNumber={dashboardStats.currentWeekNumber}
        weekYear={dashboardStats.currentWeekYear}
      />

      <section className="mt-8 border border-[var(--border)] bg-[var(--panel)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">Recent entries</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              The latest saved rows from your time tracking workbook.
            </p>
          </div>
          <ButtonLink href="/time-entries" variant="secondary">
            View all
          </ButtonLink>
        </div>
        <div className="mt-5 divide-y divide-[var(--border)]">
          {dashboardStats.recentEntries.length === 0 ? (
            <p className="py-4 text-[var(--muted)]">No entries yet.</p>
          ) : (
            dashboardStats.recentEntries.map((timeEntry) => (
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
                  {timeEntry.entryDate} · Week {timeEntry.weekNumber}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  );
}
