import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Button } from "@/components/ui/button";
import type { BudgetMappingRecord } from "@/lib/types/time-tracking";
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
        <Button type="submit">
          <span className="mr-2 inline-flex items-center">
            <FontAwesomeIcon className="h-3.5 w-3.5" icon={faFloppyDisk} />
          </span>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
