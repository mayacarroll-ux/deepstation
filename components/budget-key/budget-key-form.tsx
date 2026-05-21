import { Button } from "@/components/ui/button";
import type { BudgetMappingRecord } from "@/lib/services/time-tracking";
import { BudgetKeyFields } from "./budget-key-fields";

type BudgetKeyFormProps = {
  action: (formData: FormData) => Promise<void>;
  budgetMapping?: BudgetMappingRecord;
  returnToPath?: string;
  submitLabel: string;
};

export function BudgetKeyForm({
  action,
  budgetMapping,
  returnToPath,
  submitLabel
}: BudgetKeyFormProps) {
  return (
    <form action={action} className="grid gap-4 border border-[var(--border)] bg-[var(--panel)] p-6">
      {returnToPath ? <input name="returnTo" type="hidden" value={returnToPath} /> : null}
      <BudgetKeyFields budgetMapping={budgetMapping} />
      <div>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
