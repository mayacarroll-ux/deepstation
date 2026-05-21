"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BudgetMappingRecord } from "@/lib/services/time-tracking";

type BudgetKeyFieldsProps = {
  budgetMapping?: BudgetMappingRecord;
};

export function BudgetKeyFields({ budgetMapping }: BudgetKeyFieldsProps) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold">
          Product Name
          <Input defaultValue={budgetMapping?.productName} name="productName" required />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Budget Name
          <Input defaultValue={budgetMapping?.budgetName} name="budgetName" required />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Budget #
          <Input defaultValue={budgetMapping?.budgetNumber} name="budgetNumber" required />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-semibold">
        Notes
        <Textarea defaultValue={budgetMapping?.notes ?? ""} name="notes" />
      </label>
    </>
  );
}
