export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";
import User from "@/models/User";
import IntakeResponse from "@/models/IntakeResponse";
import { sendEmail } from "@/lib/sendgrid";
import { onboardingInviteEmail } from "@/lib/email-templates/onboarding-invite";
import { getAllFieldIds, calculateProgress } from "@/lib/framework-nav";
import { requireAuth, consultantFilter, assertConsultantOwnsClient } from "@/lib/api-helpers";
import type { IIntakeResponse } from "@/models/IntakeResponse";

const createSchema = z.object({
  businessName: z.string().min(1),
  email: z.string().email(),
  name: z.string().optional(),
  assignedConsultant: z.string().optional(),
});

interface PopulatedClient {
  _id: unknown;
  [key: string]: unknown;
}

interface LeanIntakeResponse {
  clientId: unknown;
  responses?: Record<string, unknown> | Map<string, unknown>;
  [key: string]: unknown;
}

export async function GET() {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    await connectDB();

    const clients = await Client.find(consultantFilter(userOrRes))
      .populate("userId", "email name")
      .populate("assignedConsultant", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // Batch-fetch intake responses and compute overallProgress per client
    const clientIds = (clients as PopulatedClient[]).map((c) => c._id);
    const intakeResponses = await IntakeResponse.find({ clientId: { $in: clientIds } }).lean() as unknown as LeanIntakeResponse[];

    const responseMap = new Map<string, LeanIntakeResponse>();
    for (const r of intakeResponses) {
      responseMap.set(String(r.clientId), r);
    }

    const allFieldIds = getAllFieldIds();
    const clientsWithProgress = (clients as PopulatedClient[]).map((client) => {
      const intake = responseMap.get(String(client._id));
      const overallProgress = intake
        ? calculateProgress(allFieldIds, (intake.responses ?? {}) as Record<string, unknown>).percent
        : 0;
      return { ...client, id: String(client._id), overallProgress };
    });

    return NextResponse.json({ data: clientsWithProgress }, { status: 200 });
  } catch (error) {
    console.error("[CLIENTS GET]", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const body = await req.json();
    const { businessName, email, name, assignedConsultant } = createSchema.parse(body);
    const resolvedName = name || businessName;

    await connectDB();

    // Create or find user
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({ email: email.toLowerCase(), name: resolvedName, role: "client" });
    }

    // Consultant creating a client always owns them; admin can optionally specify
    const userOrRes2 = await requireAuth();
    const creatingUserId = userOrRes2 instanceof NextResponse ? undefined : userOrRes2;
    const resolvedConsultant =
      creatingUserId?.role === "consultant"
        ? creatingUserId.id
        : (assignedConsultant || undefined);

    // Create client record
    const client = await Client.create({
      userId: user._id,
      businessName,
      status: "invited",
      assignedConsultant: resolvedConsultant,
    });

    // Send invite email
    const portalUrl = `${process.env.NEXTAUTH_URL}/login`;
    await sendEmail({
      to: email,
      subject: `Welcome to Full Funnel — ${businessName}`,
      html: onboardingInviteEmail({
        clientName: resolvedName,
        portalUrl,
        firmName: process.env.SENDGRID_FROM_NAME,
      }),
    });

    return NextResponse.json({ data: client }, { status: 201 });
  } catch (error) {
    console.error("[CLIENTS POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
