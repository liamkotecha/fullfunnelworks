export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";
import { requireAuth, toClientDTO, assertConsultantOwnsClient } from "@/lib/api-helpers";

const updateSchema = z.object({
  businessName:   z.string().min(1).optional(),
  status: z.enum(["invited", "onboarding", "active", "paused"]).optional(),
  notes: z.string().optional(),
  assignedConsultant: z.string().optional().nullable(),
  contactName:    z.string().optional(),
  jobTitle:       z.string().optional(),
  contactEmail:   z.string().email().optional().or(z.literal("")),
  phone:          z.string().optional(),
  invoicingEmail: z.string().email().optional().or(z.literal("")),
  website:        z.string().optional(),
  addressLine1:   z.string().optional(),
  addressLine2:   z.string().optional(),
  city:           z.string().optional(),
  postcode:       z.string().optional(),
  country:        z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    await connectDB();
    const client = await Client.findById(params.id)
      .populate("userId", "email name")
      .populate("assignedConsultant", "name email")
      .lean();

    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    const guard = assertConsultantOwnsClient(userOrRes, client as Record<string, unknown>);
    if (guard) return guard;
    return NextResponse.json({ data: toClientDTO(client) }, { status: 200 });
  } catch (error) {
    console.error("[CLIENT GET]", error);
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const body = await req.json();
    const parsed = updateSchema.parse(body);
    // Consultants cannot reassign clients to another consultant
    const data: typeof parsed = { ...parsed };
    if (userOrRes.role === "consultant") delete (data as Record<string, unknown>).assignedConsultant;

    await connectDB();
    // Fetch first to verify ownership
    const existing = await Client.findById(params.id).lean();
    if (!existing) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    const guard = assertConsultantOwnsClient(userOrRes, existing as Record<string, unknown>);
    if (guard) return guard;

    const client = await Client.findByIdAndUpdate(params.id, data, { new: true })
      .populate("userId", "email name")
      .populate("assignedConsultant", "name email")
      .lean();
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    return NextResponse.json({ data: toClientDTO(client) }, { status: 200 });
  } catch (error) {
    console.error("[CLIENT PATCH]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    await connectDB();
    const existing = await Client.findById(params.id).lean();
    if (!existing) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    const guard = assertConsultantOwnsClient(userOrRes, existing as Record<string, unknown>);
    if (guard) return guard;
    await Client.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[CLIENT DELETE]", error);
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
  }
}
