import { ButtonLink } from "@/components/ui/button";
import { TimeEntryFilters } from "@/components/time-entries/time-entry-filters";
import { TimeEntryTable } from "@/components/time-entries/time-entry-table";
import { getCurrentWorkbookOwnerId } from "@/lib/services/current-user";
import { listTimeEntries, type TimeEntryFilters as TimeEntryFilterValues } from "@/lib/services/time-tracking";

import { deleteTimeEntryAction } from "./actions";

type TimeEntriesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchParamValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
}

function getFilters(searchParams: Record<string, string | string[] | undefined>) {
  const weekValue = getSearchParamValue(searchParams, "week");

  return {
    weekNumber: weekValue ? Number(weekValue) : undefined,
    productName: getSearchParamValue(searchParams, "product") || undefined,
    budgetName: getSearchParamValue(searchParams, "budget") || undefined,
    budgetNumber: getSearchParamValue(searchParams, "budgetNumber") || undefined,
    startDate: getSearchParamValue(searchParams, "from") || undefined,
    endDate: getSearchParamValue(searchParams, "to") || undefined
  } satisfies TimeEntryFilterValues;
}

export default async function TimeEntriesPage({ searchParams }: TimeEntriesPageProps) {
  const resolvedSearchParams = await searchParams;
  const ownerId = await getCurrentWorkbookOwnerId();
  const filters = getFilters(resolvedSearchParams);
  const timeEntryRecords = await listTimeEntries(ownerId, filters);

  return (
    <section className="py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Time entries</h2>
          <p className="mt-2 text-[var(--muted)]">
            Search, edit, and delete the rows that replace the spreadsheet.
          </p>
        </div>
        <ButtonLink href="/time-entries/new">New time entry</ButtonLink>
      </div>
      <div className="grid gap-6">
        <TimeEntryFilters filters={filters} />
        <TimeEntryTable deleteAction={deleteTimeEntryAction} timeEntries={timeEntryRecords} />
      </div>
    </section>
  );
}
