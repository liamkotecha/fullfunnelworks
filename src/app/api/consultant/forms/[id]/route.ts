export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import LeadForm, { type ILeadForm } from "@/models/LeadForm";
import type { FlattenMaps } from "mongoose";
import { requireAuth, type AuthenticatedUser } from "@/lib/api-helpers";

type LeanForm = FlattenMaps<ILeadForm> & { _id: unknown };

/* ── GET /api/consultant/forms/[id] ─────────────────────── */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;
    if (user.role !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();
    const form = await LeadForm.findOne({ _id: id, consultantId: user.id }).lean() as LeanForm | null;
    if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ...form, id: String(form._id) });
  } catch (error) {
    console.error("FORMS GET [id]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ── PATCH /api/consultant/forms/[id] ───────────────────── */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;
    if (user.role !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json() as Record<string, unknown>;

    const allowed = ["name", "active", "primaryColor", "fields", "successMessage", "redirectUrl"];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }
    if (update.name) update.name = String(update.name).trim().slice(0, 200);

    await connectDB();
    const form = await LeadForm.findOneAndUpdate(
      { _id: id, consultantId: user.id },
      { $set: update },
      { new: true }
    ).lean() as LeanForm | null;
    if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ...form, id: String(form._id) });
  } catch (error) {
    console.error("FORMS PATCH [id]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ── DELETE /api/consultant/forms/[id] ──────────────────── */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;
    if (user.role !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();
    const form = await LeadForm.findOneAndDelete({ _id: id, consultantId: user.id });
    if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("FORMS DELETE [id]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
