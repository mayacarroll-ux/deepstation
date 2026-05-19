import { BudgetKeyForm } from "@/components/budget-key/budget-key-form";
import { BudgetKeyTable } from "@/components/budget-key/budget-key-table";
import { getCurrentWorkbookOwnerId } from "@/lib/services/current-user";
import { listBudgetMappings } from "@/lib/services/time-tracking";

import {
  createBudgetMappingAction,
  deleteBudgetMappingAction
} from "./actions";

export default async function BudgetKeyPage() {
  const ownerId = await getCurrentWorkbookOwnerId();
  const budgetMappingRecords = await listBudgetMappings(ownerId);

  return (
    <section className="py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Project / budget key</h2>
        <p className="mt-2 text-[var(--muted)]">
          Manage the mappings that auto-fill Budget Name and Budget # for time entries.
        </p>
      </div>
      <div className="grid gap-6">
        <BudgetKeyForm action={createBudgetMappingAction} submitLabel="Add mapping" />
        <BudgetKeyTable
          budgetMappings={budgetMappingRecords}
          deleteAction={deleteBudgetMappingAction}
        />
      </div>
    </section>
  );
}
