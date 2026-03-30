export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { requireAuth } from "@/lib/api-helpers";

export async function PATCH(req: Request) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { currentPassword, newPassword } = await req.json() as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Both fields are required" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(userOrRes.id).select("+password").lean() as
      | { _id: unknown; password?: string }
      | null;

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (!user.password) {
      return NextResponse.json({ error: "No password set on this account" }, { status: 400 });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(user._id, { $set: { password: hashed } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("ME PASSWORD PATCH", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
