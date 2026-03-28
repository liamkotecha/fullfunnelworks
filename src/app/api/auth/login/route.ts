export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() }).lean();
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const u = user as Record<string, unknown>;
    if (!u.password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, u.password as string);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Record login timestamp (non-blocking)
    const loginTime = new Date();
    User.updateOne(
      { _id: u._id },
      {
        $set: { lastLoginAt: loginTime },
        $push: { loginHistory: { $each: [loginTime], $slice: -10 } },
      },
    ).catch(() => {}); // fire-and-forget

    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Set the session cookie — NextAuth v5 uses this cookie name
    const isSecure = process.env.NODE_ENV === "production";
    const cookieName = isSecure
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

    // Build the same JWT payload NextAuth would create
    const token = await encode({
      token: {
        id: String(u._id),
        email: u.email as string,
        name: u.name as string,
        role: u.role as string,
        sub: String(u._id),
      },
      secret,
      salt: cookieName,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        id: String(u._id),
        email: u.email,
        name: u.name,
        role: u.role,
      },
    });

    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
