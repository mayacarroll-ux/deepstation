import { CurrentWeekTimesheetDrawer } from "@/components/time-entries/current-week-timesheet-drawer";
import { TimeEntryWeekSelector } from "@/components/time-entries/time-entry-week-selector";
import { RecurringWorkflow } from "@/components/recurring/recurring-workflow";
import { WeeklyAllocationSection } from "@/components/time-entries/weekly-allocation-section";
import { TimeEntryFilters } from "@/components/time-entries/time-entry-filters";
import { TimeEntryTable } from "@/components/time-entries/time-entry-table";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import { getCurrentWorkbookOwnerId } from "@/lib/services/current-user";
import { getRecurringTemplate, listRecurringTemplates } from "@/lib/services/recurring";
import { getCurrentWeekTimesheetPreview } from "@/lib/services/current-week-timesheet";
import { getWeeklyAllocationPreview } from "@/lib/services/weekly-allocation";
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
import { formatHours } from "@/lib/utils/format";

import {
  generateCurrentWeekTimesheetAction,
  createWeeklyAllocationEntriesAction,
  deleteTimeEntryAction,
  makeRecurringTemplateAction
} from "./actions";
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

function buildWeekSelectionValue(weekNumber: number, weekYear: number) {
  return `${weekYear}-${String(weekNumber).padStart(2, "0")}`;
}

function parseWeekSelectionValue(weekSelectionValue: string) {
  const [weekYearValue, weekNumberValue] = weekSelectionValue.split("-");
  const weekYear = Number(weekYearValue);
  const weekNumber = Number(weekNumberValue);

  if (
    !Number.isInteger(weekYear) ||
    weekYear < 2000 ||
    weekYear > 2100 ||
    !Number.isInteger(weekNumber) ||
    weekNumber < 1 ||
    weekNumber > 53
  ) {
    return null;
  }

  return { weekNumber, weekYear };
}

function getSelectedWeekSelection(
  searchParams: Record<string, string | string[] | undefined>,
  fallbackWeekNumber: number,
  fallbackWeekYear: number
) {
  const selectedWeekSelectionValue = getSearchParamValue(searchParams, "weekSelection");

  if (selectedWeekSelectionValue) {
    const parsedWeekSelection = parseWeekSelectionValue(selectedWeekSelectionValue);

    if (parsedWeekSelection) {
      return parsedWeekSelection;
    }
  }

  const legacyWeekValue = Number(getSearchParamValue(searchParams, "week"));
  const legacyYearValue = Number(getSearchParamValue(searchParams, "year"));

  if (
    Number.isInteger(legacyWeekValue) &&
    legacyWeekValue >= 1 &&
    legacyWeekValue <= 53 &&
    Number.isInteger(legacyYearValue) &&
    legacyYearValue >= 2000 &&
    legacyYearValue <= 2100
  ) {
    return {
      weekNumber: legacyWeekValue,
      weekYear: legacyYearValue
    };
  }

  return {
    weekNumber: fallbackWeekNumber,
    weekYear: fallbackWeekYear
  };
}

function getFilters(searchParams: Record<string, string | string[] | undefined>) {
  return {
    productName: getSearchParamValue(searchParams, "product") || undefined,
    budgetName: getSearchParamValue(searchParams, "budget") || undefined,
    budgetNumber: getSearchParamValue(searchParams, "budgetNumber") || undefined,
    startDate: getSearchParamValue(searchParams, "from") || undefined,
    endDate: getSearchParamValue(searchParams, "to") || undefined
  } satisfies TimeEntryFilterValues;
}

function getAllocationWeekNumber(
  searchParams: Record<string, string | string[] | undefined>,
  fallbackWeekNumber: number
) {
  const allocationWeekValue = Number(getSearchParamValue(searchParams, "allocationWeek"));

  return Number.isInteger(allocationWeekValue) && allocationWeekValue >= 1 && allocationWeekValue <= 53
    ? allocationWeekValue
    : fallbackWeekNumber;
}

function getAllocationWeekYear(
  searchParams: Record<string, string | string[] | undefined>,
  fallbackWeekYear: number
) {
  const allocationWeekYearValue = Number(getSearchParamValue(searchParams, "allocationYear"));

  return Number.isInteger(allocationWeekYearValue) &&
    allocationWeekYearValue >= 2000 &&
    allocationWeekYearValue <= 2100
    ? allocationWeekYearValue
    : fallbackWeekYear;
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

function getHistoryMode(searchParams: Record<string, string | string[] | undefined>) {
  const historyValue = getSearchParamValue(searchParams, "history");

  return historyValue === "1" || historyValue === "true";
}

function buildTimeEntriesQueryParameters(
  searchParams: Record<string, string | string[] | undefined>
) {
  const queryParameters = new URLSearchParams();
  const excludedKeys = new Set([
    "recurringTemplateStatus",
    "recurringAdded",
    "recurringSkipped",
    "recurringWeek",
    "recurringYear",
    "recurringEdit",
    "allocationStatus",
    "allocationMessage",
    "allocationAdded",
    "allocationSkipped",
    "allocationWeek",
    "allocationYear",
    "currentWeekTimesheetStatus",
    "currentWeekTimesheetMessage",
    "currentWeekRecurringAdded",
    "currentWeekRecurringSkipped",
    "currentWeekAllocationAdded",
    "currentWeekAllocationSkipped",
    "currentWeekWeek",
    "currentWeekYear",
    "deleteStatus"
  ]);

  for (const [key, value] of Object.entries(searchParams)) {
    if (excludedKeys.has(key)) {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((queryValue) => {
        if (queryValue) {
          queryParameters.append(key, queryValue);
        }
      });
      continue;
    }

    if (value) {
      queryParameters.set(key, value);
    }
  }

  return queryParameters;
}

function buildTimeEntriesHref(
  searchParams: Record<string, string | string[] | undefined>,
  overrides: Record<string, string | undefined> = {}
) {
  const queryParameters = buildTimeEntriesQueryParameters(searchParams);

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      queryParameters.delete(key);
      continue;
    }

    queryParameters.set(key, value);
  }

  const queryString = queryParameters.toString();

  return queryString ? `/time-entries?${queryString}` : "/time-entries";
}

function buildTimeEntriesHiddenFields(
  searchParams: Record<string, string | string[] | undefined>,
  hiddenFieldNames: string[]
) {
  const queryParameters = buildTimeEntriesQueryParameters(searchParams);
  const hiddenFields: Record<string, string> = {};

  for (const hiddenFieldName of hiddenFieldNames) {
    const hiddenFieldValue = queryParameters.get(hiddenFieldName);

    if (hiddenFieldValue) {
      hiddenFields[hiddenFieldName] = hiddenFieldValue;
    }
  }

  return hiddenFields;
}

function getWeekOptions(timeEntryRecords: TimeEntryRecord[]) {
  const currentWeekNumber = getIsoWeekNumber(getTodayInputValue());
  const currentWeekYear = getIsoWeekYear(getTodayInputValue());
  const weekOptionsByValue = new Map<
    string,
    {
      label: string;
      value: string;
      weekNumber: number;
      weekYear: number;
    }
  >();

  for (const timeEntryRecord of timeEntryRecords) {
    const weekYear = getIsoWeekYear(timeEntryRecord.entryDate);
    const weekNumber = timeEntryRecord.weekNumber;
    const weekSelectionValue = buildWeekSelectionValue(weekNumber, weekYear);

    if (!weekOptionsByValue.has(weekSelectionValue)) {
      weekOptionsByValue.set(weekSelectionValue, {
        label: formatWeekLabel(weekNumber, weekYear),
        value: weekSelectionValue,
        weekNumber,
        weekYear
      });
    }
  }

  const currentWeekSelectionValue = buildWeekSelectionValue(currentWeekNumber, currentWeekYear);

  if (!weekOptionsByValue.has(currentWeekSelectionValue)) {
    weekOptionsByValue.set(currentWeekSelectionValue, {
      label: formatWeekLabel(currentWeekNumber, currentWeekYear),
      value: currentWeekSelectionValue,
      weekNumber: currentWeekNumber,
      weekYear: currentWeekYear
    });
  }

  return Array.from(weekOptionsByValue.values()).sort((firstOption, secondOption) => {
    if (firstOption.weekYear !== secondOption.weekYear) {
      return secondOption.weekYear - firstOption.weekYear;
    }

    return secondOption.weekNumber - firstOption.weekNumber;
  });
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

function getMakeRecurringStatusMessage(
  searchParams: Record<string, string | string[] | undefined>
) {
  const statusValue = getSearchParamValue(searchParams, "recurringTemplateStatus");

  if (statusValue === "created") {
    return "Recurring template created from the selected entry.";
  }

  if (statusValue === "existing") {
    return "This time entry is already linked to a recurring template.";
  }

  return null;
}

function getDeleteStatusMessage(searchParams: Record<string, string | string[] | undefined>) {
  const statusValue = getSearchParamValue(searchParams, "deleteStatus");

  if (statusValue === "deleted") {
    return "Time entry deleted";
  }

  return null;
}

function getAllocationStatusMessage(
  searchParams: Record<string, string | string[] | undefined>
) {
  const statusValue = getSearchParamValue(searchParams, "allocationStatus");
  const addedValue = Number(getSearchParamValue(searchParams, "allocationAdded"));
  const skippedValue = Number(getSearchParamValue(searchParams, "allocationSkipped"));
  const weekValue = Number(getSearchParamValue(searchParams, "allocationWeek"));
  const yearValue = Number(getSearchParamValue(searchParams, "allocationYear"));

  if (statusValue === "error") {
    return getSearchParamValue(searchParams, "allocationMessage") || "Allocation failed.";
  }

  if (
    !Number.isInteger(addedValue) ||
    !Number.isInteger(skippedValue) ||
    !Number.isInteger(weekValue) ||
    !Number.isInteger(yearValue)
  ) {
    return null;
  }

  const selectedWeekLabel = formatWeekLabel(weekValue, yearValue);

  if (statusValue === "duplicate") {
    return `Skipped duplicate allocation plan for ${selectedWeekLabel}.`;
  }

  if (statusValue === "created") {
    return `${addedValue} allocation entr${addedValue === 1 ? "y" : "ies"} added for ${selectedWeekLabel}.`;
  }

  return null;
}

function getCurrentWeekTimesheetStatusMessage(
  searchParams: Record<string, string | string[] | undefined>
) {
  const statusValue = getSearchParamValue(searchParams, "currentWeekTimesheetStatus");
  const recurringAddedValue = Number(getSearchParamValue(searchParams, "currentWeekRecurringAdded"));
  const recurringSkippedValue = Number(
    getSearchParamValue(searchParams, "currentWeekRecurringSkipped")
  );
  const allocationAddedValue = Number(
    getSearchParamValue(searchParams, "currentWeekAllocationAdded")
  );
  const allocationSkippedValue = Number(
    getSearchParamValue(searchParams, "currentWeekAllocationSkipped")
  );
  const weekValue = Number(getSearchParamValue(searchParams, "currentWeekWeek"));
  const yearValue = Number(getSearchParamValue(searchParams, "currentWeekYear"));

  if (statusValue === "error") {
    return getSearchParamValue(searchParams, "currentWeekTimesheetMessage") || "Timesheet generation failed.";
  }

  if (
    !Number.isInteger(recurringAddedValue) ||
    !Number.isInteger(recurringSkippedValue) ||
    !Number.isInteger(allocationAddedValue) ||
    !Number.isInteger(allocationSkippedValue) ||
    !Number.isInteger(weekValue) ||
    !Number.isInteger(yearValue)
  ) {
    return null;
  }

  const selectedWeekLabel = formatWeekLabel(weekValue, yearValue);
  const recurringSummary = `${recurringAddedValue} recurring entr${
    recurringAddedValue === 1 ? "y" : "ies"
  }`;
  const allocationSummary = `${allocationAddedValue} allocation entr${
    allocationAddedValue === 1 ? "y" : "ies"
  }`;
  const skippedSummary =
    recurringSkippedValue + allocationSkippedValue > 0
      ? `, skipped ${recurringSkippedValue + allocationSkippedValue} duplicate${
          recurringSkippedValue + allocationSkippedValue === 1 ? "" : "s"
        }`
      : "";

  if (statusValue === "duplicate") {
    return `Selected week timesheet already matched this review plan for ${selectedWeekLabel}.`;
  }

  if (statusValue === "created") {
    return `Generated ${recurringSummary} and ${allocationSummary}${skippedSummary} for ${selectedWeekLabel}.`;
  }

  return null;
}

function buildAllocationHiddenFields(
  searchParams: Record<string, string | string[] | undefined>
) {
  const hiddenFields: Record<string, string> = {};
  const excludedKeys = new Set([
    "recurringTemplateStatus",
    "recurringAdded",
    "recurringSkipped",
    "recurringWeek",
    "recurringYear",
    "recurringEdit",
    "allocationWeek",
    "allocationYear",
    "allocationStatus",
    "allocationMessage",
    "allocationAdded",
    "allocationSkipped",
    "currentWeekTimesheetStatus",
    "currentWeekTimesheetMessage",
    "currentWeekRecurringAdded",
    "currentWeekRecurringSkipped",
    "currentWeekAllocationAdded",
    "currentWeekAllocationSkipped",
    "currentWeekWeek",
    "currentWeekYear",
    "deleteStatus"
  ]);

  for (const [key, value] of Object.entries(searchParams)) {
    if (excludedKeys.has(key)) {
      continue;
    }

    if (Array.isArray(value)) {
      if (value[0]) {
        hiddenFields[key] = value[0];
      }
      continue;
    }

    if (value) {
      hiddenFields[key] = value;
    }
  }

  return hiddenFields;
}

function getNextIsoWeekNumberAndYear() {
  const nextWeekDate = new Date(`${getTodayInputValue()}T00:00:00.000Z`);
  nextWeekDate.setUTCDate(nextWeekDate.getUTCDate() + 7);
  const nextWeekInputValue = nextWeekDate.toISOString().slice(0, 10);

  return {
    weekNumber: getIsoWeekNumber(nextWeekInputValue),
    weekYear: getIsoWeekYear(nextWeekInputValue)
  };
}

export default async function TimeEntriesPage({ searchParams }: TimeEntriesPageProps) {
  const resolvedSearchParams = await searchParams;
  const ownerId = await getCurrentWorkbookOwnerId();
  const filters = getFilters(resolvedSearchParams);
  const historyMode = getHistoryMode(resolvedSearchParams);
  const recurringTemplateId = getRecurringTemplateId(resolvedSearchParams);
  const defaultWeekNumber = getIsoWeekNumber(getTodayInputValue());
  const defaultWeekYear = getIsoWeekYear(getTodayInputValue());
  const allocationHiddenFields = buildAllocationHiddenFields(resolvedSearchParams);
  const nextWeek = getNextIsoWeekNumberAndYear();
  const requestedRecurringWeekNumber = Number(
    getSearchParamValue(resolvedSearchParams, "recurringWeek")
  );
  const requestedRecurringWeekYear = Number(
    getSearchParamValue(resolvedSearchParams, "recurringYear")
  );
  const [allTimeEntryRecords, budgetMappingRecords] = await Promise.all([
    listTimeEntries(ownerId),
    listBudgetMappings(ownerId)
  ]);
  const latestTimeEntryRecord = allTimeEntryRecords[0];
  const fallbackWeekNumber = latestTimeEntryRecord
    ? latestTimeEntryRecord.weekNumber
    : defaultWeekNumber;
  const fallbackWeekYear = latestTimeEntryRecord
    ? getIsoWeekYear(latestTimeEntryRecord.entryDate)
    : defaultWeekYear;
  const selectedWeek = getSelectedWeekSelection(
    resolvedSearchParams,
    fallbackWeekNumber,
    fallbackWeekYear
  );
  const selectedWeekSelectionValue = buildWeekSelectionValue(
    selectedWeek.weekNumber,
    selectedWeek.weekYear
  );
  const weekOptions = getWeekOptions(allTimeEntryRecords);
  const historyHref = buildTimeEntriesHref(resolvedSearchParams, {
    history: historyMode ? undefined : "1",
    weekSelection: selectedWeekSelectionValue
  });
  const weekSelectorHiddenFields = {
    ...buildTimeEntriesHiddenFields(resolvedSearchParams, ["product", "budget", "budgetNumber", "from", "to"]),
    ...(historyMode ? { history: "1" } : {})
  };
  const filterHiddenFields = {
    ...buildTimeEntriesHiddenFields(resolvedSearchParams, ["history"]),
    weekSelection: selectedWeekSelectionValue
  };
  const allocationWeekNumber = getAllocationWeekNumber(resolvedSearchParams, selectedWeek.weekNumber);
  const allocationWeekYear = getAllocationWeekYear(resolvedSearchParams, selectedWeek.weekYear);
  const currentWeekTimesheetPreview = await getCurrentWeekTimesheetPreview(
    ownerId,
    selectedWeek.weekNumber,
    selectedWeek.weekYear
  );
  const selectedWeekTimeEntryRecordsPromise = listTimeEntries(ownerId, {
    ...filters,
    weekNumber: selectedWeek.weekNumber,
    weekYear: selectedWeek.weekYear
  });
  const timeEntryRecordsPromise = historyMode
    ? listTimeEntries(ownerId, filters)
    : selectedWeekTimeEntryRecordsPromise;
  const [selectedWeekTimeEntryRecords, timeEntryRecords, recurringTemplateRecords, selectedRecurringTemplate, allocationPreview] =
    await Promise.all([
      selectedWeekTimeEntryRecordsPromise,
      timeEntryRecordsPromise,
      listRecurringTemplates(ownerId),
      recurringTemplateId ? getRecurringTemplate(ownerId, recurringTemplateId) : Promise.resolve(null),
      getWeeklyAllocationPreview(ownerId, allocationWeekNumber, allocationWeekYear)
    ]);
  const filterOptions = getFilterOptions(budgetMappingRecords, allTimeEntryRecords);
  const recurringStatusMessage = getRecurringStatusMessage(resolvedSearchParams);
  const allocationStatusMessage = getAllocationStatusMessage(resolvedSearchParams);
  const currentWeekTimesheetStatusMessage = getCurrentWeekTimesheetStatusMessage(
    resolvedSearchParams
  );
  const makeRecurringStatusMessage = getMakeRecurringStatusMessage(resolvedSearchParams);
  const deleteStatusMessage = getDeleteStatusMessage(resolvedSearchParams);
  const allocationWeekLabel = formatWeekLabel(allocationWeekNumber, allocationWeekYear);
  const selectedWeekLabel = formatWeekLabel(selectedWeek.weekNumber, selectedWeek.weekYear);
  const selectedWeekTotalHours = selectedWeekTimeEntryRecords.reduce(
    (totalHours, timeEntry) => totalHours + Number(timeEntry.hoursWorked),
    0
  );
  const selectedWeekEntryCount = selectedWeekTimeEntryRecords.length;
  const selectedWeekReturnToPath = buildTimeEntriesHref(resolvedSearchParams, {
    weekSelection: selectedWeekSelectionValue
  });
  const recurringTemplateSourceTimeEntryIds = recurringTemplateRecords
    .map((recurringTemplate) => recurringTemplate.sourceTimeEntryId)
    .filter((sourceTimeEntryId): sourceTimeEntryId is string => Boolean(sourceTimeEntryId));

  return (
    <section className="py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Time entries</h2>
          <p className="mt-2 text-[var(--muted)]">
            Search, edit, and delete the rows that replace the spreadsheet.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CurrentWeekTimesheetDrawer
            action={generateCurrentWeekTimesheetAction}
            preview={currentWeekTimesheetPreview}
            returnToPath={selectedWeekReturnToPath}
            statusMessage={currentWeekTimesheetStatusMessage}
          />
          <ButtonLink href="/time-entries/new">New time entry</ButtonLink>
        </div>
      </div>
      <div className="mb-6 grid gap-4">
        <TimeEntryWeekSelector
          hiddenFields={weekSelectorHiddenFields}
          historyHref={historyHref}
          isHistoryMode={historyMode}
          selectedWeekValue={selectedWeekSelectionValue}
          weekOptions={weekOptions}
        />
        <Card>
          <CardContent className="flex flex-wrap items-end justify-between gap-4 p-5">
            <div className="grid gap-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                Selected week
              </p>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">{selectedWeekLabel}</h3>
              <p className="text-sm text-[var(--muted)]">
                {selectedWeekEntryCount}{" "}
                {selectedWeekEntryCount === 1 ? "entry" : "entries"} in view
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-semibold tabular-nums text-[var(--foreground)]">
                {formatHours(selectedWeekTotalHours)} hrs
              </p>
              <p className="text-xs text-[var(--muted)]">Hours in selected week</p>
            </div>
          </CardContent>
        </Card>
      </div>
      {deleteStatusMessage ? <Toast clearQueryParam="deleteStatus" message={deleteStatusMessage} /> : null}
      <div className="grid gap-6">
        <div className="grid min-w-0 gap-6">
          <TimeEntryFilters
            filterOptions={filterOptions}
            filters={filters}
            hiddenFields={filterHiddenFields}
          />
            <TimeEntryTable
            deleteAction={deleteTimeEntryAction}
            makeRecurringAction={makeRecurringTemplateAction}
            recurringTemplateSourceTimeEntryIds={recurringTemplateSourceTimeEntryIds}
            returnToPath={selectedWeekReturnToPath}
            timeEntries={timeEntryRecords}
          />
          {makeRecurringStatusMessage ? (
            <div className="border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--foreground)]">
              {makeRecurringStatusMessage}
            </div>
          ) : null}
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
            nextWeekNumber={nextWeek.weekNumber}
            nextWeekYear={nextWeek.weekYear}
          />
          <WeeklyAllocationSection
            action={createWeeklyAllocationEntriesAction}
            allocationHiddenFields={allocationHiddenFields}
            budgetMappings={budgetMappingRecords}
            existingHours={allocationPreview.existingHours}
            remainingHours={allocationPreview.remainingHours}
            returnToPath={selectedWeekReturnToPath}
            selectedWeekLabel={allocationWeekLabel}
            selectedWeekNumber={allocationWeekNumber}
            selectedWeekYear={allocationWeekYear}
            statusMessage={allocationStatusMessage}
          />
        </div>
      </div>
    </section>
  );
}
