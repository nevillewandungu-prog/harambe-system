import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";

// Members table - core entity
export const members = sqliteTable("members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberNumber: text("member_number").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  idNumber: text("id_number"),
  dateOfBirth: integer("date_of_birth", { mode: "timestamp" }),
  address: text("address"),
  joinedAt: integer("joined_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  // Security: 2FA enabled
  twoFactorEnabled: integer("two_factor_enabled", { mode: "boolean" }).default(false),
  twoFactorSecret: text("two_factor_secret"),
  passwordHash: text("password_hash"),
  lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => [
  // Indexes for common queries
  index("idx_members_member_number").on(table.memberNumber),
  index("idx_members_is_active").on(table.isActive),
  index("idx_members_joined_at").on(table.joinedAt),
  index("idx_members_phone").on(table.phone),
]);

// Credit checks table - for loan default prevention
export const creditChecks = sqliteTable("credit_checks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id").notNull().references(() => members.id),
  creditScore: integer("credit_score"),
  incomeLevel: real("income_level"),
  existingLoans: real("existing_loans"),
  repaymentHistory: text("repayment_history"), // JSON
  status: text("status").notNull().default("pending"), // pending, passed, failed
  checkedAt: integer("checked_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  checkedBy: text("checked_by"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => [
  index("idx_credit_checks_member_id").on(table.memberId),
  index("idx_credit_checks_status").on(table.status),
]);

// Loan guarantors table - for loan default prevention
export const guarantors = sqliteTable("guarantors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  loanId: integer("loan_id").notNull().references(() => loans.id),
  memberId: integer("member_id").notNull().references(() => members.id),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  guaranteeAmount: real("guarantee_amount"),
  acceptedAt: integer("accepted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => [
  index("idx_guarantors_loan_id").on(table.loanId),
  index("idx_guarantors_member_id").on(table.memberId),
  index("idx_guarantors_status").on(table.status),
]);

// Penalties table - for late payment handling
export const penalties = sqliteTable("penalties", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id").notNull().references(() => members.id),
  loanId: integer("loan_id").references(() => loans.id),
  penaltyType: text("penalty_type").notNull(), // late_payment, early_repayment, default
  amount: real("amount").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"), // pending, waived, paid
  appliedAt: integer("applied_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  paidAt: integer("paid_at", { mode: "timestamp" }),
  waivedAt: integer("waived_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => [
  index("idx_penalties_member_id").on(table.memberId),
  index("idx_penalties_loan_id").on(table.loanId),
  index("idx_penalties_status").on(table.status),
]);

// Reminders/Messages table - for automatic notifications
export const reminders = sqliteTable("reminders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id").references(() => members.id),
  loanId: integer("loan_id").references(() => loans.id),
  reminderType: text("reminder_type").notNull(), // payment_due, payment_overdue, meeting, general
  channel: text("channel").notNull(), // sms, email, both
  message: text("message").notNull(),
  scheduledFor: integer("scheduled_for", { mode: "timestamp" }).$defaultFn(() => new Date()),
  sentAt: integer("sent_at", { mode: "timestamp" }),
  status: text("status").notNull().default("pending"), // pending, sent, failed
  response: text("response"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => [
  index("idx_reminders_member_id").on(table.memberId),
  index("idx_reminders_loan_id").on(table.loanId),
  index("idx_reminders_status").on(table.status),
  index("idx_reminders_scheduled_for").on(table.scheduledFor),
]);

// Savings/Deposits table
export const savings = sqliteTable("savings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id").notNull().references(() => members.id),
  accountNumber: text("account_number").notNull(),
  savingsType: text("savings_type").notNull().default("ordinary"), // ordinary, fixed, voluntary
  balance: real("balance").notNull().default(0),
  interestRate: real("interest_rate").default(0),
  openedAt: integer("opened_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => [
  index("idx_savings_member_id").on(table.memberId),
  index("idx_savings_account_number").on(table.accountNumber),
  index("idx_savings_is_active").on(table.isActive),
]);

// Loans table
export const loans = sqliteTable("loans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id").notNull().references(() => members.id),
  loanNumber: text("loan_number").notNull().unique(),
  principalAmount: real("principal_amount").notNull(),
  interestRate: real("interest_rate").notNull(),
  interestAmount: real("interest_amount").notNull().default(0),
  totalAmount: real("total_amount").notNull(),
  paidAmount: real("paid_amount").notNull().default(0),
  balance: real("balance").notNull(),
  termMonths: integer("term_months").notNull(),
  installmentAmount: real("installment_amount").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, disbursed, fully_paid, defaulted, written_off
  purpose: text("purpose"),
  guarantor1Id: integer("guarantor_1_id").references(() => members.id),
  guarantor2Id: integer("guarantor_2_id").references(() => members.id),
  appliedAt: integer("applied_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  disbursedAt: integer("disbursed_at", { mode: "timestamp" }),
  dueDate: integer("due_date", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => [
  index("idx_loans_member_id").on(table.memberId),
  index("idx_loans_loan_number").on(table.loanNumber),
  index("idx_loans_status").on(table.status),
  index("idx_loans_due_date").on(table.dueDate),
  index("idx_loans_disbursed_at").on(table.disbursedAt),
]);

// Transactions table - for all financial movements
export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id").references(() => members.id),
  savingsId: integer("savings_id").references(() => savings.id),
  loanId: integer("loan_id").references(() => loans.id),
  transactionNumber: text("transaction_number").notNull().unique(),
  transactionType: text("transaction_type").notNull(), // deposit, withdrawal, loan_disbursement, loan_repayment, interest, penalty, fee
  amount: real("amount").notNull(),
  balanceAfter: real("balance_after").notNull(),
  reference: text("reference"),
  description: text("description"),
  transactionDate: integer("transaction_date", { mode: "timestamp" }).$defaultFn(() => new Date()),
  recordedAt: integer("recorded_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  recordedBy: text("recorded_by"),
  isReversed: integer("is_reversed", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => [
  index("idx_transactions_member_id").on(table.memberId),
  index("idx_transactions_savings_id").on(table.savingsId),
  index("idx_transactions_loan_id").on(table.loanId),
  index("idx_transactions_transaction_date").on(table.transactionDate),
  index("idx_transactions_transaction_type").on(table.transactionType),
  index("idx_transactions_transaction_number").on(table.transactionNumber),
]);

// Reports table - for storing generated reports
export const reports = sqliteTable("reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reportType: text("report_type").notNull(), // monthly_summary, member_statement, loan_portfolio, savings_summary, profit_loss
  periodStart: integer("period_start", { mode: "timestamp" }).notNull(),
  periodEnd: integer("period_end", { mode: "timestamp" }).notNull(),
  reportData: text("report_data"), // JSON string of report contents
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  generatedAt: integer("generated_at", { mode: "timestamp" }),
  generatedBy: text("generated_by"),
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => [
  index("idx_reports_report_type").on(table.reportType),
  index("idx_reports_period_start").on(table.periodStart),
  index("idx_reports_period_end").on(table.periodEnd),
  index("idx_reports_status").on(table.status),
]);

// Loan restructuring table - for flexible repayment plans
export const loanRestructuring = sqliteTable("loan_restructuring", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  loanId: integer("loan_id").notNull().references(() => loans.id),
  restructuringType: text("restructuring_type").notNull(), // extension, reduction, deferment, refinancing
  originalTerm: integer("original_term"),
  newTerm: integer("new_term"),
  originalInstallment: real("original_installment"),
  newInstallment: real("new_installment"),
  reason: text("reason"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  approvedBy: text("approved_by"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => [
  index("idx_loan_restructuring_loan_id").on(table.loanId),
  index("idx_loan_restructuring_status").on(table.status),
]);

// Backups table - for data backup tracking
export const backups = sqliteTable("backups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  backupType: text("backup_type").notNull(), // full, incremental, manual
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"),
  status: text("status").notNull().default("pending"), // pending, completed, failed
  startedAt: integer("started_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  storageLocation: text("storage_location"),
  verifiedAt: integer("verified_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => [
  index("idx_backups_status").on(table.status),
  index("idx_backups_backup_type").on(table.backupType),
]);

// Member campaigns table - for attracting new members
export const campaigns = sqliteTable("campaigns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(), // recruitment, savings, loan_promo
  description: text("description"),
  targetAmount: real("target_amount"),
  startDate: integer("start_date", { mode: "timestamp" }).$defaultFn(() => new Date()),
  endDate: integer("end_date", { mode: "timestamp" }),
  status: text("status").notNull().default("active"), // draft, active, completed, cancelled
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => [
  index("idx_campaigns_status").on(table.status),
  index("idx_campaigns_type").on(table.type),
]);

// Financial partners table - for partnerships
export const partners = sqliteTable("partners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(), // bank, microfinance, corporate
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  status: text("status").notNull().default("active"), // active, inactive
  agreementStart: integer("agreement_start", { mode: "timestamp" }),
  agreementEnd: integer("agreement_end", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => [
  index("idx_partners_status").on(table.status),
  index("idx_partners_type").on(table.type),
]);

// Financial literacy resources
export const resources = sqliteTable("resources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  type: text("type").notNull(), // article, video, guide
  category: text("category").notNull(), // savings, loans, investment, general
  content: text("content"),
  fileUrl: text("file_url"),
  publishedAt: integer("published_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => [
  index("idx_resources_type").on(table.type),
  index("idx_resources_category").on(table.category),
  index("idx_resources_is_active").on(table.isActive),
]);

// Audit logs - for transparency and fraud prevention
export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  action: text("action").notNull(), // login, logout, create, update, delete, approve, reject
  entityType: text("entity_type").notNull(), // member, loan, savings, transaction, report
  entityId: integer("entity_id"),
  oldValue: text("old_value"), // JSON
  newValue: text("new_value"), // JSON
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  status: text("status").notNull().default("success"), // success, failed
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => [
  index("idx_audit_logs_user_id").on(table.userId),
  index("idx_audit_logs_action").on(table.action),
  index("idx_audit_logs_entity_type").on(table.entityType),
  index("idx_audit_logs_created_at").on(table.createdAt),
]);

// Compliance tracking - for SASRA regulations
export const complianceRecords = sqliteTable("compliance_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  requirement: text("requirement").notNull(),
  category: text("category").notNull(), // capital_adequacy, liquidity, governance, reporting
  status: text("status").notNull().default("compliant"), // compliant, non_compliant, in_progress
  dueDate: integer("due_date", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  evidence: text("evidence"),
  notes: text("notes"),
  reviewedBy: text("reviewed_by"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => [
  index("idx_compliance_status").on(table.status),
  index("idx_compliance_category").on(table.category),
  index("idx_compliance_due_date").on(table.dueDate),
]);

// System settings table
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value"),
  description: text("description"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => [
  index("idx_settings_key").on(table.key),
]);
