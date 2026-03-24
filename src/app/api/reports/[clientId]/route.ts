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
import ConsultantResponse from "@/models/ConsultantResponse";
import { requireAuth, apiError, type AuthenticatedUser } from "@/lib/api-helpers";
import { FRAMEWORK_NAV } from "@/lib/framework-nav";
import {
  generateClientReport,
  type ReportData,
  type ReportSection,
  type ConsultantSection,
  type FinancialSummary,
} from "@/lib/pdf/generate-report";
import {
  REVENUE_EXECUTION_SECTION,
  EXECUTION_PLANNING_SECTION,
} from "@/lib/concept-map";

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

    // Fetch consultant responses for this project (S2/S3 data)
    const consultantResponseDocs = project?._id
      ? await ConsultantResponse.find({ projectId: project._id }).lean()
      : [];

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

    // Build consultant sections (S2/S3) from ConsultantResponse docs
    const consultantSections: ConsultantSection[] = [];
    if (consultantResponseDocs.length > 0) {
      // Build a lookup: `${section}/${sub}` → responses Map
      const crMap = new Map<string, Record<string, any>>();
      for (const doc of consultantResponseDocs) {
        const d = doc as Record<string, any>;
        const key = `${d.section}/${d.sub}`;
        const resp = d.responses instanceof Map
          ? Object.fromEntries(d.responses)
          : (d.responses ?? {});
        crMap.set(key, resp);
      }

      // Helper to build a ConsultantSection from a concept-map section
      const buildConsultantSection = (
        sectionDef: { heading: string; modules: Record<string, any> },
        sectionKey: string
      ): ConsultantSection | null => {
        const modules: ConsultantSection["modules"] = [];

        for (const [sub, mod] of Object.entries(sectionDef.modules)) {
          const responses = crMap.get(`${sectionKey}/${sub}`);
          if (!responses || Object.keys(responses).length === 0) continue;

          const fields: { label: string; value: string }[] = [];
          if (mod.fields) {
            for (const f of mod.fields) {
              const val = responses[f.id];
              if (val && typeof val === "string" && val.trim()) {
                fields.push({ label: f.question, value: val });
              }
            }
          }

          const measures: { label: string; current: string; target: string }[] = [];
          // Check for measure table data stored with various keys
          const measureKeys = Object.keys(responses).filter(
            (k) => k.includes("measures") || k.startsWith("scorecard-")
          );
          for (const mk of measureKeys) {
            const arr = responses[mk];
            if (Array.isArray(arr)) {
              for (const row of arr) {
                if (row && (row.current || row.target)) {
                  measures.push({
                    label: row.label ?? row.id ?? mk,
                    current: row.current ?? "",
                    target: row.target ?? "",
                  });
                }
              }
            }
          }

          const tables: { label: string; rows: string[][] }[] = [];
          // Action tables, ownership matrix, risk register, governance, intervention rules
          const tableKeys = Object.keys(responses).filter(
            (k) =>
              k.includes("actions") ||
              k.includes("matrix") ||
              k.includes("register") ||
              k.includes("calendar") ||
              k.includes("intervention") ||
              k.includes("ownership")
          );
          for (const tk of tableKeys) {
            const arr = responses[tk];
            if (Array.isArray(arr) && arr.length > 0) {
              const headers = Object.keys(arr[0]).filter((h) => h !== "id");
              const rows: string[][] = [headers];
              for (const row of arr) {
                rows.push(headers.map((h) => String(row[h] ?? "")));
              }
              tables.push({ label: tk.replace(/^s[23]-/, "").replace(/-/g, " "), rows });
            }
          }

          if (fields.length > 0 || measures.length > 0 || tables.length > 0) {
            modules.push({
              moduleTitle: `${mod.number} ${mod.title}`,
              fields,
              measures,
              tables,
            });
          }
        }

        if (modules.length === 0) return null;
        return { sectionTitle: sectionDef.heading, modules };
      };

      const s2 = buildConsultantSection(REVENUE_EXECUTION_SECTION, "revenue_execution");
      if (s2) consultantSections.push(s2);
      const s3 = buildConsultantSection(EXECUTION_PLANNING_SECTION, "execution_planning");
      if (s3) consultantSections.push(s3);
    }

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
      consultantSections: consultantSections.length > 0 ? consultantSections : undefined,
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
