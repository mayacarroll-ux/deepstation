import { notFound } from "next/navigation";

import { BudgetKeyForm } from "@/components/budget-key/budget-key-form";
import { getCurrentWorkbookOwnerId } from "@/lib/services/current-user";
import { getBudgetMapping } from "@/lib/services/time-tracking";

import { updateBudgetMappingAction } from "../../actions";

type EditBudgetKeyPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchParamValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
}

export default async function EditBudgetKeyPage({ params, searchParams }: EditBudgetKeyPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const ownerId = await getCurrentWorkbookOwnerId();
  const budgetMapping = await getBudgetMapping(ownerId, id);
  const returnToPath = getSearchParamValue(resolvedSearchParams, "returnTo") || "/budget-key";

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
        returnToPath={returnToPath}
        submitLabel="Save mapping"
      />
    </section>
  );
}
