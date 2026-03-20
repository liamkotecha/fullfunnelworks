export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

/**
 * Temporary debug endpoint — DELETE after deployment is working.
 * Tests MongoDB connectivity and user lookup on Vercel.
 * Does NOT expose passwords.
 */
export async function GET() {
  const checks: Record<string, unknown> = {
    MONGODB_URI_SET: !!process.env.MONGODB_URI,
    NEXTAUTH_SECRET_SET: !!process.env.NEXTAUTH_SECRET,
    AUTH_SECRET_SET: !!process.env.AUTH_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  };

  try {
    await connectDB();
    checks.DB_CONNECTED = true;
  } catch (e) {
    checks.DB_CONNECTED = false;
    checks.DB_ERROR = (e as Error).message;
    return NextResponse.json(checks);
  }

  try {
    const adminUser = await User.findOne({
      email: "admin@fullfunnelworks.co.uk",
    }).lean();
    checks.ADMIN_USER_EXISTS = !!adminUser;
    if (adminUser) {
      const u = adminUser as Record<string, unknown>;
      checks.ADMIN_HAS_PASSWORD = !!u.password;
      checks.ADMIN_ROLE = u.role;
      checks.ADMIN_ID = String(u._id);
    }
  } catch (e) {
    checks.USER_LOOKUP_ERROR = (e as Error).message;
  }

  try {
    const userCount = await User.countDocuments();
    checks.TOTAL_USERS = userCount;
  } catch (e) {
    checks.COUNT_ERROR = (e as Error).message;
  }

  return NextResponse.json(checks);
}
