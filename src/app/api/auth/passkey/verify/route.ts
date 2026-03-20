import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAuthentication, verifyRegistration } from "@/lib/webauthn";

const authSchema = z.object({
  type: z.literal("authenticate"),
  email: z.string().email(),
  response: z.unknown(),
  challenge: z.string(),
});

const regSchema = z.object({
  type: z.literal("register"),
  userId: z.string(),
  response: z.unknown(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.type === "register") {
      const { userId, response } = regSchema.parse(body);
      const result = await verifyRegistration(userId, response as never);
      if (!result.verified) {
        return NextResponse.json({ error: "Registration verification failed" }, { status: 400 });
      }
      return NextResponse.json({ success: true, userId }, { status: 200 });
    }

    if (body.type === "authenticate") {
      const { email, response, challenge } = authSchema.parse(body);
      const { verification, userId } = await verifyAuthentication(email, response as never, challenge);
      if (!verification.verified) {
        return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
      }
      return NextResponse.json({ success: true, userId }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("[PASSKEY VERIFY]", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
