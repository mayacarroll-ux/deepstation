"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

import { BudgetKeyFields } from "./budget-key-fields";

type BudgetKeyCreateDialogProps = {
  action: (formData: FormData) => Promise<void>;
  returnToPath: string;
};

export function BudgetKeyCreateDialog({ action, returnToPath }: BudgetKeyCreateDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <Button className="text-neutral-950" onClick={() => setIsOpen(true)} type="button">
        Add budget key
      </Button>
      <DialogContent className="max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto">
        <DialogHeader className="border-b border-[var(--border)] px-5 py-4">
          <DialogTitle>Add budget key</DialogTitle>
          <DialogDescription>
            Add a mapping that fills Budget Name and Budget # for time entry forms.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-4 p-5">
          <input name="returnTo" type="hidden" value={returnToPath} />
          <BudgetKeyFields />
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
            <Button
              onClick={() => setIsOpen(false)}
              type="button"
              variant="secondary"
            >
              Cancel
            </Button>
            <Button type="submit">Save budget key</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
