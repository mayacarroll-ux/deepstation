import { RecurringWorkflow } from "@/components/recurring/recurring-workflow";
import { TimeEntryFilters } from "@/components/time-entries/time-entry-filters";
import { TimeEntryTable } from "@/components/time-entries/time-entry-table";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentWorkbookOwnerId } from "@/lib/services/current-user";
import {
  getRecurringTemplate,
  listRecurringTemplates
} from "@/lib/services/recurring";
import {
  listBudgetMappings,
  listTimeEntries,
  type BudgetMappingRecord,
  type TimeEntryFilters as TimeEntryFilterValues,
  type TimeEntryRecord
} from "@/lib/services/time-tracking";
import {
  formatWeekLabel,
  getIsoWeekNumber,
  getIsoWeekYear,
  getTodayInputValue
} from "@/lib/utils/dates";

import { deleteTimeEntryAction } from "./actions";
import {
  applyRecurringTemplatesAction,
  createRecurringTemplateAction,
  toggleRecurringTemplateActiveAction,
  updateRecurringTemplateAction
} from "../recurring/actions";

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

function getSortedUniqueValues(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))
  ).sort((firstValue, secondValue) => firstValue.localeCompare(secondValue));
}

function getFilterOptions(
  budgetMappingRecords: BudgetMappingRecord[],
  allTimeEntryRecords: TimeEntryRecord[]
) {
  return {
    productNames: getSortedUniqueValues([
      ...budgetMappingRecords.map((budgetMapping) => budgetMapping.productName),
      ...allTimeEntryRecords.map((timeEntry) => timeEntry.productName)
    ]),
    budgetNames: getSortedUniqueValues([
      ...budgetMappingRecords.map((budgetMapping) => budgetMapping.budgetName),
      ...allTimeEntryRecords.map((timeEntry) => timeEntry.budgetName)
    ]),
    budgetNumbers: getSortedUniqueValues([
      ...budgetMappingRecords.map((budgetMapping) => budgetMapping.budgetNumber),
      ...allTimeEntryRecords.map((timeEntry) => timeEntry.budgetNumber)
    ])
  };
}

function getRecurringTemplateId(searchParams: Record<string, string | string[] | undefined>) {
  const recurringEditValue = getSearchParamValue(searchParams, "recurringEdit");

  return recurringEditValue || null;
}

function getRecurringStatusMessage(searchParams: Record<string, string | string[] | undefined>) {
  const appliedValue = Number(getSearchParamValue(searchParams, "recurringAdded"));
  const skippedValue = Number(getSearchParamValue(searchParams, "recurringSkipped"));
  const weekValue = Number(getSearchParamValue(searchParams, "recurringWeek"));
  const yearValue = Number(getSearchParamValue(searchParams, "recurringYear"));

  if (
    !Number.isInteger(appliedValue) ||
    !Number.isInteger(skippedValue) ||
    !Number.isInteger(weekValue) ||
    !Number.isInteger(yearValue)
  ) {
    return null;
  }

  const selectedWeekLabel = formatWeekLabel(weekValue, yearValue);
  const appliedSummary =
    appliedValue > 0
      ? `Added ${appliedValue} recurring entr${appliedValue === 1 ? "y" : "ies"}`
      : `No new recurring entries were added`;
  const skippedSummary =
    skippedValue > 0
      ? `, skipped ${skippedValue} duplicate${skippedValue === 1 ? "" : "s"}`
      : "";

  return `${appliedSummary}${skippedSummary} for ${selectedWeekLabel}.`;
}

export default async function TimeEntriesPage({ searchParams }: TimeEntriesPageProps) {
  const resolvedSearchParams = await searchParams;
  const ownerId = await getCurrentWorkbookOwnerId();
  const filters = getFilters(resolvedSearchParams);
  const recurringTemplateId = getRecurringTemplateId(resolvedSearchParams);
  const defaultWeekNumber = getIsoWeekNumber(getTodayInputValue());
  const defaultWeekYear = getIsoWeekYear(getTodayInputValue());
  const requestedRecurringWeekNumber = Number(
    getSearchParamValue(resolvedSearchParams, "recurringWeek")
  );
  const requestedRecurringWeekYear = Number(
    getSearchParamValue(resolvedSearchParams, "recurringYear")
  );
  const [timeEntryRecords, allTimeEntryRecords, budgetMappingRecords] = await Promise.all([
    listTimeEntries(ownerId, filters),
    listTimeEntries(ownerId),
    listBudgetMappings(ownerId)
  ]);
  const [recurringTemplateRecords, selectedRecurringTemplate] = await Promise.all([
    listRecurringTemplates(ownerId),
    recurringTemplateId ? getRecurringTemplate(ownerId, recurringTemplateId) : Promise.resolve(null)
  ]);
  const filterOptions = getFilterOptions(budgetMappingRecords, allTimeEntryRecords);
  const recurringStatusMessage = getRecurringStatusMessage(resolvedSearchParams);

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
        <RecurringWorkflow
          applyRecurringTemplatesAction={applyRecurringTemplatesAction}
          basePath="/time-entries"
          createRecurringTemplateAction={createRecurringTemplateAction}
          defaultWeekNumber={
            Number.isInteger(requestedRecurringWeekNumber) &&
            requestedRecurringWeekNumber >= 1 &&
            requestedRecurringWeekNumber <= 53
              ? requestedRecurringWeekNumber
              : defaultWeekNumber
          }
          defaultWeekYear={
            Number.isInteger(requestedRecurringWeekYear) &&
            requestedRecurringWeekYear >= 2000 &&
            requestedRecurringWeekYear <= 2100
              ? requestedRecurringWeekYear
              : defaultWeekYear
          }
          recurringTemplates={recurringTemplateRecords}
          selectedRecurringTemplate={selectedRecurringTemplate}
          statusMessage={recurringStatusMessage}
          toggleRecurringTemplateActiveAction={toggleRecurringTemplateActiveAction}
          updateRecurringTemplateAction={updateRecurringTemplateAction}
        />
        <TimeEntryFilters filterOptions={filterOptions} filters={filters} />
        <TimeEntryTable deleteAction={deleteTimeEntryAction} timeEntries={timeEntryRecords} />
      </div>
    </section>
  );
}
