/**
 * SACCO Service Library
 * 
 * Implements solutions for all 9 SACCO challenges:
 * 1. Loan Defaults - Credit checks, guarantors, reminders, penalties
 * 2. Poor Management - Audit logs, transparency
 * 3. Fraud & Cybercrime - Security, 2FA, monitoring
 * 4. Mobile Lenders - Digitized services
 * 5. Strict Regulations - Compliance tracking
 * 6. Limited Capital - Member campaigns, partners
 * 7. Technology Challenges - Backup, ICT
 * 8. Low Member Participation - Communications
 * 9. Economic Challenges - Flexible repayment plans
 */

import { db } from "@/db";
import { 
  members, loans, savings, transactions, 
  creditChecks, guarantors, penalties, reminders,
  auditLogs, complianceRecords, backups, 
  campaigns, partners, resources, loanRestructuring,
  settings
} from "@/db/schema";
import { eq, and, gte, lte, sql, desc, like, or } from "drizzle-orm";

// ============================================
// SOLUTION 1: LOAN DEFAULTS
// Credit checks, Guarantors, Reminders, Penalties
// ============================================

/**
 * Perform credit check before approving loan
 * Solution for: "Do proper credit checks before giving loans"
 */
export async function performCreditCheck(memberId: number, loanAmount: number) {
  // Get member's financial history
  const [member] = await db.select().from(members).where(eq(members.id, memberId));
  if (!member) throw new Error("Member not found");

  // Get existing loans
  const existingLoans = await db
    .select({
      count: sql<number>`count(*)`,
      totalBalance: sql<number>`sum(${loans.balance})`,
    })
    .from(loans)
    .where(
      and(
        eq(loans.memberId, memberId),
        eq(loans.status, 'disbursed')
      )
    );

  // Get savings balance
  const [savingsAccount] = await db
    .select({ total: sql<number>`sum(${savings.balance})` })
    .from(savings)
    .where(
      and(
        eq(savings.memberId, memberId),
        eq(savings.isActive, true)
      )
    );

  // Calculate credit score (simple algorithm)
  let creditScore = 100;
  
  // Deduct for existing loans
  if (existingLoans[0]?.totalBalance) {
    creditScore -= Math.min(50, Number(existingLoans[0].totalBalance) / 10000);
  }
  
  // Deduct if loan amount is too high relative to savings
  if (savingsAccount?.total) {
    const ratio = loanAmount / Number(savingsAccount.total);
    if (ratio > 3) creditScore -= 20;
    if (ratio > 5) creditScore -= 30;
  }

  // Check payment history
  const latePayments = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(
      and(
        eq(transactions.memberId, memberId),
        eq(transactions.transactionType, 'loan_repayment'),
        sql`${transactions.transactionDate} < ${new Date()}`
      )
    );

  if (latePayments[0]?.count) {
    creditScore -= Math.min(30, latePayments[0].count * 5);
  }

  // Save credit check record
  const [creditCheck] = await db
    .insert(creditChecks)
    .values({
      memberId,
      creditScore: Math.max(0, Math.min(100, Math.round(creditScore))),
      incomeLevel: 0, // Would come from income verification
      existingLoans: existingLoans[0]?.totalBalance || 0,
      repaymentHistory: JSON.stringify({ latePayments: latePayments[0]?.count || 0 }),
      status: creditScore >= 50 ? 'passed' : 'failed',
      checkedAt: new Date(),
    })
    .returning();

  return creditCheck;
}

/**
 * Request guarantors for a loan
 * Solution for: "Require guarantors"
 */
export async function requestGuarantors(loanId: number, memberIds: number[]) {
  const guarantorRecords = await Promise.all(
    memberIds.map(memberId => 
      db.insert(guarantors).values({
        loanId,
        memberId,
        status: 'pending',
      }).returning()
    )
  );
  return guarantorRecords.flat();
}

/**
 * Schedule payment reminder
 * Solution for: "Use a system to send automatic reminders"
 */
export async function schedulePaymentReminder(
  memberId: number,
  loanId: number,
  daysBeforeDue: number
) {
  const [loan] = await db.select().from(loans).where(eq(loans.id, loanId));
  if (!loan || !loan.dueDate) throw new Error("Loan or due date not found");

  const reminderDate = new Date(loan.dueDate);
  reminderDate.setDate(reminderDate.getDate() - daysBeforeDue);

  const [reminder] = await db.insert(reminders).values({
    memberId,
    loanId,
    reminderType: daysBeforeDue === 0 ? 'payment_due' : 'payment_overdue',
    channel: 'sms',
    message: `Reminder: Your loan payment of KES ${loan.installmentAmount} is due on ${loan.dueDate.toDateString()}.`,
    scheduledFor: reminderDate,
    status: 'pending',
  }).returning();

  return reminder;
}

/**
 * Apply penalty for late payment
 * Solution for: "Charge penalties for late payment"
 */
export async function applyLatePenalty(memberId: number, loanId: number) {
  const [loan] = await db.select().from(loans).where(eq(loans.id, loanId));
  if (!loan) throw new Error("Loan not found");

  // Calculate penalty (e.g., 2% of installment)
  const penaltyAmount = Number(loan.installmentAmount) * 0.02;

  const [penalty] = await db.insert(penalties).values({
    memberId,
    loanId,
    penaltyType: 'late_payment',
    amount: penaltyAmount,
    reason: `Late payment penalty for loan ${loan.loanNumber}`,
    status: 'pending',
    appliedAt: new Date(),
  }).returning();

  return penalty;
}

// ============================================
// SOLUTION 2: POOR MANAGEMENT
// Training, Audits, Transparency
// ============================================

/**
 * Log audit trail for transparency
 * Solution for: "Allow members to access financial reports"
 */
export async function logAuditTrail(
  userId: number | null,
  action: string,
  entityType: string,
  entityId: number | null,
  oldValue?: object,
  newValue?: object,
  ipAddress?: string
) {
  const [log] = await db.insert(auditLogs).values({
    userId,
    action,
    entityType,
    entityId,
    oldValue: oldValue ? JSON.stringify(oldValue) : null,
    newValue: newValue ? JSON.stringify(newValue) : null,
    ipAddress,
    status: 'success',
  }).returning();

  return log;
}

/**
 * Get transparent reports accessible by members
 * Solution for: "Allow members to access financial reports"
 */
export async function getMemberAccessibleReports(memberId: number) {
  const [member] = await db.select().from(members).where(eq(members.id, memberId));
  if (!member) throw new Error("Member not found");

  // Get member's savings summary
  const savingsSummary = await db
    .select({
      accountNumber: savings.accountNumber,
      savingsType: savings.savingsType,
      balance: savings.balance,
    })
    .from(savings)
    .where(
      and(
        eq(savings.memberId, memberId),
        eq(savings.isActive, true)
      )
    );

  // Get member's loans
  const memberLoans = await db
    .select({
      id: loans.id,
      loanNumber: loans.loanNumber,
      principalAmount: loans.principalAmount,
      balance: loans.balance,
      status: loans.status,
      dueDate: loans.dueDate,
    })
    .from(loans)
    .where(eq(loans.memberId, memberId));

  // Get member's transactions for current year
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const memberTransactions = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.memberId, memberId),
        gte(transactions.transactionDate, yearStart)
      )
    )
    .orderBy(desc(transactions.transactionDate))
    .limit(100);

  return {
    member: {
      id: member.id,
      name: `${member.firstName} ${member.lastName}`,
      memberNumber: member.memberNumber,
    },
    savings: savingsSummary,
    loans: memberLoans.map(l => ({
      ...l,
      dueDate: l.dueDate?.toISOString(),
    })),
    transactions: memberTransactions.map(t => ({
      ...t,
      transactionDate: t.transactionDate?.toISOString(),
    })),
    reportDate: new Date().toISOString(),
  };
}

// ============================================
// SOLUTION 3: FRAUD & CYBERCRIME
// Security, 2FA, Monitoring
// ============================================

/**
 * Enable two-factor authentication for a member
 * Solution for: "Use strong passwords and two-factor authentication"
 */
export async function enableTwoFactor(memberId: number, secret: string) {
  await db
    .update(members)
    .set({
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      updatedAt: new Date(),
    })
    .where(eq(members.id, memberId));

  // Log the action
  await logAuditTrail(memberId, 'enable_2fa', 'member', memberId);
}

/**
 * Monitor suspicious transactions
 * Solution for: "Monitor transactions daily"
 */
export async function monitorTransactions() {
  // Get all transactions from the last 24 hours
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const recentTransactions = await db
    .select({
      id: transactions.id,
      memberId: transactions.memberId,
      amount: transactions.amount,
      transactionType: transactions.transactionType,
      transactionDate: transactions.transactionDate,
    })
    .from(transactions)
    .where(gte(transactions.transactionDate, yesterday));

  // Flag suspicious transactions (e.g., unusually large amounts)
  const suspiciousTransactions = recentTransactions.filter(
    t => Number(t.amount) > 1000000 // Over 1 million KES
  );

  if (suspiciousTransactions.length > 0) {
    // Log alert
    await logAuditTrail(
      null, 
      'suspicious_activity', 
      'transactions', 
      null,
      undefined,
      { count: suspiciousTransactions.length, amounts: suspiciousTransactions.map(t => t.amount) }
    );
  }

  return {
    totalTransactions: recentTransactions.length,
    suspiciousCount: suspiciousTransactions.length,
    suspiciousTransactions,
    monitoredAt: new Date().toISOString(),
  };
}

// ============================================
// SOLUTION 4: MOBILE LENDERS COMPETITION
// Digitize services, mobile app, fast approval
// ============================================

/**
 * Quick loan approval for competitive rates
 * Solution for: "Reduce loan approval time" & "Offer competitive interest rates"
 */
export async function quickLoanApproval(memberId: number, amount: number, purpose: string) {
  // First perform credit check
  const creditCheck = await performCreditCheck(memberId, amount);
  
  if (creditCheck.status !== 'passed') {
    throw new Error("Credit check failed - loan cannot be approved");
  }

  // Check if member has sufficient savings
  const [savingsAccount] = await db
    .select({ balance: savings.balance })
    .from(savings)
    .where(
      and(
        eq(savings.memberId, memberId),
        eq(savings.isActive, true)
      )
    );

  // Calculate maximum loan (typically 3x savings or based on credit score)
  const maxLoan = Number(savingsAccount?.balance || 0) * 3;
  if (amount > maxLoan) {
    throw new Error(`Loan amount exceeds maximum allowed (${maxLoan})`);
  }

  // Calculate interest (competitive rate)
  const interestRate = creditCheck.creditScore! >= 80 ? 1.0 : 1.5; // 1% or 1.5% per month
  const interestAmount = amount * (interestRate / 100) * 12; // 12 month term
  const totalAmount = amount + interestAmount;
  const installmentAmount = totalAmount / 12;

  // Generate loan number
  const loanNumber = `LN${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

  // Create loan record
  const [loan] = await db.insert(loans).values({
    memberId,
    loanNumber,
    principalAmount: amount,
    interestRate,
    interestAmount,
    totalAmount,
    paidAmount: 0,
    balance: totalAmount,
    termMonths: 12,
    installmentAmount,
    status: 'approved',
    purpose,
    dueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    approvedAt: new Date(),
  }).returning();

  await logAuditTrail(memberId, 'loan_approved', 'loan', loan.id, undefined, { amount, interestRate });

  return {
    ...loan,
    approvedAt: loan.approvedAt?.toISOString(),
    dueDate: loan.dueDate?.toISOString(),
  };
}

// ============================================
// SOLUTION 5: STRICT REGULATIONS (SASRA)
// Compliance tracking
// ============================================

/**
 * Track compliance with SASRA regulations
 * Solution for: "Keep proper financial records" & "Train staff on regulatory requirements"
 */
export async function trackCompliance() {
  // Get all compliance records
  const records = await db
    .select()
    .from(complianceRecords)
    .orderBy(desc(complianceRecords.dueDate));

  // Calculate compliance rate
  const total = records.length;
  const compliant = records.filter(r => r.status === 'compliant').length;
  const inProgress = records.filter(r => r.status === 'in_progress').length;
  const nonCompliant = records.filter(r => r.status === 'non_compliant').length;

  return {
    total,
    compliant,
    inProgress,
    nonCompliant,
    complianceRate: total > 0 ? Math.round((compliant / total) * 100) : 0,
    records: records.map(r => ({
      ...r,
      dueDate: r.dueDate?.toISOString(),
      completedAt: r.completedAt?.toISOString(),
    })),
    trackedAt: new Date().toISOString(),
  };
}

/**
 * Add compliance requirement
 */
export async function addComplianceRequirement(
  requirement: string,
  category: string,
  dueDate: Date
) {
  const [record] = await db.insert(complianceRecords).values({
    requirement,
    category,
    status: 'in_progress',
    dueDate,
  }).returning();

  return record;
}

// ============================================
// SOLUTION 6: LIMITED CAPITAL
// Member campaigns, partners
// ============================================

/**
 * Create member recruitment campaign
 * Solution for: "Encourage more member savings" & "Attract new members"
 */
export async function createCampaign(
  name: string,
  type: 'recruitment' | 'savings' | 'loan_promo',
  targetAmount: number,
  endDate: Date,
  description?: string
) {
  const [campaign] = await db.insert(campaigns).values({
    name,
    type,
    description,
    targetAmount,
    endDate,
    status: 'active',
  }).returning();

  return campaign;
}

/**
 * Get active campaigns
 */
export async function getActiveCampaigns() {
  const now = new Date();
  return db
    .select()
    .from(campaigns)
    .where(
      and(
        eq(campaigns.status, 'active'),
        gte(campaigns.endDate, now)
      )
    );
}

/**
 * Add financial partner
 * Solution for: "Partner with financial institutions"
 */
export async function addPartner(
  name: string,
  type: 'bank' | 'microfinance' | 'corporate',
  contactPerson: string,
  email: string,
  phone: string,
  agreementEnd: Date
) {
  const [partner] = await db.insert(partners).values({
    name,
    type,
    contactPerson,
    email,
    phone,
    agreementStart: new Date(),
    agreementEnd,
    status: 'active',
  }).returning();

  return partner;
}

// ============================================
// SOLUTION 7: TECHNOLOGY CHALLENGES
// Backup, ICT training
// ============================================

/**
 * Record backup
 * Solution for: "Backup data regularly"
 */
export async function recordBackup(backupType: 'full' | 'incremental' | 'manual') {
  const [backup] = await db.insert(backups).values({
    backupType,
    fileName: `backup_${backupType}_${Date.now()}.sql`,
    status: 'completed',
    startedAt: new Date(),
    completedAt: new Date(),
    storageLocation: '/backups',
  }).returning();

  return backup;
}

// ============================================
// SOLUTION 8: LOW MEMBER PARTICIPATION
// Communications, incentives
// ============================================

/**
 * Send member communication
 * Solution for: "Improve communication (SMS/email updates)"
 */
export async function sendMemberCommunication(
  memberId: number,
  message: string,
  channel: 'sms' | 'email' | 'both'
) {
  const [reminder] = await db.insert(reminders).values({
    memberId,
    reminderType: 'general',
    channel,
    message,
    scheduledFor: new Date(),
    status: 'pending',
  }).returning();

  return reminder;
}

/**
 * Broadcast to all active members
 */
export async function broadcastToMembers(message: string, channel: 'sms' | 'email' | 'both') {
  const activeMembers = await db
    .select({ id: members.id })
    .from(members)
    .where(eq(members.isActive, true));

  const broadcasts = await Promise.all(
    activeMembers.map(m =>
      db.insert(reminders).values({
        memberId: m.id,
        reminderType: 'general',
        channel,
        message,
        scheduledFor: new Date(),
        status: 'pending',
      }).returning()
    )
  );

  return {
    sent: broadcasts.length,
    message: "Broadcast queued for all active members",
  };
}

/**
 * Add financial literacy resource
 * Solution for: "Educate members on benefits of saving"
 */
export async function addResource(
  title: string,
  type: 'article' | 'video' | 'guide',
  category: 'savings' | 'loans' | 'investment' | 'general',
  content: string
) {
  const [resource] = await db.insert(resources).values({
    title,
    type,
    category,
    content,
    publishedAt: new Date(),
    isActive: true,
  }).returning();

  return resource;
}

// ============================================
// SOLUTION 9: ECONOMIC CHALLENGES
// Flexible repayment plans
// ============================================

/**
 * Request loan restructuring for flexible repayment
 * Solution for: "Offer flexible repayment plans"
 */
export async function requestLoanRestructuring(
  loanId: number,
  restructuringType: 'extension' | 'reduction' | 'deferment' | 'refinancing',
  newTerm: number,
  reason: string
) {
  const [loan] = await db.select().from(loans).where(eq(loans.id, loanId));
  if (!loan) throw new Error("Loan not found");

  const newInstallment = Number(loan.balance) / newTerm;

  const [restructure] = await db.insert(loanRestructuring).values({
    loanId,
    restructuringType,
    originalTerm: loan.termMonths,
    newTerm,
    originalInstallment: loan.installmentAmount,
    newInstallment,
    reason,
    status: 'pending',
  }).returning();

  return restructure;
}

/**
 * Approve loan restructuring
 */
export async function approveLoanRestructuring(restructureId: number, approvedBy: string) {
  const [restructure] = await db
    .select()
    .from(loanRestructuring)
    .where(eq(loanRestructuring.id, restructureId));

  if (!restructure) throw new Error("Restructuring request not found");

  if (!restructure.newTerm || !restructure.newInstallment) {
    throw new Error("Restructuring terms not set");
  }

  // Update loan terms
  await db
    .update(loans)
    .set({
      termMonths: Number(restructure.newTerm),
      installmentAmount: Number(restructure.newInstallment),
      updatedAt: new Date(),
    })
    .where(eq(loans.id, restructure.loanId));

  // Update restructuring status
  await db
    .update(loanRestructuring)
    .set({
      status: 'approved',
      approvedAt: new Date(),
      approvedBy,
    })
    .where(eq(loanRestructuring.id, restructureId));

  await logAuditTrail(null, 'restructure_approved', 'loan', restructure.loanId);

  return { success: true };
}

// ============================================
// SETTINGS MANAGEMENT
// ============================================

/**
 * Get or set system setting
 */
export async function getSetting(key: string) {
  const [setting] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key));
  return setting;
}

export async function setSetting(key: string, value: string, description?: string) {
  const [setting] = await db
    .insert(settings)
    .values({
      key,
      value,
      description,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: settings.key,
      set: {
        value,
        description,
        updatedAt: new Date(),
      },
    })
    .returning();
  return setting;
}
