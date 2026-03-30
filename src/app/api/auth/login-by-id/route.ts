export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { encode } from "next-auth/jwt";

/**
 * Login by user ID (used after OTP or passkey verification).
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const u = user as Record<string, unknown>;

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

    const isSecure = process.env.NODE_ENV === "production";
    const cookieName = isSecure
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

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
      maxAge: 30 * 24 * 60 * 60,
    });

    // Determine if this consultant needs first-login onboarding
    // (invited accounts have no password and no passkeys set)
    const needsOnboarding =
      u.role === "consultant" &&
      !u.password &&
      !(u.passkeyCredentials as unknown[])?.length;

    const response = NextResponse.json({
      ok: true,
      user: {
        id: String(u._id),
        email: u.email,
        name: u.name,
        role: u.role,
        needsOnboarding,
      },
    });

    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (e) {
    console.error("Login-by-id error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
