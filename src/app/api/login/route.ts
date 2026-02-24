import { NextResponse } from "next/server";
import { db } from "@/db";
import { members } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, phone, memberNumber, password } = body;

    if (!email && !phone && !memberNumber) {
      return NextResponse.json(
        { error: "Please provide email, phone number, or member number" },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // Find member by email, phone, or member number
    let member;
    
    if (email) {
      member = await db.query.members.findFirst({
        where: eq(members.email, email),
      });
    } else if (phone) {
      member = await db.query.members.findFirst({
        where: eq(members.phone, phone),
      });
    } else if (memberNumber) {
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

    // For demo: verify password against passwordHash
    // In production, use bcrypt.compare() with proper hashing
    if (member.passwordHash && member.passwordHash !== password) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // If no password set, allow login for demo purposes
    // In production, you'd require a password to be set

    // Update last login
    await db.update(members)
      .set({ lastLoginAt: new Date() })
      .where(eq(members.id, member.id));

    // Return member data (excluding passwordHash)
    const { passwordHash: _, ...memberWithoutPassword } = member;

    return NextResponse.json({ member: memberWithoutPassword });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
