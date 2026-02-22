import { NextRequest, NextResponse } from "next/server";
import { generateDownload, getDownloadTypes, type DownloadOptions } from "@/lib/downloads";

export const dynamic = "force-dynamic";

/**
 * GET handler for downloads
 * Query params:
 * - type: Download type (required)
 * - format: csv, json, excel (default: csv)
 * - startDate: Start date filter (optional)
 * - endDate: End date filter (optional)
 * - memberId: Member ID filter (optional)
 * - status: Status filter (optional)
 * - search: Search term (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get("type") as DownloadOptions["type"];
    const format = (searchParams.get("format") || "csv") as DownloadOptions["format"];
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const memberId = searchParams.get("memberId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    
    // If no type provided, return available download types
    if (!type) {
      const types = getDownloadTypes();
      return NextResponse.json({
        availableTypes: types,
        message: "Provide 'type' parameter to download data",
      });
    }
    
    // Validate type
    const validTypes = [
      "members", "savings", "loans", "transactions", "penalties",
      "credit_checks", "guarantors", "reminders", "audit_logs",
      "compliance", "campaigns", "partners", "monthly_summary",
      "loan Portfolio", "member_statement"
    ];
    
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid download type. Available: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }
    
    // Validate format
    const validFormats = ["csv", "json", "excel"];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: `Invalid format. Available: ${validFormats.join(", ")}` },
        { status: 400 }
      );
    }
    
    // Build options
    const options: DownloadOptions = {
      type,
      format,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      memberId: memberId ? parseInt(memberId, 10) : undefined,
      status: status || undefined,
      search: search || undefined,
    };
    
    // Generate download
    const result = await generateDownload(options);
    
    // Return file with proper headers
    return new NextResponse(result.data, {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    return NextResponse.json(
      { error: `Download failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * POST handler for downloads with body
 * Allows more complex queries
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { type, format = "csv", startDate, endDate, memberId, status, search } = body;
    
    if (!type) {
      return NextResponse.json(
        { error: "Download type is required" },
        { status: 400 }
      );
    }
    
    const options: DownloadOptions = {
      type,
      format,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      memberId,
      status,
      search,
    };
    
    // Generate download
    const result = await generateDownload(options);
    
    // Return file with proper headers
    return new NextResponse(result.data, {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    return NextResponse.json(
      { error: `Download failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
