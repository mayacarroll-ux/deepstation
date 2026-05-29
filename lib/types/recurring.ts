export type RecurringTemplateRecord = {
  id: string;
  ownerId: string;
  sourceTimeEntryId: string | null;
  taskDescription: string;
  productName: string;
  budgetName: string;
  budgetNumber: string;
  dayOfWeek: number;
  hoursWorked: string;
  notes: string | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

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
  duplicate: boolean;
  templateId: string;
};

export type RecurringTemplateSourceInput = {
  sourceTimeEntryId?: string | null;
  taskDescription: string;
  productName: string;
  budgetName: string;
  budgetNumber: string;
  dayOfWeek: number;
  hoursWorked: number | string;
  notes?: string | null;
  startDate: string;
  endDate?: string | null;
  isActive?: boolean;
};
