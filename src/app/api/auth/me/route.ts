export const dynamic = "force-dynamic";
/**
 * GET /api/auth/me
 * Returns the current authenticated user's basic info from the session token.
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET(req: NextRequest) {
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

    await connectDB();
    const user = await User.findById(token.id).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const u = user as Record<string, unknown>;

    return NextResponse.json({
      id: String(u._id),
      email: u.email as string,
      name: u.name as string,
      role: u.role as string,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
