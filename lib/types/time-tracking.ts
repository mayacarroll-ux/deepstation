export type BudgetMappingRecord = {
  id: string;
  ownerId: string;
  productName: string;
  budgetName: string;
  budgetNumber: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TimeEntryRecord = {
  id: string;
  ownerId: string;
  allocationBatchId: string | null;
  budgetMappingId: string | null;
  recurringTemplateId: string | null;
  entryDate: string;
  startTime: string | null;
  endTime: string | null;
  productName: string;
  budgetName: string;
  budgetNumber: string;
  taskDescription: string;
  hoursWorked: string;
  weekNumber: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
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
