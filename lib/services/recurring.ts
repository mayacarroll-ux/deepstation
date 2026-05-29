import { and, asc, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { database } from "@/db";
import { recurringTimeEntryTemplates, timeEntries } from "@/db/schema";
import { isProduction } from "@/lib/config";
import type {
  BudgetMappingRecord,
  TimeEntryRecord
} from "@/lib/types/time-tracking";
import type {
  RecurringApplyPreview,
  RecurringApplyResult,
  RecurringPreviewEntry,
  RecurringTemplateCreationResult,
  RecurringTemplateRecord,
  RecurringTemplateSourceInput
} from "@/lib/types/recurring";
import { getIsoDayOfWeek, getIsoWeekDateRange } from "@/lib/utils/dates";

import {
  getTimeEntry,
  listBudgetMappings,
  listTimeEntries,
  requireDatabase,
} from "./time-tracking";

export type {
  RecurringApplyPreview,
  RecurringApplyResult,
  RecurringPreviewEntry,
  RecurringTemplateCreationResult,
  RecurringTemplateRecord,
  RecurringTemplateSourceInput
} from "@/lib/types/recurring";

export const recurringTemplateFormSchema = z.object({
  templateId: z.string().uuid().optional().or(z.literal("")),
  taskDescription: z.string().trim().min(1, "Title / task description is required."),
  productName: z.string().trim().min(1, "Product Name is required."),
  budgetName: z.string().trim().min(1, "Budget Name is required."),
  budgetNumber: z.string().trim().min(1, "Budget # is required."),
  dayOfWeek: z.coerce
    .number()
    .int("Day of week must be a whole number.")
    .min(1, "Day of week is required.")
    .max(7, "Day of week cannot be greater than 7."),
  hoursWorked: z.coerce
    .number()
    .positive("Hours Worked must be greater than 0.")
    .max(999.99, "Hours Worked is too large."),
  notes: z.string().trim().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date is required."),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  isActive: z.string().optional()
});

function normalizeTemplateKey(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function buildRecurringTemplateDuplicateKey(
  productName: string,
  taskDescription: string,
  dayOfWeek: number,
  startDate: string
) {
  return [
    normalizeTemplateKey(productName),
    normalizeTemplateKey(taskDescription),
    String(dayOfWeek),
    startDate
  ].join("\u0000");
}

function normalizeRecurringTemplateHours(hoursWorked: number | string) {
  return Number(hoursWorked).toFixed(2);
}

function getWeekDateForDayOfWeek(weekNumber: number, weekYear: number, dayOfWeek: number) {
  const { startDate } = getIsoWeekDateRange(weekNumber, weekYear);
  const weekStartDate = new Date(`${startDate}T00:00:00.000Z`);
  weekStartDate.setUTCDate(weekStartDate.getUTCDate() + (dayOfWeek - 1));

  return weekStartDate.toISOString().slice(0, 10);
}

function buildBudgetMappingKey(
  productName: string,
  budgetName: string,
  budgetNumber: string
) {
  return [
    normalizeTemplateKey(productName),
    normalizeTemplateKey(budgetName),
    normalizeTemplateKey(budgetNumber)
  ].join("\u0000");
}

async function findRecurringTemplateDuplicate(
  ownerId: string,
  input: Pick<
    RecurringTemplateSourceInput,
    "productName" | "taskDescription" | "dayOfWeek" | "startDate"
  >
) {
  const writableDatabase = requireDatabase();
  const normalizedProductName = normalizeTemplateKey(input.productName);
  const normalizedTaskDescription = normalizeTemplateKey(input.taskDescription);

  const [existingRecurringTemplate] = await writableDatabase
    .select({ id: recurringTimeEntryTemplates.id })
    .from(recurringTimeEntryTemplates)
    .where(
      and(
        eq(recurringTimeEntryTemplates.ownerId, ownerId),
        sql`lower(trim(${recurringTimeEntryTemplates.productName})) = ${normalizedProductName}`,
        sql`lower(trim(${recurringTimeEntryTemplates.taskDescription})) = ${normalizedTaskDescription}`,
        eq(recurringTimeEntryTemplates.dayOfWeek, input.dayOfWeek),
        eq(recurringTimeEntryTemplates.startDate, input.startDate)
      )
    )
    .limit(1);

  return existingRecurringTemplate ?? null;
}

export async function listRecurringTemplates(ownerId: string) {
  if (!database) {
    if (isProduction) {
      throw new Error("DATABASE_URL is required to list recurring templates in production.");
    }

    return [] as RecurringTemplateRecord[];
  }

  return database
    .select()
    .from(recurringTimeEntryTemplates)
    .where(eq(recurringTimeEntryTemplates.ownerId, ownerId))
    .orderBy(
      desc(recurringTimeEntryTemplates.isActive),
      asc(recurringTimeEntryTemplates.dayOfWeek),
      asc(recurringTimeEntryTemplates.taskDescription)
    );
}

export async function getRecurringTemplate(ownerId: string, templateId: string) {
  if (!database) {
    if (isProduction) {
      throw new Error("DATABASE_URL is required to load recurring templates in production.");
    }

    const fallbackTemplates = await listRecurringTemplates(ownerId);

    return (
      fallbackTemplates.find(
        (recurringTemplate) =>
          recurringTemplate.ownerId === ownerId && recurringTemplate.id === templateId
      ) ?? null
    );
  }

  const [recurringTemplate] = await database
    .select()
    .from(recurringTimeEntryTemplates)
    .where(
      and(
        eq(recurringTimeEntryTemplates.ownerId, ownerId),
        eq(recurringTimeEntryTemplates.id, templateId)
      )
    )
    .limit(1);

  return recurringTemplate ?? null;
}

function parseRecurringTemplateFormData(formData: FormData) {
  const parsedRecurringTemplate = recurringTemplateFormSchema.parse({
    templateId: formData.get("templateId"),
    taskDescription: formData.get("taskDescription"),
    productName: formData.get("productName"),
    budgetName: formData.get("budgetName"),
    budgetNumber: formData.get("budgetNumber"),
    dayOfWeek: formData.get("dayOfWeek"),
    hoursWorked: formData.get("hoursWorked"),
    notes: formData.get("notes"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    isActive: formData.get("isActive")
  });

  return {
    ...parsedRecurringTemplate,
    templateId: parsedRecurringTemplate.templateId || null,
    hoursWorked: parsedRecurringTemplate.hoursWorked.toFixed(2),
    endDate: parsedRecurringTemplate.endDate || null,
    isActive: parsedRecurringTemplate.isActive === "on"
  };
}

export async function createRecurringTemplate(ownerId: string, formData: FormData) {
  const writableDatabase = requireDatabase();
  const parsedRecurringTemplate = parseRecurringTemplateFormData(formData);

  await writableDatabase.insert(recurringTimeEntryTemplates).values({
    ownerId,
    taskDescription: parsedRecurringTemplate.taskDescription,
    productName: parsedRecurringTemplate.productName,
    budgetName: parsedRecurringTemplate.budgetName,
    budgetNumber: parsedRecurringTemplate.budgetNumber,
    dayOfWeek: parsedRecurringTemplate.dayOfWeek,
    hoursWorked: parsedRecurringTemplate.hoursWorked,
    notes: parsedRecurringTemplate.notes || null,
    startDate: parsedRecurringTemplate.startDate,
    endDate: parsedRecurringTemplate.endDate,
    isActive: parsedRecurringTemplate.isActive
  });
}

export async function updateRecurringTemplate(
  ownerId: string,
  templateId: string,
  formData: FormData
) {
  const writableDatabase = requireDatabase();
  const parsedRecurringTemplate = parseRecurringTemplateFormData(formData);

  await writableDatabase
    .update(recurringTimeEntryTemplates)
    .set({
      taskDescription: parsedRecurringTemplate.taskDescription,
      productName: parsedRecurringTemplate.productName,
      budgetName: parsedRecurringTemplate.budgetName,
      budgetNumber: parsedRecurringTemplate.budgetNumber,
      dayOfWeek: parsedRecurringTemplate.dayOfWeek,
      hoursWorked: parsedRecurringTemplate.hoursWorked,
      notes: parsedRecurringTemplate.notes || null,
      startDate: parsedRecurringTemplate.startDate,
      endDate: parsedRecurringTemplate.endDate,
      isActive: parsedRecurringTemplate.isActive,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(recurringTimeEntryTemplates.ownerId, ownerId),
        eq(recurringTimeEntryTemplates.id, templateId)
      )
    );
}

export async function createRecurringTemplateFromTimeEntryDetails(
  ownerId: string,
  sourceTimeEntry: RecurringTemplateSourceInput
): Promise<RecurringTemplateCreationResult> {
  const writableDatabase = requireDatabase();
  const duplicateRecurringTemplate = await findRecurringTemplateDuplicate(ownerId, sourceTimeEntry);

  if (duplicateRecurringTemplate) {
    return {
      created: false,
      duplicate: true,
      templateId: duplicateRecurringTemplate.id
    };
  }

  const [createdTemplate] = await writableDatabase
    .insert(recurringTimeEntryTemplates)
    .values({
      ownerId,
      sourceTimeEntryId: sourceTimeEntry.sourceTimeEntryId ?? null,
      taskDescription: sourceTimeEntry.taskDescription,
      productName: sourceTimeEntry.productName,
      budgetName: sourceTimeEntry.budgetName,
      budgetNumber: sourceTimeEntry.budgetNumber,
      dayOfWeek: sourceTimeEntry.dayOfWeek,
      hoursWorked: normalizeRecurringTemplateHours(sourceTimeEntry.hoursWorked),
      notes: sourceTimeEntry.notes || null,
      startDate: sourceTimeEntry.startDate,
      endDate: sourceTimeEntry.endDate || null,
      isActive: sourceTimeEntry.isActive ?? true
    })
    .onConflictDoNothing({
      target: [recurringTimeEntryTemplates.ownerId, recurringTimeEntryTemplates.sourceTimeEntryId]
    })
    .returning({ id: recurringTimeEntryTemplates.id });

  if (createdTemplate) {
    return {
      created: true,
      duplicate: false,
      templateId: createdTemplate.id
    };
  }

  if (sourceTimeEntry.sourceTimeEntryId) {
    const existingRecurringTemplate = await getRecurringTemplateBySourceTimeEntryId(
      ownerId,
      sourceTimeEntry.sourceTimeEntryId
    );

    if (existingRecurringTemplate) {
      return {
        created: false,
        duplicate: false,
        templateId: existingRecurringTemplate.id
      };
    }
  }

  const matchingRecurringTemplate = await findRecurringTemplateDuplicate(ownerId, sourceTimeEntry);

  if (matchingRecurringTemplate) {
    return {
      created: false,
      duplicate: true,
      templateId: matchingRecurringTemplate.id
    };
  }

  throw new Error("Recurring template could not be created.");
}

export async function createRecurringTemplateFromTimeEntry(
  ownerId: string,
  timeEntryId: string
): Promise<RecurringTemplateCreationResult> {
  const timeEntry = await getTimeEntry(ownerId, timeEntryId);

  if (!timeEntry) {
    throw new Error("Time entry not found.");
  }

  const existingTemplate = await getRecurringTemplateBySourceTimeEntryId(ownerId, timeEntryId);

  if (existingTemplate) {
    return {
      created: false,
      duplicate: false,
      templateId: existingTemplate.id
    };
  }

  return createRecurringTemplateFromTimeEntryDetails(ownerId, {
    sourceTimeEntryId: timeEntryId,
    taskDescription: timeEntry.taskDescription,
    productName: timeEntry.productName,
    budgetName: timeEntry.budgetName,
    budgetNumber: timeEntry.budgetNumber,
    dayOfWeek: getIsoDayOfWeek(timeEntry.entryDate),
    hoursWorked: Number(timeEntry.hoursWorked),
    notes: timeEntry.notes,
    startDate: timeEntry.entryDate,
    endDate: null,
    isActive: true
  });
}

export async function setRecurringTemplateActive(
  ownerId: string,
  templateId: string,
  isActive: boolean
) {
  const writableDatabase = requireDatabase();

  await writableDatabase
    .update(recurringTimeEntryTemplates)
    .set({
      isActive,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(recurringTimeEntryTemplates.ownerId, ownerId),
        eq(recurringTimeEntryTemplates.id, templateId)
      )
    );
}

function buildCandidateTimeEntryRows(
  ownerId: string,
  templates: RecurringTemplateRecord[],
  budgetMappings: BudgetMappingRecord[],
  selectedWeekNumber: number,
  selectedWeekYear: number,
  excludedRecurringTemplateIds: string[] = []
) {
  const excludedRecurringTemplateIdSet = new Set(excludedRecurringTemplateIds);
  const budgetMappingIdsByKey = new Map(
    budgetMappings.map((budgetMapping) => [
      buildBudgetMappingKey(
        budgetMapping.productName,
        budgetMapping.budgetName,
        budgetMapping.budgetNumber
      ),
      budgetMapping.id
    ])
  );

  return templates.flatMap((template) => {
    if (excludedRecurringTemplateIdSet.has(template.id)) {
      return [];
    }

    if (!template.isActive) {
      return [];
    }

    const generatedEntryDate = getWeekDateForDayOfWeek(
      selectedWeekNumber,
      selectedWeekYear,
      template.dayOfWeek
    );

    if (generatedEntryDate < template.startDate) {
      return [];
    }

    if (template.endDate && generatedEntryDate > template.endDate) {
      return [];
    }

    return [
      {
        ownerId,
        recurringTemplateId: template.id,
        budgetMappingId:
          budgetMappingIdsByKey.get(
            buildBudgetMappingKey(template.productName, template.budgetName, template.budgetNumber)
          ) ?? null,
        entryDate: generatedEntryDate,
        productName: template.productName,
        budgetName: template.budgetName,
        budgetNumber: template.budgetNumber,
        taskDescription: template.taskDescription,
        hoursWorked: Number(template.hoursWorked).toFixed(2),
        weekNumber: selectedWeekNumber,
        notes: template.notes
      }
    ];
  });
}

function getRecurringPreviewEntries(
  candidateTimeEntryRows: ReturnType<typeof buildCandidateTimeEntryRows>,
  savedTimeEntries: TimeEntryRecord[]
) {
  const savedEntriesByTemplateKey = new Map(
    savedTimeEntries
      .filter((timeEntry) => timeEntry.recurringTemplateId)
      .map((timeEntry) => [
        `${timeEntry.recurringTemplateId}\u0000${timeEntry.entryDate}`,
        timeEntry
      ])
  );

  const existingEntries: RecurringPreviewEntry[] = [];
  const pendingEntries: RecurringPreviewEntry[] = [];

  for (const candidateTimeEntry of candidateTimeEntryRows) {
    const savedTimeEntry = savedEntriesByTemplateKey.get(
      `${candidateTimeEntry.recurringTemplateId}\u0000${candidateTimeEntry.entryDate}`
    );

    const previewEntry = {
      entryDate: candidateTimeEntry.entryDate,
      hoursWorked: Number(candidateTimeEntry.hoursWorked),
      notes: candidateTimeEntry.notes || null,
      productName: candidateTimeEntry.productName,
      budgetName: candidateTimeEntry.budgetName,
      budgetNumber: candidateTimeEntry.budgetNumber,
      taskDescription: candidateTimeEntry.taskDescription,
      recurringTemplateId: candidateTimeEntry.recurringTemplateId,
      status: savedTimeEntry ? ("existing" as const) : ("pending" as const),
      timeEntryId: savedTimeEntry?.id ?? null
    };

    if (savedTimeEntry) {
      existingEntries.push(previewEntry);
      continue;
    }

    pendingEntries.push(previewEntry);
  }

  return { existingEntries, pendingEntries };
}

export async function applyRecurringTemplates(
  ownerId: string,
  selectedWeekNumber: number,
  selectedWeekYear: number,
  excludedRecurringTemplateIds: string[] = []
): Promise<RecurringApplyResult> {
  const writableDatabase = requireDatabase();
  const [templates, budgetMappings] = await Promise.all([
    listRecurringTemplates(ownerId),
    listBudgetMappings(ownerId)
  ]);
  const candidateTimeEntryRows = buildCandidateTimeEntryRows(
    ownerId,
    templates,
    budgetMappings,
    selectedWeekNumber,
    selectedWeekYear,
    excludedRecurringTemplateIds
  );

  if (candidateTimeEntryRows.length === 0) {
    return {
      attemptedCount: 0,
      insertedCount: 0,
      skippedCount: 0,
      selectedWeekNumber,
      selectedWeekYear
    };
  }

  const insertedRows = await writableDatabase
    .insert(timeEntries)
    .values(candidateTimeEntryRows)
    .onConflictDoNothing({
      target: [timeEntries.ownerId, timeEntries.recurringTemplateId, timeEntries.entryDate]
    })
    .returning({ id: timeEntries.id });

  return {
    attemptedCount: candidateTimeEntryRows.length,
    insertedCount: insertedRows.length,
    skippedCount: candidateTimeEntryRows.length - insertedRows.length,
    selectedWeekNumber,
    selectedWeekYear
  };
}

export async function getRecurringApplyPreview(
  ownerId: string,
  selectedWeekNumber: number,
  selectedWeekYear: number
): Promise<RecurringApplyPreview> {
  const [templates, budgetMappings, savedTimeEntries] = await Promise.all([
    listRecurringTemplates(ownerId),
    listBudgetMappings(ownerId),
    listTimeEntries(ownerId, {
      weekNumber: selectedWeekNumber,
      weekYear: selectedWeekYear
    })
  ]);
  const candidateTimeEntryRows = buildCandidateTimeEntryRows(
    ownerId,
    templates,
    budgetMappings,
    selectedWeekNumber,
    selectedWeekYear
  );
  const { existingEntries, pendingEntries } = getRecurringPreviewEntries(
    candidateTimeEntryRows,
    savedTimeEntries
  );

  return {
    attemptedCount: candidateTimeEntryRows.length,
    existingEntries,
    pendingEntries,
    existingHours: existingEntries.reduce((totalHours, entry) => totalHours + entry.hoursWorked, 0),
    pendingHours: pendingEntries.reduce((totalHours, entry) => totalHours + entry.hoursWorked, 0),
    selectedWeekNumber,
    selectedWeekYear
  };
}

export async function getRecurringTemplateBySourceTimeEntryId(
  ownerId: string,
  sourceTimeEntryId: string
) {
  if (!database) {
    if (isProduction) {
      throw new Error("DATABASE_URL is required to load recurring templates in production.");
    }

    const fallbackTemplates = await listRecurringTemplates(ownerId);

    return (
      fallbackTemplates.find(
        (recurringTemplate) =>
          recurringTemplate.sourceTimeEntryId === sourceTimeEntryId &&
          recurringTemplate.ownerId === ownerId
      ) ?? null
    );
  }

  const [recurringTemplate] = await database
    .select()
    .from(recurringTimeEntryTemplates)
    .where(
      and(
        eq(recurringTimeEntryTemplates.ownerId, ownerId),
        eq(recurringTimeEntryTemplates.sourceTimeEntryId, sourceTimeEntryId)
      )
    )
    .limit(1);

  return recurringTemplate ?? null;
}
