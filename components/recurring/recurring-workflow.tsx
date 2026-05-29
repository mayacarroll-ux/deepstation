import { RecurringApplyForm } from "@/components/recurring/recurring-apply-form";
import { RecurringTemplateForm } from "@/components/recurring/recurring-template-form";
import { RecurringTemplateTable } from "@/components/recurring/recurring-template-table";
import type { RecurringTemplateRecord } from "@/lib/types/recurring";

type RecurringWorkflowProps = {
  applyRecurringTemplatesAction: (formData: FormData) => Promise<void>;
  basePath: string;
  createRecurringTemplateAction: (formData: FormData) => Promise<void>;
  defaultWeekNumber: number;
  defaultWeekYear: number;
  nextWeekNumber: number;
  nextWeekYear: number;
  recurringTemplates: RecurringTemplateRecord[];
  selectedRecurringTemplate?: RecurringTemplateRecord | null;
  statusMessage: string | null;
  toggleRecurringTemplateActiveAction: (templateId: string, formData: FormData) => Promise<void>;
  updateRecurringTemplateAction: (templateId: string, formData: FormData) => Promise<void>;
};

export function RecurringWorkflow({
  applyRecurringTemplatesAction,
  basePath,
  createRecurringTemplateAction,
  defaultWeekNumber,
  defaultWeekYear,
  nextWeekNumber,
  nextWeekYear,
  recurringTemplates,
  selectedRecurringTemplate,
  statusMessage,
  toggleRecurringTemplateActiveAction,
  updateRecurringTemplateAction
}: RecurringWorkflowProps) {
  return (
    <section
      className="grid gap-5 border border-[var(--border)] bg-[var(--panel)] p-5"
      id="recurring"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">Recurring entries</h3>
          <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">
            Define weekly templates once, then apply them to any selected ISO week. Generated rows
            are normal time entries and stay editable.
          </p>
        </div>
      </div>

      {statusMessage ? (
        <div className="border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)]">
          {statusMessage}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <RecurringTemplateForm
          action={
            selectedRecurringTemplate
              ? updateRecurringTemplateAction.bind(null, selectedRecurringTemplate.id)
              : createRecurringTemplateAction
          }
          cancelHref={basePath}
          recurringTemplate={selectedRecurringTemplate ?? undefined}
          returnToPath={basePath}
          submitLabel={selectedRecurringTemplate ? "Save changes" : "Add template"}
        />

        <RecurringApplyForm
          action={applyRecurringTemplatesAction}
          defaultWeekNumber={defaultWeekNumber}
          defaultWeekYear={defaultWeekYear}
          nextWeekNumber={nextWeekNumber}
          nextWeekYear={nextWeekYear}
          returnToPath={basePath}
        />
      </div>

      <details className="grid gap-4">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--foreground)]">
          Saved templates
        </summary>
        <div className="pt-4">
          <RecurringTemplateTable
            basePath={basePath}
            recurringTemplates={recurringTemplates}
            toggleActiveAction={toggleRecurringTemplateActiveAction}
          />
        </div>
      </details>
    </section>
  );
}
