export const dynamic = "force-dynamic";
/**
 * POST /api/auth/onboarding/set-password
 * Allows an authenticated user (typically an invited consultant) to set their
 * password for the first time, completing the onboarding flow.
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const isSecure = req.url.startsWith("https");
    const cookieName = isSecure
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
      cookieName,
      salt: cookieName,
    });

    if (!token?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { password } = await req.json();
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    await connectDB();
    const hashed = await bcrypt.hash(password, 12);
    await User.updateOne({ _id: token.id }, { $set: { password: hashed } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
