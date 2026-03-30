/**
 * Seed script — full multi-tenant SaaS data.
 * Creates admin, 6 consultants with subscriptions, clients, projects, invoices,
 * notifications, and settings.
 *
 * Run: npx tsx scripts/seed.ts
 * Requires MONGODB_URI in .env.local (or override via env var)
 *
 * Safe to re-run (wipes and re-creates everything except admin password).
 */

import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import User from "../src/models/User";
import Plan from "../src/models/Plan";
import Subscription from "../src/models/Subscription";
import Notification from "../src/models/Notification";
import Settings from "../src/models/Settings";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI is not set");
  process.exit(1);
}

const DEV_PASSWORD = "admin123";
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000);

async function seed() {
  await mongoose.connect(MONGODB_URI!);
  console.log("✅  Connected to MongoDB\n");

  const hash = await bcrypt.hash(DEV_PASSWORD, 10);

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
    return u!;
  };

  // ── Lazy model imports ─────────────────────────────────────
  const { default: Client } = await import("../src/models/Client");
  const { default: Project } = await import("../src/models/Project");
  const { default: Invoice } = await import("../src/models/Invoice");
  const { default: Prospect } = await import("../src/models/Prospect");
  const { default: IntakeResponse } = await import("../src/models/IntakeResponse");
  const { default: HiringPlan } = await import("../src/models/HiringPlan");
  const { default: ModellerBase } = await import("../src/models/ModellerBase");
  const { default: ModellerScenario } = await import("../src/models/ModellerScenario");
  const { default: ConsultantNote } = await import("../src/models/ConsultantNote");

  // ── Wipe everything ────────────────────────────────────────
  await Promise.all([
    User.deleteMany({ role: { $in: ["consultant", "client"] } }),
    Plan.deleteMany({}),
    Subscription.deleteMany({}),
    Client.deleteMany({}),
    Project.deleteMany({}),
    Invoice.deleteMany({}),
    Prospect.deleteMany({}),
    IntakeResponse.deleteMany({}),
    HiringPlan.deleteMany({}),
    ModellerBase.deleteMany({}),
    ModellerScenario.deleteMany({}),
    ConsultantNote.deleteMany({}),
    Notification.deleteMany({}),
    Settings.deleteMany({}),
  ]);
  console.log("🗑️  Wiped existing data\n");

  // ── 1. ADMIN ──────────────────────────────────────────────
  const admin = await upsertUser("admin@fullfunnelworks.co.uk", "Admin", "admin");
  console.log("👤 Admin: " + admin.email);

  // ── 2. CONSULTANTS ────────────────────────────────────────
  const c1 = await upsertUser("consultant1@fullfunnelworks.co.uk", "Laura James", "consultant", {
    lastLoginAt: daysAgo(1),
    loginHistory: [daysAgo(1), daysAgo(5), daysAgo(12), daysAgo(20)],
  });
  const c2 = await upsertUser("consultant2@fullfunnelworks.co.uk", "Mark Stevens", "consultant", {
    lastLoginAt: daysAgo(4),
    loginHistory: [daysAgo(4), daysAgo(11), daysAgo(18)],
  });
  const c3 = await upsertUser("sarah.connor@fullfunnelworks.co.uk", "Sarah Connor", "consultant", {
    lastLoginAt: daysAgo(18),
    loginHistory: [daysAgo(18), daysAgo(25)],
  });
  const c4 = await upsertUser("james.wright@fullfunnelworks.co.uk", "James Wright", "consultant", {
    lastLoginAt: daysAgo(45),
    loginHistory: [daysAgo(45), daysAgo(52), daysAgo(61)],
  });
  const c5 = await upsertUser("emma.thornton@fullfunnelworks.co.uk", "Emma Thornton", "consultant", {
    lastLoginAt: daysAgo(7),
    loginHistory: [daysAgo(7), daysAgo(14), daysAgo(22), daysAgo(30)],
  });
  const c6 = await upsertUser("david.lee@fullfunnelworks.co.uk", "David Lee", "consultant", {
    lastLoginAt: daysAgo(1),
    loginHistory: [daysAgo(1), daysAgo(3)],
  });
  console.log("👤 Consultants: consultant1, consultant2, sarah.connor, james.wright, emma.thornton, david.lee\n");

  // ── 3. PLANS ──────────────────────────────────────────────
  const [starterPlan, growthPlan, enterprisePlan] = await Plan.insertMany([
    {
      name: "Starter",
      description: "For consultants just getting started",
      monthlyPricePence: 4900,
      annualPricePence: 49000,
      maxActiveClients: 5,
      maxProjectsPerClient: 1,
      allowedModules: ["assessment", "people", "product"],
      trialDays: 14,
      isActive: true,
    },
    {
      name: "Growth",
      description: "For growing consultant practices",
      monthlyPricePence: 9900,
      annualPricePence: 99000,
      maxActiveClients: 15,
      maxProjectsPerClient: 3,
      allowedModules: ["assessment", "people", "product", "process", "kpis", "gtm", "hiring"],
      trialDays: 14,
      isActive: true,
    },
    {
      name: "Enterprise",
      description: "Unlimited access for large practices",
      monthlyPricePence: 24900,
      annualPricePence: 249000,
      maxActiveClients: 999,
      maxProjectsPerClient: 99,
      allowedModules: [
        "assessment", "people", "product", "process", "kpis", "gtm",
        "hiring", "modeller", "roadmap", "revenue_execution", "execution_planning",
      ],
      trialDays: 14,
      isActive: true,
    },
  ]);
  console.log("📦 Plans seeded: 3 (Starter, Growth, Enterprise)\n");

  // ── 4. SUBSCRIPTIONS ──────────────────────────────────────
  await Subscription.insertMany([
    // Laura — Growth · active
    { consultantId: c1._id, planId: growthPlan._id, status: "active", currentPeriodStart: daysAgo(15), currentPeriodEnd: daysFromNow(15), cardExpMonth: 9, cardExpYear: 2027 },
    // Mark — Starter · past_due (payment failed)
    { consultantId: c2._id, planId: starterPlan._id, status: "past_due", currentPeriodStart: daysAgo(32), currentPeriodEnd: daysAgo(2), cardExpMonth: 4, cardExpYear: 2026, notes: "Payment failed — follow up required" },
    // Sarah — Growth · past_due (expired card)
    { consultantId: c3._id, planId: growthPlan._id, status: "past_due", currentPeriodStart: daysAgo(35), currentPeriodEnd: daysAgo(5), cardExpMonth: 11, cardExpYear: 2025, notes: "Card expired — outreach needed" },
    // James — Growth · canceled
    { consultantId: c4._id, planId: growthPlan._id, status: "canceled", currentPeriodStart: daysAgo(90), currentPeriodEnd: daysAgo(30), canceledAt: daysAgo(35), cardExpMonth: 7, cardExpYear: 2026, notes: "Canceled — cited cost concerns" },
    // Emma — Starter · active
    { consultantId: c5._id, planId: starterPlan._id, status: "active", currentPeriodStart: daysAgo(8), currentPeriodEnd: daysFromNow(22), cardExpMonth: 3, cardExpYear: 2028 },
    // David — Enterprise · active (new)
    { consultantId: c6._id, planId: enterprisePlan._id, status: "active", currentPeriodStart: daysAgo(1), currentPeriodEnd: daysFromNow(29), cardExpMonth: 12, cardExpYear: 2029 },
  ]);
  console.log("💳 Subscriptions seeded: 6 (active×3, past_due×2, canceled×1)\n");

  // ── 5. CLIENT USERS + CLIENTS + PROJECTS + INVOICES ───────

  // Helper: create a client user + Client record
  const mkClient = async (
    consultant: typeof c1,
    email: string,
    name: string,
    biz: string,
    status: "invited" | "onboarding" | "active" | "paused",
    extras: Record<string, unknown> = {}
  ) => {
    const u = await upsertUser(email, name, "client");
    const cl = await Client.findOneAndUpdate(
      { userId: u._id },
      {
        $set: {
          userId: u._id,
          businessName: biz,
          status,
          assignedConsultant: consultant._id,
          contactName: name,
          contactEmail: email,
          invoicingEmail: email,
          onboardingCompletedAt: status === "active" ? daysAgo(30) : undefined,
          ...extras,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return { u, cl };
  };

  // ── LAURA JAMES (Growth · active) — 4 clients ─────────────
  console.log("👥 Seeding Laura James clients…");

  const { cl: techVentures } = await mkClient(c1, "sarah.mitchell@techventures.io", "Sarah Mitchell", "TechVentures Ltd", "active", {
    jobTitle: "CEO", phone: "+44 7700 900001", website: "https://techventures.io",
    city: "London", postcode: "EC2A 1BN", country: "UK", plan: "premium",
  });
  const { cl: brightPath } = await mkClient(c1, "james.wilson@brightpath.co", "James Wilson", "BrightPath Consulting", "active", {
    jobTitle: "Managing Director", phone: "+44 7700 900002",
    city: "Edinburgh", postcode: "EH2 1JE", country: "UK", plan: "premium",
  });
  const { cl: meridian } = await mkClient(c1, "claire.ford@meridiansolutions.co.uk", "Claire Ford", "Meridian Solutions", "onboarding", {
    jobTitle: "COO", city: "Manchester", postcode: "M1 4BH", country: "UK",
  });
  const { cl: hartleyGroup } = await mkClient(c1, "rob.hartley@hartleygroup.com", "Rob Hartley", "Hartley Group", "active", {
    jobTitle: "Founder", city: "Bristol", postcode: "BS1 5QD", country: "UK", plan: "premium",
  });

  // Laura's projects
  const [tvProject] = await Project.insertMany([
    {
      clientId: techVentures._id, assignedTo: c1._id,
      title: "Full Funnel Transformation",
      description: "End-to-end sales process redesign and team enablement",
      status: "in_progress", package: "scale-accelerator",
      activeModules: ["assessment", "people", "product", "process", "kpis"],
      dueDate: daysFromNow(60),
      lastActivityAt: daysAgo(1), staleness: "active",
      milestones: [
        { title: "Assessment Complete", completedAt: daysAgo(45) },
        { title: "People Framework", completedAt: daysAgo(20) },
        { title: "Process Standardisation", dueDate: daysFromNow(30) },
        { title: "KPI Dashboard", dueDate: daysFromNow(60) },
      ],
    },
  ]);
  const [bpProject] = await Project.insertMany([
    {
      clientId: brightPath._id, assignedTo: c1._id,
      title: "Sales Methodology Build",
      description: "Custom consultative selling methodology",
      status: "in_progress", package: "growth-starter",
      activeModules: ["assessment", "people", "product"],
      dueDate: daysFromNow(45),
      lastActivityAt: daysAgo(3), staleness: "active",
      milestones: [
        { title: "Assessment Complete", completedAt: daysAgo(14) },
        { title: "Messaging Framework", dueDate: daysFromNow(21) },
      ],
    },
  ]);
  const [merProject] = await Project.insertMany([
    {
      clientId: meridian._id, assignedTo: c1._id,
      title: "Onboarding — Growth Starter",
      description: "90-day foundation programme",
      status: "in_progress", package: "growth-starter",
      activeModules: ["assessment"],
      dueDate: daysFromNow(75),
      lastActivityAt: daysAgo(2), staleness: "active",
    },
  ]);
  const [hartProject] = await Project.insertMany([
    {
      clientId: hartleyGroup._id, assignedTo: c1._id,
      title: "GTM Playbook",
      description: "Market intelligence and competitive positioning",
      status: "blocked", package: "scale-accelerator",
      activeModules: ["assessment", "gtm", "product"],
      dueDate: daysFromNow(30),
      lastActivityAt: daysAgo(21), staleness: "stalled",
      blocks: [{ reason: "Awaiting competitor analysis data from client", raisedAt: daysAgo(14) }],
    },
  ]);

  // Laura's invoices
  await Invoice.insertMany([
    { clientId: techVentures._id, projectId: tvProject._id, title: "Scale Accelerator — Assessment Phase", amountPence: 350000, status: "paid", paymentModel: "upfront", dueDate: daysAgo(45), sentAt: daysAgo(60), paidAt: daysAgo(44) },
    { clientId: techVentures._id, projectId: tvProject._id, title: "Scale Accelerator — People & Product Phase", amountPence: 450000, status: "sent", paymentModel: "milestone", dueDate: daysFromNow(14), sentAt: daysAgo(5) },
    { clientId: brightPath._id, projectId: bpProject._id, title: "Growth Starter — Month 1", amountPence: 150000, status: "paid", paymentModel: "milestone", dueDate: daysAgo(25), sentAt: daysAgo(30), paidAt: daysAgo(24) },
    { clientId: brightPath._id, projectId: bpProject._id, title: "Growth Starter — Month 2", amountPence: 150000, status: "sent", paymentModel: "milestone", dueDate: daysFromNow(7), sentAt: daysAgo(3) },
    { clientId: hartleyGroup._id, projectId: hartProject._id, title: "GTM Playbook — Deposit", amountPence: 200000, status: "paid", paymentModel: "upfront", dueDate: daysAgo(30), sentAt: daysAgo(35), paidAt: daysAgo(29) },
    { clientId: merProject.clientId, projectId: merProject._id, title: "Onboarding — Kickoff Fee", amountPence: 75000, status: "paid", paymentModel: "upfront", dueDate: daysAgo(5), sentAt: daysAgo(8), paidAt: daysAgo(4) },
  ]);
  console.log("  ✓ TechVentures, BrightPath, Meridian, Hartley Group");

  // ── MARK STEVENS (Starter · past_due) — 2 clients ─────────
  console.log("👥 Seeding Mark Stevens clients…");

  const { cl: cloudScale } = await mkClient(c2, "tom.baker@cloudscale.dev", "Tom Baker", "CloudScale Systems", "active", {
    jobTitle: "CTO", city: "Cambridge", postcode: "CB1 2AB", country: "UK",
  });
  const { cl: novaRetail } = await mkClient(c2, "nina.price@novaretail.co.uk", "Nina Price", "Nova Retail", "paused", {
    jobTitle: "Head of Sales", city: "Leeds", postcode: "LS1 4BN", country: "UK",
  });

  const [csProject] = await Project.insertMany([
    {
      clientId: cloudScale._id, assignedTo: c2._id,
      title: "KPI Framework & Dashboard",
      description: "Define company and department KPIs, implement tracking",
      status: "in_progress", package: "advisory-retainer",
      activeModules: ["assessment", "kpis"],
      dueDate: daysFromNow(30),
      lastActivityAt: daysAgo(5), staleness: "nudge",
      milestones: [
        { title: "KPI Workshop", completedAt: daysAgo(10) },
        { title: "Dashboard Build", dueDate: daysFromNow(20) },
      ],
    },
  ]);
  const [nrProject] = await Project.insertMany([
    {
      clientId: novaRetail._id, assignedTo: c2._id,
      title: "Sales Process Audit",
      description: "Current state analysis and gap identification",
      status: "blocked", package: "advisory-retainer",
      activeModules: ["assessment", "process"],
      lastActivityAt: daysAgo(40), staleness: "at_risk",
      blocks: [{ reason: "Client temporarily paused — budget review", raisedAt: daysAgo(30) }],
    },
  ]);

  await Invoice.insertMany([
    { clientId: cloudScale._id, projectId: csProject._id, title: "Advisory Retainer — Month 1", amountPence: 120000, status: "paid", paymentModel: "milestone", dueDate: daysAgo(15), sentAt: daysAgo(20), paidAt: daysAgo(14) },
    { clientId: cloudScale._id, projectId: csProject._id, title: "Advisory Retainer — Month 2", amountPence: 120000, status: "overdue", paymentModel: "milestone", dueDate: daysAgo(3), sentAt: daysAgo(10) },
    { clientId: novaRetail._id, projectId: nrProject._id, title: "Sales Process Audit — Deposit", amountPence: 90000, status: "paid", paymentModel: "upfront", dueDate: daysAgo(35), sentAt: daysAgo(40), paidAt: daysAgo(34) },
  ]);
  console.log("  ✓ CloudScale Systems, Nova Retail");

  // ── SARAH CONNOR (Growth · past_due) — 2 clients ──────────
  console.log("👥 Seeding Sarah Connor clients…");

  const { cl: pinnacle } = await mkClient(c3, "alex.burns@pinnacletech.io", "Alex Burns", "Pinnacle Tech", "active", {
    jobTitle: "CEO", city: "London", postcode: "W1A 1AA", country: "UK",
  });
  const { cl: blueRidge } = await mkClient(c3, "kate.marsh@blueridgepartners.co.uk", "Kate Marsh", "BlueRidge Partners", "onboarding", {
    jobTitle: "Partner", city: "Birmingham", postcode: "B1 1BB", country: "UK",
  });

  const [ptProject] = await Project.insertMany([
    {
      clientId: pinnacle._id, assignedTo: c3._id,
      title: "Growth Assessment",
      description: "Baseline assessment and 90-day roadmap",
      status: "in_progress", package: "growth-starter",
      activeModules: ["assessment", "people"],
      dueDate: daysFromNow(45),
      lastActivityAt: daysAgo(10), staleness: "nudge",
      milestones: [{ title: "Discovery Workshop", completedAt: daysAgo(20) }],
    },
  ]);
  const [brProject] = await Project.insertMany([
    {
      clientId: blueRidge._id, assignedTo: c3._id,
      title: "Onboarding Programme",
      description: "Initial assessment and intake",
      status: "not_started", package: "growth-starter",
      activeModules: ["assessment"],
      lastActivityAt: daysAgo(3), staleness: "active",
    },
  ]);

  await Invoice.insertMany([
    { clientId: pinnacle._id, projectId: ptProject._id, title: "Growth Starter — Kickoff", amountPence: 180000, status: "paid", paymentModel: "upfront", dueDate: daysAgo(20), sentAt: daysAgo(25), paidAt: daysAgo(19) },
    { clientId: blueRidge._id, projectId: brProject._id, title: "Onboarding Fee", amountPence: 75000, status: "sent", paymentModel: "upfront", dueDate: daysFromNow(10), sentAt: daysAgo(2) },
  ]);
  console.log("  ✓ Pinnacle Tech, BlueRidge Partners");

  // ── JAMES WRIGHT (Growth · canceled) — 1 client (wound down) ─
  console.log("👥 Seeding James Wright clients…");

  const { cl: vortex } = await mkClient(c4, "dan.cole@vortexdigital.co.uk", "Dan Cole", "Vortex Digital", "active", {
    jobTitle: "MD", city: "London", postcode: "EC1A 2BB", country: "UK",
  });

  const [vxProject] = await Project.insertMany([
    {
      clientId: vortex._id, assignedTo: c4._id,
      title: "Product Positioning Workshop",
      description: "Outcome mapping and value proposition design",
      status: "completed", package: "growth-starter",
      activeModules: ["assessment", "product"],
      lastActivityAt: daysAgo(45), staleness: "active",
      milestones: [
        { title: "Workshop 1", completedAt: daysAgo(70) },
        { title: "Workshop 2", completedAt: daysAgo(60) },
        { title: "Final Deliverable", completedAt: daysAgo(45) },
      ],
    },
  ]);

  await Invoice.insertMany([
    { clientId: vortex._id, projectId: vxProject._id, title: "Positioning Workshop — Full Fee", amountPence: 225000, status: "paid", paymentModel: "upfront", dueDate: daysAgo(50), sentAt: daysAgo(65), paidAt: daysAgo(48) },
  ]);
  console.log("  ✓ Vortex Digital (completed project)");

  // ── EMMA THORNTON (Starter · active) — 3 clients ──────────
  console.log("👥 Seeding Emma Thornton clients…");

  const { cl: blueStar } = await mkClient(c5, "helen.park@bluestarmedia.co.uk", "Helen Park", "BlueStar Media", "active", {
    jobTitle: "Commercial Director", city: "London", postcode: "SE1 7PB", country: "UK",
  });
  const { cl: thornfield } = await mkClient(c5, "simon.reed@thornfieldco.com", "Simon Reed", "Thornfield & Co", "active", {
    jobTitle: "Operations Director", city: "Oxford", postcode: "OX1 1BH", country: "UK",
  });
  const { cl: sterling } = await mkClient(c5, "paula.cross@sterlinggroup.co.uk", "Paula Cross", "Sterling Group", "onboarding", {
    jobTitle: "CEO", city: "Nottingham", postcode: "NG1 5GG", country: "UK",
  });

  const [bsProject] = await Project.insertMany([
    {
      clientId: blueStar._id, assignedTo: c5._id,
      title: "People Framework",
      description: "Sales team structure and capability mapping",
      status: "in_progress", package: "growth-starter",
      activeModules: ["assessment", "people"],
      dueDate: daysFromNow(30),
      lastActivityAt: daysAgo(4), staleness: "active",
      milestones: [
        { title: "Team Assessment", completedAt: daysAgo(15) },
        { title: "Capability Framework", dueDate: daysFromNow(15) },
      ],
    },
  ]);
  const [tfProject] = await Project.insertMany([
    {
      clientId: thornfield._id, assignedTo: c5._id,
      title: "Process Standardisation",
      description: "Document and standardise core sales processes",
      status: "in_progress", package: "advisory-retainer",
      activeModules: ["assessment", "product"],
      dueDate: daysFromNow(60),
      lastActivityAt: daysAgo(8), staleness: "nudge",
    },
  ]);
  const [sterProject] = await Project.insertMany([
    {
      clientId: sterling._id, assignedTo: c5._id,
      title: "Initial Assessment",
      description: "Baseline gap analysis and 90-day priority planning",
      status: "not_started", package: "growth-starter",
      activeModules: ["assessment"],
      lastActivityAt: daysAgo(1), staleness: "active",
    },
  ]);

  await Invoice.insertMany([
    { clientId: blueStar._id, projectId: bsProject._id, title: "People Framework — Phase 1", amountPence: 160000, status: "paid", paymentModel: "milestone", dueDate: daysAgo(10), sentAt: daysAgo(15), paidAt: daysAgo(9) },
    { clientId: thornfield._id, projectId: tfProject._id, title: "Process Review — Retainer Month 1", amountPence: 110000, status: "paid", paymentModel: "milestone", dueDate: daysAgo(20), sentAt: daysAgo(25), paidAt: daysAgo(19) },
    { clientId: thornfield._id, projectId: tfProject._id, title: "Process Review — Retainer Month 2", amountPence: 110000, status: "sent", paymentModel: "milestone", dueDate: daysFromNow(10), sentAt: daysAgo(2) },
    { clientId: sterling._id, projectId: sterProject._id, title: "Onboarding Fee", amountPence: 65000, status: "sent", paymentModel: "upfront", dueDate: daysFromNow(14), sentAt: daysAgo(1) },
  ]);
  console.log("  ✓ BlueStar Media, Thornfield & Co, Sterling Group");

  // ── DAVID LEE (Enterprise · active, new) — 2 clients ──────
  console.log("👥 Seeding David Lee clients…");

  const { cl: vantage } = await mkClient(c6, "michael.orr@vantagecapital.co.uk", "Michael Orr", "Vantage Capital", "active", {
    jobTitle: "CEO", city: "London", postcode: "EC3M 3BD", country: "UK", plan: "premium",
  });
  const { cl: nexusVentures } = await mkClient(c6, "priya.nair@nexusventures.io", "Priya Nair", "Nexus Ventures", "onboarding", {
    jobTitle: "Portfolio Director", city: "London", postcode: "W1K 4PS", country: "UK",
  });

  const [vcProject] = await Project.insertMany([
    {
      clientId: vantage._id, assignedTo: c6._id,
      title: "Enterprise Growth Programme",
      description: "Full-funnel transformation across all practice areas",
      status: "in_progress", package: "enterprise-growth",
      activeModules: ["assessment", "people", "product", "process", "kpis", "gtm", "hiring", "modeller"],
      dueDate: daysFromNow(180),
      lastActivityAt: daysAgo(1), staleness: "active",
      milestones: [
        { title: "Discovery & Assessment", dueDate: daysFromNow(30) },
        { title: "People & Product", dueDate: daysFromNow(90) },
        { title: "Process & KPIs", dueDate: daysFromNow(140) },
        { title: "GTM & Execution", dueDate: daysFromNow(180) },
      ],
    },
  ]);
  const [nvProject] = await Project.insertMany([
    {
      clientId: nexusVentures._id, assignedTo: c6._id,
      title: "Assessment & Discovery",
      description: "Initial assessment and priority identification",
      status: "not_started", package: "scale-accelerator",
      activeModules: ["assessment"],
      lastActivityAt: daysAgo(0), staleness: "active",
    },
  ]);

  await Invoice.insertMany([
    { clientId: vantage._id, projectId: vcProject._id, title: "Enterprise Programme — Deposit (50%)", amountPence: 750000, status: "paid", paymentModel: "upfront", dueDate: daysAgo(2), sentAt: daysAgo(5), paidAt: daysAgo(1) },
    { clientId: nexusVentures._id, projectId: nvProject._id, title: "Scale Accelerator — Discovery Fee", amountPence: 300000, status: "sent", paymentModel: "upfront", dueDate: daysFromNow(21), sentAt: daysAgo(1) },
  ]);
  console.log("  ✓ Vantage Capital, Nexus Ventures\n");

  // ── 6. NOTIFICATIONS ──────────────────────────────────────
  await Notification.insertMany([
    { userId: admin._id, type: "info",    title: "New sign-up",          message: "David Lee signed up for Enterprise",          read: false, createdAt: daysAgo(1) },
    { userId: admin._id, type: "warning", title: "Subscription past due", message: "Sarah Connor — subscription past due",        read: false, createdAt: daysAgo(5) },
    { userId: admin._id, type: "warning", title: "Subscription past due", message: "Mark Stevens — payment failed",               read: false, createdAt: daysAgo(3) },
    { userId: admin._id, type: "warning", title: "Inactive consultant",   message: "James Wright hasn't logged in for 45 days",   read: false, createdAt: daysAgo(0) },
    { userId: admin._id, type: "success", title: "Invoice paid",          message: "Vantage Capital paid £7,500 deposit",         read: true,  createdAt: daysAgo(1) },
    { userId: admin._id, type: "info",    title: "Plan upgraded",         message: "Laura James is on Growth — 4 active clients", read: true,  createdAt: daysAgo(10) },
  ]);
  console.log("🔔 Notifications seeded: 6\n");

  // ── 7. SETTINGS ───────────────────────────────────────────
  await Settings.create({
    platformName: "Full Funnel Works",
    supportEmail: "support@fullfunnelworks.co.uk",
    billingCurrency: "GBP",
    trialDaysDefault: 14,
    maintenanceMode: false,
  });
  console.log("⚙️  Settings seeded\n");

  await mongoose.disconnect();
  console.log("✅  Seed complete.\n");
  console.log("  Admin:        admin@fullfunnelworks.co.uk / admin123");
  console.log("  Consultant 1: consultant1@fullfunnelworks.co.uk / admin123");
  console.log("  Consultant 2: consultant2@fullfunnelworks.co.uk / admin123");
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
