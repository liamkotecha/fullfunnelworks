import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyOTP } from "@/lib/otp";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code } = schema.parse(body);
    const userId = await verifyOTP(email, code);
    if (!userId) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
    }
    // Return userId so client can call signIn("otp")
    return NextResponse.json({ success: true, userId }, { status: 200 });
  } catch (error) {
    console.error("[OTP VERIFY]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
