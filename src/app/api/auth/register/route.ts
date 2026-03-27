export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";
import { sendEmail } from "@/lib/sendgrid";
import { consultantWelcomeEmail } from "@/lib/email-templates/consultant-welcome";

/* ── POST /api/auth/register ────────────────────────────────── */
// Creates a new consultant account (pending — no allowedModules yet)
// and sets the session cookie so they land straight on the dashboard.
export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(emailLower)) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await User.findOne({ email: emailLower });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: emailLower,
      password: hashed,
      role: "consultant",
      consultantProfile: {
        maxActiveClients: 5,
        availabilityStatus: "available",
        specialisms: [],
        roundRobinWeight: 1,
        totalLeadsAssigned: 0,
        allowedModules: [], // admin grants access later
      },
    });

    // Send welcome email (non-blocking)
    const appUrl = process.env.NEXTAUTH_URL ?? "https://app.fullfunnelworks.com";
    sendEmail({
      to: emailLower,
      subject: "Welcome to Full Funnel Works",
      html: consultantWelcomeEmail({
        name: name.trim(),
        dashboardUrl: `${appUrl}/admin/dashboard`,
      }),
    }).catch(() => {}); // fire-and-forget — never block registration

    // Issue JWT session
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
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role,
        sub: String(user._id),
      },
      secret,
      salt: cookieName,
      maxAge: 30 * 24 * 60 * 60,
    });

    const response = NextResponse.json({
      ok: true,
      user: { id: String(user._id), email: user.email, name: user.name, role: user.role },
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
    console.error("Register error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
