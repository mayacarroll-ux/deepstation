import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { database } from "@/db";
import { recurringTimeEntryTemplates, timeEntries } from "@/db/schema";
import { isProduction } from "@/lib/config";
import { getIsoWeekDateRange } from "@/lib/utils/dates";

import { listBudgetMappings, requireDatabase, type BudgetMappingRecord, type TimeEntryRecord } from "./time-tracking";

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
  selectedWeekNumber: number;
  selectedWeekYear: number;
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
    selectedWeekNumber,
    selectedWeekYear
  };
}
