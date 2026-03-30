export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import LeadForm, { type ILeadForm } from "@/models/LeadForm";
import type { FlattenMaps } from "mongoose";

type LeanForm = FlattenMaps<ILeadForm> & { _id: unknown };

/**
 * GET /api/public/forms/[id]
 * Returns the form schema for rendering on the client.
 * No authentication required — intentionally public.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const form = await LeadForm.findOne({ _id: id, active: true })
      .select("name fields primaryColor successMessage redirectUrl")
      .lean() as LeanForm | null;

    if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

    return NextResponse.json({
      name: form.name,
      primaryColor: form.primaryColor,
      fields: form.fields,
      successMessage: form.successMessage,
      redirectUrl: form.redirectUrl ?? null,
    });
  } catch (error) {
    console.error("PUBLIC FORM GET", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
