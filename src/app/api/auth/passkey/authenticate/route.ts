export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticationOptions } from "@/lib/webauthn";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const schema = z.object({ email: z.string().email().optional() });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);
    const options = await getAuthenticationOptions(email);

    // Tell the client whether this user already has credentials registered
    let hasCredentials = false;
    if (email) {
      await connectDB();
      const user = await User.findOne({ email: email.toLowerCase() });
      hasCredentials = !!(user?.passkeyCredentials?.length);
    }

    return NextResponse.json({ options, hasCredentials }, { status: 200 });
  } catch (error) {
    console.error("[PASSKEY AUTHENTICATE]", error);
    return NextResponse.json({ error: "Failed to generate authentication options" }, { status: 500 });
  }
}
