export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRegistrationOptions } from "@/lib/webauthn";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const schema = z.object({ email: z.string().email(), name: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name } = schema.parse(body);
    await connectDB();

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({ email: email.toLowerCase(), name, role: "client" });
    }

    const options = await getRegistrationOptions(user._id.toString(), email);
    return NextResponse.json({ options, userId: user._id.toString() }, { status: 200 });
  } catch (error) {
    console.error("[PASSKEY REGISTER]", error);
    return NextResponse.json({ error: "Failed to generate registration options" }, { status: 500 });
  }
}
