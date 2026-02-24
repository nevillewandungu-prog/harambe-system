import { db } from "@/db";
import { 
  members, 
  savings, 
  loans, 
  transactions,
  reports 
} from "@/db/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

/**
 * Optimized monthly summary report generator
 * Uses indexed columns for fast queries
 */
export async function generateMonthlySummaryReport(
  periodStart: Date,
  periodEnd: Date
) {
  const startTime = Date.now();
  
  // Use parallel queries with indexed columns for performance
  const [
    totalMembers,
    activeMembers,
    totalSavings,
    totalLoansDisbursed,
    totalLoanRepayments,
    loanPortfolio,
    transactionsByType,
    newMembers,
  ] = await Promise.all([
    // Total members
    db.select({ count: sql<number>`count(*)` }).from(members),
    
    // Active members
    db.select({ count: sql<number>`count(*)` })
      .from(members)
      .where(eq(members.isActive, true)),
    
    // Total savings balance
    db.select({ total: sql<number>`sum(${savings.balance})` })
      .from(savings)
      .where(eq(savings.isActive, true)),
    
    // Loans disbursed in period (using indexed column)
    db.select({ total: sql<number>`sum(${loans.principalAmount})` })
      .from(loans)
      .where(
        and(
          gte(loans.disbursedAt, periodStart),
          lte(loans.disbursedAt, periodEnd)
        )
      ),
    
    // Loan repayments in period (using indexed column)
    db.select({ total: sql<number>`sum(${transactions.amount})` })
      .from(transactions)
      .where(
        and(
          eq(transactions.transactionType, 'loan_repayment'),
          gte(transactions.transactionDate, periodStart),
          lte(transactions.transactionDate, periodEnd)
        )
      ),
    
    // Current loan portfolio (outstanding)
    db.select({ total: sql<number>`sum(${loans.balance})` })
      .from(loans)
      .where(eq(loans.status, 'disbursed')),
    
    // Transactions by type (using indexed column)
    db.select({
      type: transactions.transactionType,
      total: sql<number>`sum(${transactions.amount})`,
      count: sql<number>`count(*)`,
    })
      .from(transactions)
      .where(
        and(
          gte(transactions.transactionDate, periodStart),
          lte(transactions.transactionDate, periodEnd)
        )
      )
      .groupBy(transactions.transactionType),
    
    // New members in period
    db.select({ count: sql<number>`count(*)` })
      .from(members)
      .where(
        and(
          gte(members.joinedAt, periodStart),
          lte(members.joinedAt, periodEnd)
        )
      ),
  ]);

  const endTime = Date.now();
  
  return {
    period: {
      start: periodStart.toISOString(),
      end: periodEnd.toISOString(),
    },
    members: {
      total: totalMembers[0]?.count || 0,
      active: activeMembers[0]?.count || 0,
      new: newMembers[0]?.count || 0,
    },
    savings: {
      totalBalance: totalSavings[0]?.total || 0,
    },
    loans: {
      disbursed: totalLoansDisbursed[0]?.total || 0,
      repayments: totalLoanRepayments[0]?.total || 0,
      outstandingPortfolio: loanPortfolio[0]?.total || 0,
    },
    transactions: transactionsByType.map(t => ({
      type: t.type,
      amount: t.total || 0,
      count: t.count || 0,
    })),
    generatedIn: `${endTime - startTime}ms`,
  };
}

/**
 * Optimized loan portfolio report
 * Uses batch processing and indexed queries
 */
export async function generateLoanPortfolioReport() {
  const startTime = Date.now();
  
  // Get loans with member details using indexed columns
  const loanData = await db
    .select({
      id: loans.id,
      loanNumber: loans.loanNumber,
      memberId: loans.memberId,
      firstName: members.firstName,
      lastName: members.lastName,
      memberNumber: members.memberNumber,
      principalAmount: loans.principalAmount,
      totalAmount: loans.totalAmount,
      paidAmount: loans.paidAmount,
      balance: loans.balance,
      status: loans.status,
      interestRate: loans.interestRate,
      dueDate: loans.dueDate,
      disbursedAt: loans.disbursedAt,
    })
    .from(loans)
    .leftJoin(members, eq(loans.memberId, members.id))
    .where(eq(loans.status, 'disbursed'))
    .orderBy(desc(loans.balance));
  
  // Calculate summaries using SQL aggregation (faster than JS)
  const summary = await db
    .select({
      status: loans.status,
      count: sql<number>`count(*)`,
      totalPrincipal: sql<number>`sum(${loans.principalAmount})`,
      totalOutstanding: sql<number>`sum(${loans.balance})`,
    })
    .from(loans)
    .groupBy(loans.status);
  
  const endTime = Date.now();
  
  return {
    loans: loanData.map(loan => ({
      ...loan,
      disbursedAt: loan.disbursedAt?.toISOString(),
      dueDate: loan.dueDate?.toISOString(),
    })),
    summary: summary.map(s => ({
      status: s.status,
      count: s.count || 0,
      totalPrincipal: s.totalPrincipal || 0,
      totalOutstanding: s.totalOutstanding || 0,
    })),
    generatedIn: `${endTime - startTime}ms`,
  };
}

/**
 * Optimized member statement report
 * Uses date-range indexes for fast transaction lookup
 */
export async function generateMemberStatement(
  memberId: number,
  periodStart: Date,
  periodEnd: Date
) {
  const startTime = Date.now();
  
  // Get member details (single query)
  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.id, memberId));
  
  if (!member) {
    throw new Error("Member not found");
  }
  
  // Get member's savings account
  const [savingsAccount] = await db
    .select()
    .from(savings)
    .where(
      and(
        eq(savings.memberId, memberId),
        eq(savings.isActive, true)
      )
    );
  
  // Get transactions using indexed date column (parallel queries)
  const [savingsTransactions, loanTransactions] = await Promise.all([
    db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.memberId, memberId),
          gte(transactions.transactionDate, periodStart),
          lte(transactions.transactionDate, periodEnd)
        )
      )
      .orderBy(desc(transactions.transactionDate)),
    
    db
      .select()
      .from(loans)
      .where(eq(loans.memberId, memberId)),
  ]);
  
  const endTime = Date.now();
  
  return {
    member: {
      id: member.id,
      name: `${member.firstName} ${member.lastName}`,
      memberNumber: member.memberNumber,
    },
    savings: savingsAccount ? {
      accountNumber: savingsAccount.accountNumber,
      balance: savingsAccount.balance,
    } : null,
    transactions: savingsTransactions.map(t => ({
      ...t,
      transactionDate: t.transactionDate?.toISOString(),
      recordedAt: t.recordedAt?.toISOString(),
    })),
    loans: loanTransactions.map(l => ({
      ...l,
      appliedAt: l.appliedAt?.toISOString(),
      approvedAt: l.approvedAt?.toISOString(),
      disbursedAt: l.disbursedAt?.toISOString(),
      dueDate: l.dueDate?.toISOString(),
    })),
    period: {
      start: periodStart.toISOString(),
      end: periodEnd.toISOString(),
    },
    generatedIn: `${endTime - startTime}ms`,
  };
}

/**
 * Generate end-of-month report with all key metrics
 */
export async function generateEndOfMonthReport(year: number, month: number) {
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0, 23, 59, 59); // Last day of month
  
  const summary = await generateMonthlySummaryReport(periodStart, periodEnd);
  const portfolio = await generateLoanPortfolioReport();
  
  return {
    reportDate: new Date().toISOString(),
    period: summary.period,
    summary,
    portfolio,
  };
}

/**
 * Save report to database for future reference
 */
export async function saveReport(
  reportType: string,
  periodStart: Date,
  periodEnd: Date,
  reportData: object
) {
  await db
    .insert(reports)
    .values({
      reportType,
      periodStart,
      periodEnd,
      reportData: JSON.stringify(reportData),
      status: 'completed',
      generatedAt: new Date(),
    });
  
  // Return a mock report object for compatibility
  return { id: 0, reportType, status: 'completed' };
}
