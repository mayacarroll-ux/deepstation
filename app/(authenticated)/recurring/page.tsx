import { RecurringWorkflow } from "@/components/recurring/recurring-workflow";
import { getCurrentWorkbookOwnerId } from "@/lib/services/current-user";
import {
  getRecurringTemplate,
  listRecurringTemplates
} from "@/lib/services/recurring";
import { formatWeekLabel, getIsoWeekNumber, getIsoWeekYear, getTodayInputValue } from "@/lib/utils/dates";

import {
  applyRecurringTemplatesAction,
  createRecurringTemplateAction,
  toggleRecurringTemplateActiveAction,
  updateRecurringTemplateAction
} from "./actions";

type RecurringPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchParamValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
}

function getFirstSearchParamValue(
  searchParams: Record<string, string | string[] | undefined>,
  keys: string[]
) {
  for (const key of keys) {
    const value = getSearchParamValue(searchParams, key);

    if (value) {
      return value;
    }
  }

  return undefined;
}

function getRequestedWeekNumber(searchParams: Record<string, string | string[] | undefined>) {
  const weekValue = getFirstSearchParamValue(searchParams, ["recurringWeek", "week"]);
  const weekNumber = Number(weekValue);

  return Number.isInteger(weekNumber) && weekNumber >= 1 && weekNumber <= 53 ? weekNumber : null;
}

function getRequestedWeekYear(searchParams: Record<string, string | string[] | undefined>) {
  const yearValue = getFirstSearchParamValue(searchParams, ["recurringYear", "year"]);
  const weekYear = Number(yearValue);

  return Number.isInteger(weekYear) && weekYear >= 2000 && weekYear <= 2100 ? weekYear : null;
}

function getSelectedTemplateId(searchParams: Record<string, string | string[] | undefined>) {
  const templateId = getSearchParamValue(searchParams, "recurringEdit");

  return templateId || null;
}

function getAppliedCount(searchParams: Record<string, string | string[] | undefined>) {
  const appliedValue = Number(
    getFirstSearchParamValue(searchParams, ["recurringAdded", "applied"])
  );

  return Number.isInteger(appliedValue) && appliedValue >= 0 ? appliedValue : null;
}

function getSkippedCount(searchParams: Record<string, string | string[] | undefined>) {
  const skippedValue = Number(
    getFirstSearchParamValue(searchParams, ["recurringSkipped", "skipped"])
  );

  return Number.isInteger(skippedValue) && skippedValue >= 0 ? skippedValue : null;
}

export default async function RecurringPage({ searchParams }: RecurringPageProps) {
  const resolvedSearchParams = await searchParams;
  const ownerId = await getCurrentWorkbookOwnerId();
  const recurringTemplateRecords = await listRecurringTemplates(ownerId);
  const editTemplateId = getSelectedTemplateId(resolvedSearchParams);
  const selectedRecurringTemplate = editTemplateId
    ? await getRecurringTemplate(ownerId, editTemplateId)
    : null;
  const todayInputValue = getTodayInputValue();
  const selectedWeekNumber =
    getRequestedWeekNumber(resolvedSearchParams) ?? getIsoWeekNumber(todayInputValue);
  const selectedWeekYear =
    getRequestedWeekYear(resolvedSearchParams) ?? getIsoWeekYear(todayInputValue);
  const appliedCount = getAppliedCount(resolvedSearchParams);
  const skippedCount = getSkippedCount(resolvedSearchParams);
  const selectedWeekLabel = formatWeekLabel(selectedWeekNumber, selectedWeekYear);
  const statusMessage =
    appliedCount !== null && skippedCount !== null
      ? `${appliedCount > 0 ? `Added ${appliedCount} recurring entr${appliedCount === 1 ? "y" : "ies"}` : "No new recurring entries were added"}${
          skippedCount > 0 ? `, skipped ${skippedCount} duplicate${skippedCount === 1 ? "" : "s"}` : ""
        } for ${selectedWeekLabel}.`
      : null;

  return (
    <section className="py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Recurring entries</h2>
          <p className="mt-2 max-w-3xl text-[var(--muted)]">
            Define weekly templates once, then apply them to any selected ISO week. Generated rows
            are normal time entries and can still be edited.
          </p>
        </div>
      </div>

      <RecurringWorkflow
        applyRecurringTemplatesAction={applyRecurringTemplatesAction}
        basePath="/recurring"
        createRecurringTemplateAction={createRecurringTemplateAction}
        defaultWeekNumber={selectedWeekNumber}
        defaultWeekYear={selectedWeekYear}
        recurringTemplates={recurringTemplateRecords}
        selectedRecurringTemplate={selectedRecurringTemplate}
        statusMessage={statusMessage}
        toggleRecurringTemplateActiveAction={toggleRecurringTemplateActiveAction}
        updateRecurringTemplateAction={updateRecurringTemplateAction}
      />
    </section>
  );
}
