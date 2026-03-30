export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import LeadForm, { type ILeadForm } from "@/models/LeadForm";
import type { FlattenMaps } from "mongoose";
import Prospect from "@/models/Prospect";

type LeanForm = FlattenMaps<ILeadForm> & { _id: unknown };
import { calculateLeadScore } from "@/lib/lead-scoring";

/**
 * POST /api/public/forms/[slug]/submit
 * Public endpoint — no auth required. Creates a Prospect from form data.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectDB();

    const form = await LeadForm.findOne({ slug, active: true }).lean() as LeanForm | null;
    if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

    const body = await req.json() as Record<string, unknown>;

    // Validate required fields
    for (const field of form.fields) {
      if (field.required && !body[field.id]?.toString().trim()) {
        return NextResponse.json(
          { error: `"${field.label}" is required` },
          { status: 400 }
        );
      }
    }

    // Email format check on any email-type field
    const emailFields = form.fields.filter((f) => f.type === "email");
    for (const ef of emailFields) {
      const val = String(body[ef.id] ?? "").trim();
      if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        return NextResponse.json(
          { error: `"${ef.label}" must be a valid email address` },
          { status: 400 }
        );
      }
    }

    // Extract well-known fields; everything else goes into `message`
    const businessName = String(body.businessName ?? body.company ?? "").trim().slice(0, 200);
    const contactName = String(body.contactName ?? body.name ?? "").trim().slice(0, 200);
    const contactEmail = String(body.contactEmail ?? body.email ?? "").trim().toLowerCase().slice(0, 200);
    const phone = String(body.phone ?? "").trim().slice(0, 50);
    const website = String(body.website ?? "").trim().slice(0, 200);
    const message = String(body.message ?? "").trim().slice(0, 2000);

    if (!businessName || !contactName || !contactEmail) {
      return NextResponse.json(
        { error: "Business name, contact name and email are required" },
        { status: 400 }
      );
    }

    const referrerUrl = req.headers.get("referer") ?? undefined;

    const { breakdown, total } = calculateLeadScore({ phone, website, message });

    const prospectData = {
      businessName,
      contactName,
      contactEmail,
      ...(phone ? { phone } : {}),
      ...(website ? { website } : {}),
      ...(message ? { message } : {}),
      stage: "mql" as const,
      source: "web_form" as const,
      assignedConsultant: form.consultantId,
      leadScore: total,
      leadScoreBreakdown: breakdown,
      ...(referrerUrl ? { referrerUrl } : {}),
      activityLog: [
        {
          type: "system" as const,
          message: `Lead submitted via form "${form.name}"`,
          createdAt: new Date(),
        },
      ],
      stageEnteredAt: new Map([["mql", new Date()]]),
    };

    await Prospect.create(prospectData);

    // Increment submission counter on the form
    await LeadForm.findByIdAndUpdate(form._id, { $inc: { submissionCount: 1 } });

    return NextResponse.json(
      {
        ok: true,
        successMessage: form.successMessage,
        redirectUrl: form.redirectUrl || null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("PUBLIC FORM SUBMIT", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
