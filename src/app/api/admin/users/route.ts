import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { requireAuth, apiError } from "@/lib/api-helpers";
import type { AuthenticatedUser } from "@/lib/api-helpers";

/**
 * GET /api/admin/users — list users filtered by role.
 * Query params:
 *   role — comma-separated roles, e.g. "admin,consultant"
 */
export async function GET(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;
    if (user.role !== "admin" && user.role !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const roleParam = req.nextUrl.searchParams.get("role");
    const filter: Record<string, unknown> = {};
    if (roleParam) {
      const roles = roleParam.split(",").map((r) => r.trim()).filter(Boolean);
      if (roles.length > 0) {
        filter.role = { $in: roles };
      }
    }

    const users = await User.find(filter)
      .select("_id name email role")
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      data: users.map((u) => ({
        _id: String(u._id),
        name: u.name ?? "",
        email: u.email ?? "",
        role: u.role ?? "",
      })),
    });
  } catch (error) {
    return apiError("ADMIN USERS GET", error);
  }
}
