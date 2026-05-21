import { Button } from "@/components/ui/button";
import { WorkdayCopyButton } from "@/components/workday/workday-copy-button";
import { WorkdayTimeEntryRow } from "@/components/workday/workday-time-entry-row";
import { getCurrentWorkbookOwnerId } from "@/lib/services/current-user";
import { getWorkdayWeek, workdayTimeType } from "@/lib/services/workday";
import { getIsoWeekNumber, getIsoWeekYear, getTodayInputValue } from "@/lib/utils/dates";
import { formatHours, formatHourUnit } from "@/lib/utils/format";

import {
  setWorkdayDayEnteredAction,
  setWorkdayWeekEnteredAction,
  updateWorkdayTimeEntryAction
} from "./actions";

type WorkdayPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchParamValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
}

function getSelectedWeek(searchParams: Record<string, string | string[] | undefined>) {
  const todayInputValue = getTodayInputValue();
  const requestedWeekNumber = Number(getSearchParamValue(searchParams, "week"));
  const requestedWeekYear = Number(getSearchParamValue(searchParams, "year"));

  return {
    weekNumber:
      Number.isInteger(requestedWeekNumber) && requestedWeekNumber >= 1 && requestedWeekNumber <= 53
        ? requestedWeekNumber
        : getIsoWeekNumber(todayInputValue),
    weekYear:
      Number.isInteger(requestedWeekYear) && requestedWeekYear >= 2000 && requestedWeekYear <= 2100
        ? requestedWeekYear
        : getIsoWeekYear(todayInputValue)
  };
}

function formatWorkdayDate(dateInputValue: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${dateInputValue}T00:00:00.000Z`));
}

function formatWorkdayHours(hours: number) {
  return `${formatHours(hours)} ${formatHourUnit(hours)}`;
}

function buildReturnToPath(searchParams: Record<string, string | string[] | undefined>) {
  const urlSearchParameters = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "workdayEntryMessage" || key === "workdayEntryStatus") {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((queryValue) => {
        if (queryValue) {
          urlSearchParameters.append(key, queryValue);
        }
      });
      continue;
    }

    if (value) {
      urlSearchParameters.set(key, value);
    }
  }

  const queryString = urlSearchParameters.toString();

  return queryString ? `/workday?${queryString}` : "/workday";
}

function getWorkdayEntryStatusMessage(
  searchParams: Record<string, string | string[] | undefined>
) {
  const message = getSearchParamValue(searchParams, "workdayEntryMessage");

  return message || null;
}

export default async function WorkdayPage({ searchParams }: WorkdayPageProps) {
  const resolvedSearchParams = await searchParams;
  const ownerId = await getCurrentWorkbookOwnerId();
  const selectedWeek = getSelectedWeek(resolvedSearchParams);
  const returnToPath = buildReturnToPath(resolvedSearchParams);
  const workdayWeek = await getWorkdayWeek(
    ownerId,
    selectedWeek.weekNumber,
    selectedWeek.weekYear
  );
  const daysWithHours = workdayWeek.days.filter((day) => day.totalHours > 0);
  const enteredDaysWithHours = daysWithHours.filter((day) => day.isEntered);
  const hasUnenteredDays = enteredDaysWithHours.length < daysWithHours.length;
  const workdayEntryStatusMessage = getWorkdayEntryStatusMessage(resolvedSearchParams);

  return (
    <section className="py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Workday</h2>
          <p className="mt-2 max-w-3xl text-[var(--muted)]">
            Manual Workday entry assistant. No Workday credentials are stored and no Workday login
            is automated.
          </p>
        </div>
        <form className="grid gap-3 border border-[var(--border)] bg-[var(--panel)] p-4 sm:grid-cols-[8rem_8rem_auto] sm:items-end">
          <label className="grid gap-2 text-sm font-semibold">
            Year
            <input
              className="h-10 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
              defaultValue={workdayWeek.weekYear}
              max="2100"
              min="2000"
              name="year"
              type="number"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Week
            <input
              className="h-10 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
              defaultValue={workdayWeek.weekNumber}
              max="53"
              min="1"
              name="week"
              type="number"
            />
          </label>
          <Button className="h-10 px-4 !text-neutral-950" type="submit">
            View
          </Button>
        </form>
      </div>

      <div className="grid gap-6">
        {workdayEntryStatusMessage ? (
          <div className="border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--foreground)]">
            {workdayEntryStatusMessage}
          </div>
        ) : null}
        <section className="border border-[var(--border)] bg-[var(--panel)] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-[var(--muted)]">{workdayWeek.weekLabel}</p>
              <h3 className="mt-1 text-xl font-semibold">Weekly reconciliation</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Workday time type:{" "}
                <span className="font-semibold text-[var(--foreground)]">{workdayTimeType}</span>
              </p>
              {!workdayWeek.statusStorageReady ? (
                <p className="mt-3 max-w-2xl text-sm text-[var(--warning)]">
                  Workday status tables are not available yet. The week still renders, but marked
                  entered controls stay read-only until the Neon migration is applied.
                </p>
              ) : null}
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm text-[var(--muted)]">Weekly total</p>
              <p className="text-3xl font-semibold">{formatWorkdayHours(workdayWeek.totalHours)}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {workdayWeek.days.map((day) => (
              <div className="border border-[var(--border)] bg-[var(--surface)] p-4" key={day.date}>
                <p className="text-sm font-semibold">{formatWorkdayDate(day.date)}</p>
                <p className="mt-2 text-2xl font-semibold">{formatWorkdayHours(day.totalHours)}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {day.isEntered ? "Marked entered" : "Not entered"}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
            <p className="text-sm text-[var(--muted)]">
              {enteredDaysWithHours.length} of {daysWithHours.length} days with hours marked entered.
              {workdayWeek.isEntered && hasUnenteredDays
                ? " Week is marked entered, but some days with hours are not."
                : ""}
            </p>
            {workdayWeek.statusStorageReady ? (
              <form action={setWorkdayWeekEnteredAction}>
                <input name="weekNumber" type="hidden" value={workdayWeek.weekNumber} />
                <input name="weekYear" type="hidden" value={workdayWeek.weekYear} />
                <input
                  name="isEntered"
                  type="hidden"
                  value={workdayWeek.isEntered ? "false" : "true"}
                />
                <Button type="submit" variant={workdayWeek.isEntered ? "secondary" : "primary"}>
                  {workdayWeek.isEntered ? "Unmark week" : "Mark week entered"}
                </Button>
              </form>
            ) : null}
          </div>
        </section>

        <div className="grid gap-4">
          {workdayWeek.days.map((day) => (
            <article className="border border-[var(--border)] bg-[var(--panel)] p-5" key={day.date}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-[var(--muted)]">{formatWorkdayDate(day.date)}</p>
                  <h3 className="mt-1 text-xl font-semibold">{formatWorkdayHours(day.totalHours)}</h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Time type:{" "}
                    <span className="font-semibold text-[var(--foreground)]">{workdayTimeType}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <WorkdayCopyButton commentText={day.commentText} />
                  {workdayWeek.statusStorageReady ? (
                    <form action={setWorkdayDayEnteredAction}>
                      <input name="entryDate" type="hidden" value={day.date} />
                      <input
                        name="isEntered"
                        type="hidden"
                        value={day.isEntered ? "false" : "true"}
                      />
                      <Button type="submit" variant={day.isEntered ? "secondary" : "primary"}>
                        {day.isEntered ? "Unmark day" : "Mark entered"}
                      </Button>
                    </form>
                  ) : null}
                </div>
              </div>

              {day.entries.length > 0 ? (
                <div className="mt-5 grid gap-3">
                  {day.entries.map((timeEntry) => (
                    <WorkdayTimeEntryRow
                      entry={timeEntry}
                      key={timeEntry.id}
                      returnToPath={returnToPath}
                      updateAction={updateWorkdayTimeEntryAction}
                    />
                  ))}
                </div>
              ) : (
                <p className="mt-5 border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
                  No app time entries for this day.
                </p>
              )}

              {day.commentText ? (
                <div className="mt-5 border border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                    Workday-ready comment
                  </p>
                  <p className="mt-2 text-sm leading-6">{day.commentText}</p>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
