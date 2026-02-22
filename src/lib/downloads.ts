import { db } from "@/db";
import { 
  members, 
  savings, 
  loans, 
  transactions,
  penalties,
  creditChecks,
  guarantors,
  reminders,
  auditLogs,
  complianceRecords,
  campaigns,
  partners
} from "@/db/schema";
import { eq, and, gte, lte, desc, sql, like, or } from "drizzle-orm";

/**
 * Download types available in the system
 */
export type DownloadType = 
  | "members"
  | "savings"
  | "loans"
  | "transactions"
  | "penalties"
  | "credit_checks"
  | "guarantors"
  | "reminders"
  | "audit_logs"
  | "compliance"
  | "campaigns"
  | "partners"
  | "monthly_summary"
  | "loan Portfolio"
  | "member_statement";

/**
 * Format types for downloads
 */
export type DownloadFormat = "csv" | "json" | "excel";

/**
 * Download options
 */
export interface DownloadOptions {
  type: DownloadType;
  format: DownloadFormat;
  startDate?: Date;
  endDate?: Date;
  memberId?: number;
  status?: string;
  search?: string;
}

/**
 * Convert data to CSV format
 */
function toCSV(data: Record<string, unknown>[], headers?: string[]): string {
  if (data.length === 0) return "";
  
  const keys = headers || Object.keys(data[0]);
  const csvRows = [keys.join(",")];
  
  for (const row of data) {
    const values = keys.map((key) => {
      const value = row[key];
      const stringValue = value === null || value === undefined 
        ? "" 
        : String(value);
      // Escape quotes and wrap in quotes if contains comma
      const escaped = stringValue.replace(/"/g, '""');
      return stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")
        ? `"${escaped}"`
        : escaped;
    });
    csvRows.push(values.join(","));
  }
  
  return csvRows.join("\n");
}

/**
 * Format date for display
 */
function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

/**
 * Format currency
 */
function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "0.00";
  return amount.toFixed(2);
}

/**
 * Fetch members data
 */
async function fetchMembers(options: DownloadOptions) {
  let query = db.select().from(members).$dynamic();
  const conditions = [];
  
  if (options.status === "active") {
    conditions.push(eq(members.isActive, true));
  } else if (options.status === "inactive") {
    conditions.push(eq(members.isActive, false));
  }
  
  if (options.search) {
    conditions.push(
      or(
        like(members.firstName, `%${options.search}%`),
        like(members.lastName, `%${options.search}%`),
        like(members.memberNumber, `%${options.search}%`),
        like(members.phone, `%${options.search}%`)
      )
    );
  }
  
  if (conditions.length > 0) {
    query = db.select().from(members).where(and(...conditions)).$dynamic();
  }
  
  const results = await query.orderBy(desc(members.joinedAt));
  
  return results.map((m) => ({
    "Member Number": m.memberNumber,
    "First Name": m.firstName,
    "Last Name": m.lastName,
    Email: m.email || "",
    Phone: m.phone || "",
    "ID Number": m.idNumber || "",
    "Date of Birth": formatDate(m.dateOfBirth),
    Address: m.address || "",
    "Joined Date": formatDate(m.joinedAt),
    Status: m.isActive ? "Active" : "Inactive",
    "2FA Enabled": m.twoFactorEnabled ? "Yes" : "No",
    "Last Login": formatDate(m.lastLoginAt),
  }));
}

/**
 * Fetch savings data
 */
async function fetchSavings(options: DownloadOptions) {
  let query = db.select().from(savings).$dynamic();
  const conditions = [];
  
  if (options.memberId) {
    conditions.push(eq(savings.memberId, options.memberId));
  }
  
  if (options.status === "active") {
    conditions.push(eq(savings.isActive, true));
  } else if (options.status === "inactive") {
    conditions.push(eq(savings.isActive, false));
  }
  
  if (conditions.length > 0) {
    query = db.select().from(savings).where(and(...conditions)).$dynamic();
  }
  
  const results = await query.orderBy(desc(savings.openedAt));
  
  // Join with members to get names
  const memberData = await db.select({
    id: members.id,
    memberNumber: members.memberNumber,
    firstName: members.firstName,
    lastName: members.lastName,
  }).from(members);
  
  const memberMap = new Map(memberData.map(m => [m.id, m]));
  
  return results.map((s) => {
    const member = memberMap.get(s.memberId);
    return {
      "Account Number": s.accountNumber,
      "Member Number": member?.memberNumber || "",
      "Member Name": member ? `${member.firstName} ${member.lastName}` : "",
      "Savings Type": s.savingsType,
      Balance: formatCurrency(s.balance),
      "Interest Rate": s.interestRate ? `${s.interestRate}%` : "0%",
      "Opened Date": formatDate(s.openedAt),
      Status: s.isActive ? "Active" : "Closed",
    };
  });
}

/**
 * Fetch loans data
 */
async function fetchLoans(options: DownloadOptions) {
  let query = db.select().from(loans).$dynamic();
  const conditions = [];
  
  if (options.memberId) {
    conditions.push(eq(loans.memberId, options.memberId));
  }
  
  if (options.status && ["pending", "approved", "disbursed", "fully_paid", "defaulted", "written_off"].includes(options.status)) {
    conditions.push(eq(loans.status, options.status));
  }
  
  if (options.startDate && options.endDate) {
    conditions.push(
      and(
        gte(loans.appliedAt, options.startDate),
        lte(loans.appliedAt, options.endDate)
      )
    );
  }
  
  if (conditions.length > 0) {
    query = db.select().from(loans).where(and(...conditions)).$dynamic();
  }
  
  const results = await query.orderBy(desc(loans.appliedAt));
  
  // Join with members to get names
  const memberData = await db.select({
    id: members.id,
    memberNumber: members.memberNumber,
    firstName: members.firstName,
    lastName: members.lastName,
  }).from(members);
  
  const memberMap = new Map(memberData.map(m => [m.id, m]));
  
  return results.map((l) => ({
    "Loan Number": l.loanNumber,
    "Member Number": memberMap.get(l.memberId)?.memberNumber || "",
    "Member Name": memberMap.get(l.memberId) 
      ? `${memberMap.get(l.memberId)?.firstName} ${memberMap.get(l.memberId)?.lastName}` 
      : "",
    "Principal Amount": formatCurrency(l.principalAmount),
    "Interest Rate": `${l.interestRate}%`,
    "Interest Amount": formatCurrency(l.interestAmount),
    "Total Amount": formatCurrency(l.totalAmount),
    "Paid Amount": formatCurrency(l.paidAmount),
    Balance: formatCurrency(l.balance),
    "Term (Months)": l.termMonths,
    "Installment Amount": formatCurrency(l.installmentAmount),
    Purpose: l.purpose || "",
    Status: l.status,
    "Applied Date": formatDate(l.appliedAt),
    "Approved Date": formatDate(l.approvedAt),
    "Disbursed Date": formatDate(l.disbursedAt),
    "Due Date": formatDate(l.dueDate),
  }));
}

/**
 * Fetch transactions data
 */
async function fetchTransactions(options: DownloadOptions) {
  let query = db.select().from(transactions).$dynamic();
  const conditions = [];
  
  if (options.memberId) {
    conditions.push(eq(transactions.memberId, options.memberId));
  }
  
  if (options.startDate && options.endDate) {
    conditions.push(
      and(
        gte(transactions.transactionDate, options.startDate),
        lte(transactions.transactionDate, options.endDate)
      )
    );
  }
  
  if (options.status) {
    conditions.push(eq(transactions.transactionType, options.status));
  }
  
  if (conditions.length > 0) {
    query = db.select().from(transactions).where(and(...conditions)).$dynamic();
  }
  
  const results = await query.orderBy(desc(transactions.transactionDate)).limit(10000);
  
  // Join with members to get names
  const memberData = await db.select({
    id: members.id,
    memberNumber: members.memberNumber,
    firstName: members.firstName,
    lastName: members.lastName,
  }).from(members);
  
  const memberMap = new Map(memberData.map(m => [m.id, m]));
  
  return results.map((t) => {
    const memberIdNum = t.memberId ?? 0;
    return {
      "Transaction ID": t.id,
      "Member Number": memberMap.get(memberIdNum)?.memberNumber || "",
      "Member Name": memberMap.get(memberIdNum) 
        ? `${memberMap.get(memberIdNum)?.firstName} ${memberMap.get(memberIdNum)?.lastName}` 
        : "",
      "Transaction Type": t.transactionType,
      Amount: formatCurrency(t.amount),
      Reference: t.reference || "",
      Description: t.description || "",
      "Transaction Date": formatDate(t.transactionDate),
      "Created Date": formatDate(t.createdAt),
    };
  });
}

/**
 * Fetch penalties data
 */
async function fetchPenalties(options: DownloadOptions) {
  let query = db.select().from(penalties).$dynamic();
  const conditions = [];
  
  if (options.memberId) {
    conditions.push(eq(penalties.memberId, options.memberId));
  }
  
  if (options.status && ["pending", "waived", "paid"].includes(options.status)) {
    conditions.push(eq(penalties.status, options.status));
  }
  
  if (conditions.length > 0) {
    query = db.select().from(penalties).where(and(...conditions)).$dynamic();
  }
  
  const results = await query.orderBy(desc(penalties.appliedAt));
  
  // Join with members to get names
  const memberData = await db.select({
    id: members.id,
    memberNumber: members.memberNumber,
    firstName: members.firstName,
    lastName: members.lastName,
  }).from(members);
  
  const memberMap = new Map(memberData.map(m => [m.id, m]));
  
  return results.map((p) => ({
    "Penalty ID": p.id,
    "Member Number": memberMap.get(p.memberId)?.memberNumber || "",
    "Member Name": memberMap.get(p.memberId) 
      ? `${memberMap.get(p.memberId)?.firstName} ${memberMap.get(p.memberId)?.lastName}` 
      : "",
    "Penalty Type": p.penaltyType,
    Amount: formatCurrency(p.amount),
    Reason: p.reason || "",
    Status: p.status,
    "Applied Date": formatDate(p.appliedAt),
    "Paid Date": formatDate(p.paidAt),
    "Waived Date": formatDate(p.waivedAt),
  }));
}

/**
 * Fetch credit checks data
 */
async function fetchCreditChecks(options: DownloadOptions) {
  let query = db.select().from(creditChecks).$dynamic();
  const conditions = [];
  
  if (options.memberId) {
    conditions.push(eq(creditChecks.memberId, options.memberId));
  }
  
  if (options.status && ["pending", "passed", "failed"].includes(options.status)) {
    conditions.push(eq(creditChecks.status, options.status));
  }
  
  if (conditions.length > 0) {
    query = db.select().from(creditChecks).where(and(...conditions)).$dynamic();
  }
  
  const results = await query.orderBy(desc(creditChecks.checkedAt));
  
  // Join with members to get names
  const memberData = await db.select({
    id: members.id,
    memberNumber: members.memberNumber,
    firstName: members.firstName,
    lastName: members.lastName,
  }).from(members);
  
  const memberMap = new Map(memberData.map(m => [m.id, m]));
  
  return results.map((c) => ({
    "Check ID": c.id,
    "Member Number": memberMap.get(c.memberId)?.memberNumber || "",
    "Member Name": memberMap.get(c.memberId) 
      ? `${memberMap.get(c.memberId)?.firstName} ${memberMap.get(c.memberId)?.lastName}` 
      : "",
    "Credit Score": c.creditScore ?? "N/A",
    "Income Level": c.incomeLevel ? formatCurrency(c.incomeLevel) : "N/A",
    "Existing Loans": c.existingLoans ? formatCurrency(c.existingLoans) : "N/A",
    Status: c.status,
    "Checked By": c.checkedBy || "",
    "Checked Date": formatDate(c.checkedAt),
    Notes: c.notes || "",
  }));
}

/**
 * Fetch guarantors data
 */
async function fetchGuarantors(options: DownloadOptions) {
  const results = await db.select().from(guarantors).orderBy(desc(guarantors.createdAt));
  
  // Join with members and loans
  const memberData = await db.select({
    id: members.id,
    memberNumber: members.memberNumber,
    firstName: members.firstName,
    lastName: members.lastName,
  }).from(members);
  
  const memberMap = new Map(memberData.map(m => [m.id, m]));
  
  const loanData = await db.select({
    id: loans.id,
    loanNumber: loans.loanNumber,
  }).from(loans);
  
  const loanMap = new Map(loanData.map(l => [l.id, l]));
  
  return results.map((g) => ({
    "Guarantor ID": g.id,
    "Loan Number": loanMap.get(g.loanId)?.loanNumber || "",
    "Guarantor Number": memberMap.get(g.memberId)?.memberNumber || "",
    "Guarantor Name": memberMap.get(g.memberId) 
      ? `${memberMap.get(g.memberId)?.firstName} ${memberMap.get(g.memberId)?.lastName}` 
      : "",
    "Guarantee Amount": formatCurrency(g.guaranteeAmount),
    Status: g.status,
    "Accepted Date": formatDate(g.acceptedAt),
    "Created Date": formatDate(g.createdAt),
  }));
}

/**
 * Fetch reminders data
 */
async function fetchReminders(options: DownloadOptions) {
  let query = db.select().from(reminders).$dynamic();
  const conditions = [];
  
  if (options.memberId) {
    conditions.push(eq(reminders.memberId, options.memberId));
  }
  
  if (options.status && ["pending", "sent", "failed"].includes(options.status)) {
    conditions.push(eq(reminders.status, options.status));
  }
  
  if (conditions.length > 0) {
    query = db.select().from(reminders).where(and(...conditions)).$dynamic();
  }
  
  const results = await query.orderBy(desc(reminders.scheduledFor)).limit(5000);
  
  // Join with members to get names
  const memberData = await db.select({
    id: members.id,
    memberNumber: members.memberNumber,
    firstName: members.firstName,
    lastName: members.lastName,
  }).from(members);
  
  const memberMap = new Map(memberData.map(m => [m.id, m]));
  
  return results.map((r) => ({
    "Reminder ID": r.id,
    "Member Number": r.memberId ? memberMap.get(r.memberId)?.memberNumber || "" : "N/A",
    "Member Name": r.memberId && memberMap.get(r.memberId) 
      ? `${memberMap.get(r.memberId)?.firstName} ${memberMap.get(r.memberId)?.lastName}` 
      : "N/A",
    "Reminder Type": r.reminderType,
    Channel: r.channel,
    Message: r.message.substring(0, 100) + (r.message.length > 100 ? "..." : ""),
    "Scheduled For": formatDate(r.scheduledFor),
    "Sent Date": formatDate(r.sentAt),
    Status: r.status,
    Response: r.response || "",
  }));
}

/**
 * Fetch audit logs data
 */
async function fetchAuditLogs(options: DownloadOptions) {
  let query = db.select().from(auditLogs).$dynamic();
  const conditions = [];
  
  if (options.startDate && options.endDate) {
    conditions.push(
      and(
        gte(auditLogs.createdAt, options.startDate),
        lte(auditLogs.createdAt, options.endDate)
      )
    );
  }
  
  if (options.search) {
    conditions.push(
      or(
        like(auditLogs.action, `%${options.search}%`),
        like(auditLogs.entityType, `%${options.search}%`)
      )
    );
  }
  
  if (conditions.length > 0) {
    query = db.select().from(auditLogs).where(and(...conditions)).$dynamic();
  }
  
  const results = await query.orderBy(desc(auditLogs.createdAt)).limit(5000);
  
  // Join with members to get names
  const memberData = await db.select({
    id: members.id,
    memberNumber: members.memberNumber,
    firstName: members.firstName,
    lastName: members.lastName,
  }).from(members);
  
  const memberMap = new Map(memberData.map(m => [m.id, m]));
  
  return results.map((a) => ({
    "Log ID": a.id,
    "User Number": a.userId ? memberMap.get(a.userId)?.memberNumber || "" : "System",
    "User Name": a.userId && memberMap.get(a.userId) 
      ? `${memberMap.get(a.userId)?.firstName} ${memberMap.get(a.userId)?.lastName}` 
      : "System",
    "Action": a.action,
    "Entity Type": a.entityType,
    "Entity ID": a.entityId || "",
    Details: a.oldValue ? JSON.stringify(JSON.parse(a.oldValue)) : "",
    "IP Address": a.ipAddress || "",
    "Created Date": formatDate(a.createdAt),
  }));
}

/**
 * Fetch compliance records data
 */
async function fetchCompliance(options: DownloadOptions) {
  let query = db.select().from(complianceRecords).$dynamic();
  const conditions = [];
  
  if (options.status && ["compliant", "non_compliant", "pending_review"].includes(options.status)) {
    conditions.push(eq(complianceRecords.status, options.status));
  }
  
  if (options.startDate && options.endDate) {
    conditions.push(
      and(
        gte(complianceRecords.createdAt, options.startDate),
        lte(complianceRecords.createdAt, options.endDate)
      )
    );
  }
  
  if (conditions.length > 0) {
    query = db.select().from(complianceRecords).where(and(...conditions)).$dynamic();
  }
  
  const results = await query.orderBy(desc(complianceRecords.createdAt));
  
  return results.map((c) => ({
    "Record ID": c.id,
    "Regulation Type": c.category,
    Requirement: c.requirement,
    Status: c.status,
    "Due Date": formatDate(c.dueDate),
    "Completed Date": formatDate(c.completedAt),
    Notes: c.notes || "",
    "Created Date": formatDate(c.createdAt),
  }));
}

/**
 * Fetch campaigns data
 */
async function fetchCampaigns(options: DownloadOptions) {
  let query = db.select().from(campaigns).$dynamic();
  const conditions = [];
  
  if (options.status && ["active", "completed", "planned"].includes(options.status)) {
    conditions.push(eq(campaigns.status, options.status));
  }
  
  if (conditions.length > 0) {
    query = db.select().from(campaigns).where(and(...conditions)).$dynamic();
  }
  
  const results = await query.orderBy(desc(campaigns.startDate));
  
  return results.map((c) => ({
    "Campaign ID": c.id,
    Name: c.name,
    Description: c.description || "",
    Type: c.type,
    "Target Amount": formatCurrency(c.targetAmount),
    "Raised Amount": c.targetAmount ? formatCurrency(0) : "N/A",
    "Start Date": formatDate(c.startDate),
    "End Date": formatDate(c.endDate),
    Status: c.status,
  }));
}

/**
 * Fetch partners data
 */
async function fetchPartners(options: DownloadOptions) {
  let query = db.select().from(partners).$dynamic();
  const conditions = [];
  
  if (options.status && ["active", "inactive", "pending"].includes(options.status)) {
    conditions.push(eq(partners.status, options.status));
  }
  
  if (conditions.length > 0) {
    query = db.select().from(partners).where(and(...conditions)).$dynamic();
  }
  
  const results = await query.orderBy(desc(partners.createdAt));
  
  return results.map((p) => ({
    "Partner ID": p.id,
    Name: p.name,
    Type: p.type,
    Contact: p.contactPerson || "",
    Email: p.email || "",
    Phone: p.phone || "",
    "Investment Amount": "N/A",
    "Return Rate": "N/A",
    "Start Date": formatDate(p.agreementStart),
    "End Date": formatDate(p.agreementEnd),
    Status: p.status,
    Notes: "",
  }));
}

/**
 * Generate monthly summary report data
 */
async function fetchMonthlySummary(options: DownloadOptions) {
  const startDate = options.startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endDate = options.endDate || new Date();
  
  const [
    totalMembers,
    activeMembers,
    totalSavings,
    totalLoansDisbursed,
    totalLoanRepayments,
    loanPortfolio,
    newMembers,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(members),
    db.select({ count: sql<number>`count(*)` }).from(members).where(eq(members.isActive, true)),
    db.select({ total: sql<number>`sum(${savings.balance})` }).from(savings).where(eq(savings.isActive, true)),
    db.select({ total: sql<number>`sum(${loans.principalAmount})` }).from(loans).where(
      and(gte(loans.disbursedAt, startDate), lte(loans.disbursedAt, endDate))
    ),
    db.select({ total: sql<number>`sum(${transactions.amount})` }).from(transactions).where(
      and(
        eq(transactions.transactionType, "loan_repayment"),
        gte(transactions.transactionDate, startDate),
        lte(transactions.transactionDate, endDate)
      )
    ),
    db.select({ total: sql<number>`sum(${loans.balance})` }).from(loans).where(eq(loans.status, "disbursed")),
    db.select({ count: sql<number>`count(*)` }).from(members).where(
      and(gte(members.joinedAt, startDate), lte(members.joinedAt, endDate))
    ),
  ]);
  
  return [{
    "Report Type": "Monthly Summary",
    "Period Start": formatDate(startDate),
    "Period End": formatDate(endDate),
    "Total Members": totalMembers[0]?.count || 0,
    "Active Members": activeMembers[0]?.count || 0,
    "New Members": newMembers[0]?.count || 0,
    "Total Savings": formatCurrency(totalSavings[0]?.total),
    "Loans Disbursed": formatCurrency(totalLoansDisbursed[0]?.total),
    "Loan Repayments": formatCurrency(totalLoanRepayments[0]?.total),
    "Loan Portfolio": formatCurrency(loanPortfolio[0]?.total),
    "Generated Date": new Date().toISOString().split("T")[0],
  }];
}

/**
 * Generate loan portfolio report
 */
async function fetchLoanPortfolio(options: DownloadOptions) {
  let query = db.select().from(loans).where(eq(loans.status, "disbursed")).$dynamic();
  
  if (options.startDate && options.endDate) {
    query = db.select().from(loans).where(
      and(
        eq(loans.status, "disbursed"),
        gte(loans.disbursedAt, options.startDate),
        lte(loans.disbursedAt, options.endDate)
      )
    ).$dynamic();
  }
  
  const results = await query.orderBy(desc(loans.disbursedAt));
  
  // Join with members
  const memberData = await db.select({
    id: members.id,
    memberNumber: members.memberNumber,
    firstName: members.firstName,
    lastName: members.lastName,
  }).from(members);
  
  const memberMap = new Map(memberData.map(m => [m.id, m]));
  
  return results.map((l) => ({
    "Loan Number": l.loanNumber,
    "Member Number": memberMap.get(l.memberId)?.memberNumber || "",
    "Member Name": memberMap.get(l.memberId) 
      ? `${memberMap.get(l.memberId)?.firstName} ${memberMap.get(l.memberId)?.lastName}` 
      : "",
    "Principal Amount": formatCurrency(l.principalAmount),
    "Interest Amount": formatCurrency(l.interestAmount),
    "Total Amount": formatCurrency(l.totalAmount),
    "Paid Amount": formatCurrency(l.paidAmount),
    Balance: formatCurrency(l.balance),
    "Term (Months)": l.termMonths,
    "Installment": formatCurrency(l.installmentAmount),
    Purpose: l.purpose || "",
    "Disbursed Date": formatDate(l.disbursedAt),
    "Due Date": formatDate(l.dueDate),
    "Days Overdue": l.dueDate ? Math.floor((Date.now() - new Date(l.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0,
  }));
}

/**
 * Generate member statement
 */
async function fetchMemberStatement(options: DownloadOptions) {
  if (!options.memberId) {
    throw new Error("Member ID is required for member statement");
  }
  
  const memberData = await db.select().from(members).where(eq(members.id, options.memberId));
  const member = memberData[0];
  
  if (!member) {
    throw new Error("Member not found");
  }
  
  const startDateVal = options.startDate ?? member.joinedAt ?? new Date();
  const endDateVal = options.endDate ?? new Date();
  
  const [memberSavings, memberLoans, memberTransactions] = await Promise.all([
    db.select().from(savings).where(eq(savings.memberId, options.memberId)),
    db.select().from(loans).where(eq(loans.memberId, options.memberId)),
    db.select().from(transactions)
      .where(
        and(
          eq(transactions.memberId, options.memberId),
          gte(transactions.transactionDate, startDateVal),
          lte(transactions.transactionDate, endDateVal)
        )
      )
      .orderBy(desc(transactions.transactionDate)),
  ]);
  
  const savingsBalance = memberSavings.reduce((sum, s) => sum + (s.balance || 0), 0);
  const loansBalance = memberLoans.reduce((sum, l) => sum + (l.balance || 0), 0);
  
  const transactionsFormatted = memberTransactions.map((t) => ({
    Date: formatDate(t.transactionDate),
    "Transaction Type": t.transactionType,
    Reference: t.reference || "",
    Description: t.description || "",
    Debit: t.transactionType.startsWith("loan_disbursement") ? formatCurrency(t.amount) : "",
    Credit: !t.transactionType.startsWith("loan_disbursement") ? formatCurrency(t.amount) : "",
    Balance: "", // Would need running balance calculation
  }));
  
  // Return member info + transactions
  return [
    {
      "Statement Type": "Member Account Statement",
      "Member Number": member.memberNumber,
      "Name": `${member.firstName} ${member.lastName}`,
      Email: member.email || "",
      Phone: member.phone || "",
      "Statement Period": `${formatDate(startDateVal)} to ${formatDate(endDateVal)}`,
      "Generated Date": new Date().toISOString().split("T")[0],
    },
    {
      "Statement Type": "Account Summary",
      "Total Savings": formatCurrency(savingsBalance),
      "Total Loans Outstanding": formatCurrency(loansBalance),
      "Net Position": formatCurrency(savingsBalance - loansBalance),
    },
    ...transactionsFormatted,
  ];
}

/**
 * Main download function - fetches data based on type
 */
export async function generateDownload(options: DownloadOptions): Promise<{
  data: string;
  filename: string;
  contentType: string;
}> {
  let data: Record<string, unknown>[] = [];
  
  switch (options.type) {
    case "members":
      data = await fetchMembers(options);
      break;
    case "savings":
      data = await fetchSavings(options);
      break;
    case "loans":
      data = await fetchLoans(options);
      break;
    case "transactions":
      data = await fetchTransactions(options);
      break;
    case "penalties":
      data = await fetchPenalties(options);
      break;
    case "credit_checks":
      data = await fetchCreditChecks(options);
      break;
    case "guarantors":
      data = await fetchGuarantors(options);
      break;
    case "reminders":
      data = await fetchReminders(options);
      break;
    case "audit_logs":
      data = await fetchAuditLogs(options);
      break;
    case "compliance":
      data = await fetchCompliance(options);
      break;
    case "campaigns":
      data = await fetchCampaigns(options);
      break;
    case "partners":
      data = await fetchPartners(options);
      break;
    case "monthly_summary":
      data = await fetchMonthlySummary(options);
      break;
    case "loan Portfolio":
      data = await fetchLoanPortfolio(options);
      break;
    case "member_statement":
      data = await fetchMemberStatement(options);
      break;
    default:
      throw new Error(`Unknown download type: ${options.type}`);
  }
  
  const timestamp = new Date().toISOString().split("T")[0];
  let output: string;
  let filename: string;
  let contentType: string;
  
  switch (options.format) {
    case "csv":
      output = toCSV(data);
      filename = `${options.type}_${timestamp}.csv`;
      contentType = "text/csv";
      break;
    case "json":
      output = JSON.stringify(data, null, 2);
      filename = `${options.type}_${timestamp}.json`;
      contentType = "application/json";
      break;
    case "excel":
      // Excel-compatible JSON (array of arrays with header row)
      output = JSON.stringify(data, null, 2);
      filename = `${options.type}_${timestamp}.xls`;
      contentType = "application/vnd.ms-excel";
      break;
    default:
      throw new Error(`Unknown format: ${options.format}`);
  }
  
  return { data: output, filename, contentType };
}

/**
 * Get available download types with descriptions
 */
export function getDownloadTypes() {
  return [
    { id: "members", name: "Members", description: "Download all member records", category: "Members" },
    { id: "savings", name: "Savings Accounts", description: "Download savings account balances", category: "Members" },
    { id: "loans", name: "Loans", description: "Download loan applications and status", category: "Loans" },
    { id: "transactions", name: "Transactions", description: "Download all financial transactions", category: "Finance" },
    { id: "penalties", name: "Penalties", description: "Download penalty records", category: "Loans" },
    { id: "credit_checks", name: "Credit Checks", description: "Download credit assessment records", category: "Loans" },
    { id: "guarantors", name: "Guarantors", description: "Download guarantor information", category: "Loans" },
    { id: "reminders", name: "Reminders", description: "Download sent reminders and notifications", category: "Communication" },
    { id: "audit_logs", name: "Audit Logs", description: "Download system audit trail", category: "Security" },
    { id: "compliance", name: "Compliance", description: "Download regulatory compliance records", category: "Compliance" },
    { id: "campaigns", name: "Campaigns", description: "Download capital campaign records", category: "Capital" },
    { id: "partners", name: "Partners", description: "Download partner/investor information", category: "Capital" },
    { id: "monthly_summary", name: "Monthly Summary", description: "Download monthly summary report", category: "Reports" },
    { id: "loan Portfolio", name: "Loan Portfolio", description: "Download active loan portfolio", category: "Reports" },
    { id: "member_statement", name: "Member Statement", description: "Download individual member statement", category: "Reports" },
  ];
}
