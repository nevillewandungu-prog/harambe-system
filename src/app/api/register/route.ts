import { NextResponse } from "next/server";
import { db } from "@/db";
import { members } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hash, verify } from "@node-rs/argon2";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, idNumber, dateOfBirth, address, password } = body;

    // Validate required fields
    if (!firstName || !lastName || !phone || !password) {
      return NextResponse.json(
        { error: "First name, last name, phone, and password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if member already exists (by phone or email)
    if (email) {
      const existingByEmail = await db.query.members.findFirst({
        where: eq(members.email, email),
      });
      if (existingByEmail) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 400 }
        );
      }
    }

    const existingByPhone = await db.query.members.findFirst({
      where: eq(members.phone, phone),
    });
    if (existingByPhone) {
      return NextResponse.json(
        { error: "An account with this phone number already exists" },
        { status: 400 }
      );
    }

    // Generate member number (HAR-XXXX format)
    const timestamp = Date.now().toString().slice(-6);
    const memberNumber = `HAR-${timestamp}`;

    // Hash the password
    const passwordHash = await hash(password);

    // Create new member
    const newMember = await db.insert(members).values({
      memberNumber,
      firstName,
      lastName,
      email: email || null,
      phone,
      idNumber: idNumber || null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      address: address || null,
      passwordHash,
      isActive: true,
      joinedAt: new Date(),
    }).returning({ id: members.id, memberNumber: members.memberNumber });

    return NextResponse.json({
      success: true,
      message: "Registration successful! Welcome to Harambee Sacco.",
      member: {
        id: newMember[0].id,
        memberNumber: newMember[0].memberNumber,
        firstName,
        lastName,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
