import { RecurringApplyForm } from "@/components/recurring/recurring-apply-form";
import { RecurringTemplateForm } from "@/components/recurring/recurring-template-form";
import { RecurringTemplateTable } from "@/components/recurring/recurring-template-table";
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

function getSelectedTemplateId(searchParams: Record<string, string | string[] | undefined>) {
  const templateId = getSearchParamValue(searchParams, "edit");

  return templateId || null;
}

function getAppliedCount(searchParams: Record<string, string | string[] | undefined>) {
  const appliedValue = Number(getSearchParamValue(searchParams, "applied"));

  return Number.isInteger(appliedValue) && appliedValue >= 0 ? appliedValue : null;
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
  const selectedWeekLabel = formatWeekLabel(selectedWeekNumber, selectedWeekYear);

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

      {appliedCount !== null ? (
        <div className="mb-6 border border-[var(--border)] bg-[var(--panel)] px-5 py-4 text-sm text-[var(--foreground)]">
          {appliedCount > 0
            ? `Applied ${appliedCount} recurring entr${appliedCount === 1 ? "y" : "ies"} for ${selectedWeekLabel}.`
            : `No new recurring entries were added for ${selectedWeekLabel}.`}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <RecurringTemplateForm
          action={
            selectedRecurringTemplate
              ? updateRecurringTemplateAction.bind(null, selectedRecurringTemplate.id)
              : createRecurringTemplateAction
          }
          recurringTemplate={selectedRecurringTemplate ?? undefined}
          submitLabel={selectedRecurringTemplate ? "Save changes" : "Add template"}
        />

        <RecurringApplyForm
          action={applyRecurringTemplatesAction}
          defaultWeekNumber={selectedWeekNumber}
          defaultWeekYear={selectedWeekYear}
        />
      </div>

      <section className="mt-8 border border-[var(--border)] bg-[var(--panel)] p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">Recurring templates</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Active templates are applied to the selected week. Inactive ones stay saved but do
              not generate rows.
            </p>
          </div>
        </div>
        <RecurringTemplateTable
          recurringTemplates={recurringTemplateRecords}
          toggleActiveAction={toggleRecurringTemplateActiveAction}
        />
      </section>
    </section>
  );
}
