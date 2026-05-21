import { and, asc, desc, eq, gte, ilike, lte, sql } from "drizzle-orm";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import { database } from "@/db";
import { budgetMappings, timeEntries } from "@/db/schema";
import { isProduction } from "@/lib/config";
import { getIsoWeekNumber, getIsoWeekYear, getTodayInputValue } from "@/lib/utils/dates";

export const budgetMappingFormSchema = z.object({
  productName: z.string().trim().min(1, "Product Name is required."),
  budgetName: z.string().trim().min(1, "Budget Name is required."),
  budgetNumber: z.string().trim().min(1, "Budget # is required."),
  notes: z.string().trim().optional()
});

export const timeEntryFormSchema = z.object({
  budgetMappingId: z.string().uuid().optional().or(z.literal("")),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date is required."),
  startTime: z
    .string()
    .trim()
    .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Start Time must use 24-hour HH:MM format.")
    .optional()
    .or(z.literal("")),
  endTime: z
    .string()
    .trim()
    .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "End Time must use 24-hour HH:MM format.")
    .optional()
    .or(z.literal("")),
  productName: z.string().trim().min(1, "Product Name is required."),
  budgetName: z.string().trim().min(1, "Budget Name is required."),
  budgetNumber: z.string().trim().min(1, "Budget # is required."),
  taskDescription: z.string().trim().min(1, "Task Description is required."),
  hoursWorked: z.coerce
    .number()
    .positive("Hours Worked must be greater than 0.")
    .max(999.99, "Hours Worked is too large."),
  weekNumber: z.coerce
    .number()
    .int("Week Number must be a whole number.")
    .min(1, "Week Number must be at least 1.")
    .max(53, "Week Number cannot be greater than 53."),
  notes: z.string().trim().optional()
});

export type BudgetMappingRecord = typeof budgetMappings.$inferSelect;
export type TimeEntryRecord = typeof timeEntries.$inferSelect;
type ImportedWorkbookData = {
  budgetMappings: Array<{
    id: string;
    productName: string;
    budgetName: string;
    budgetNumber: string;
    notes: string | null;
  }>;
  timeEntries: Array<{
    id: string;
    budgetMappingKey: string[] | null;
    entryDate: string;
    productName: string;
    budgetName: string;
    budgetNumber: string;
    taskDescription: string;
    hoursWorked: string;
    weekNumber: number;
    notes: string | null;
  }>;
};

export type TimeEntryFilters = {
  weekNumber?: number;
  weekYear?: number;
  productName?: string;
  budgetName?: string;
  budgetNumber?: string;
  startDate?: string;
  endDate?: string;
};

const accountantProjectNamesByProductName = new Map([
  ["bizquest nationa exp", "Zurich Middle School"],
  ["h2c jani", "Zurich Hs Courses-Custom"],
  ["h2c maritime", "IBAS-Y2-CD11.1"],
  ["h2c ai chat bot", "AI ACCENTURE PROD"],
  ["fin lit hs course", "ZURICH HS COURSES-CUSTOM"]
]);

export function requireDatabase() {
  if (!database) {
    throw new Error("DATABASE_URL is required for this workflow.");
  }

  return database;
}

function normalizeProductName(productName: string) {
  return productName.trim().replace(/\s+/g, " ").toLowerCase();
}

export function getAccountantProjectName(productName: string, budgetName: string) {
  const normalizedProductName = normalizeProductName(productName);
  const normalizedBudgetName = normalizeProductName(budgetName);

  if (normalizedProductName.includes("ibas") || normalizedBudgetName.includes("ibas")) {
    return "IBAS-Y2-CD11.1";
  }

  return accountantProjectNamesByProductName.get(normalizedProductName) ?? budgetName.trim();
}

async function readImportedWorkbookLifetimeHours() {
  const importedWorkbookData = await readImportedWorkbookData();

  return importedWorkbookData.timeEntries.reduce(
    (totalHours, timeEntry) => totalHours + Number(timeEntry.hoursWorked),
    0
  );
}

async function readImportedWorkbookData() {
  if (isProduction) {
    throw new Error("JSON workbook fallback is disabled in production. Configure DATABASE_URL.");
  }

  try {
    const importedWorkbookPath = path.join(process.cwd(), "data", "imported-workbook.json");
    const importedWorkbookContent = await fs.readFile(importedWorkbookPath, "utf8");

    return JSON.parse(importedWorkbookContent) as ImportedWorkbookData;
  } catch {
    return {
      budgetMappings: [],
      timeEntries: []
    } satisfies ImportedWorkbookData;
  }
}

function getFallbackDate() {
  return new Date("2026-01-01T00:00:00.000Z");
}

async function listFallbackBudgetMappings() {
  const importedWorkbookData = await readImportedWorkbookData();

  return importedWorkbookData.budgetMappings
    .map((budgetMapping) => ({
      id: budgetMapping.id,
      ownerId: "single-user",
      productName: budgetMapping.productName,
      budgetName: budgetMapping.budgetName,
      budgetNumber: budgetMapping.budgetNumber,
      notes: budgetMapping.notes,
      createdAt: getFallbackDate(),
      updatedAt: getFallbackDate()
    }))
    .sort((firstBudgetMapping, secondBudgetMapping) =>
      `${firstBudgetMapping.productName} ${firstBudgetMapping.budgetName}`.localeCompare(
        `${secondBudgetMapping.productName} ${secondBudgetMapping.budgetName}`
      )
    );
}

async function listFallbackTimeEntries(filters: TimeEntryFilters = {}) {
  const importedWorkbookData = await readImportedWorkbookData();
  const budgetMappingIdsByKey = new Map(
    importedWorkbookData.budgetMappings.map((budgetMapping) => [
      [
        budgetMapping.productName.toLowerCase(),
        budgetMapping.budgetName.toLowerCase(),
        budgetMapping.budgetNumber.toLowerCase()
      ].join("\u0000"),
      budgetMapping.id
    ])
  );

  return importedWorkbookData.timeEntries
    .map((timeEntry) => ({
      id: timeEntry.id,
      ownerId: "single-user",
      allocationBatchId: null,
      budgetMappingId: timeEntry.budgetMappingKey
        ? budgetMappingIdsByKey.get(timeEntry.budgetMappingKey.join("\u0000")) ?? null
        : null,
      recurringTemplateId: null,
      entryDate: timeEntry.entryDate,
      startTime: null,
      endTime: null,
      productName: timeEntry.productName,
      budgetName: timeEntry.budgetName,
      budgetNumber: timeEntry.budgetNumber,
      taskDescription: timeEntry.taskDescription,
      hoursWorked: timeEntry.hoursWorked,
      weekNumber: timeEntry.weekNumber,
      notes: timeEntry.notes,
      createdAt: getFallbackDate(),
      updatedAt: getFallbackDate()
    }))
    .filter((timeEntry) => {
      if (filters.weekNumber && timeEntry.weekNumber !== filters.weekNumber) {
        return false;
      }

      if (filters.weekYear && getIsoWeekYear(timeEntry.entryDate) !== filters.weekYear) {
        return false;
      }

      if (
        filters.productName &&
        !timeEntry.productName.toLowerCase().includes(filters.productName.toLowerCase())
      ) {
        return false;
      }

      if (
        filters.budgetName &&
        !timeEntry.budgetName.toLowerCase().includes(filters.budgetName.toLowerCase())
      ) {
        return false;
      }

      if (
        filters.budgetNumber &&
        !timeEntry.budgetNumber.toLowerCase().includes(filters.budgetNumber.toLowerCase())
      ) {
        return false;
      }

      if (filters.startDate && timeEntry.entryDate < filters.startDate) {
        return false;
      }

      if (filters.endDate && timeEntry.entryDate > filters.endDate) {
        return false;
      }

      return true;
    })
    .sort((firstTimeEntry, secondTimeEntry) =>
      secondTimeEntry.entryDate.localeCompare(firstTimeEntry.entryDate)
    );
}

export function parseBudgetMappingFormData(formData: FormData) {
  return budgetMappingFormSchema.parse({
    productName: formData.get("productName"),
    budgetName: formData.get("budgetName"),
    budgetNumber: formData.get("budgetNumber"),
    notes: formData.get("notes")
  });
}

export function parseTimeEntryFormData(formData: FormData) {
  const parsedTimeEntry = timeEntryFormSchema.parse({
    budgetMappingId: formData.get("budgetMappingId"),
    entryDate: formData.get("entryDate"),
    startTime: formData.get("startTime") ?? "",
    endTime: formData.get("endTime") ?? "",
    productName: formData.get("productName"),
    budgetName: formData.get("budgetName"),
    budgetNumber: formData.get("budgetNumber"),
    taskDescription: formData.get("taskDescription"),
    hoursWorked: formData.get("hoursWorked"),
    weekNumber: formData.get("weekNumber"),
    notes: formData.get("notes")
  });

  return {
    ...parsedTimeEntry,
    budgetMappingId: parsedTimeEntry.budgetMappingId || null,
    startTime: parsedTimeEntry.startTime || null,
    endTime: parsedTimeEntry.endTime || null,
    hoursWorked: parsedTimeEntry.hoursWorked.toFixed(2),
    notes: parsedTimeEntry.notes || null
  };
}

export async function listBudgetMappings(ownerId: string) {
  if (!database) {
    if (isProduction) {
      throw new Error("DATABASE_URL is required to list budget mappings in production.");
    }

    return listFallbackBudgetMappings();
  }

  return database
    .select()
    .from(budgetMappings)
    .where(eq(budgetMappings.ownerId, ownerId))
    .orderBy(asc(budgetMappings.productName), asc(budgetMappings.budgetName));
}

export async function getBudgetMapping(ownerId: string, budgetMappingId: string) {
  if (!database) {
    if (isProduction) {
      throw new Error("DATABASE_URL is required to load budget mappings in production.");
    }

    const fallbackBudgetMappings = await listFallbackBudgetMappings();

    return (
      fallbackBudgetMappings.find(
        (budgetMapping) =>
          budgetMapping.ownerId === ownerId && budgetMapping.id === budgetMappingId
      ) ?? null
    );
  }

  const [budgetMapping] = await database
    .select()
    .from(budgetMappings)
    .where(and(eq(budgetMappings.ownerId, ownerId), eq(budgetMappings.id, budgetMappingId)))
    .limit(1);

  return budgetMapping ?? null;
}

export async function createBudgetMapping(ownerId: string, formData: FormData) {
  const writableDatabase = requireDatabase();
  const parsedBudgetMapping = parseBudgetMappingFormData(formData);

  await writableDatabase.insert(budgetMappings).values({
    ownerId,
    productName: parsedBudgetMapping.productName,
    budgetName: parsedBudgetMapping.budgetName,
    budgetNumber: parsedBudgetMapping.budgetNumber,
    notes: parsedBudgetMapping.notes || null
  });
}

export async function updateBudgetMapping(
  ownerId: string,
  budgetMappingId: string,
  formData: FormData
) {
  const writableDatabase = requireDatabase();
  const parsedBudgetMapping = parseBudgetMappingFormData(formData);

  await writableDatabase
    .update(budgetMappings)
    .set({
      productName: parsedBudgetMapping.productName,
      budgetName: parsedBudgetMapping.budgetName,
      budgetNumber: parsedBudgetMapping.budgetNumber,
      notes: parsedBudgetMapping.notes || null,
      updatedAt: new Date()
    })
    .where(and(eq(budgetMappings.ownerId, ownerId), eq(budgetMappings.id, budgetMappingId)));
}

export async function deleteBudgetMapping(ownerId: string, budgetMappingId: string) {
  const writableDatabase = requireDatabase();

  await writableDatabase
    .delete(budgetMappings)
    .where(and(eq(budgetMappings.ownerId, ownerId), eq(budgetMappings.id, budgetMappingId)));
}

export async function listTimeEntries(ownerId: string, filters: TimeEntryFilters = {}) {
  if (!database) {
    if (isProduction) {
      throw new Error("DATABASE_URL is required to list time entries in production.");
    }

    return listFallbackTimeEntries(filters);
  }

  const filterConditions = [eq(timeEntries.ownerId, ownerId)];

  if (filters.weekNumber) {
    filterConditions.push(eq(timeEntries.weekNumber, filters.weekNumber));
  }

  if (filters.productName) {
    filterConditions.push(ilike(timeEntries.productName, `%${filters.productName}%`));
  }

  if (filters.budgetName) {
    filterConditions.push(ilike(timeEntries.budgetName, `%${filters.budgetName}%`));
  }

  if (filters.budgetNumber) {
    filterConditions.push(ilike(timeEntries.budgetNumber, `%${filters.budgetNumber}%`));
  }

  if (filters.startDate) {
    filterConditions.push(gte(timeEntries.entryDate, filters.startDate));
  }

  if (filters.endDate) {
    filterConditions.push(lte(timeEntries.entryDate, filters.endDate));
  }

  return database
    .select()
    .from(timeEntries)
    .where(and(...filterConditions))
    .orderBy(desc(timeEntries.entryDate), desc(timeEntries.createdAt));
}

export async function getTimeEntry(ownerId: string, timeEntryId: string) {
  if (!database) {
    if (isProduction) {
      throw new Error("DATABASE_URL is required to load time entries in production.");
    }

    const fallbackTimeEntries = await listFallbackTimeEntries();

    return (
      fallbackTimeEntries.find(
        (timeEntry) => timeEntry.ownerId === ownerId && timeEntry.id === timeEntryId
      ) ?? null
    );
  }

  const [timeEntry] = await database
    .select()
    .from(timeEntries)
    .where(and(eq(timeEntries.ownerId, ownerId), eq(timeEntries.id, timeEntryId)))
    .limit(1);

  return timeEntry ?? null;
}

export async function createTimeEntry(ownerId: string, formData: FormData) {
  const writableDatabase = requireDatabase();
  const parsedTimeEntry = parseTimeEntryFormData(formData);

  await writableDatabase.insert(timeEntries).values({
    ownerId,
    allocationBatchId: null,
    budgetMappingId: parsedTimeEntry.budgetMappingId,
    recurringTemplateId: null,
    entryDate: parsedTimeEntry.entryDate,
    startTime: parsedTimeEntry.startTime,
    endTime: parsedTimeEntry.endTime,
    productName: parsedTimeEntry.productName,
    budgetName: parsedTimeEntry.budgetName,
    budgetNumber: parsedTimeEntry.budgetNumber,
    taskDescription: parsedTimeEntry.taskDescription,
    hoursWorked: parsedTimeEntry.hoursWorked,
    weekNumber: parsedTimeEntry.weekNumber,
    notes: parsedTimeEntry.notes
  });
}

export async function updateTimeEntry(ownerId: string, timeEntryId: string, formData: FormData) {
  const writableDatabase = requireDatabase();
  const parsedTimeEntry = parseTimeEntryFormData(formData);

  await writableDatabase
    .update(timeEntries)
    .set({
      budgetMappingId: parsedTimeEntry.budgetMappingId,
      entryDate: parsedTimeEntry.entryDate,
      startTime: parsedTimeEntry.startTime,
      endTime: parsedTimeEntry.endTime,
      productName: parsedTimeEntry.productName,
      budgetName: parsedTimeEntry.budgetName,
      budgetNumber: parsedTimeEntry.budgetNumber,
      taskDescription: parsedTimeEntry.taskDescription,
      hoursWorked: parsedTimeEntry.hoursWorked,
      weekNumber: parsedTimeEntry.weekNumber,
      notes: parsedTimeEntry.notes,
      updatedAt: new Date()
    })
    .where(and(eq(timeEntries.ownerId, ownerId), eq(timeEntries.id, timeEntryId)));
}

export async function getWeekTotalHours(ownerId: string, weekNumber: number, weekYear: number) {
  const weekTimeEntries = await listTimeEntries(ownerId, { weekNumber, weekYear });

  return weekTimeEntries.reduce(
    (totalHours, timeEntry) => totalHours + Number(timeEntry.hoursWorked),
    0
  );
}

export async function deleteTimeEntry(ownerId: string, timeEntryId: string) {
  const writableDatabase = requireDatabase();

  await writableDatabase
    .delete(timeEntries)
    .where(and(eq(timeEntries.ownerId, ownerId), eq(timeEntries.id, timeEntryId)));
}

export async function getDashboardStats(ownerId: string) {
  const currentWeekNumber = getIsoWeekNumber(getTodayInputValue());
  const currentWeekYear = getIsoWeekYear(getTodayInputValue());
  const recentEntries = await listTimeEntries(ownerId);
  const currentWeekEntries = recentEntries.filter(
    (timeEntry) =>
      timeEntry.weekNumber === currentWeekNumber &&
      getIsoWeekYear(timeEntry.entryDate) === currentWeekYear
  );
  const fallbackEntry = recentEntries[0];
  const displayedWeekNumber =
    currentWeekEntries.length > 0 ? currentWeekNumber : fallbackEntry?.weekNumber ?? currentWeekNumber;
  const displayedWeekYear =
    currentWeekEntries.length > 0
      ? currentWeekYear
      : fallbackEntry
        ? getIsoWeekYear(fallbackEntry.entryDate)
        : currentWeekYear;
  const displayedWeekEntries = recentEntries.filter(
    (timeEntry) =>
      timeEntry.weekNumber === displayedWeekNumber &&
      getIsoWeekYear(timeEntry.entryDate) === displayedWeekYear
  );
  const currentWeekTotalHours = displayedWeekEntries.reduce(
    (totalHours, timeEntry) => totalHours + Number(timeEntry.hoursWorked),
    0
  );

  return {
    currentWeekNumber: displayedWeekNumber,
    currentWeekYear: displayedWeekYear,
    currentWeekTotalHours,
    recentEntries: recentEntries.slice(0, 5)
  };
}

export async function getLifetimeHours(ownerId: string) {
  if (!database) {
    if (isProduction) {
      throw new Error("DATABASE_URL is required to load lifetime hours in production.");
    }

    return readImportedWorkbookLifetimeHours();
  }

  const [result] = await database
    .select({
      totalHours: sql<string>`coalesce(sum(${timeEntries.hoursWorked}), 0)`
    })
    .from(timeEntries)
    .where(eq(timeEntries.ownerId, ownerId));

  return Number(result?.totalHours ?? 0);
}

export async function getWeeklySummary(ownerId: string, weekNumber: number) {
  return getWeeklySummaryForYear(ownerId, weekNumber, getIsoWeekYear(getTodayInputValue()));
}

export async function getWeeklySummaryForYear(
  ownerId: string,
  weekNumber: number,
  weekYear: number
) {
  if (!database) {
    if (isProduction) {
      throw new Error("DATABASE_URL is required to load weekly summaries in production.");
    }

    const weeklyTimeEntries = await listFallbackTimeEntries({ weekNumber, weekYear });
    const groupedHoursByProjectName = new Map<string, number>();

    for (const timeEntry of weeklyTimeEntries) {
      const projectName = getAccountantProjectName(timeEntry.productName, timeEntry.budgetName);

      groupedHoursByProjectName.set(
        projectName,
        (groupedHoursByProjectName.get(projectName) ?? 0) + Number(timeEntry.hoursWorked)
      );
    }

    const groupedHours = Array.from(groupedHoursByProjectName.entries())
      .map(([projectName, totalHours]) => ({ projectName, budgetName: projectName, totalHours }))
      .filter((groupedHour) => groupedHour.totalHours > 0)
      .sort((firstGroupedHour, secondGroupedHour) =>
        firstGroupedHour.projectName.localeCompare(secondGroupedHour.projectName)
      );

    return {
      totalHours: groupedHours.reduce(
        (currentTotalHours, groupedHour) => currentTotalHours + groupedHour.totalHours,
        0
      ),
      groupedHours
    };
  }

  const groupedHours = await database
    .select({
      productName: timeEntries.productName,
      budgetName: timeEntries.budgetName,
      totalHours: sql<string>`sum(${timeEntries.hoursWorked})`
    })
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.ownerId, ownerId),
        eq(timeEntries.weekNumber, weekNumber),
        sql`extract(isoyear from ${timeEntries.entryDate}) = ${weekYear}`
      )
    )
    .groupBy(timeEntries.productName, timeEntries.budgetName);

  const groupedHoursByProjectName = new Map<string, number>();

  for (const groupedHour of groupedHours) {
    const projectName = getAccountantProjectName(groupedHour.productName, groupedHour.budgetName);

    groupedHoursByProjectName.set(
      projectName,
      (groupedHoursByProjectName.get(projectName) ?? 0) + Number(groupedHour.totalHours)
    );
  }

  const billingGroupedHours = Array.from(groupedHoursByProjectName.entries())
    .map(([projectName, totalHours]) => ({ projectName, budgetName: projectName, totalHours }))
    .filter((groupedHour) => groupedHour.totalHours > 0)
    .sort((firstGroupedHour, secondGroupedHour) =>
      firstGroupedHour.projectName.localeCompare(secondGroupedHour.projectName)
    );

  const totalHours = billingGroupedHours.reduce(
    (currentTotalHours, groupedHour) => currentTotalHours + Number(groupedHour.totalHours),
    0
  );

  return {
    totalHours,
    groupedHours: billingGroupedHours.map((groupedHour) => ({
      projectName: groupedHour.projectName,
      budgetName: groupedHour.budgetName,
      totalHours: Number(groupedHour.totalHours)
    }))
  };
}
