import { notFound } from "next/navigation";

import { TimeEntryForm } from "@/components/time-entries/time-entry-form";
import { getCurrentWorkbookOwnerId } from "@/lib/services/current-user";
import { getTimeEntry, listBudgetMappings } from "@/lib/services/time-tracking";

import { updateTimeEntryAction } from "../../actions";

type EditTimeEntryPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditTimeEntryPage({ params }: EditTimeEntryPageProps) {
  const { id } = await params;
  const ownerId = await getCurrentWorkbookOwnerId();
  const [timeEntry, budgetMappingRecords] = await Promise.all([
    getTimeEntry(ownerId, id),
    listBudgetMappings(ownerId)
  ]);

  if (!timeEntry) {
    notFound();
  }

  return (
    <section className="py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Edit time entry</h2>
        <p className="mt-2 text-[var(--muted)]">
          Update the saved workbook row.
        </p>
      </div>
      <TimeEntryForm
        action={updateTimeEntryAction.bind(null, timeEntry.id)}
        budgetMappings={budgetMappingRecords}
        submitLabel="Save changes"
        timeEntry={timeEntry}
      />
    </section>
  );
}
