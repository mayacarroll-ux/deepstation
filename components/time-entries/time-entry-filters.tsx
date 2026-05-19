import { Button } from "@/components/ui/button";
import type { TimeEntryFilters } from "@/lib/services/time-tracking";

type TimeEntryFiltersProps = {
  filters: TimeEntryFilters;
};

export function TimeEntryFilters({ filters }: TimeEntryFiltersProps) {
  return (
    <form className="grid gap-4 border border-[var(--border)] bg-[var(--panel)] p-5 md:grid-cols-6">
      <label className="grid gap-2 text-sm font-semibold">
        Week number
        <input
          className="h-10 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
          defaultValue={filters.weekNumber ?? ""}
          max="53"
          min="1"
          name="week"
          type="number"
        />
        <span className="text-xs font-normal text-[var(--muted)]">
          Date range depends on entry year.
        </span>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Product
        <input
          className="h-10 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
          defaultValue={filters.productName ?? ""}
          name="product"
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Budget Name
        <input
          className="h-10 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
          defaultValue={filters.budgetName ?? ""}
          name="budget"
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Budget #
        <input
          className="h-10 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
          defaultValue={filters.budgetNumber ?? ""}
          name="budgetNumber"
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        From
        <input
          className="h-10 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
          defaultValue={filters.startDate ?? ""}
          name="from"
          type="date"
        />
      </label>
      <div className="grid gap-2 text-sm font-semibold">
        <label htmlFor="to">To</label>
        <div className="flex gap-2">
          <input
            className="h-10 min-w-0 flex-1 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
            defaultValue={filters.endDate ?? ""}
            id="to"
            name="to"
            type="date"
          />
          <Button className="h-10 px-4" type="submit">
            Filter
          </Button>
        </div>
      </div>
    </form>
  );
}
