import { NextResponse } from "next/server";
import { db } from "@/db";
import { members } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verify } from "@node-rs/argon2";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, email, memberNumber, password } = body;

    // Validate required fields
    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // Try to find member by phone, email, or member number
    let member = null;

    if (phone) {
      member = await db.query.members.findFirst({
        where: eq(members.phone, phone),
      });
    }

    if (!member && email) {
      member = await db.query.members.findFirst({
        where: eq(members.email, email),
      });
    }

    if (!member && memberNumber) {
      member = await db.query.members.findFirst({
        where: eq(members.memberNumber, memberNumber),
      });
    }

    if (!member) {
      return NextResponse.json(
        { error: "Member not found. Please check your credentials." },
        { status: 401 }
      );
    }

    // Update last login
    await db.update(members)
      .set({ lastLoginAt: new Date() })
      .where(eq(members.id, member.id));

    return NextResponse.json({
      success: true,
      message: "Login successful!",
      member: {
        id: member.id,
        memberNumber: member.memberNumber,
        firstName: member.firstName,
        lastName: member.lastName,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
