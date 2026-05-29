import { WeeklyAllocationSection } from "@/components/time-entries/weekly-allocation-section";
import { getCurrentWorkbookOwnerId } from "@/lib/services/current-user";
import { getWeeklyAllocationPreview } from "@/lib/services/weekly-allocation";
import { listBudgetMappings } from "@/lib/services/time-tracking";
import {
  formatWeekLabel,
  getIsoWeekNumber,
  getIsoWeekYear,
  getTodayInputValue
} from "@/lib/utils/dates";

import { createWeeklyAllocationEntriesAction } from "../time-entries/actions";

type WeeklyAllocationPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchParamValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
}

function getRequestedWeekNumber(searchParams: Record<string, string | string[] | undefined>) {
  const weekValue = Number(
    getSearchParamValue(searchParams, "allocationWeek") ?? getSearchParamValue(searchParams, "week")
  );

  return Number.isInteger(weekValue) && weekValue >= 1 && weekValue <= 53 ? weekValue : null;
}

function getRequestedWeekYear(searchParams: Record<string, string | string[] | undefined>) {
  const yearValue = Number(
    getSearchParamValue(searchParams, "allocationYear") ?? getSearchParamValue(searchParams, "year")
  );

  return Number.isInteger(yearValue) && yearValue >= 2000 && yearValue <= 2100 ? yearValue : null;
}

function getAllocationStatusMessage(
  searchParams: Record<string, string | string[] | undefined>
) {
  const statusValue = getSearchParamValue(searchParams, "allocationStatus");
  const addedValue = Number(getSearchParamValue(searchParams, "allocationAdded"));
  const skippedValue = Number(getSearchParamValue(searchParams, "allocationSkipped"));
  const weekValue = Number(getSearchParamValue(searchParams, "allocationWeek"));
  const yearValue = Number(getSearchParamValue(searchParams, "allocationYear"));

  if (statusValue === "error") {
    return getSearchParamValue(searchParams, "allocationMessage") || "Allocation failed.";
  }

  if (
    !Number.isInteger(addedValue) ||
    !Number.isInteger(skippedValue) ||
    !Number.isInteger(weekValue) ||
    !Number.isInteger(yearValue)
  ) {
    return null;
  }

  const selectedWeekLabel = formatWeekLabel(weekValue, yearValue);

  if (statusValue === "duplicate") {
    return `Skipped duplicate allocation plan for ${selectedWeekLabel}.`;
  }

  if (statusValue === "created") {
    return `${addedValue} allocation entr${addedValue === 1 ? "y" : "ies"} added for ${selectedWeekLabel}.`;
  }

  return null;
}

export default async function WeeklyAllocationPage({ searchParams }: WeeklyAllocationPageProps) {
  const resolvedSearchParams = await searchParams;
  const ownerId = await getCurrentWorkbookOwnerId();
  const todayInputValue = getTodayInputValue();
  const selectedWeekNumber =
    getRequestedWeekNumber(resolvedSearchParams) ?? getIsoWeekNumber(todayInputValue);
  const selectedWeekYear =
    getRequestedWeekYear(resolvedSearchParams) ?? getIsoWeekYear(todayInputValue);
  const allocationPreview = await getWeeklyAllocationPreview(
    ownerId,
    selectedWeekNumber,
    selectedWeekYear
  );
  const budgetMappings = await listBudgetMappings(ownerId);
  const selectedWeekLabel = formatWeekLabel(selectedWeekNumber, selectedWeekYear);
  const statusMessage = getAllocationStatusMessage(resolvedSearchParams);

  return (
    <section className="py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Weekly allocation</h2>
          <p className="mt-2 max-w-3xl text-[var(--muted)]">
            Allocate the remaining time for the selected ISO week across project and task rows.
          </p>
        </div>
      </div>

      <WeeklyAllocationSection
        action={createWeeklyAllocationEntriesAction}
        allocationHiddenFields={{}}
        budgetMappings={budgetMappings}
        existingHours={allocationPreview.existingHours}
        remainingHours={allocationPreview.remainingHours}
        returnToPath="/weekly-allocation"
        selectedWeekLabel={selectedWeekLabel}
        selectedWeekNumber={selectedWeekNumber}
        selectedWeekYear={selectedWeekYear}
        statusMessage={statusMessage}
      />
    </section>
  );
}
