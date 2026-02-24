import { mysqlTable, int, varchar, text, timestamp, boolean, index, float, serial } from "drizzle-orm/mysql-core";

// Helper for default timestamps
const timestamps = {
  createdAt: timestamp("created_at").default(new Date()),
  updatedAt: timestamp("updated_at").default(new Date()),
};

// Members table - core entity
export const members = mysqlTable("members", {
  id: serial("id").primaryKey(),
  memberNumber: varchar("member_number", { length: 50 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  idNumber: varchar("id_number", { length: 50 }),
  dateOfBirth: timestamp("date_of_birth"),
  address: text("address"),
  joinedAt: timestamp("joined_at").default(new Date()),
  isActive: boolean("is_active").default(true),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: text("two_factor_secret"),
  passwordHash: text("password_hash"),
  lastLoginAt: timestamp("last_login_at"),
  failedLoginAttempts: int("failed_login_attempts").default(0),
  ...timestamps,
}, (table) => [
  index("idx_members_member_number").on(table.memberNumber),
  index("idx_members_is_active").on(table.isActive),
  index("idx_members_joined_at").on(table.joinedAt),
  index("idx_members_phone").on(table.phone),
]);

// Credit checks table
export const creditChecks = mysqlTable("credit_checks", {
  id: serial("id").primaryKey(),
  memberId: int("member_id").notNull().references(() => members.id),
  creditScore: int("credit_score"),
  incomeLevel: float("income_level"),
  existingLoans: float("existing_loans"),
  repaymentHistory: text("repayment_history"),
  status: varchar("status", { length: 20 }).default("pending"),
  checkedAt: timestamp("checked_at").default(new Date()),
  checkedBy: varchar("checked_by", { length: 100 }),
  notes: text("notes"),
  ...timestamps,
}, (table) => [
  index("idx_credit_checks_member_id").on(table.memberId),
  index("idx_credit_checks_status").on(table.status),
]);

// Loan guarantors table
export const guarantors = mysqlTable("guarantors", {
  id: serial("id").primaryKey(),
  loanId: int("loan_id").notNull().references(() => loans.id),
  memberId: int("member_id").notNull().references(() => members.id),
  status: varchar("status", { length: 20 }).default("pending"),
  guaranteeAmount: float("guarantee_amount"),
  acceptedAt: timestamp("accepted_at"),
  ...timestamps,
}, (table) => [
  index("idx_guarantors_loan_id").on(table.loanId),
  index("idx_guarantors_member_id").on(table.memberId),
  index("idx_guarantors_status").on(table.status),
]);

// Penalties table
export const penalties = mysqlTable("penalties", {
  id: serial("id").primaryKey(),
  memberId: int("member_id").notNull().references(() => members.id),
  loanId: int("loan_id").references(() => loans.id),
  penaltyType: varchar("penalty_type", { length: 50 }).notNull(),
  amount: float("amount").notNull(),
  reason: text("reason"),
  status: varchar("status", { length: 20 }).default("pending"),
  appliedAt: timestamp("applied_at").default(new Date()),
  paidAt: timestamp("paid_at"),
  waivedAt: timestamp("waived_at"),
  ...timestamps,
}, (table) => [
  index("idx_penalties_member_id").on(table.memberId),
  index("idx_penalties_loan_id").on(table.loanId),
  index("idx_penalties_status").on(table.status),
]);

// Reminders table
export const reminders = mysqlTable("reminders", {
  id: serial("id").primaryKey(),
  memberId: int("member_id").references(() => members.id),
  loanId: int("loan_id").references(() => loans.id),
  reminderType: varchar("reminder_type", { length: 50 }).notNull(),
  channel: varchar("channel", { length: 20 }).notNull(),
  message: text("message").notNull(),
  scheduledFor: timestamp("scheduled_for").default(new Date()),
  sentAt: timestamp("sent_at"),
  status: varchar("status", { length: 20 }).default("pending"),
  response: text("response"),
  ...timestamps,
}, (table) => [
  index("idx_reminders_member_id").on(table.memberId),
  index("idx_reminders_loan_id").on(table.loanId),
  index("idx_reminders_status").on(table.status),
  index("idx_reminders_scheduled_for").on(table.scheduledFor),
]);

// Savings table
export const savings = mysqlTable("savings", {
  id: serial("id").primaryKey(),
  memberId: int("member_id").notNull().references(() => members.id),
  accountNumber: varchar("account_number", { length: 50 }).notNull(),
  savingsType: varchar("savings_type", { length: 50 }).default("ordinary"),
  balance: float("balance").notNull().default(0),
  interestRate: float("interest_rate").default(0),
  openedAt: timestamp("opened_at").default(new Date()),
  isActive: boolean("is_active").default(true),
  ...timestamps,
}, (table) => [
  index("idx_savings_member_id").on(table.memberId),
  index("idx_savings_account_number").on(table.accountNumber),
  index("idx_savings_is_active").on(table.isActive),
]);

// Loans table
export const loans = mysqlTable("loans", {
  id: serial("id").primaryKey(),
  memberId: int("member_id").notNull().references(() => members.id),
  loanNumber: varchar("loan_number", { length: 50 }).notNull().unique(),
  principalAmount: float("principal_amount").notNull(),
  interestRate: float("interest_rate").notNull(),
  interestAmount: float("interest_amount").notNull().default(0),
  totalAmount: float("total_amount").notNull(),
  paidAmount: float("paid_amount").notNull().default(0),
  balance: float("balance").notNull(),
  termMonths: int("term_months").notNull(),
  installmentAmount: float("installment_amount").notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  purpose: text("purpose"),
  guarantor1Id: int("guarantor_1_id").references(() => members.id),
  guarantor2Id: int("guarantor_2_id").references(() => members.id),
  appliedAt: timestamp("applied_at").default(new Date()),
  approvedAt: timestamp("approved_at"),
  disbursedAt: timestamp("disbursed_at"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  ...timestamps,
}, (table) => [
  index("idx_loans_member_id").on(table.memberId),
  index("idx_loans_loan_number").on(table.loanNumber),
  index("idx_loans_status").on(table.status),
  index("idx_loans_due_date").on(table.dueDate),
  index("idx_loans_disbursed_at").on(table.disbursedAt),
]);

// Transactions table
export const transactions = mysqlTable("transactions", {
  id: serial("id").primaryKey(),
  memberId: int("member_id").references(() => members.id),
  savingsId: int("savings_id").references(() => savings.id),
  loanId: int("loan_id").references(() => loans.id),
  transactionNumber: varchar("transaction_number", { length: 50 }).notNull().unique(),
  transactionType: varchar("transaction_type", { length: 50 }).notNull(),
  amount: float("amount").notNull(),
  balanceAfter: float("balance_after").notNull(),
  reference: varchar("reference", { length: 100 }),
  description: text("description"),
  transactionDate: timestamp("transaction_date").default(new Date()),
  recordedAt: timestamp("recorded_at").default(new Date()),
  recordedBy: varchar("recorded_by", { length: 100 }),
  isReversed: boolean("is_reversed").default(false),
  ...timestamps,
}, (table) => [
  index("idx_transactions_member_id").on(table.memberId),
  index("idx_transactions_savings_id").on(table.savingsId),
  index("idx_transactions_loan_id").on(table.loanId),
  index("idx_transactions_transaction_date").on(table.transactionDate),
  index("idx_transactions_transaction_type").on(table.transactionType),
  index("idx_transactions_transaction_number").on(table.transactionNumber),
]);

// Reports table
export const reports = mysqlTable("reports", {
  id: serial("id").primaryKey(),
  reportType: varchar("report_type", { length: 50 }).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  reportData: text("report_data"),
  status: varchar("status", { length: 20 }).default("pending"),
  generatedAt: timestamp("generated_at"),
  generatedBy: varchar("generated_by", { length: 100 }),
  errorMessage: text("error_message"),
  ...timestamps,
}, (table) => [
  index("idx_reports_report_type").on(table.reportType),
  index("idx_reports_period_start").on(table.periodStart),
  index("idx_reports_period_end").on(table.periodEnd),
  index("idx_reports_status").on(table.status),
]);

// Loan restructuring table
export const loanRestructuring = mysqlTable("loan_restructuring", {
  id: serial("id").primaryKey(),
  loanId: int("loan_id").notNull().references(() => loans.id),
  restructuringType: varchar("restructuring_type", { length: 50 }).notNull(),
  originalTerm: int("original_term"),
  newTerm: int("new_term"),
  originalInstallment: float("original_installment"),
  newInstallment: float("new_installment"),
  reason: text("reason"),
  status: varchar("status", { length: 20 }).default("pending"),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by", { length: 100 }),
  ...timestamps,
}, (table) => [
  index("idx_loan_restructuring_loan_id").on(table.loanId),
  index("idx_loan_restructuring_status").on(table.status),
]);

// Backups table
export const backups = mysqlTable("backups", {
  id: serial("id").primaryKey(),
  backupType: varchar("backup_type", { length: 50 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: int("file_size"),
  status: varchar("status", { length: 20 }).default("pending"),
  startedAt: timestamp("started_at").default(new Date()),
  completedAt: timestamp("completed_at"),
  storageLocation: text("storage_location"),
  verifiedAt: timestamp("verified_at"),
  ...timestamps,
}, (table) => [
  index("idx_backups_status").on(table.status),
  index("idx_backups_backup_type").on(table.backupType),
]);

// Campaigns table
export const campaigns = mysqlTable("campaigns", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  description: text("description"),
  targetAmount: float("target_amount"),
  startDate: timestamp("start_date").default(new Date()),
  endDate: timestamp("end_date"),
  status: varchar("status", { length: 20 }).default("active"),
  ...timestamps,
}, (table) => [
  index("idx_campaigns_status").on(table.status),
  index("idx_campaigns_type").on(table.type),
]);

// Partners table
export const partners = mysqlTable("partners", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  contactPerson: varchar("contact_person", { length: 100 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  status: varchar("status", { length: 20 }).default("active"),
  agreementStart: timestamp("agreement_start"),
  agreementEnd: timestamp("agreement_end"),
  ...timestamps,
}, (table) => [
  index("idx_partners_status").on(table.status),
  index("idx_partners_type").on(table.type),
]);

// Resources table
export const resources = mysqlTable("resources", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  content: text("content"),
  fileUrl: varchar("file_url", { length: 500 }),
  publishedAt: timestamp("published_at").default(new Date()),
  isActive: boolean("is_active").default(true),
  ...timestamps,
}, (table) => [
  index("idx_resources_type").on(table.type),
  index("idx_resources_category").on(table.category),
  index("idx_resources_is_active").on(table.isActive),
]);

// Audit logs table
export const auditLogs = mysqlTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: int("user_id"),
  action: varchar("action", { length: 50 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: int("entity_id"),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  status: varchar("status", { length: 20 }).default("success"),
  errorMessage: text("error_message"),
  ...timestamps,
}, (table) => [
  index("idx_audit_logs_user_id").on(table.userId),
  index("idx_audit_logs_action").on(table.action),
  index("idx_audit_logs_entity_type").on(table.entityType),
  index("idx_audit_logs_created_at").on(table.createdAt),
]);

// Compliance records table
export const complianceRecords = mysqlTable("compliance_records", {
  id: serial("id").primaryKey(),
  requirement: text("requirement").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).default("compliant"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  evidence: text("evidence"),
  notes: text("notes"),
  reviewedBy: varchar("reviewed_by", { length: 100 }),
  ...timestamps,
}, (table) => [
  index("idx_compliance_status").on(table.status),
  index("idx_compliance_category").on(table.category),
  index("idx_compliance_due_date").on(table.dueDate),
]);

// Settings table
export const settings = mysqlTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  description: text("description"),
  updatedAt: timestamp("updated_at").default(new Date()),
}, (table) => [
  index("idx_settings_key").on(table.key),
]);

// Type exports
export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type Loan = typeof loans.$inferSelect;
export type NewLoan = typeof loans.$inferInsert;
export type Savings = typeof savings.$inferSelect;
export type NewSavings = typeof savings.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
