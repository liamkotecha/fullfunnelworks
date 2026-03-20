/**
 * Comprehensive seed script — populates all models with realistic data
 * covering every status / scenario for dev/demo purposes.
 *
 * Run: npx tsx scripts/seed.ts
 * Requires MONGODB_URI in .env.local
 *
 * Safe to re-run — uses upsert for Users & Clients, deletes + re-creates
 * for transactional data (Projects, Invoices, Prospects, etc.).
 */

import mongoose, { Types } from "mongoose";
import * as dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// ── Import actual models ─────────────────────────────────────
import User from "../src/models/User";
import Client from "../src/models/Client";
import Project from "../src/models/Project";
import Invoice from "../src/models/Invoice";
import Prospect from "../src/models/Prospect";
import IntakeResponse from "../src/models/IntakeResponse";
import HiringPlan from "../src/models/HiringPlan";
import ModellerBase from "../src/models/ModellerBase";
import ModellerScenario from "../src/models/ModellerScenario";
import Notification from "../src/models/Notification";
import ConsultantNote from "../src/models/ConsultantNote";
import Settings from "../src/models/Settings";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI is not set in .env.local");
  process.exit(1);
}

// ── Helpers ──────────────────────────────────────────────────

const DEV_PASSWORD = "admin123";
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000);

// ── Seed function ────────────────────────────────────────────

async function seed() {
  await mongoose.connect(MONGODB_URI!);
  console.log("✅  Connected to MongoDB\n");

  const hash = await bcrypt.hash(DEV_PASSWORD, 10);

  // ┌──────────────────────────────────────────────────────────┐
  // │  1. USERS — admin, 2 consultants, 6 client users         │
  // └──────────────────────────────────────────────────────────┘

  const upsertUser = async (
    email: string,
    name: string,
    role: "admin" | "consultant" | "client",
    extras: Record<string, unknown> = {}
  ) => {
    const u = await User.findOneAndUpdate(
      { email },
      { $set: { email, name, role, password: hash, ...extras } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return u;
  };

  const admin = await upsertUser("admin@fullfunnelworks.co.uk", "Admin", "admin");
  console.log(`👤 Admin: ${admin.email}`);

  const consultant1 = await upsertUser("consultant1@fullfunnelworks.co.uk", "Laura James", "consultant", {
    consultantProfile: {
      maxActiveClients: 6,
      availabilityStatus: "available",
      specialisms: ["sales methodology", "GTM strategy"],
      roundRobinWeight: 2,
      totalLeadsAssigned: 14,
      lastAssignedAt: daysAgo(3),
    },
  });
  console.log(`👤 Consultant: ${consultant1.email}`);

  const consultant2 = await upsertUser("consultant2@fullfunnelworks.co.uk", "Mark Stevens", "consultant", {
    consultantProfile: {
      maxActiveClients: 4,
      availabilityStatus: "limited",
      specialisms: ["process optimisation", "KPI frameworks"],
      roundRobinWeight: 1,
      totalLeadsAssigned: 8,
      lastAssignedAt: daysAgo(7),
    },
  });
  console.log(`👤 Consultant: ${consultant2.email}`);

  const CLIENT_DEFS = [
    { name: "Sarah Mitchell",  email: "sarah@techventures.io",        biz: "TechVentures Ltd",       status: "active"     as const, contact: { contactName: "Sarah Mitchell", jobTitle: "CEO", phone: "+44 7700 900001", website: "https://techventures.io", addressLine1: "14 Innovation Way", city: "London", postcode: "EC2A 1BN", country: "UK" } },
    { name: "James Wilson",    email: "james@brightpath.co",          biz: "BrightPath Consulting",  status: "active"     as const, contact: { contactName: "James Wilson", jobTitle: "Managing Director", phone: "+44 7700 900002", website: "https://brightpath.co", addressLine1: "8 Queen Street", city: "Edinburgh", postcode: "EH2 1JE", country: "UK" } },
    { name: "Emma Thompson",   email: "emma@greenleaf.com",           biz: "GreenLeaf Industries",   status: "onboarding" as const, contact: { contactName: "Emma Thompson", jobTitle: "COO", phone: "+44 7700 900003", website: "https://greenleaf.com", addressLine1: "22 Park Lane", city: "Manchester", postcode: "M1 4BH", country: "UK" } },
    { name: "David Chen",      email: "david@nexusdigital.io",        biz: "Nexus Digital",          status: "active"     as const, contact: { contactName: "David Chen", jobTitle: "Founder", phone: "+44 7700 900004", website: "https://nexusdigital.io", addressLine1: "100 Tech Park", city: "Bristol", postcode: "BS1 5QD", country: "UK" } },
    { name: "Rachel Adams",    email: "rachel@swiftlogistics.co.uk",  biz: "Swift Logistics",        status: "paused"     as const, contact: { contactName: "Rachel Adams", jobTitle: "Operations Director", phone: "+44 7700 900005", website: "https://swiftlogistics.co.uk", addressLine1: "Unit 7, Harbour Rd", city: "Southampton", postcode: "SO14 2AQ", country: "UK" } },
    { name: "Tom Baker",       email: "tom@cloudscale.dev",           biz: "CloudScale Systems",     status: "onboarding" as const, contact: { contactName: "Tom Baker", jobTitle: "CTO", phone: "+44 7700 900006", website: "https://cloudscale.dev", addressLine1: "50 Silicon Walk", city: "Cambridge", postcode: "CB1 2AB", country: "UK" } },
  ];

  const clientUsers: (typeof admin)[] = [];
  const clientRecords: any[] = [];

  for (const cd of CLIENT_DEFS) {
    const u = await upsertUser(cd.email, cd.name, "client");
    clientUsers.push(u);

    const c = await Client.findOneAndUpdate(
      { userId: u._id },
      {
        $set: {
          userId: u._id,
          businessName: cd.biz,
          status: cd.status,
          assignedConsultant: consultant1._id,
          onboardingCompletedAt: cd.status === "active" ? daysAgo(30) : undefined,
          plan: cd.status === "active" ? "premium" : "standard",
          contactEmail: cd.email,
          invoicingEmail: cd.email,
          ...cd.contact,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    clientRecords.push(c);
    console.log(`🏢 Client: ${cd.biz} (${cd.status})`);
  }

  // ┌──────────────────────────────────────────────────────────┐
  // │  2. PROJECTS                                             │
  // └──────────────────────────────────────────────────────────┘

  await Project.deleteMany({});
  console.log("\n🗑️  Cleared Projects");

  const projects = await Project.insertMany([
    {
      clientId: clientRecords[0]._id,
      title: "Full Funnel Transformation",
      description: "End-to-end sales process redesign",
      status: "in_progress",
      package: "scale-accelerator",
      assignedTo: consultant1._id,
      dueDate: daysFromNow(120),
      activeModules: ["assessment", "people", "product", "process", "modeller"],
      lastActivityAt: daysAgo(1),
      staleness: "active",
      milestones: [
        { title: "Assessment Complete", completedAt: daysAgo(30) },
        { title: "People Framework", dueDate: daysFromNow(30) },
        { title: "Process Standardisation", dueDate: daysFromNow(75) },
      ],
    },
    {
      clientId: clientRecords[1]._id,
      title: "Sales Methodology Build",
      description: "Custom methodology aligned to consultative selling",
      status: "in_progress",
      package: "growth-starter",
      assignedTo: consultant1._id,
      dueDate: daysFromNow(60),
      activeModules: ["assessment", "people", "product"],
      lastActivityAt: daysAgo(3),
      staleness: "active",
    },
    {
      clientId: clientRecords[1]._id,
      title: "KPI Dashboard Setup",
      description: "Define and implement company + department KPIs",
      status: "not_started",
      package: "advisory-retainer",
      assignedTo: consultant2._id,
      activeModules: ["kpis"],
      lastActivityAt: daysAgo(14),
      staleness: "nudge",
    },
    {
      clientId: clientRecords[2]._id,
      title: "Onboarding — Growth Starter",
      description: "90-day foundation programme",
      status: "in_progress",
      package: "growth-starter",
      assignedTo: consultant1._id,
      dueDate: daysFromNow(45),
      activeModules: ["assessment"],
      lastActivityAt: daysAgo(2),
      staleness: "active",
    },
    {
      clientId: clientRecords[3]._id,
      title: "GTM Playbook",
      description: "Market intelligence & competitive positioning",
      status: "blocked",
      package: "scale-accelerator",
      assignedTo: consultant2._id,
      dueDate: daysFromNow(30),
      activeModules: ["assessment", "gtm", "product"],
      lastActivityAt: daysAgo(21),
      staleness: "stalled",
      blocks: [{ reason: "Awaiting competitor data from client", raisedAt: daysAgo(14) }],
    },
    {
      clientId: clientRecords[3]._id,
      title: "Product Positioning Workshop",
      description: "Outcome mapping and value proposition",
      status: "completed",
      package: "growth-starter",
      assignedTo: consultant1._id,
      activeModules: ["assessment", "product"],
      lastActivityAt: daysAgo(45),
      staleness: "active",
      milestones: [
        { title: "Workshop 1", completedAt: daysAgo(60) },
        { title: "Workshop 2", completedAt: daysAgo(50) },
        { title: "Final Deliverable", completedAt: daysAgo(45) },
      ],
    },
    {
      clientId: clientRecords[4]._id,
      title: "Process Audit",
      description: "Current state analysis of sales process",
      status: "blocked",
      package: "advisory-retainer",
      assignedTo: consultant2._id,
      activeModules: ["assessment", "process"],
      lastActivityAt: daysAgo(40),
      staleness: "at_risk",
      blocks: [{ reason: "Client temporarily paused engagement", raisedAt: daysAgo(30) }],
    },
    {
      clientId: clientRecords[5]._id,
      title: "Assessment & Discovery",
      description: "Initial framework assessment and gap analysis",
      status: "in_progress",
      package: "enterprise-growth",
      assignedTo: consultant1._id,
      dueDate: daysFromNow(180),
      activeModules: ["assessment", "people", "product", "process", "kpis", "gtm", "modeller", "hiring"],
      lastActivityAt: daysAgo(1),
      staleness: "active",
    },
  ]);
  console.log(`📋 Projects seeded: ${projects.length}`);

  // ┌──────────────────────────────────────────────────────────┐
  // │  3. INVOICES — all statuses represented                  │
  // └──────────────────────────────────────────────────────────┘

  await Invoice.deleteMany({});
  console.log("\n🗑️  Cleared Invoices");

  const invoices = await Invoice.insertMany([
    // Paid invoices
    {
      clientId: clientRecords[0]._id, projectId: projects[0]._id,
      title: "Scale Accelerator — Assessment Phase",
      description: "Initial assessment and discovery engagement",
      amountPence: 350000, status: "paid", paymentModel: "upfront",
      dueDate: daysAgo(45), sentAt: daysAgo(60), paidAt: daysAgo(44),
    },
    {
      clientId: clientRecords[1]._id, projectId: projects[1]._id,
      title: "Growth Starter — Month 1",
      description: "First monthly retainer payment",
      amountPence: 150000, status: "paid", paymentModel: "milestone",
      dueDate: daysAgo(25), sentAt: daysAgo(30), paidAt: daysAgo(24),
    },
    {
      clientId: clientRecords[3]._id, projectId: projects[5]._id,
      title: "Product Positioning — Workshop Bundle",
      description: "Two-day workshop and deliverables",
      amountPence: 225000, status: "paid", paymentModel: "upfront",
      dueDate: daysAgo(50), sentAt: daysAgo(65), paidAt: daysAgo(48),
    },
    {
      clientId: clientRecords[3]._id, projectId: projects[4]._id,
      title: "GTM Playbook — Phase 1 Deposit",
      description: "50% deposit for GTM engagement",
      amountPence: 275000, status: "paid", paymentModel: "milestone",
      dueDate: daysAgo(20), sentAt: daysAgo(28), paidAt: daysAgo(19),
    },

    // Sent (unpaid) invoices
    {
      clientId: clientRecords[0]._id, projectId: projects[0]._id,
      title: "Scale Accelerator — People & Product Phase",
      description: "Second phase of transformation programme",
      amountPence: 450000, status: "sent", paymentModel: "milestone",
      dueDate: daysFromNow(14), sentAt: daysAgo(5),
    },
    {
      clientId: clientRecords[1]._id, projectId: projects[1]._id,
      title: "Growth Starter — Month 2",
      description: "Second monthly retainer payment",
      amountPence: 150000, status: "sent", paymentModel: "milestone",
      dueDate: daysFromNow(7), sentAt: daysAgo(3),
    },
    {
      clientId: clientRecords[5]._id, projectId: projects[7]._id,
      title: "Enterprise Growth — Discovery Phase",
      description: "Full discovery and assessment engagement",
      amountPence: 500000, status: "sent", paymentModel: "upfront",
      dueDate: daysFromNow(21), sentAt: daysAgo(2),
    },

    // Draft invoices
    {
      clientId: clientRecords[2]._id, projectId: projects[3]._id,
      title: "Growth Starter — Onboarding Setup",
      description: "Initial onboarding programme fee",
      amountPence: 180000, status: "draft", paymentModel: "upfront",
      dueDate: daysFromNow(30),
    },
    {
      clientId: clientRecords[1]._id, projectId: projects[2]._id,
      title: "Advisory Retainer — KPI Phase",
      description: "KPI design and implementation sprint",
      amountPence: 120000, status: "draft", paymentModel: "on_completion",
    },

    // Overdue invoices
    {
      clientId: clientRecords[4]._id, projectId: projects[6]._id,
      title: "Advisory Retainer — Process Audit",
      description: "Current state process analysis",
      amountPence: 195000, status: "overdue", paymentModel: "upfront",
      dueDate: daysAgo(10), sentAt: daysAgo(25),
      gracePeriodDays: 7, gracePeriodEndsAt: daysAgo(3),
    },
    {
      clientId: clientRecords[3]._id, projectId: projects[4]._id,
      title: "GTM Playbook — Phase 2 Balance",
      description: "Remaining 50% on competitor analysis delivery",
      amountPence: 275000, status: "overdue", paymentModel: "milestone",
      dueDate: daysAgo(5), sentAt: daysAgo(20),
    },

    // Void invoice
    {
      clientId: clientRecords[4]._id, projectId: projects[6]._id,
      title: "Process Audit — Cancelled",
      description: "Voided due to client pause",
      amountPence: 195000, status: "void", paymentModel: "upfront",
      dueDate: daysAgo(30), sentAt: daysAgo(40),
    },
  ]);
  console.log(`💷 Invoices seeded: ${invoices.length}`);

  // ┌──────────────────────────────────────────────────────────┐
  // │  4. PROSPECTS — full pipeline coverage                   │
  // └──────────────────────────────────────────────────────────┘

  await Prospect.deleteMany({});
  console.log("\n🗑️  Cleared Prospects");

  const prospectData = [
    {
      businessName: "Apex Solutions",     contactName: "Oliver Grant",    contactEmail: "oliver@apexsolutions.io",
      phone: "+44 7700 900010", companySize: "51-200", revenueRange: "2m-10m",
      primaryChallenge: "Inconsistent sales methodology across teams",
      stage: "mql", source: "web_form" as const, dealValue: 25000,
      leadScore: 72, leadScoreBreakdown: { companySizeScore: 20, revenueScore: 25, challengeScore: 15, completenessScore: 12, total: 72 },
    },
    {
      businessName: "Mosaic Digital",     contactName: "Hannah Lee",     contactEmail: "hannah@mosaicdigital.co",
      phone: "+44 7700 900011", companySize: "11-50", revenueRange: "500k-2m",
      primaryChallenge: "No clear GTM strategy for new product line",
      stage: "sql", source: "referral" as const, dealValue: 15000,
      leadScore: 64, leadScoreBreakdown: { companySizeScore: 15, revenueScore: 20, challengeScore: 17, completenessScore: 12, total: 64 },
      qualifiedAt: daysAgo(5),
    },
    {
      businessName: "Prism Analytics",    contactName: "Liam Foster",    contactEmail: "liam@prismanalytics.co.uk",
      phone: "+44 7700 900012", companySize: "51-200", revenueRange: "2m-10m",
      primaryChallenge: "Customer retention and churn reduction",
      stage: "discovery", source: "event" as const, dealValue: 30000,
      leadScore: 81, leadScoreBreakdown: { companySizeScore: 20, revenueScore: 25, challengeScore: 20, completenessScore: 16, total: 81 },
      qualifiedAt: daysAgo(12), discoveryAt: daysAgo(7),
      assignedConsultant: consultant1._id,
    },
    {
      businessName: "Forge Manufacturing", contactName: "Claire Dawson",  contactEmail: "claire@forgemfg.com",
      phone: "+44 7700 900013", companySize: "201-500", revenueRange: "10m+",
      primaryChallenge: "Sales team scaling without losing quality",
      stage: "proposal", source: "manual" as const, dealValue: 50000,
      leadScore: 91, leadScoreBreakdown: { companySizeScore: 25, revenueScore: 30, challengeScore: 20, completenessScore: 16, total: 91 },
      qualifiedAt: daysAgo(20), discoveryAt: daysAgo(14), proposalSentAt: daysAgo(5),
      assignedConsultant: consultant1._id,
    },
    {
      businessName: "Vertex Fintech",     contactName: "Sam Park",       contactEmail: "sam@vertexfintech.io",
      phone: "+44 7700 900014", companySize: "51-200", revenueRange: "2m-10m",
      primaryChallenge: "Pipeline visibility and forecasting accuracy",
      stage: "negotiating", source: "web_form" as const, dealValue: 35000,
      leadScore: 86, leadScoreBreakdown: { companySizeScore: 20, revenueScore: 25, challengeScore: 22, completenessScore: 19, total: 86 },
      qualifiedAt: daysAgo(25), discoveryAt: daysAgo(18), proposalSentAt: daysAgo(10),
      assignedConsultant: consultant2._id,
    },
    {
      businessName: "NovaTech Labs",      contactName: "Rebecca Stone",  contactEmail: "rebecca@novatechlabs.com",
      phone: "+44 7700 900015", companySize: "11-50", revenueRange: "500k-2m",
      primaryChallenge: "Moving from founder-led sales to repeatable process",
      stage: "won", source: "referral" as const, dealValue: 18000,
      leadScore: 78, leadScoreBreakdown: { companySizeScore: 15, revenueScore: 20, challengeScore: 25, completenessScore: 18, total: 78 },
      qualifiedAt: daysAgo(35), discoveryAt: daysAgo(28), proposalSentAt: daysAgo(20), wonAt: daysAgo(8),
      assignedConsultant: consultant1._id,
    },
    {
      businessName: "Summit Retail Group", contactName: "Nathan Brooks",  contactEmail: "nathan@summitretail.co.uk",
      phone: "+44 7700 900016", companySize: "201-500", revenueRange: "10m+",
      primaryChallenge: "Omnichannel sales alignment",
      stage: "won", source: "event" as const, dealValue: 60000,
      leadScore: 94, leadScoreBreakdown: { companySizeScore: 25, revenueScore: 30, challengeScore: 22, completenessScore: 17, total: 94 },
      qualifiedAt: daysAgo(40), discoveryAt: daysAgo(32), proposalSentAt: daysAgo(22), wonAt: daysAgo(12),
      assignedConsultant: consultant2._id,
    },
    {
      businessName: "Harbour Media",      contactName: "Zoe Patterson",  contactEmail: "zoe@harbourmedia.co",
      companySize: "1-10", revenueRange: "under-500k",
      primaryChallenge: "Need a structured approach to B2B sales",
      stage: "lost", source: "web_form" as const, dealValue: 8000,
      leadScore: 38, leadScoreBreakdown: { companySizeScore: 5, revenueScore: 10, challengeScore: 12, completenessScore: 11, total: 38 },
      lostReason: "Budget constraints — revisit in Q3",
      lostAt: daysAgo(15),
    },
    {
      businessName: "ClearView SaaS",     contactName: "Jake Morgan",    contactEmail: "jake@clearviewsaas.com",
      phone: "+44 7700 900018", companySize: "11-50", revenueRange: "500k-2m",
      primaryChallenge: "Product-market fit messaging unclear",
      stage: "lost", source: "manual" as const, dealValue: 20000,
      leadScore: 55, leadScoreBreakdown: { companySizeScore: 15, revenueScore: 20, challengeScore: 10, completenessScore: 10, total: 55 },
      lostReason: "Went with competitor — pricing",
      lostAt: daysAgo(22),
      assignedConsultant: consultant1._id,
    },
    {
      businessName: "Aurora Energy",      contactName: "Priya Sharma",   contactEmail: "priya@auroraenergy.co.uk",
      phone: "+44 7700 900019", companySize: "500+", revenueRange: "10m+",
      primaryChallenge: "Enterprise sales process re-engineering",
      stage: "mql", source: "web_form" as const, dealValue: 80000,
      leadScore: 89, leadScoreBreakdown: { companySizeScore: 30, revenueScore: 30, challengeScore: 18, completenessScore: 11, total: 89 },
    },
  ];

  const prospects = [];
  for (const pd of prospectData) {
    const stageMap = new Map<string, Date>();
    stageMap.set("mql", daysAgo(45));
    if (pd.qualifiedAt) stageMap.set("sql", pd.qualifiedAt);
    if (pd.discoveryAt) stageMap.set("discovery", pd.discoveryAt);
    if (pd.proposalSentAt) stageMap.set("proposal", pd.proposalSentAt);
    if (pd.wonAt) stageMap.set("won", pd.wonAt);
    if (pd.lostAt) stageMap.set("lost", pd.lostAt);
    if (pd.stage === "negotiating") stageMap.set("negotiating", daysAgo(8));

    const activityLog: { type: "stage_change" | "note" | "assignment" | "system"; message: string; createdAt: Date }[] = [
      { type: "system", message: "Lead created via " + pd.source.replace("_", " "), createdAt: daysAgo(45) },
    ];
    if (pd.qualifiedAt) activityLog.push({ type: "stage_change", message: "Moved to SQL", createdAt: pd.qualifiedAt });
    if (pd.discoveryAt) activityLog.push({ type: "stage_change", message: "Moved to Discovery", createdAt: pd.discoveryAt });
    if (pd.proposalSentAt) activityLog.push({ type: "stage_change", message: "Proposal sent", createdAt: pd.proposalSentAt });
    if (pd.wonAt) activityLog.push({ type: "stage_change", message: "Deal won 🎉", createdAt: pd.wonAt });
    if (pd.lostAt) activityLog.push({ type: "stage_change", message: `Deal lost: ${pd.lostReason}`, createdAt: pd.lostAt });

    prospects.push({
      ...pd,
      stageEnteredAt: stageMap,
      activityLog,
      tasks: pd.stage === "proposal" || pd.stage === "negotiating" ? [
        { title: "Follow up on proposal", dueDate: daysFromNow(3), assignedTo: pd.assignedConsultant, createdAt: daysAgo(2) },
      ] : [],
    });
  }

  await Prospect.insertMany(prospects);
  console.log(`🎯 Prospects seeded: ${prospects.length}`);

  // ┌──────────────────────────────────────────────────────────┐
  // │  5. INTAKE RESPONSES — partial + submitted               │
  // └──────────────────────────────────────────────────────────┘

  await IntakeResponse.deleteMany({});
  console.log("\n🗑️  Cleared IntakeResponses");

  // Mongoose Maps disallow dots in keys via .create(), so we insert via raw driver
  const irColl = IntakeResponse.collection;

  // Client 0 (TechVentures) — well progressed
  await irColl.insertOne({
    clientId: clientRecords[0]._id,
    completedBy: "client",
    responses: {
      assessment_checklist_0: true,
      assessment_checklist_1: true,
      assessment_checklist_2: true,
      assessment_checklist_3: false,
      assessment_swot_strengths_0: "Strong brand recognition in our core market with 15+ years of trust built with enterprise clients.",
      assessment_swot_strengths_1: "Highly skilled technical team with deep domain expertise in cloud infrastructure.",
      assessment_swot_weaknesses_0: "Sales team lacks formal methodology — mostly relationship-driven without repeatability.",
      assessment_swot_weaknesses_1: "No structured onboarding process for new sales hires.",
      assessment_swot_opportunities_0: "Adjacent market in SaaS observability is under-served by incumbents.",
      assessment_swot_threats_0: "Large competitors entering our niche with aggressive pricing strategies.",
      people_structure_org_size: "52",
      people_structure_sales_headcount: "8",
      people_leadership_vision: "Become the UK's leading cloud infrastructure consultancy within 3 years.",
    },
    sectionProgress: { assessment: true, people: false },
    subSectionProgress: {
      "assessment.checklist": { answeredCount: 4, totalCount: 12, lastSavedAt: daysAgo(5) },
      "assessment.swot": { answeredCount: 6, totalCount: 24, lastSavedAt: daysAgo(3) },
      "people.structure": { answeredCount: 2, totalCount: 8, lastSavedAt: daysAgo(2) },
      "people.leadership": { answeredCount: 1, totalCount: 6, lastSavedAt: daysAgo(1) },
    },
    lastActiveSub: "people.leadership",
    lastSavedAt: daysAgo(1),
    teamMode: false,
    teamMembers: [],
    individualResponses: {},
    synthesisResponses: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Client 1 (BrightPath) — submitted
  await irColl.insertOne({
    clientId: clientRecords[1]._id,
    completedBy: "client",
    responses: {
      assessment_checklist_0: true,
      assessment_checklist_1: true,
      assessment_checklist_2: true,
      assessment_swot_strengths_0: "Diverse client portfolio across financial services and tech sectors.",
      assessment_swot_weaknesses_0: "Reliance on two key clients for 60% of revenue.",
      people_structure_org_size: "24",
      people_methodology_current: "Ad-hoc consultative approach, no formal framework.",
      product_value_proposition: "We help mid-market firms unlock growth through strategic advisory and implementation support.",
    },
    sectionProgress: { assessment: true, people: true, product: true },
    subSectionProgress: {
      "assessment.checklist": { answeredCount: 3, totalCount: 12, lastSavedAt: daysAgo(20) },
      "assessment.swot": { answeredCount: 2, totalCount: 24, lastSavedAt: daysAgo(18) },
      "people.structure": { answeredCount: 1, totalCount: 8, lastSavedAt: daysAgo(15) },
      "people.methodology": { answeredCount: 1, totalCount: 6, lastSavedAt: daysAgo(14) },
      "product.value": { answeredCount: 1, totalCount: 4, lastSavedAt: daysAgo(10) },
    },
    lastActiveSub: "product.value",
    submittedAt: daysAgo(8),
    lastSavedAt: daysAgo(8),
    teamMode: false,
    teamMembers: [],
    individualResponses: {},
    synthesisResponses: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Client 2 (GreenLeaf) — just started
  await irColl.insertOne({
    clientId: clientRecords[2]._id,
    completedBy: "client",
    responses: { assessment_checklist_0: true },
    sectionProgress: {},
    subSectionProgress: {
      "assessment.checklist": { answeredCount: 1, totalCount: 12, lastSavedAt: daysAgo(2) },
    },
    lastActiveSub: "assessment.checklist",
    lastSavedAt: daysAgo(2),
    teamMode: false,
    teamMembers: [],
    individualResponses: {},
    synthesisResponses: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Client 3 (Nexus Digital) — well progressed, team mode
  await irColl.insertOne({
    clientId: clientRecords[3]._id,
    completedBy: "client",
    responses: {
      assessment_checklist_0: true,
      assessment_checklist_1: true,
      assessment_swot_strengths_0: "First-mover advantage in the UK digital transformation consultancy space.",
      assessment_swot_opportunities_0: "Expansion into European markets with remote-first offering.",
      people_structure_org_size: "78",
      product_positioning_target_market: "Mid-market B2B SaaS companies (£1M-£20M ARR).",
    },
    sectionProgress: { assessment: true },
    subSectionProgress: {
      "assessment.checklist": { answeredCount: 2, totalCount: 12, lastSavedAt: daysAgo(8) },
      "assessment.swot": { answeredCount: 2, totalCount: 24, lastSavedAt: daysAgo(6) },
      "people.structure": { answeredCount: 1, totalCount: 8, lastSavedAt: daysAgo(4) },
      "product.positioning": { answeredCount: 1, totalCount: 4, lastSavedAt: daysAgo(3) },
    },
    lastActiveSub: "product.positioning",
    lastSavedAt: daysAgo(3),
    teamMode: true,
    teamMembers: [
      { userId: clientUsers[3]._id, name: "David Chen", email: "david@nexusdigital.io", role: "Founder", invitedAt: daysAgo(10), invitedBy: admin._id, submittedAt: daysAgo(3) },
    ],
    individualResponses: {},
    synthesisResponses: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log("📝 IntakeResponses seeded: 4");

  // ┌──────────────────────────────────────────────────────────┐
  // │  6. HIRING PLANS                                         │
  // └──────────────────────────────────────────────────────────┘

  await HiringPlan.deleteMany({});
  console.log("\n🗑️  Cleared HiringPlans");

  await HiringPlan.insertMany([
    {
      clientId: clientRecords[0]._id,
      useModeller: true,
      hires: [
        { id: "h1", role: "Senior AE", department: "Sales", startMonth: 2, salary: 65000, revenueContribution: 180000, rampMonths: 3, hiringCost: 12000 },
        { id: "h2", role: "SDR", department: "Sales", startMonth: 3, salary: 32000, revenueContribution: 80000, rampMonths: 2, hiringCost: 6000 },
        { id: "h3", role: "Sales Manager", department: "Sales", startMonth: 4, salary: 78000, revenueContribution: 0, rampMonths: 2, hiringCost: 15000 },
        { id: "h4", role: "Customer Success Manager", department: "Customer Success", startMonth: 5, salary: 48000, revenueContribution: 50000, rampMonths: 2, hiringCost: 8000 },
      ],
    },
    {
      clientId: clientRecords[3]._id,
      useModeller: true,
      hires: [
        { id: "h1", role: "Product Marketing Manager", department: "Marketing", startMonth: 1, salary: 55000, revenueContribution: 0, rampMonths: 3, hiringCost: 10000 },
        { id: "h2", role: "Enterprise AE", department: "Sales", startMonth: 2, salary: 72000, revenueContribution: 250000, rampMonths: 4, hiringCost: 14000 },
      ],
    },
    {
      clientId: clientRecords[5]._id,
      useModeller: false,
      baseOverride: {
        monthlyRevenue: 180000,
        grossMarginPct: 62,
        existingPeopleMonthly: 95000,
        monthlyOverheads: 28000,
      },
      hires: [
        { id: "h1", role: "VP Sales", department: "Sales", startMonth: 1, salary: 120000, revenueContribution: 0, rampMonths: 3, hiringCost: 25000 },
        { id: "h2", role: "AE", department: "Sales", startMonth: 2, salary: 58000, revenueContribution: 160000, rampMonths: 3, hiringCost: 11000 },
        { id: "h3", role: "AE", department: "Sales", startMonth: 3, salary: 58000, revenueContribution: 160000, rampMonths: 3, hiringCost: 11000 },
        { id: "h4", role: "RevOps Analyst", department: "Operations", startMonth: 4, salary: 42000, revenueContribution: 0, rampMonths: 2, hiringCost: 7000 },
        { id: "h5", role: "Marketing Coordinator", department: "Marketing", startMonth: 3, salary: 35000, revenueContribution: 0, rampMonths: 2, hiringCost: 5000 },
      ],
    },
  ]);
  console.log("🧑‍💼 HiringPlans seeded: 3");

  // ┌──────────────────────────────────────────────────────────┐
  // │  7. MODELLER BASE + SCENARIOS                            │
  // └──────────────────────────────────────────────────────────┘

  await ModellerBase.deleteMany({});
  await ModellerScenario.deleteMany({});
  console.log("\n🗑️  Cleared Modeller data");

  // TechVentures modeller
  await ModellerBase.create({
    clientId: clientRecords[0]._id,
    revenue: [
      { id: "r1", name: "Cloud Consulting", price: 15000, volume: 8, cogsPct: 25 },
      { id: "r2", name: "Managed Services", price: 5000, volume: 20, cogsPct: 35 },
      { id: "r3", name: "Training & Workshops", price: 3000, volume: 6, cogsPct: 15 },
    ],
    people: [
      { id: "p1", name: "Senior Consultants", salary: 72000, headcount: 5, pensionPct: 5 },
      { id: "p2", name: "Junior Consultants", salary: 38000, headcount: 3, pensionPct: 3 },
      { id: "p3", name: "Account Managers", salary: 52000, headcount: 2, pensionPct: 5 },
      { id: "p4", name: "Operations & Admin", salary: 35000, headcount: 3, pensionPct: 3 },
    ],
    overheads: [
      { id: "o1", name: "Office Rent", amount: 4500, period: "monthly" },
      { id: "o2", name: "Software & Tools", amount: 2800, period: "monthly" },
      { id: "o3", name: "Insurance", amount: 9600, period: "annual" },
      { id: "o4", name: "Marketing", amount: 3500, period: "monthly" },
    ],
  });

  // Nexus Digital modeller
  await ModellerBase.create({
    clientId: clientRecords[3]._id,
    revenue: [
      { id: "r1", name: "Digital Transformation Projects", price: 45000, volume: 4, cogsPct: 30 },
      { id: "r2", name: "Retainer Clients", price: 8000, volume: 12, cogsPct: 20 },
    ],
    people: [
      { id: "p1", name: "Delivery Consultants", salary: 65000, headcount: 8, pensionPct: 5 },
      { id: "p2", name: "Project Managers", salary: 55000, headcount: 3, pensionPct: 5 },
      { id: "p3", name: "Sales & Marketing", salary: 50000, headcount: 4, pensionPct: 3 },
      { id: "p4", name: "Support Staff", salary: 32000, headcount: 4, pensionPct: 3 },
    ],
    overheads: [
      { id: "o1", name: "Office Space", amount: 6200, period: "monthly" },
      { id: "o2", name: "Technology Stack", amount: 4100, period: "monthly" },
      { id: "o3", name: "Professional Indemnity", amount: 12000, period: "annual" },
    ],
  });

  // A scenario for TechVentures
  await ModellerScenario.create({
    clientId: clientRecords[0]._id,
    name: "Aggressive Hiring + Price Increase",
    description: "Model the impact of hiring 3 new consultants and raising consulting rates by 15%",
    type: "hire",
    data: {
      revenue: [
        { id: "r1", name: "Cloud Consulting", price: 17250, volume: 12, cogsPct: 25 },
        { id: "r2", name: "Managed Services", price: 5500, volume: 25, cogsPct: 35 },
        { id: "r3", name: "Training & Workshops", price: 3450, volume: 8, cogsPct: 15 },
      ],
      people: [
        { id: "p1", name: "Senior Consultants", salary: 72000, headcount: 7, pensionPct: 5 },
        { id: "p2", name: "Junior Consultants", salary: 38000, headcount: 4, pensionPct: 3 },
        { id: "p3", name: "Account Managers", salary: 52000, headcount: 3, pensionPct: 5 },
        { id: "p4", name: "Operations & Admin", salary: 35000, headcount: 3, pensionPct: 3 },
      ],
      overheads: [
        { id: "o1", name: "Office Rent", amount: 5500, period: "monthly" },
        { id: "o2", name: "Software & Tools", amount: 3500, period: "monthly" },
        { id: "o3", name: "Insurance", amount: 12000, period: "annual" },
        { id: "o4", name: "Marketing", amount: 5000, period: "monthly" },
      ],
    },
  });

  // A scenario for Nexus Digital
  await ModellerScenario.create({
    clientId: clientRecords[3]._id,
    name: "New Revenue Stream",
    description: "Adding a SaaS product line alongside services",
    type: "revenue",
    data: {
      revenue: [
        { id: "r1", name: "Digital Transformation Projects", price: 45000, volume: 4, cogsPct: 30 },
        { id: "r2", name: "Retainer Clients", price: 8000, volume: 14, cogsPct: 20 },
        { id: "r3", name: "SaaS Platform (new)", price: 500, volume: 80, cogsPct: 60 },
      ],
      people: [
        { id: "p1", name: "Delivery Consultants", salary: 65000, headcount: 8, pensionPct: 5 },
        { id: "p2", name: "Project Managers", salary: 55000, headcount: 3, pensionPct: 5 },
        { id: "p3", name: "Sales & Marketing", salary: 50000, headcount: 5, pensionPct: 3 },
        { id: "p4", name: "Support Staff", salary: 32000, headcount: 4, pensionPct: 3 },
        { id: "p5", name: "Product Engineers (new)", salary: 68000, headcount: 2, pensionPct: 5 },
      ],
      overheads: [
        { id: "o1", name: "Office Space", amount: 6200, period: "monthly" },
        { id: "o2", name: "Technology Stack", amount: 5500, period: "monthly" },
        { id: "o3", name: "Professional Indemnity", amount: 14000, period: "annual" },
        { id: "o4", name: "Cloud Hosting (SaaS)", amount: 1200, period: "monthly" },
      ],
    },
  });

  console.log("📊 ModellerBase seeded: 2");
  console.log("📊 ModellerScenarios seeded: 2");

  // ┌──────────────────────────────────────────────────────────┐
  // │  8. NOTIFICATIONS — mix of read / unread                 │
  // └──────────────────────────────────────────────────────────┘

  await Notification.deleteMany({});
  console.log("\n🗑️  Cleared Notifications");

  await Notification.insertMany([
    // Admin notifications
    { userId: admin._id, type: "info",    title: "New lead received",            message: "Apex Solutions submitted a contact form.",                              read: false, link: "/admin/crm/prospects" },
    { userId: admin._id, type: "info",    title: "New lead received",            message: "Aurora Energy submitted a contact form.",                               read: false, link: "/admin/crm/prospects" },
    { userId: admin._id, type: "success", title: "Invoice paid",                 message: "TechVentures Ltd paid £3,500.00 for Scale Accelerator — Assessment.",   read: false, link: "/admin/invoices" },
    { userId: admin._id, type: "warning", title: "Invoice overdue",              message: "Swift Logistics — Process Audit invoice is 10 days overdue.",           read: false, link: "/admin/invoices" },
    { userId: admin._id, type: "success", title: "Deal won",                     message: "Summit Retail Group — £60,000 deal closed.",                            read: true, link: "/admin/crm/prospects" },
    { userId: admin._id, type: "info",    title: "Assessment submitted",         message: "BrightPath Consulting submitted their framework assessment.",           read: true, link: "/admin/clients" },
    { userId: admin._id, type: "warning", title: "Project stalled",              message: "Nexus Digital — GTM Playbook has had no activity for 21 days.",         read: true, link: "/admin/projects" },
    { userId: admin._id, type: "error",   title: "Client at risk",              message: "Swift Logistics — Process Audit engagement at risk of termination.",     read: true, link: "/admin/clients" },

    // Consultant 1 notifications
    { userId: consultant1._id, type: "info",    title: "New lead assigned",       message: "Prism Analytics assigned to you for discovery.",                        read: false, link: "/admin/crm/prospects" },
    { userId: consultant1._id, type: "success", title: "Client completed section", message: "TechVentures Ltd completed their People framework section.",          read: false },
    { userId: consultant1._id, type: "info",    title: "Follow-up due",           message: "Forge Manufacturing proposal follow-up is due in 3 days.",            read: true, link: "/admin/crm/prospects" },

    // Consultant 2 notifications
    { userId: consultant2._id, type: "info",    title: "New lead assigned",       message: "Vertex Fintech assigned to you for negotiation.",                      read: false, link: "/admin/crm/prospects" },
    { userId: consultant2._id, type: "warning", title: "Block unresolved",        message: "Nexus Digital — GTM Playbook block has been open for 14 days.",        read: true },

    // Client notifications
    { userId: clientUsers[0]._id, type: "info",    title: "Invoice sent",          message: "Your invoice for Scale Accelerator — People & Product Phase is ready.", read: false, link: "/portal/invoices" },
    { userId: clientUsers[0]._id, type: "success", title: "Section completed",     message: "Assessment section marked as complete! Great progress.",                read: true },
    { userId: clientUsers[1]._id, type: "success", title: "Assessment reviewed",   message: "Your consultant has reviewed your submitted assessment.",               read: false },
    { userId: clientUsers[3]._id, type: "info",    title: "Team member joined",    message: "Your team member has been invited to collaborate.",                     read: true },
  ]);
  console.log("🔔 Notifications seeded: 17");

  // ┌──────────────────────────────────────────────────────────┐
  // │  9. CONSULTANT NOTES                                     │
  // └──────────────────────────────────────────────────────────┘

  await ConsultantNote.deleteMany({});
  console.log("\n🗑️  Cleared ConsultantNotes");

  await ConsultantNote.insertMany([
    {
      clientId: clientRecords[0]._id,
      fieldId: "assessment_swot_strengths_0",
      note: "Strong foundation here — use this as a proof point in their GTM messaging. Worth exploring how to quantify the 15 years of trust into case studies.",
      createdBy: consultant1._id,
      updatedBy: consultant1._id,
    },
    {
      clientId: clientRecords[0]._id,
      fieldId: "assessment_swot_weaknesses_0",
      note: "This is the core challenge we're addressing. Need to design a methodology that balances their relationship-driven culture while adding structure. SPIN Selling framework might be a good fit.",
      createdBy: consultant1._id,
      updatedBy: consultant1._id,
    },
    {
      clientId: clientRecords[0]._id,
      fieldId: "people_structure_sales_headcount",
      note: "8 is a good starting point but they'll need to scale to 12-14 to hit their targets. Recommend phased hiring — 2 in Q2, 2 in Q3. See hiring plan for modelled impact.",
      createdBy: consultant1._id,
      updatedBy: consultant1._id,
    },
    {
      clientId: clientRecords[1]._id,
      fieldId: "assessment_swot_weaknesses_0",
      note: "Client concentration risk is high. Diversification should be priority #1. We should build a prospecting playbook targeting 3 new verticals.",
      createdBy: consultant1._id,
      updatedBy: consultant1._id,
    },
    {
      clientId: clientRecords[1]._id,
      fieldId: "product_value_proposition",
      note: "Good start but too generic. Need to sharpen around specific outcomes: revenue growth %, time-to-value, and measurable ROI for mid-market specifically.",
      createdBy: consultant1._id,
      updatedBy: consultant1._id,
    },
    {
      clientId: clientRecords[3]._id,
      fieldId: "assessment_swot_opportunities_0",
      note: "European expansion is ambitious but viable with their remote-first model. Recommend a pilot in DACH region given strong fintech demand. Include in GTM playbook.",
      createdBy: consultant2._id,
      updatedBy: consultant2._id,
    },
    {
      clientId: clientRecords[3]._id,
      fieldId: "product_positioning_target_market",
      note: "Good ICP definition. Should refine further with buyer persona mapping — likely targeting VP Sales and CRO-level buyers. Need to validate with their existing client data.",
      createdBy: consultant2._id,
      updatedBy: consultant2._id,
    },
  ]);
  console.log("📌 ConsultantNotes seeded: 7");

  // ┌──────────────────────────────────────────────────────────┐
  // │  10. SETTINGS (singleton)                                │
  // └──────────────────────────────────────────────────────────┘

  await Settings.deleteMany({});
  console.log("\n🗑️  Cleared Settings");

  await Settings.create({
    leadNotificationEmail: "admin@fullfunnelworks.co.uk",
    autoResponseReplyTo: "hello@fullfunnelworks.co.uk",
    calendlyUrl: "https://calendly.com/fullfunnel/discovery",
    autoAssignEnabled: true,
    ga4Enabled: false,
    ga4MeasurementId: "",
    ga4ApiSecret: "",
    ga4TrackedEvents: {
      leadReceived: true,
      leadQualified: true,
      proposalSent: true,
      dealWon: true,
      dealLost: false,
      clientConverted: true,
      assessmentStarted: true,
      sectionCompleted: false,
      moduleCompleted: true,
      invoicePaid: true,
      reportDownloaded: false,
    },
  });
  console.log("⚙️  Settings seeded: 1");

  // ┌──────────────────────────────────────────────────────────┐
  // │  SUMMARY                                                 │
  // └──────────────────────────────────────────────────────────┘

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  SEED COMPLETE — All models populated");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Admin       : admin@fullfunnelworks.co.uk / ${DEV_PASSWORD}`);
  console.log(`  Consultant 1: consultant1@fullfunnelworks.co.uk / ${DEV_PASSWORD}`);
  console.log(`  Consultant 2: consultant2@fullfunnelworks.co.uk / ${DEV_PASSWORD}`);
  console.log(`  Clients     : ${CLIENT_DEFS.length} (all password: ${DEV_PASSWORD})`);
  console.log("  ─────────────────────────────────────────────────────────");
  console.log(`  Users             : ${3 + CLIENT_DEFS.length}`);
  console.log(`  Clients           : ${CLIENT_DEFS.length}`);
  console.log(`  Projects          : ${projects.length}`);
  console.log(`  Invoices          : ${invoices.length}`);
  console.log(`  Prospects         : ${prospects.length}`);
  console.log(`  IntakeResponses   : 4`);
  console.log(`  HiringPlans       : 3`);
  console.log(`  ModellerBase      : 2`);
  console.log(`  ModellerScenarios : 2`);
  console.log(`  Notifications     : 17`);
  console.log(`  ConsultantNotes   : 7`);
  console.log(`  Settings          : 1`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n  ℹ️  FrameworkQuestions are seeded separately:");
  console.log("     npx tsx scripts/seed-questions.ts");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
