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
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => [
  // Indexes for common queries
  index("idx_members_member_number").on(table.memberNumber),
  index("idx_members_is_active").on(table.isActive),
  index("idx_members_joined_at").on(table.joinedAt),
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
