import Link from "next/link";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { BudgetKeyCreateDialog } from "@/components/budget-key/budget-key-create-dialog";
import { BudgetKeyTable } from "@/components/budget-key/budget-key-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentWorkbookOwnerId } from "@/lib/services/current-user";
import { getBudgetMappingDuplicateKey, listBudgetMappings } from "@/lib/services/time-tracking";

import {
  createBudgetMappingAction,
  deleteBudgetMappingAction
} from "./actions";

type BudgetKeyPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchParamValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
}

function buildBudgetKeyQueryParameters(
  searchParams: Record<string, string | string[] | undefined>
) {
  const queryParameters = new URLSearchParams();
  const excludedKeys = new Set(["budgetKeyStatus", "budgetKeyMessage"]);

  for (const [key, value] of Object.entries(searchParams)) {
    if (excludedKeys.has(key)) {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((queryValue) => {
        if (queryValue) {
          queryParameters.append(key, queryValue);
        }
      });
      continue;
    }

    if (value) {
      queryParameters.set(key, value);
    }
  }

  return queryParameters;
}

function buildBudgetKeyReturnToPath(
  searchParams: Record<string, string | string[] | undefined>,
  overrides: Record<string, string | undefined> = {}
) {
  const queryParameters = buildBudgetKeyQueryParameters(searchParams);

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      queryParameters.delete(key);
      continue;
    }

    queryParameters.set(key, value);
  }

  const queryString = queryParameters.toString();

  return queryString ? `/budget-key?${queryString}` : "/budget-key";
}

function getSearchTerm(searchParams: Record<string, string | string[] | undefined>) {
  return getSearchParamValue(searchParams, "q")?.trim() ?? "";
}

function getRequestedPage(searchParams: Record<string, string | string[] | undefined>) {
  const pageValue = Number(getSearchParamValue(searchParams, "page"));

  return Number.isInteger(pageValue) && pageValue >= 1 ? pageValue : 1;
}

function normalizeSearchValue(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function budgetMappingMatchesSearch(budgetMapping: {
  productName: string;
  budgetName: string;
  budgetNumber: string;
}, searchTerm: string) {
  if (!searchTerm) {
    return true;
  }

  const normalizedSearchTerm = normalizeSearchValue(searchTerm);
  const normalizedProductName = normalizeSearchValue(budgetMapping.productName);
  const normalizedBudgetName = normalizeSearchValue(budgetMapping.budgetName);
  const normalizedBudgetNumber = normalizeSearchValue(budgetMapping.budgetNumber);

  return (
    normalizedProductName.includes(normalizedSearchTerm) ||
    normalizedBudgetName.includes(normalizedSearchTerm) ||
    normalizedBudgetNumber.includes(normalizedSearchTerm)
  );
}

function getDuplicateBudgetMappingIds(budgetMappings: Array<{
  id: string;
  productName: string;
  budgetName: string;
  budgetNumber: string;
}>) {
  const budgetMappingIdsByKey = new Map<string, string[]>();

  for (const budgetMapping of budgetMappings) {
    const duplicateKey = getBudgetMappingDuplicateKey(
      budgetMapping.productName,
      budgetMapping.budgetName,
      budgetMapping.budgetNumber
    );
    const existingIds = budgetMappingIdsByKey.get(duplicateKey) ?? [];

    existingIds.push(budgetMapping.id);
    budgetMappingIdsByKey.set(duplicateKey, existingIds);
  }

  return Array.from(budgetMappingIdsByKey.values())
    .filter((budgetMappingIds) => budgetMappingIds.length > 1)
    .flat();
}

function getDuplicateGroupCount(budgetMappings: Array<{
  productName: string;
  budgetName: string;
  budgetNumber: string;
}>) {
  const countsByKey = new Map<string, number>();

  for (const budgetMapping of budgetMappings) {
    const duplicateKey = getBudgetMappingDuplicateKey(
      budgetMapping.productName,
      budgetMapping.budgetName,
      budgetMapping.budgetNumber
    );
    countsByKey.set(duplicateKey, (countsByKey.get(duplicateKey) ?? 0) + 1);
  }

  return Array.from(countsByKey.values()).filter((count) => count > 1).length;
}

function buildPageHref(
  searchParams: Record<string, string | string[] | undefined>,
  pageNumber: number
) {
  return buildBudgetKeyReturnToPath(searchParams, { page: String(pageNumber) });
}

function getBudgetKeyStatusMessage(
  searchParams: Record<string, string | string[] | undefined>
) {
  const statusValue = getSearchParamValue(searchParams, "budgetKeyStatus");
  const messageValue = getSearchParamValue(searchParams, "budgetKeyMessage");

  if (!statusValue) {
    return null;
  }

  if (messageValue) {
    return messageValue;
  }

  if (statusValue === "created") {
    return "Budget key created.";
  }

  if (statusValue === "updated") {
    return "Budget key updated.";
  }

  if (statusValue === "deleted") {
    return "Budget key deleted.";
  }

  if (statusValue === "duplicate") {
    return "This budget key already exists.";
  }

  return null;
}

export default async function BudgetKeyPage({ searchParams }: BudgetKeyPageProps) {
  const resolvedSearchParams = await searchParams;
  const ownerId = await getCurrentWorkbookOwnerId();
  const budgetMappingRecords = await listBudgetMappings(ownerId);
  const searchTerm = getSearchTerm(resolvedSearchParams);
  const filteredBudgetMappingRecords = budgetMappingRecords.filter((budgetMapping) =>
    budgetMappingMatchesSearch(budgetMapping, searchTerm)
  );
  const duplicateBudgetMappingIds = getDuplicateBudgetMappingIds(budgetMappingRecords);
  const duplicateGroupCount = getDuplicateGroupCount(budgetMappingRecords);
  const pageSize = 20;
  const totalBudgetMappings = filteredBudgetMappingRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalBudgetMappings / pageSize));
  const requestedPage = getRequestedPage(resolvedSearchParams);
  const currentPage = Math.min(requestedPage, totalPages);
  const startIndex = totalBudgetMappings === 0 ? 0 : (currentPage - 1) * pageSize;
  const visibleBudgetMappings = filteredBudgetMappingRecords.slice(
    startIndex,
    startIndex + pageSize
  );
  const showingStart = totalBudgetMappings === 0 ? 0 : startIndex + 1;
  const showingEnd = totalBudgetMappings === 0 ? 0 : Math.min(startIndex + pageSize, totalBudgetMappings);
  const currentReturnToPath = buildBudgetKeyReturnToPath(resolvedSearchParams, {
    page: String(currentPage),
    q: searchTerm || undefined
  });
  const budgetKeyStatusMessage = getBudgetKeyStatusMessage(resolvedSearchParams);
  const previousPageHref = currentPage > 1 ? buildPageHref(resolvedSearchParams, currentPage - 1) : null;
  const nextPageHref =
    currentPage < totalPages ? buildPageHref(resolvedSearchParams, currentPage + 1) : null;

  return (
    <section className="py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-2">
          <h2 className="text-2xl font-semibold">Project / Budget key</h2>
          <p className="text-[var(--muted)]">
            Manage the mappings that auto-fill Budget Name and Budget # for time entries.
          </p>
        </div>
        <BudgetKeyCreateDialog action={createBudgetMappingAction} returnToPath={currentReturnToPath} />
      </div>

      <div className="grid gap-4">
        <form className="grid gap-4 border border-[var(--border)] bg-[var(--panel)] p-5">
          <input name="page" type="hidden" value="1" />
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <label className="grid gap-2 text-sm font-semibold">
              Search
            <Input
                defaultValue={searchTerm}
                name="q"
                placeholder="Search product or budget name..."
              />
            </label>
            <Button className="text-neutral-950" type="submit">
              <span className="mr-2 inline-flex items-center">
                <FontAwesomeIcon className="h-3.5 w-3.5" icon={faMagnifyingGlass} />
              </span>
              Search
            </Button>
          </div>
        </form>

        {budgetKeyStatusMessage ? (
          <Card>
            <CardContent className="px-4 py-3 text-sm text-[var(--foreground)]">
              {budgetKeyStatusMessage}
            </CardContent>
          </Card>
        ) : null}

        {duplicateGroupCount > 0 ? (
          <div className="flex flex-wrap items-center gap-3 border border-[var(--warning)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--foreground)]">
            <span className="font-semibold">Duplicates found</span>
            <Badge variant="outline">{duplicateGroupCount} group{duplicateGroupCount === 1 ? "" : "s"}</Badge>
            <span className="text-[var(--muted)]">
              Duplicate budget keys are labeled in the table below. Existing rows were not changed.
            </span>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--muted)]">
            Showing {showingStart}–{showingEnd} of {totalBudgetMappings} budget keys
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              aria-disabled={!previousPageHref}
              className={
                previousPageHref
                  ? "border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-muted)]"
                  : "pointer-events-none border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--muted)] opacity-50"
              }
              href={previousPageHref ?? "#"}
            >
              Previous
            </Link>
            <span className="text-sm text-[var(--muted)]">
              Page {currentPage} of {totalPages}
            </span>
            <Link
              aria-disabled={!nextPageHref}
              className={
                nextPageHref
                  ? "border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-muted)]"
                  : "pointer-events-none border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--muted)] opacity-50"
              }
              href={nextPageHref ?? "#"}
            >
              Next
            </Link>
          </div>
        </div>

        <BudgetKeyTable
          budgetMappings={visibleBudgetMappings}
          deleteAction={deleteBudgetMappingAction}
          duplicateBudgetMappingIds={duplicateBudgetMappingIds}
          emptyMessage={
            searchTerm
              ? "No budget keys match this search."
              : "No budget mappings yet."
          }
          returnToPath={currentReturnToPath}
        />
      </div>
    </section>
  );
}
