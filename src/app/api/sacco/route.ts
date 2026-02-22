import { NextRequest, NextResponse } from "next/server";
import * as saccoServices from "@/lib/sacco-services";

/**
 * SACCO Management API
 * 
 * Provides endpoints for all 9 SACCO challenges:
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    let result;

    switch (action) {
      // ========== LOAN DEFAULTS SOLUTIONS ==========
      case "credit_check":
        result = await saccoServices.performCreditCheck(data.memberId, data.loanAmount);
        break;

      case "request_guarantors":
        result = await saccoServices.requestGuarantors(data.loanId, data.memberIds);
        break;

      case "schedule_reminder":
        result = await saccoServices.schedulePaymentReminder(data.memberId, data.loanId, data.daysBeforeDue);
        break;

      case "apply_penalty":
        result = await saccoServices.applyLatePenalty(data.memberId, data.loanId);
        break;

      // ========== POOR MANAGEMENT SOLUTIONS ==========
      case "get_member_report":
        result = await saccoServices.getMemberAccessibleReports(data.memberId);
        break;

      // ========== FRAUD & CYBERCRIME SOLUTIONS ==========
      case "enable_2fa":
        result = await saccoServices.enableTwoFactor(data.memberId, data.secret);
        break;

      case "monitor_transactions":
        result = await saccoServices.monitorTransactions();
        break;

      // ========== MOBILE LENDERS COMPETITION ==========
      case "quick_loan_approval":
        result = await saccoServices.quickLoanApproval(data.memberId, data.amount, data.purpose);
        break;

      // ========== STRICT REGULATIONS ==========
      case "track_compliance":
        result = await saccoServices.trackCompliance();
        break;

      case "add_compliance":
        result = await saccoServices.addComplianceRequirement(data.requirement, data.category, new Date(data.dueDate));
        break;

      // ========== LIMITED CAPITAL ==========
      case "create_campaign":
        result = await saccoServices.createCampaign(data.name, data.type, data.targetAmount, new Date(data.endDate), data.description);
        break;

      case "get_campaigns":
        result = await saccoServices.getActiveCampaigns();
        break;

      case "add_partner":
        result = await saccoServices.addPartner(data.name, data.type, data.contactPerson, data.email, data.phone, new Date(data.agreementEnd));
        break;

      // ========== TECHNOLOGY CHALLENGES ==========
      case "record_backup":
        result = await saccoServices.recordBackup(data.backupType);
        break;

      // ========== LOW MEMBER PARTICIPATION ==========
      case "send_communication":
        result = await saccoServices.sendMemberCommunication(data.memberId, data.message, data.channel);
        break;

      case "broadcast":
        result = await saccoServices.broadcastToMembers(data.message, data.channel);
        break;

      case "add_resource":
        result = await saccoServices.addResource(data.title, data.type, data.category, data.content);
        break;

      // ========== ECONOMIC CHALLENGES ==========
      case "request_restructuring":
        result = await saccoServices.requestLoanRestructuring(data.loanId, data.restructuringType, data.newTerm, data.reason);
        break;

      case "approve_restructuring":
        result = await saccoServices.approveLoanRestructuring(data.restructureId, data.approvedBy);
        break;

      // ========== SETTINGS ==========
      case "get_setting":
        result = await saccoServices.getSetting(data.key);
        break;

      case "set_setting":
        result = await saccoServices.setSetting(data.key, data.value, data.description);
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action", validActions: getValidActions() },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("SACCO API error:", error);
    return NextResponse.json(
      { error: "Operation failed", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resource = searchParams.get("resource");

    let result;

    switch (resource) {
      case "campaigns":
        result = await saccoServices.getActiveCampaigns();
        break;
      case "compliance":
        result = await saccoServices.trackCompliance();
        break;
      case "monitoring":
        result = await saccoServices.monitorTransactions();
        break;
      default:
        result = {
          message: "Harambee SACCO Management System API",
          version: "1.0.0",
          endpoints: {
            POST: getValidActions(),
            GET: ["campaigns", "compliance", "monitoring"]
          }
        };
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch data", details: String(error) },
      { status: 500 }
    );
  }
}

function getValidActions() {
  return [
    // Loan Defaults
    "credit_check",
    "request_guarantors", 
    "schedule_reminder",
    "apply_penalty",
    // Poor Management
    "get_member_report",
    // Fraud & Cybercrime
    "enable_2fa",
    "monitor_transactions",
    // Mobile Lenders
    "quick_loan_approval",
    // Strict Regulations
    "track_compliance",
    "add_compliance",
    // Limited Capital
    "create_campaign",
    "get_campaigns",
    "add_partner",
    // Technology
    "record_backup",
    // Member Participation
    "send_communication",
    "broadcast",
    "add_resource",
    // Economic Challenges
    "request_restructuring",
    "approve_restructuring",
    // Settings
    "get_setting",
    "set_setting",
  ];
}
