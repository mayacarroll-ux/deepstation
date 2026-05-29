export type WeeklySummaryEmailSettingsRecord = {
  id: string;
  ownerId: string;
  managerEmail: string;
  accountingEmails: string[];
  ccEmails: string[];
  bccEmails: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type WeeklySummaryEmailScheduleRecord = {
  id: string;
  ownerId: string;
  enabled: boolean;
  dayOfWeek: number;
  timeOfDay: string;
  timeZone: string;
  createdAt: Date;
  updatedAt: Date;
};

export type WeeklySummaryEmailStatusRecord = {
  id: string;
  ownerId: string;
  weekYear: number;
  weekNumber: number;
  lastSentAt: Date;
  lastMessageId: string | null;
  lastSendMode: string;
  toRecipients: string[];
  ccRecipients: string[];
  sendCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type WeeklySummaryEmailPreview = {
  subject: string;
  bodyText: string;
  toRecipients: string[];
  ccRecipients: string[];
  bccRecipients: string[];
};

export type WeeklySummaryEmailSendResult = {
  sent: boolean;
  duplicateBlocked: boolean;
  weekNumber: number;
  weekYear: number;
  messageId: string | null;
  recipientCount: number;
};

export type WeeklySummaryEmailSendMode = "manual" | "resend" | "auto";
