export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import LeadForm from "@/models/LeadForm";
import { requireAuth, type AuthenticatedUser } from "@/lib/api-helpers";

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

/* ── GET /api/consultant/forms ───────────────────────────── */
export async function GET() {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;
    if (user.role !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const forms = await LeadForm.find({ consultantId: user.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ data: forms.map((f) => ({ ...f, id: String(f._id) })) });
  } catch (error) {
    console.error("FORMS GET", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ── POST /api/consultant/forms ──────────────────────────── */
export async function POST(req: Request) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;
    if (user.role !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json() as {
      name?: string;
      primaryColor?: string;
      fields?: unknown[];
      successMessage?: string;
      redirectUrl?: string;
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Form name is required" }, { status: 400 });
    }

    await connectDB();

    // Generate unique slug within this consultant's forms
    let baseSlug = toSlug(body.name.trim());
    if (!baseSlug) baseSlug = "form";
    let slug = baseSlug;
    let attempt = 0;
    while (await LeadForm.exists({ consultantId: user.id, slug })) {
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    const form = await LeadForm.create({
      consultantId: user.id,
      name: body.name.trim().slice(0, 200),
      slug,
      primaryColor: body.primaryColor ?? "#6CC2FF",
      fields: body.fields ?? defaultFields(),
      successMessage: body.successMessage ?? "Thanks! We\u2019ll be in touch soon.",
      redirectUrl: body.redirectUrl ?? "",
    });

    return NextResponse.json({ id: String(form._id), slug: form.slug }, { status: 201 });
  } catch (error) {
    console.error("FORMS POST", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function defaultFields() {
  return [
    { id: "businessName", type: "text", label: "Company name", placeholder: "Acme Ltd", required: true },
    { id: "contactName", type: "text", label: "Your name", placeholder: "Jane Smith", required: true },
    { id: "contactEmail", type: "email", label: "Work email", placeholder: "jane@acme.com", required: true },
    { id: "phone", type: "phone", label: "Phone number", placeholder: "+44 7700 000000", required: false },
    { id: "message", type: "textarea", label: "What are you looking for help with?", placeholder: "Tell us about your situation...", required: false },
  ];
}
