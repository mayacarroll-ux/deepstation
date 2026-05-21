import { NewTimeEntryDialog } from "@/components/time-entries/new-time-entry-dialog";
import { getCurrentWorkbookOwnerId } from "@/lib/services/current-user";
import { listBudgetMappings } from "@/lib/services/time-tracking";

import { createTimeEntryAction } from "../actions";

export default async function NewTimeEntryPage() {
  const ownerId = await getCurrentWorkbookOwnerId();
  const budgetMappingRecords = await listBudgetMappings(ownerId);

  return (
    <section className="py-8">
      <NewTimeEntryDialog
        action={createTimeEntryAction}
        budgetMappings={budgetMappingRecords}
        defaultOpen
        returnToPath="/time-entries"
        showTrigger={false}
      />
    </section>
  );
}
