import Link from "next/link";
import { faFilter } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { TimeEntryFilters } from "@/lib/services/time-tracking";

type TimeEntryFiltersProps = {
  filters: TimeEntryFilters;
  filterOptions: {
    productNames: string[];
    budgetNames: string[];
    budgetNumbers: string[];
  };
  hiddenFields?: Record<string, string>;
};

export function TimeEntryFilters({ filters, filterOptions, hiddenFields }: TimeEntryFiltersProps) {
  return (
    <form>
      <Card>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(12rem,1fr))_repeat(2,minmax(10rem,0.9fr))_8rem]">
          {hiddenFields
            ? Object.entries(hiddenFields).map(([fieldName, fieldValue]) => (
                <input key={fieldName} name={fieldName} type="hidden" value={fieldValue} />
              ))
            : null}
          <label className="grid gap-2 text-sm font-semibold">
            Product
            <Select defaultValue={filters.productName ?? ""} name="product">
              <option value="">All products</option>
              {filterOptions.productNames.map((productName) => (
                <option key={productName} value={productName}>
                  {productName}
                </option>
              ))}
            </Select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Budget Name
            <Select defaultValue={filters.budgetName ?? ""} name="budget">
              <option value="">All budget names</option>
              {filterOptions.budgetNames.map((budgetName) => (
                <option key={budgetName} value={budgetName}>
                  {budgetName}
                </option>
              ))}
            </Select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Budget #
            <Select defaultValue={filters.budgetNumber ?? ""} name="budgetNumber">
              <option value="">All budget numbers</option>
              {filterOptions.budgetNumbers.map((budgetNumber) => (
                <option key={budgetNumber} value={budgetNumber}>
                  {budgetNumber}
                </option>
              ))}
            </Select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            From
            <Input defaultValue={filters.startDate ?? ""} name="from" type="date" />
          </label>
          <div className="grid gap-2 text-sm font-semibold">
            <label htmlFor="to">To</label>
            <Input defaultValue={filters.endDate ?? ""} id="to" name="to" type="date" />
          </div>
          <div className="grid items-end">
            <Button className="h-10 w-full min-w-28 px-4 !text-neutral-950" type="submit">
              <span className="mr-2 inline-flex items-center">
                <FontAwesomeIcon className="h-3.5 w-3.5" icon={faFilter} />
              </span>
              Filter
            </Button>
          </div>
          <p className="text-sm font-normal text-[var(--muted)] sm:col-span-2 lg:col-span-6">
            Dropdown options come from saved entries and Budget key mappings.{" "}
            <Link className="font-semibold text-[var(--accent)] hover:underline" href="/budget-key">
              Manage dropdown options
            </Link>
          </p>
        </CardContent>
      </Card>
    </form>
  );
}
