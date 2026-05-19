import { Button } from "@/components/ui/button";
import type { BudgetMappingRecord } from "@/lib/services/time-tracking";

type BudgetKeyFormProps = {
  action: (formData: FormData) => Promise<void>;
  budgetMapping?: BudgetMappingRecord;
  submitLabel: string;
};

export function BudgetKeyForm({
  action,
  budgetMapping,
  submitLabel
}: BudgetKeyFormProps) {
  return (
    <form action={action} className="grid gap-4 border border-[var(--border)] bg-[var(--panel)] p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold">
          Product Name
          <input
            className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
            defaultValue={budgetMapping?.productName}
            name="productName"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Budget Name
          <input
            className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
            defaultValue={budgetMapping?.budgetName}
            name="budgetName"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Budget #
          <input
            className="h-11 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
            defaultValue={budgetMapping?.budgetNumber}
            name="budgetNumber"
            required
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-semibold">
        Notes
        <textarea
          className="min-h-20 resize-y border border-[var(--border)] p-3 font-normal outline-none focus:border-[var(--accent)]"
          defaultValue={budgetMapping?.notes ?? ""}
          name="notes"
        />
      </label>
      <div>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
