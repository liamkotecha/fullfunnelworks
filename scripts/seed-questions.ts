/**
 * seed-questions.ts — populate FrameworkQuestion collection from concept-map.ts
 *
 * Usage: npx tsx scripts/seed-questions.ts
 *
 * Safe to re-run: uses upsert by fieldId so existing edits are preserved
 * unless you pass --force to overwrite all question text.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import FrameworkQuestion from "../src/models/FrameworkQuestion";
import {
  ASSESSMENT_SECTION,
  PEOPLE_SECTION,
  PRODUCT_SECTION,
  PROCESS_SECTION,
  ROADMAP_SECTION,
  KPIS_SECTION,
  GTM_SECTION,
  REVENUE_EXECUTION_SECTION,
  EXECUTION_PLANNING_SECTION,
} from "../src/lib/concept-map";

const force = process.argv.includes("--force");

interface QSeed {
  fieldId: string;
  section: string;
  subSection: string;
  group?: string;
  question: string;
  subPrompt?: string;
  label?: string;
  type: "textarea" | "text" | "checkbox" | "slider" | "select" | "measure-table" | "action-table" | "ownership-matrix" | "risk-register" | "governance-calendar" | "intervention-rules";
  placeholder?: string;
  weightFieldId?: string;
  order: number;
  metadata?: Record<string, unknown>;
}

const questions: QSeed[] = [];

// ── Assessment: Checklist ────────────────────────────────────

ASSESSMENT_SECTION.checklist.forEach((text, i) => {
  questions.push({
    fieldId: `assessment_checklist_${i}`,
    section: "assessment",
    subSection: "checklist",
    question: text,
    type: "checkbox",
    order: i,
  });
});

// ── Assessment: SWOT ─────────────────────────────────────────

const swotQuadrants = [
  { key: "strengths", data: ASSESSMENT_SECTION.swot.strengths },
  { key: "weaknesses", data: ASSESSMENT_SECTION.swot.weaknesses },
  { key: "opportunities", data: ASSESSMENT_SECTION.swot.opportunities },
  { key: "threats", data: ASSESSMENT_SECTION.swot.threats },
] as const;

swotQuadrants.forEach(({ key, data }) => {
  data.questions.forEach((q, i) => {
    questions.push({
      fieldId: q.id,
      section: "assessment",
      subSection: "swot",
      group: key,
      question: q.question,
      label: data.label,
      type: "textarea",
      weightFieldId: q.weightId,
      order: i,
    });
  });
});

// ── Assessment: MOST ─────────────────────────────────────────

const mostGroups = [
  { key: "mission", data: ASSESSMENT_SECTION.most.mission },
  { key: "objectives", data: ASSESSMENT_SECTION.most.objectives },
  { key: "strategy", data: ASSESSMENT_SECTION.most.strategy },
  { key: "tactics", data: ASSESSMENT_SECTION.most.tactics },
] as const;

mostGroups.forEach(({ key, data }) => {
  data.questions.forEach((q, i) => {
    questions.push({
      fieldId: q.id,
      section: "assessment",
      subSection: "most",
      group: key,
      question: q.question,
      label: data.label,
      type: "textarea",
      order: i,
    });
  });
});

// ── Assessment: Leadership ───────────────────────────────────

ASSESSMENT_SECTION.leadershipQuestions.questions.forEach((q, i) => {
  questions.push({
    fieldId: q.id,
    section: "assessment",
    subSection: "leadership",
    question: q.question,
    subPrompt: q.subPrompt,
    type: "textarea",
    order: i,
  });
});

// ── Assessment: Gap Analysis ─────────────────────────────────

const gapFields = [
  { fieldId: "gap-priority", question: "What are the top 3 capability gaps you need to close?", placeholder: "Priority gaps..." },
  { fieldId: "gap-impact", question: "What is the expected impact of closing these gaps?", placeholder: "Expected impact..." },
  { fieldId: "gap-timeline", question: "What is the realistic timeline for addressing these gaps?", placeholder: "Timeline..." },
];

gapFields.forEach((f, i) => {
  questions.push({
    fieldId: f.fieldId,
    section: "assessment",
    subSection: "gap",
    question: f.question,
    placeholder: f.placeholder,
    type: "textarea",
    order: i,
  });
});

// ── People: Challenges Checklist ─────────────────────────────

PEOPLE_SECTION.checklist.forEach((text, i) => {
  questions.push({
    fieldId: `people_checklist_${i}`,
    section: "people",
    subSection: "challenges",
    question: text,
    type: "checkbox",
    order: i,
  });
});

// ── People: Team Capability ──────────────────────────────────

PEOPLE_SECTION.teamCapabilityTracker.fields.forEach((f, i) => {
  questions.push({
    fieldId: f.id,
    section: "people",
    subSection: "methodology",
    question: f.label,
    placeholder: "placeholder" in f ? (f as Record<string, string>).placeholder : undefined,
    type: f.type === "range" ? "slider" : f.type === "textarea" ? "textarea" : "text",
    order: i,
    metadata: f.type === "range" ? { min: f.min, max: f.max, defaultValue: f.defaultValue } : undefined,
  });
});

// ── Product: Challenges Checklist ────────────────────────────

PRODUCT_SECTION.checklist.forEach((text, i) => {
  questions.push({
    fieldId: `product_checklist_${i}`,
    section: "product",
    subSection: "challenges",
    question: text,
    type: "checkbox",
    order: i,
  });
});

// ── Product: Outcome Mapper ──────────────────────────────────

PRODUCT_SECTION.outcomeMapper.columns.forEach((col, i) => {
  questions.push({
    fieldId: col.id,
    section: "product",
    subSection: "outcomes",
    question: col.label,
    placeholder: col.placeholder,
    type: "text",
    order: i,
  });
});

// ── Process: Checklist ───────────────────────────────────────

PROCESS_SECTION.checklist.forEach((text, i) => {
  questions.push({
    fieldId: `process_checklist_${i}`,
    section: "process",
    subSection: "checklist",
    question: text,
    type: "checkbox",
    order: i,
  });
});

// ── Process: Sales Methodology ───────────────────────────────

PROCESS_SECTION.salesCapabilityMethodology.phases.forEach((phase) => {
  phase.questions.forEach((q, i) => {
    questions.push({
      fieldId: q.id,
      section: "process",
      subSection: "methodology",
      group: `phase-${phase.number}`,
      question: q.label,
      label: phase.title,
      type: "textarea",
      order: (phase.number - 1) * 10 + i,
      metadata: { phaseNumber: phase.number, phaseTitle: phase.title, phaseObjective: phase.objective },
    });
  });
});

// ── Process: Sales Process Builder ───────────────────────────

PROCESS_SECTION.salesProcessBuilder.stages.forEach((stage) => {
  stage.fields.forEach((f, i) => {
    const fieldId = `proc_stage_${stage.id}_${i}`;
    questions.push({
      fieldId,
      section: "process",
      subSection: "builder",
      group: stage.id,
      question: f.label,
      placeholder: f.placeholder,
      label: stage.label,
      type: "textarea",
      order: parseInt(stage.label) * 10 + i,
      metadata: { stageId: stage.id, stageHeading: stage.heading },
    });
  });
});

// ── Roadmap ──────────────────────────────────────────────────

ROADMAP_SECTION.phases.forEach((phase) => {
  questions.push({
    fieldId: `roadmap_notes_${phase.number}`,
    section: "roadmap",
    subSection: "roadmap",
    group: `phase-${phase.number}`,
    question: `Phase ${phase.number}: ${phase.title} (${phase.duration}) — Notes`,
    label: phase.title,
    type: "textarea",
    placeholder: "Add your notes for this phase...",
    order: phase.number,
    metadata: { phaseNumber: phase.number, duration: phase.duration, items: phase.items },
  });
});

// ── KPIs ─────────────────────────────────────────────────────

for (let i = 0; i < 5; i++) {
  const companyPlaceholders = KPIS_SECTION.companyKPIPlaceholders[i];
  questions.push({
    fieldId: `company-kpi${i + 1}-name`,
    section: "kpis",
    subSection: "kpis",
    group: "company",
    question: "KPI Name",
    placeholder: companyPlaceholders.namePlaceholder,
    type: "text",
    order: i * 2,
  });
  questions.push({
    fieldId: `company-kpi${i + 1}-outcome`,
    section: "kpis",
    subSection: "kpis",
    group: "company",
    question: "Target Outcome",
    placeholder: companyPlaceholders.outcomePlaceholder,
    type: "text",
    order: i * 2 + 1,
  });
}

for (let i = 0; i < 5; i++) {
  const deptPlaceholders = KPIS_SECTION.deptKPIPlaceholders[i];
  questions.push({
    fieldId: `dept-kpi${i + 1}-name`,
    section: "kpis",
    subSection: "kpis",
    group: "department",
    question: "KPI Name",
    placeholder: deptPlaceholders.namePlaceholder,
    type: "text",
    order: 10 + i * 2,
  });
  questions.push({
    fieldId: `dept-kpi${i + 1}-outcome`,
    section: "kpis",
    subSection: "kpis",
    group: "department",
    question: "Target Outcome",
    placeholder: deptPlaceholders.outcomePlaceholder,
    type: "text",
    order: 10 + i * 2 + 1,
  });
}

// ── GTM: Competition ─────────────────────────────────────────

GTM_SECTION.competition.subsections.forEach((sub) => {
  sub.questions.forEach((q, i) => {
    questions.push({
      fieldId: q.id,
      section: "gtm",
      subSection: "competition",
      group: `section-${sub.number}`,
      question: q.question,
      label: sub.title,
      type: "textarea",
      order: (sub.number - 1) * 10 + i,
      metadata: { sectionNumber: sub.number, sectionTitle: sub.title, italic: sub.italic },
    });
  });
});

// ── GTM: Market Intelligence ─────────────────────────────────

GTM_SECTION.marketplace.subsections.forEach((sub) => {
  sub.questions.forEach((q, i) => {
    questions.push({
      fieldId: `${q.id}-current`,
      section: "gtm",
      subSection: "market",
      group: `section-${sub.number}`,
      question: q.question,
      label: q.label,
      subPrompt: "What you do now",
      type: "textarea",
      order: (sub.number - 1) * 10 + i * 2,
      metadata: { sectionNumber: sub.number, sectionTitle: sub.title, variant: "current" },
    });
    questions.push({
      fieldId: `${q.id}-next`,
      section: "gtm",
      subSection: "market",
      group: `section-${sub.number}`,
      question: q.question,
      label: q.label,
      subPrompt: "What you will put in place next",
      type: "textarea",
      order: (sub.number - 1) * 10 + i * 2 + 1,
      metadata: { sectionNumber: sub.number, sectionTitle: sub.title, variant: "next" },
    });
  });
});

// ── Run ──────────────────────────────────────────────────────

// ── S2: Revenue Execution ────────────────────────────────────

const S2 = REVENUE_EXECUTION_SECTION.modules;

function seedS2Module(
  mod: { id: string; title: string; fields?: readonly { id: string; type: string; question: string; options?: readonly string[] }[]; measures?: readonly { id: string; label: string }[] },
  subSection: string,
) {
  let order = 0;
  // Regular fields
  if (mod.fields) {
    for (const f of mod.fields) {
      questions.push({
        fieldId: f.id,
        section: "revenue_execution",
        subSection,
        question: f.question,
        type: f.type as QSeed["type"],
        order: order++,
        metadata: f.options ? { options: [...f.options] } : undefined,
      });
    }
  }
  // Measure table (single composite field)
  if (mod.measures) {
    questions.push({
      fieldId: `${mod.id}-measures`,
      section: "revenue_execution",
      subSection,
      question: `${mod.title} — Core Measures`,
      type: "measure-table",
      order: order++,
      metadata: { measures: mod.measures.map((m) => ({ id: m.id, label: m.label })) },
    });
  }
  // Action table
  questions.push({
    fieldId: `${mod.id}-actions`,
    section: "revenue_execution",
    subSection,
    question: `${mod.title} — Actions Required`,
    type: "action-table",
    order: order++,
  });
}

// 2.1 Methodology
seedS2Module(S2.methodology, "methodology");

// 2.2 Adoption
seedS2Module(S2.adoption, "adoption");

// 2.3 Ownership — has ownership matrix
questions.push({
  fieldId: "s2-ownership-matrix",
  section: "revenue_execution",
  subSection: "ownership",
  question: "Commercial Leadership — Ownership Matrix",
  type: "ownership-matrix",
  order: 0,
  metadata: {
    roles: S2.ownership.ownershipRoles.map((r) => ({
      role: r.role,
      responsibility: r.responsibility,
    })),
  },
});
for (const f of S2.ownership.fields) {
  questions.push({
    fieldId: f.id,
    section: "revenue_execution",
    subSection: "ownership",
    question: f.question,
    type: f.type as QSeed["type"],
    order: 1,
  });
}
if (S2.ownership.measures) {
  questions.push({
    fieldId: "s2-ownership-measures",
    section: "revenue_execution",
    subSection: "ownership",
    question: "Commercial Ownership — Core Measures",
    type: "measure-table",
    order: 2,
    metadata: { measures: S2.ownership.measures.map((m) => ({ id: m.id, label: m.label })) },
  });
}

// 2.4 CRM
seedS2Module(S2.crm, "crm");

// 2.5 Campaigns
seedS2Module(S2.campaigns, "campaigns");

// 2.6 Scorecard — has balanced scorecard
questions.push({
  fieldId: "s2-scorecard-table",
  section: "revenue_execution",
  subSection: "scorecard",
  question: "Balanced Scorecard",
  type: "measure-table",
  order: 0,
  metadata: {
    scorecardAreas: S2.scorecard.scorecardAreas.map((area) => ({
      area: area.area,
      measures: area.measures.map((m) => ({ id: m.id, label: m.label })),
    })),
  },
});
for (const f of S2.scorecard.fields) {
  questions.push({
    fieldId: f.id,
    section: "revenue_execution",
    subSection: "scorecard",
    question: f.question,
    type: f.type as QSeed["type"],
    order: 1,
  });
}

// 2.7 QBR
for (const f of S2.qbr.fields) {
  questions.push({
    fieldId: f.id,
    section: "revenue_execution",
    subSection: "qbr",
    question: f.question,
    type: f.type as QSeed["type"],
    order: S2.qbr.fields.indexOf(f),
  });
}
questions.push({
  fieldId: "s2-qbr-corrective-actions",
  section: "revenue_execution",
  subSection: "qbr",
  question: "Corrective Actions",
  type: "action-table",
  order: S2.qbr.fields.length,
  metadata: { columns: ["Issue/Gap", "Corrective Action", "Owner", "Due Date"] },
});

// 2.8 People & Capability
seedS2Module(S2.peopleCap, "people-cap");

// ── S3: Execution Planning ───────────────────────────────────

const S3 = EXECUTION_PLANNING_SECTION.modules;

function seedS3Module(
  mod: { id: string; title: string; fields?: readonly { id: string; type: string; question: string }[]; measures?: readonly { id: string; label: string }[] },
  subSection: string,
) {
  let order = 0;
  if (mod.fields) {
    for (const f of mod.fields) {
      questions.push({
        fieldId: f.id,
        section: "execution_planning",
        subSection,
        question: f.question,
        type: f.type as QSeed["type"],
        order: order++,
      });
    }
  }
  if (mod.measures) {
    questions.push({
      fieldId: `${mod.id}-measures`,
      section: "execution_planning",
      subSection,
      question: `${mod.title} — Core Measures`,
      type: "measure-table",
      order: order++,
      metadata: { measures: mod.measures.map((m) => ({ id: m.id, label: m.label })) },
    });
  }
}

// 3.1 Priorities
seedS3Module(S3.priorities, "priorities");

// 3.2 90-Day — has workstream action tables
for (const ws of S3.ninetyDay.workstreams) {
  questions.push({
    fieldId: `s3-90day-${ws.id}-actions`,
    section: "execution_planning",
    subSection: "90day",
    group: ws.id,
    question: `${ws.label} — 90-Day Actions`,
    label: ws.label,
    type: "action-table",
    order: S3.ninetyDay.workstreams.indexOf(ws),
    metadata: { icon: ws.icon, purpose: ws.purpose, successEvidence: ws.successEvidence },
  });
}
if (S3.ninetyDay.measures) {
  questions.push({
    fieldId: "s3-90day-measures",
    section: "execution_planning",
    subSection: "90day",
    question: "90-Day Milestone Measures",
    type: "measure-table",
    order: S3.ninetyDay.workstreams.length,
    metadata: { measures: S3.ninetyDay.measures.map((m) => ({ id: m.id, label: m.label })) },
  });
}

// 3.3 Accountability — has accountability matrix
questions.push({
  fieldId: "s3-accountability-matrix",
  section: "execution_planning",
  subSection: "accountability",
  question: "Functional Accountability Matrix",
  type: "ownership-matrix",
  order: 0,
  metadata: {
    roles: S3.accountability.accountabilityRoles.map((r) => ({
      role: r.function,
      responsibility: r.accountabilities,
      evidence: r.evidence,
    })),
  },
});
if (S3.accountability.measures) {
  questions.push({
    fieldId: "s3-accountability-measures",
    section: "execution_planning",
    subSection: "accountability",
    question: "Accountability Measures",
    type: "measure-table",
    order: 1,
    metadata: { measures: S3.accountability.measures.map((m) => ({ id: m.id, label: m.label })) },
  });
}

// 3.4 Risk — has risk register
questions.push({
  fieldId: "s3-risk-register",
  section: "execution_planning",
  subSection: "risk",
  question: "Risk Register",
  type: "risk-register",
  order: 0,
});
for (const f of S3.risk.fields) {
  questions.push({
    fieldId: f.id,
    section: "execution_planning",
    subSection: "risk",
    question: f.question,
    type: f.type as QSeed["type"],
    order: 1,
  });
}
if (S3.risk.measures) {
  questions.push({
    fieldId: "s3-risk-measures",
    section: "execution_planning",
    subSection: "risk",
    question: "Risk & Resource Measures",
    type: "measure-table",
    order: 2,
    metadata: { measures: S3.risk.measures.map((m) => ({ id: m.id, label: m.label })) },
  });
}

// 3.5 Governance — has governance calendar
questions.push({
  fieldId: "s3-governance-calendar",
  section: "execution_planning",
  subSection: "governance",
  question: "Governance Calendar",
  type: "governance-calendar",
  order: 0,
  metadata: {
    reviews: S3.governance.governanceCalendar.map((r) => ({
      reviewType: r.reviewType,
      frequency: r.frequency,
    })),
  },
});
for (const f of S3.governance.fields) {
  questions.push({
    fieldId: f.id,
    section: "execution_planning",
    subSection: "governance",
    question: f.question,
    type: f.type as QSeed["type"],
    order: S3.governance.fields.indexOf(f) + 1,
  });
}

// 3.6 KPI Dashboard — has intervention rules
questions.push({
  fieldId: "s3-kpi-dashboard-interventions",
  section: "execution_planning",
  subSection: "kpi-dashboard",
  question: "KPI Action Thresholds & Intervention Rules",
  type: "intervention-rules",
  order: 0,
  metadata: {
    areas: S3.kpiDashboard.interventionAreas.map((a) => ({
      area: a.area,
      amberTrigger: a.amberTrigger,
      typicalIntervention: a.typicalIntervention,
    })),
  },
});

// 3.7 Reset
seedS3Module(S3.reset, "reset");

// ── Run ──────────────────────────────────────────────────────

async function main() {
  await connectDB();
  console.log(`\n📋 Seeding ${questions.length} framework questions...\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const q of questions) {
    const existing = await FrameworkQuestion.findOne({ fieldId: q.fieldId });

    if (existing && !force) {
      skipped++;
      continue;
    }

    const updateData = force
      ? { ...q, active: true }
      : { $setOnInsert: { ...q, active: true } };

    const result = await FrameworkQuestion.updateOne(
      { fieldId: q.fieldId },
      force ? { $set: updateData } : updateData,
      { upsert: true }
    );

    if (result.upsertedCount > 0) created++;
    else if (result.modifiedCount > 0) updated++;
    else skipped++;
  }

  console.log(`✅ Done: ${created} created, ${updated} updated, ${skipped} skipped`);
  console.log(`   Total in DB: ${await FrameworkQuestion.countDocuments()}`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
