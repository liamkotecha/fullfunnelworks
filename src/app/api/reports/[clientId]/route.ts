export const dynamic = "force-dynamic";
/**
 * GET /api/reports/[clientId]?includeNotes=true&projectId=[id]
 *
 * Generates and streams a branded PDF report for the client engagement.
 * Auth: admin/consultant OR the client themselves (for terminated engagements).
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";
import Project from "@/models/Project";
import IntakeResponse from "@/models/IntakeResponse";
import FrameworkQuestion from "@/models/FrameworkQuestion";
import ConsultantNote from "@/models/ConsultantNote";
import ModellerBase from "@/models/ModellerBase";
import { requireAuth, apiError, type AuthenticatedUser } from "@/lib/api-helpers";
import { FRAMEWORK_NAV } from "@/lib/framework-nav";
import {
  generateClientReport,
  type ReportData,
  type ReportSection,
  type FinancialSummary,
} from "@/lib/pdf/generate-report";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;

    const { clientId } = await params;
    const includeNotes = req.nextUrl.searchParams.get("includeNotes") === "true";
    const projectId = req.nextUrl.searchParams.get("projectId");

    await connectDB();

    // Auth: admin/consultant always allowed, client only if they own this client record
    if (user.role === "client") {
      const client = await Client.findById(clientId).select("userId teamUserIds").lean() as Record<string, unknown> | null;
      if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }
      const isOwner =
        String(client.userId) === user.id ||
        ((client.teamUserIds as string[]) ?? []).some((id) => String(id) === user.id);
      if (!isOwner) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Fetch all data in parallel
    const [client, project, intakeDoc, questions, notesDocs, modellerBase] =
      await Promise.all([
        Client.findById(clientId).populate("userId", "name email").lean() as Promise<Record<string, any> | null>,
        projectId
          ? Project.findById(projectId).populate("assignedTo", "name email").lean() as Promise<Record<string, any> | null>
          : Project.findOne({ clientId }).sort({ createdAt: -1 }).populate("assignedTo", "name email").lean() as Promise<Record<string, any> | null>,
        IntakeResponse.findOne({ clientId }).lean() as Promise<Record<string, any> | null>,
        FrameworkQuestion.find({ active: true }).sort({ section: 1, subSection: 1, group: 1, order: 1 }).lean(),
        includeNotes
          ? ConsultantNote.find({ clientId }).lean()
          : Promise.resolve([]),
        ModellerBase.findOne({ clientId }).lean() as Promise<Record<string, any> | null>,
      ]);

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Build question map: fieldId → { question, section, subSection }
    const questionMap = new Map<string, { question: string; section: string; subSection: string }>();
    for (const q of questions) {
      const qObj = q as Record<string, any>;
      questionMap.set(qObj.fieldId, {
        question: qObj.question ?? qObj.fieldId,
        section: qObj.section,
        subSection: qObj.subSection,
      });
    }

    // Build notes map: fieldId → note
    const notesMap: Record<string, string> = {};
    if (includeNotes && notesDocs) {
      for (const n of notesDocs) {
        const nObj = n as Record<string, any>;
        notesMap[nObj.fieldId] = nObj.note;
      }
    }

    // Get responses
    const responses = (intakeDoc?.responses as Record<string, unknown>) ?? {};

    // Build ReportData sections from FRAMEWORK_NAV
    const sections: ReportSection[] = [];
    for (const section of FRAMEWORK_NAV) {
      const subSections: ReportSection["subSections"] = [];

      if (section.children.length > 0) {
        for (const sub of section.children) {
          const fields = sub.fieldIds.map((fieldId) => {
            const qInfo = questionMap.get(fieldId);
            return {
              fieldId,
              question: qInfo?.question ?? fieldId,
              answer: responses[fieldId]
                ? String(responses[fieldId])
                : null,
              note: includeNotes ? notesMap[fieldId] : undefined,
            };
          });
          subSections.push({ subSectionLabel: sub.label, fields });
        }
      } else if (section.fieldIds && section.fieldIds.length > 0) {
        const fields = section.fieldIds.map((fieldId) => {
          const qInfo = questionMap.get(fieldId);
          return {
            fieldId,
            question: qInfo?.question ?? fieldId,
            answer: responses[fieldId]
              ? String(responses[fieldId])
              : null,
            note: includeNotes ? notesMap[fieldId] : undefined,
          };
        });
        subSections.push({ subSectionLabel: "Responses", fields });
      }

      if (subSections.some((s) => s.fields.length > 0)) {
        sections.push({ sectionLabel: section.label, subSections });
      }
    }

    // Build financial summary if modeller data exists
    let financialSummary: FinancialSummary | null = null;
    if (modellerBase) {
      const revenue = (modellerBase.revenue as Array<{ monthly: number[] }>) ?? [];
      const people = (modellerBase.people as Array<{ monthly: number[] }>) ?? [];
      const overheads = (modellerBase.overheads as Array<{ monthly: number[] }>) ?? [];

      const sumFirst = (arr: Array<{ monthly: number[] }>) =>
        arr.reduce((total, item) => total + ((item.monthly?.[0]) ?? 0), 0);

      const monthlyRev = sumFirst(revenue);
      const monthlyPeopleCost = sumFirst(people);
      const monthlyOverheadsCost = sumFirst(overheads);
      // Estimate gross margin at 60% if not specified
      const grossMarginPct = 60;
      const grossProfit = monthlyRev * (grossMarginPct / 100);
      const netProfit = grossProfit - monthlyPeopleCost - monthlyOverheadsCost;

      if (monthlyRev > 0 || monthlyPeopleCost > 0) {
        financialSummary = {
          monthlyRevenue: monthlyRev,
          grossMarginPct,
          monthlyPeople: monthlyPeopleCost,
          monthlyOverheads: monthlyOverheadsCost,
          netProfit,
        };
      }
    }

    const consultantName = project?.assignedTo
      ? (project.assignedTo as Record<string, any>).name
      : undefined;

    const reportData: ReportData = {
      client: {
        businessName: (client.businessName as string) ?? "Client",
        contactName: (client.contactName as string) ?? undefined,
        website: (client.website as string) ?? undefined,
      },
      project: {
        title: (project?.title as string) ?? "Growth Strategy",
        createdAt: project?.createdAt
          ? new Date(project.createdAt).toISOString()
          : new Date().toISOString(),
        completedAt: project?.terminatedAt
          ? new Date(project.terminatedAt).toISOString()
          : undefined,
        assignedConsultantName: consultantName,
      },
      sections,
      financialSummary,
      includeNotes,
      notes: includeNotes ? notesMap : undefined,
    };

    const pdfBuffer = await generateClientReport(reportData);

    const safeName = ((client.businessName as string) ?? "report")
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase();

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}-report.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    return apiError("REPORT_GENERATE", error);
  }
}
