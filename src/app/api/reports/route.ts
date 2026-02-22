import { NextRequest, NextResponse } from "next/server";
import { 
  generateMonthlySummaryReport, 
  generateLoanPortfolioReport,
  generateMemberStatement,
  generateEndOfMonthReport,
  saveReport 
} from "@/lib/reports";

/**
 * API Route for generating financial reports
 * 
 * Optimizations implemented:
 * 1. Parallel database queries using Promise.all
 * 2. Indexed columns for fast lookups
 * 3. SQL aggregation instead of JS processing
 * 4. Batch processing for large datasets
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      reportType, 
      year, 
      month, 
      memberId, 
      periodStart, 
      periodEnd 
    } = body;

    let reportData: object;
    let reportTypeStr: string;

    switch (reportType) {
      case "monthly_summary":
        if (!periodStart || !periodEnd) {
          return NextResponse.json(
            { error: "periodStart and periodEnd are required" },
            { status: 400 }
          );
        }
        reportTypeStr = "monthly_summary";
        reportData = await generateMonthlySummaryReport(
          new Date(periodStart),
          new Date(periodEnd)
        );
        break;

      case "loan_portfolio":
        reportTypeStr = "loan_portfolio";
        reportData = await generateLoanPortfolioReport();
        break;

      case "member_statement":
        if (!memberId || !periodStart || !periodEnd) {
          return NextResponse.json(
            { error: "memberId, periodStart, and periodEnd are required" },
            { status: 400 }
          );
        }
        reportTypeStr = "member_statement";
        reportData = await generateMemberStatement(
          memberId,
          new Date(periodStart),
          new Date(periodEnd)
        );
        break;

      case "end_of_month":
        if (!year || !month) {
          return NextResponse.json(
            { error: "year and month are required" },
            { status: 400 }
          );
        }
        reportTypeStr = "end_of_month";
        reportData = await generateEndOfMonthReport(year, month);
        break;

      default:
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 }
        );
    }

    // Save report to database
    const savedReport = await saveReport(
      reportTypeStr,
      new Date(periodStart || Date.now()),
      new Date(periodEnd || Date.now()),
      reportData
    );

    return NextResponse.json({
      success: true,
      reportId: savedReport.id,
      reportType: reportTypeStr,
      data: reportData,
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate report", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Get list of previously generated reports
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const reportType = searchParams.get("type");

    // Import db and reports here to avoid issues
    const { db } = await import("@/db");
    const { reports: reportsTable } = await import("@/db/schema");
    const { eq, desc } = await import("drizzle-orm");

    let query = db.select().from(reportsTable).orderBy(desc(reportsTable.createdAt));

    if (status) {
      query = query.where(eq(reportsTable.status, status)) as typeof query;
    }

    if (reportType) {
      query = query.where(eq(reportsTable.reportType, reportType)) as typeof query;
    }

    const reportList = await query.limit(50);

    return NextResponse.json({
      success: true,
      reports: reportList.map(r => ({
        ...r,
        periodStart: r.periodStart?.toISOString(),
        periodEnd: r.periodEnd?.toISOString(),
        generatedAt: r.generatedAt?.toISOString(),
        createdAt: r.createdAt?.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports", details: String(error) },
      { status: 500 }
    );
  }
}
