import { and, eq } from "drizzle-orm";
import { createHash } from "node:crypto";
import { z } from "zod";

import { database } from "@/db";
import { timeEntries, weeklyAllocationBatches } from "@/db/schema";
import { isProduction } from "@/lib/config";
import { getIsoWeekDateRange } from "@/lib/utils/dates";

import {
  getWeekTotalHours,
  listBudgetMappings,
  requireDatabase,
  type BudgetMappingRecord
} from "./time-tracking";

const weeklyCapHours = 20;

const allocationPlanRowSchema = z.object({
  budgetMappingId: z.string().uuid(),
  taskDescription: z.string().trim().min(1, "Task description is required."),
  notes: z.string().trim().optional().or(z.literal("")),
  hoursWorked: z.coerce
    .number()
    .positive("Allocated hours must be greater than 0.")
    .max(999.99, "Allocated hours are too large.")
});

const weeklyAllocationPlanSchema = z.object({
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Entry date is required."),
  rows: z.array(
    z.object({
      included: z.boolean(),
      budgetMappingId: z.string().uuid(),
      taskDescription: z.string().trim().min(1, "Task description is required."),
      notes: z.string().trim().optional().or(z.literal("")),
      hoursWorked: z.coerce
        .number()
        .positive("Allocated hours must be greater than 0.")
        .max(999.99, "Allocated hours are too large.")
    })
  )
});

export type WeeklyAllocationBatchRecord = typeof weeklyAllocationBatches.$inferSelect;

export type WeeklyAllocationCreateResult = {
  created: boolean;
  duplicateBlocked: boolean;
  batchId: string | null;
  insertedCount: number;
  selectedWeekNumber: number;
  selectedWeekYear: number;
  existingHours: number;
  remainingHours: number;
};

export type WeeklyAllocationPreview = {
  weeklyCapHours: number;
  existingHours: number;
  remainingHours: number;
};

type ParsedWeeklyAllocationRow = z.infer<typeof allocationPlanRowSchema>;

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function toHoursValue(hours: number) {
  return Math.round(hours * 100) / 100;
}

function getPlanHash(plan: {
  entryDate: string;
  selectedWeekNumber: number;
  selectedWeekYear: number;
  rows: ParsedWeeklyAllocationRow[];
}) {
  return createHash("sha256")
    .update(JSON.stringify(plan))
    .digest("hex");
}

function validateEntryDateInWeek(entryDate: string, weekNumber: number, weekYear: number) {
  const { startDate, endDate } = getIsoWeekDateRange(weekNumber, weekYear);

  if (entryDate < startDate || entryDate > endDate) {
    throw new Error("Allocation entry date must fall within the selected ISO week.");
  }
}

async function getBudgetMappingsById(ownerId: string) {
  const budgetMappings = await listBudgetMappings(ownerId);

  return new Map(
    budgetMappings.map((budgetMapping) => [budgetMapping.id, budgetMapping as BudgetMappingRecord])
  );
}

export async function getWeeklyAllocationPreview(ownerId: string, weekNumber: number, weekYear: number): Promise<WeeklyAllocationPreview> {
  const existingHours = await getWeekTotalHours(ownerId, weekNumber, weekYear);

  return {
    weeklyCapHours,
    existingHours: toHoursValue(existingHours),
    remainingHours: toHoursValue(Math.max(0, weeklyCapHours - existingHours))
  };
}

export async function createWeeklyAllocationEntries(
  ownerId: string,
  weekNumber: number,
  weekYear: number,
  formData: FormData
): Promise<WeeklyAllocationCreateResult> {
  const writableDatabase = requireDatabase();
  const parsedPlan = weeklyAllocationPlanSchema.parse({
    entryDate: formData.get("entryDate"),
    rows: JSON.parse(String(formData.get("allocationPlan") ?? "[]"))
  });
  const selectedRows = parsedPlan.rows
    .map((row) => ({
      ...allocationPlanRowSchema.parse(row),
      included: row.included
    }))
    .filter((row) => row.included);

  if (selectedRows.length === 0) {
    throw new Error("Select at least one project/task row for allocation.");
  }

  validateEntryDateInWeek(parsedPlan.entryDate, weekNumber, weekYear);

  const existingHours = toHoursValue(await getWeekTotalHours(ownerId, weekNumber, weekYear));
  const remainingHours = toHoursValue(Math.max(0, weeklyCapHours - existingHours));

  if (remainingHours <= 0) {
    throw new Error("This week already has 20 hours or more saved.");
  }

  const selectedHours = toHoursValue(
    selectedRows.reduce((currentTotalHours, row) => currentTotalHours + Number(row.hoursWorked), 0)
  );

  if (Math.abs(selectedHours - remainingHours) > 0.01) {
    throw new Error("Allocated hours must match the remaining weekly hours exactly.");
  }

  const duplicateRowKeys = new Set<string>();
  for (const row of selectedRows) {
    const rowKey = [
      row.budgetMappingId,
      normalizeText(row.taskDescription).toLowerCase(),
      normalizeText(String(row.notes ?? "")).toLowerCase()
    ].join("\u0000");

    if (duplicateRowKeys.has(rowKey)) {
      throw new Error("Allocation rows must be unique.");
    }

    duplicateRowKeys.add(rowKey);
  }

  const budgetMappingsById = await getBudgetMappingsById(ownerId);

  const normalizedRows = selectedRows.map((row) => {
    const budgetMapping = budgetMappingsById.get(row.budgetMappingId);

    if (!budgetMapping) {
      throw new Error("One or more selected budget mappings no longer exist.");
    }

    return {
      budgetMappingId: row.budgetMappingId,
      productName: budgetMapping.productName,
      budgetName: budgetMapping.budgetName,
      budgetNumber: budgetMapping.budgetNumber,
      taskDescription: normalizeText(row.taskDescription),
      notes: normalizeText(String(row.notes ?? "")) || null,
      hoursWorked: toHoursValue(Number(row.hoursWorked))
    };
  });

  const planHash = getPlanHash({
    entryDate: parsedPlan.entryDate,
    selectedWeekNumber: weekNumber,
    selectedWeekYear: weekYear,
    rows: normalizedRows.map((row) => ({
      included: true,
      budgetMappingId: row.budgetMappingId,
      taskDescription: row.taskDescription,
      notes: row.notes ?? "",
      hoursWorked: row.hoursWorked
    }))
  });

  return writableDatabase.transaction(async (transaction) => {
    const [createdBatch] = await transaction
      .insert(weeklyAllocationBatches)
      .values({
        ownerId,
        weekYear,
        weekNumber,
        weeklyCapHours: weeklyCapHours.toFixed(2),
        existingHours: existingHours.toFixed(2),
        remainingHours: remainingHours.toFixed(2),
        planHash,
        updatedAt: new Date()
      })
      .onConflictDoNothing({
        target: [
          weeklyAllocationBatches.ownerId,
          weeklyAllocationBatches.weekYear,
          weeklyAllocationBatches.weekNumber,
          weeklyAllocationBatches.planHash
        ]
      })
      .returning({ id: weeklyAllocationBatches.id });

    if (!createdBatch) {
      return {
        created: false,
        duplicateBlocked: true,
        batchId: null,
        insertedCount: 0,
        selectedWeekNumber: weekNumber,
        selectedWeekYear: weekYear,
        existingHours,
        remainingHours
      };
    }

    await transaction.insert(timeEntries).values(
      normalizedRows.map((row) => ({
        ownerId,
        allocationBatchId: createdBatch.id,
        budgetMappingId: row.budgetMappingId,
        recurringTemplateId: null,
        entryDate: parsedPlan.entryDate,
        startTime: null,
        endTime: null,
        productName: row.productName,
        budgetName: row.budgetName,
        budgetNumber: row.budgetNumber,
        taskDescription: row.taskDescription,
        hoursWorked: row.hoursWorked.toFixed(2),
        weekNumber,
        notes: row.notes
      }))
    );

    return {
      created: true,
      duplicateBlocked: false,
      batchId: createdBatch.id,
      insertedCount: normalizedRows.length,
      selectedWeekNumber: weekNumber,
      selectedWeekYear: weekYear,
      existingHours,
      remainingHours
    };
  });
}

export async function hasWeeklyAllocationBatch(
  ownerId: string,
  weekNumber: number,
  weekYear: number,
  planHash: string
) {
  if (!database) {
    if (isProduction) {
      throw new Error("DATABASE_URL is required to load allocation batches in production.");
    }

    return null;
  }

  const [batch] = await database
    .select()
    .from(weeklyAllocationBatches)
    .where(
      and(
        eq(weeklyAllocationBatches.ownerId, ownerId),
        eq(weeklyAllocationBatches.weekYear, weekYear),
        eq(weeklyAllocationBatches.weekNumber, weekNumber),
        eq(weeklyAllocationBatches.planHash, planHash)
      )
    )
    .limit(1);

  return batch ?? null;
}
