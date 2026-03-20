import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateAndStoreOTP } from "@/lib/otp";
import { sendEmail } from "@/lib/sendgrid";
import { otpEmail } from "@/lib/email-templates/otp";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);
    const code = await generateAndStoreOTP(email);

    // DEV: skip email, log code to terminal
    if (process.env.NODE_ENV === "development") {
      console.log(`\n🔑  DEV OTP for ${email}: ${code}\n`);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    await sendEmail({
      to: email,
      subject: "Your Full Funnel sign-in code",
      html: otpEmail({ code }),
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[OTP SEND]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
