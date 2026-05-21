import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { database } from "@/db";
import { recurringTimeEntryTemplates, timeEntries } from "@/db/schema";
import { isProduction } from "@/lib/config";
import { getIsoWeekDateRange } from "@/lib/utils/dates";

import {
  getTimeEntry,
  listBudgetMappings,
  listTimeEntries,
  requireDatabase,
  type BudgetMappingRecord,
  type TimeEntryRecord
} from "./time-tracking";

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

export type RecurringTemplateRecord = typeof recurringTimeEntryTemplates.$inferSelect;

export type RecurringApplyResult = {
  attemptedCount: number;
  insertedCount: number;
  skippedCount: number;
  selectedWeekNumber: number;
  selectedWeekYear: number;
};

export type RecurringPreviewEntry = {
  entryDate: string;
  hoursWorked: number;
  notes: string | null;
  productName: string;
  budgetName: string;
  budgetNumber: string;
  taskDescription: string;
  recurringTemplateId: string;
  status: "existing" | "pending";
  timeEntryId: string | null;
};

export type RecurringApplyPreview = {
  attemptedCount: number;
  existingEntries: RecurringPreviewEntry[];
  pendingEntries: RecurringPreviewEntry[];
  existingHours: number;
  pendingHours: number;
  selectedWeekNumber: number;
  selectedWeekYear: number;
};

export type RecurringTemplateCreationResult = {
  created: boolean;
  templateId: string;
};

const isoDayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const recurringDayOptions = isoDayNames.map((dayName, index) => ({
  label: dayName,
  value: index + 1
}));

function normalizeTemplateKey(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
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

function getIsoDayOfWeek(entryDate: string) {
  const dayNumber = new Date(`${entryDate}T00:00:00.000Z`).getUTCDay();

  return dayNumber === 0 ? 7 : dayNumber;
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

export async function createRecurringTemplateFromTimeEntry(
  ownerId: string,
  timeEntryId: string
): Promise<RecurringTemplateCreationResult> {
  const writableDatabase = requireDatabase();
  const timeEntry = await getTimeEntry(ownerId, timeEntryId);

  if (!timeEntry) {
    throw new Error("Time entry not found.");
  }

  const existingTemplate = await getRecurringTemplateBySourceTimeEntryId(ownerId, timeEntryId);

  if (existingTemplate) {
    return {
      created: false,
      templateId: existingTemplate.id
    };
  }

  const [createdTemplate] = await writableDatabase
    .insert(recurringTimeEntryTemplates)
    .values({
      ownerId,
      sourceTimeEntryId: timeEntryId,
      taskDescription: timeEntry.taskDescription,
      productName: timeEntry.productName,
      budgetName: timeEntry.budgetName,
      budgetNumber: timeEntry.budgetNumber,
      dayOfWeek: getIsoDayOfWeek(timeEntry.entryDate),
      hoursWorked: Number(timeEntry.hoursWorked).toFixed(2),
      notes: timeEntry.notes || null,
      startDate: timeEntry.entryDate,
      endDate: null,
      isActive: true
    })
    .onConflictDoNothing({
      target: [recurringTimeEntryTemplates.ownerId, recurringTimeEntryTemplates.sourceTimeEntryId]
    })
    .returning({ id: recurringTimeEntryTemplates.id });

  if (createdTemplate) {
    return {
      created: true,
      templateId: createdTemplate.id
    };
  }

  const existingRecurringTemplate = await getRecurringTemplateBySourceTimeEntryId(ownerId, timeEntryId);

  if (!existingRecurringTemplate) {
    throw new Error("Recurring template could not be created.");
  }

  return {
    created: false,
    templateId: existingRecurringTemplate.id
  };
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
  selectedWeekYear: number
) {
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
  selectedWeekYear: number
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
    selectedWeekYear
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
