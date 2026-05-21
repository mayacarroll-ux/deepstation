import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BudgetMappingRecord } from "@/lib/services/time-tracking";

type BudgetKeyTableProps = {
  budgetMappings: BudgetMappingRecord[];
  deleteAction: (budgetMappingId: string, formData: FormData) => Promise<void>;
  duplicateBudgetMappingIds: string[];
  emptyMessage: string;
  returnToPath: string;
};

export function BudgetKeyTable({
  budgetMappings,
  deleteAction,
  duplicateBudgetMappingIds,
  emptyMessage,
  returnToPath
}: BudgetKeyTableProps) {
  if (budgetMappings.length === 0) {
    return (
      <div className="border border-[var(--border)] bg-[var(--panel)] p-6 text-[var(--muted)]">
        {emptyMessage}
      </div>
    );
  }

  const duplicateBudgetMappingIdSet = new Set(duplicateBudgetMappingIds);

  return (
    <div className="overflow-x-auto border border-[var(--border)] bg-[var(--panel)]">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)]">
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
            <tr
              className={
                duplicateBudgetMappingIdSet.has(budgetMapping.id)
                  ? "bg-[rgba(245,158,11,0.08)] transition-colors hover:bg-[rgba(245,158,11,0.12)]"
                  : "transition-colors hover:bg-[var(--surface)]"
              }
              key={budgetMapping.id}
            >
              <td className="px-4 py-3 font-semibold">
                <div className="flex flex-wrap items-center gap-2">
                  <span>{budgetMapping.productName}</span>
                  {duplicateBudgetMappingIdSet.has(budgetMapping.id) ? (
                    <Badge variant="outline">Duplicate</Badge>
                  ) : null}
                </div>
              </td>
              <td className="px-4 py-3">{budgetMapping.budgetName}</td>
              <td className="px-4 py-3">{budgetMapping.budgetNumber}</td>
              <td className="px-4 py-3 text-[var(--muted)]">{budgetMapping.notes}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Link
                    className="px-3 py-2 font-semibold hover:underline"
                    href={`/budget-key/${budgetMapping.id}/edit?returnTo=${encodeURIComponent(returnToPath)}`}
                  >
                    Edit
                  </Link>
                  <form action={deleteAction.bind(null, budgetMapping.id)}>
                    <input name="returnTo" type="hidden" value={returnToPath} />
                    <Button type="submit" variant="destructive">
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
