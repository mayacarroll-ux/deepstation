import { Button } from "@/components/ui/button";
import type { TimeEntryFilters } from "@/lib/services/time-tracking";

type TimeEntryFiltersProps = {
  filters: TimeEntryFilters;
};

export function TimeEntryFilters({ filters }: TimeEntryFiltersProps) {
  return (
    <form className="grid gap-4 border border-[var(--border)] bg-[var(--panel)] p-5 sm:grid-cols-2 lg:grid-cols-[minmax(9rem,0.8fr)_repeat(3,minmax(12rem,1fr))_repeat(2,minmax(10rem,0.9fr))_8rem]">
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
          className="h-10 min-w-0 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
          defaultValue={filters.productName ?? ""}
          name="product"
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Budget Name
        <input
          className="h-10 min-w-0 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
          defaultValue={filters.budgetName ?? ""}
          name="budget"
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Budget #
        <input
          className="h-10 min-w-0 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
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
        <input
          className="h-10 min-w-0 border border-[var(--border)] px-3 font-normal outline-none focus:border-[var(--accent)]"
          defaultValue={filters.endDate ?? ""}
          id="to"
          name="to"
          type="date"
        />
      </div>
      <div className="grid items-end">
        <Button className="h-10 w-full min-w-28 px-4 !text-neutral-950" type="submit">
          Filter
        </Button>
      </div>
    </form>
  );
}
