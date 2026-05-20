import { TimeEntryForm } from "@/components/time-entries/time-entry-form";
import { getCurrentWorkbookOwnerId } from "@/lib/services/current-user";
import { listBudgetMappings } from "@/lib/services/time-tracking";

import { createTimeEntryAction } from "../actions";

export default async function NewTimeEntryPage() {
  const ownerId = await getCurrentWorkbookOwnerId();
  const budgetMappingRecords = await listBudgetMappings(ownerId);

  return (
    <section className="py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">New time entry</h2>
        <p className="mt-2 text-[var(--muted)]">
          Add a workbook row. Product Name can auto-fill budget fields from the budget key, and
          optional Start Time / End Time fields can auto-calculate Hours Worked.
        </p>
      </div>
      <TimeEntryForm
        action={createTimeEntryAction}
        budgetMappings={budgetMappingRecords}
        submitLabel="Save time entry"
      />
    </section>
  );
}
