import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image")
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state")
  },
  (accountTable) => [
    primaryKey({
      columns: [accountTable.provider, accountTable.providerAccountId]
    })
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull()
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull()
  },
  (verificationTokenTable) => [
    primaryKey({
      columns: [verificationTokenTable.identifier, verificationTokenTable.token]
    })
  ]
);

export const authenticators = pgTable(
  "authenticators",
  {
    credentialID: text("credential_id").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("provider_account_id").notNull(),
    credentialPublicKey: text("credential_public_key").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credential_device_type").notNull(),
    credentialBackedUp: boolean("credential_backed_up").notNull(),
    transports: text("transports")
  },
  (authenticatorTable) => [
    primaryKey({
      columns: [authenticatorTable.userId, authenticatorTable.credentialID]
    })
  ]
);

export const budgetMappings = pgTable(
  "budget_mappings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productName: text("product_name").notNull(),
    budgetName: text("budget_name").notNull(),
    budgetNumber: text("budget_number").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull()
  },
  (budgetMappingTable) => [
    uniqueIndex("budget_mapping_owner_product_budget_unique").on(
      budgetMappingTable.ownerId,
      budgetMappingTable.productName,
      budgetMappingTable.budgetName,
      budgetMappingTable.budgetNumber
    )
  ]
);

export const timeEntries = pgTable("time_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  budgetMappingId: uuid("budget_mapping_id").references(() => budgetMappings.id, {
    onDelete: "set null"
  }),
  recurringTemplateId: uuid("recurring_template_id").references(
    () => recurringTimeEntryTemplates.id,
    {
      onDelete: "set null"
    }
  ),
  entryDate: date("entry_date", { mode: "string" }).notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  productName: text("product_name").notNull(),
  budgetName: text("budget_name").notNull(),
  budgetNumber: text("budget_number").notNull(),
  taskDescription: text("task_description").notNull(),
  hoursWorked: numeric("hours_worked", { precision: 5, scale: 2 }).notNull(),
  weekNumber: integer("week_number").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull()
}, (timeEntryTable) => [
  uniqueIndex("time_entry_owner_recurring_date_unique").on(
    timeEntryTable.ownerId,
    timeEntryTable.recurringTemplateId,
    timeEntryTable.entryDate
  )
]);

export const recurringTimeEntryTemplates = pgTable(
  "recurring_time_entry_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    taskDescription: text("task_description").notNull(),
    productName: text("product_name").notNull(),
    budgetName: text("budget_name").notNull(),
    budgetNumber: text("budget_number").notNull(),
    dayOfWeek: integer("day_of_week").notNull(),
    hoursWorked: numeric("hours_worked", { precision: 5, scale: 2 }).notNull(),
    notes: text("notes"),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull()
  }
);

export const workdayDayStatuses = pgTable(
  "workday_day_statuses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entryDate: date("entry_date", { mode: "string" }).notNull(),
    isEntered: boolean("is_entered").default(false).notNull(),
    enteredAt: timestamp("entered_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull()
  },
  (workdayDayStatusTable) => [
    uniqueIndex("workday_day_status_owner_date_unique").on(
      workdayDayStatusTable.ownerId,
      workdayDayStatusTable.entryDate
    )
  ]
);

export const workdayWeekStatuses = pgTable(
  "workday_week_statuses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weekYear: integer("week_year").notNull(),
    weekNumber: integer("week_number").notNull(),
    isEntered: boolean("is_entered").default(false).notNull(),
    enteredAt: timestamp("entered_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull()
  },
  (workdayWeekStatusTable) => [
    uniqueIndex("workday_week_status_owner_week_unique").on(
      workdayWeekStatusTable.ownerId,
      workdayWeekStatusTable.weekYear,
      workdayWeekStatusTable.weekNumber
    )
  ]
);
