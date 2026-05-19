import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { BudgetMappingRecord } from "@/lib/services/time-tracking";

type BudgetKeyTableProps = {
  budgetMappings: BudgetMappingRecord[];
  deleteAction: (budgetMappingId: string) => Promise<void>;
};

export function BudgetKeyTable({ budgetMappings, deleteAction }: BudgetKeyTableProps) {
  if (budgetMappings.length === 0) {
    return (
      <div className="border border-[var(--border)] bg-[var(--panel)] p-6 text-[var(--muted)]">
        No budget mappings yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-[var(--border)] bg-[var(--panel)]">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead className="border-b border-[var(--border)] bg-[#eef1eb]">
          <tr>
            <th className="px-4 py-3">Product Name</th>
            <th className="px-4 py-3">Budget Name</th>
            <th className="px-4 py-3">Budget #</th>
            <th className="px-4 py-3">Notes</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {budgetMappings.map((budgetMapping) => (
            <tr key={budgetMapping.id}>
              <td className="px-4 py-3 font-semibold">{budgetMapping.productName}</td>
              <td className="px-4 py-3">{budgetMapping.budgetName}</td>
              <td className="px-4 py-3">{budgetMapping.budgetNumber}</td>
              <td className="px-4 py-3 text-[var(--muted)]">{budgetMapping.notes}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Link className="px-3 py-2 font-semibold hover:underline" href={`/budget-key/${budgetMapping.id}/edit`}>
                    Edit
                  </Link>
                  <form action={deleteAction.bind(null, budgetMapping.id)}>
                    <Button type="submit" variant="secondary">
                      Delete
                    </Button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
