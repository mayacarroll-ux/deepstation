import { notFound } from "next/navigation";

import { BudgetKeyForm } from "@/components/budget-key/budget-key-form";
import { getCurrentWorkbookOwnerId } from "@/lib/services/current-user";
import { getBudgetMapping } from "@/lib/services/time-tracking";

import { updateBudgetMappingAction } from "../../actions";

type EditBudgetKeyPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditBudgetKeyPage({ params }: EditBudgetKeyPageProps) {
  const { id } = await params;
  const ownerId = await getCurrentWorkbookOwnerId();
  const budgetMapping = await getBudgetMapping(ownerId, id);

  if (!budgetMapping) {
    notFound();
  }

  return (
    <section className="py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Edit budget mapping</h2>
        <p className="mt-2 text-[var(--muted)]">
          Update the Product Name, Budget Name, Budget #, or notes for this key row.
        </p>
      </div>
      <BudgetKeyForm
        action={updateBudgetMappingAction.bind(null, budgetMapping.id)}
        budgetMapping={budgetMapping}
        submitLabel="Save mapping"
      />
    </section>
  );
}
