import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { TimeEntryFilters } from "@/lib/services/time-tracking";

type TimeEntryFiltersProps = {
  filters: TimeEntryFilters;
  filterOptions: {
    productNames: string[];
    budgetNames: string[];
    budgetNumbers: string[];
  };
};

const filterControlClassName =
  "h-10 min-w-0 border border-[var(--border)] bg-[var(--surface)] px-3 font-normal text-[var(--foreground)] outline-none focus:border-[var(--accent)]";

export function TimeEntryFilters({ filters, filterOptions }: TimeEntryFiltersProps) {
  return (
    <form className="grid gap-4 border border-[var(--border)] bg-[var(--panel)] p-5 sm:grid-cols-2 lg:grid-cols-[minmax(9rem,0.8fr)_repeat(3,minmax(12rem,1fr))_repeat(2,minmax(10rem,0.9fr))_8rem]">
      <label className="grid gap-2 text-sm font-semibold">
        Week number
        <input
          className={filterControlClassName}
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
        <select
          className={filterControlClassName}
          defaultValue={filters.productName ?? ""}
          name="product"
        >
          <option value="">All products</option>
          {filterOptions.productNames.map((productName) => (
            <option key={productName} value={productName}>
              {productName}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Budget Name
        <select
          className={filterControlClassName}
          defaultValue={filters.budgetName ?? ""}
          name="budget"
        >
          <option value="">All budget names</option>
          {filterOptions.budgetNames.map((budgetName) => (
            <option key={budgetName} value={budgetName}>
              {budgetName}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Budget #
        <select
          className={filterControlClassName}
          defaultValue={filters.budgetNumber ?? ""}
          name="budgetNumber"
        >
          <option value="">All budget numbers</option>
          {filterOptions.budgetNumbers.map((budgetNumber) => (
            <option key={budgetNumber} value={budgetNumber}>
              {budgetNumber}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        From
        <input
          className={filterControlClassName}
          defaultValue={filters.startDate ?? ""}
          name="from"
          type="date"
        />
      </label>
      <div className="grid gap-2 text-sm font-semibold">
        <label htmlFor="to">To</label>
        <input
          className={filterControlClassName}
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
      <p className="text-sm font-normal text-[var(--muted)] sm:col-span-2 lg:col-span-7">
        Dropdown options come from saved entries and Budget key mappings.{" "}
        <Link className="font-semibold text-[var(--accent)] hover:underline" href="/budget-key">
          Manage dropdown options
        </Link>
      </p>
    </form>
  );
}
