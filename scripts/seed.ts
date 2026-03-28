/**
 * Seed script — multi-tenant SaaS admin data only.
 * Creates admin + consultant users, plans, subscriptions, notifications, settings.
 * Does NOT create client/project/invoice data — those belong to consultant workspaces.
 *
 * Run: npx tsx scripts/seed.ts
 * Requires MONGODB_URI in .env.local
 *
 * Safe to re-run — upserts admin, deletes + re-creates everything else.
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
  console.error("❌  MONGODB_URI is not set in .env.local");
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

  // ── Remove stale old users ─────────────────────────────────
  const staleEmails = [
    "consultant1@fullfunnelworks.co.uk",
    "consultant2@fullfunnelworks.co.uk",
    "sarah@techventures.io",
    "james@brightpath.co",
    "emma@greenleaf.com",
    "david@nexusdigital.io",
    "rachel@swiftlogistics.co.uk",
    "tom@cloudscale.dev",
  ];
  await User.deleteMany({ email: { $in: staleEmails } });
  console.log("🗑️  Removed stale users\n");

  // ── 1. ADMIN ──────────────────────────────────────────────
  const admin = await upsertUser(
    "admin@fullfunnelworks.co.uk",
    "Admin",
    "admin"
  );
  console.log("👤 Admin: " + admin.email);

  // ── 2. CONSULTANTS ────────────────────────────────────────
  const c1 = await upsertUser(
    "laura.james@fullfunnelworks.co.uk",
    "Laura James",
    "consultant",
    {
      lastLoginAt: daysAgo(1),
      loginHistory: [daysAgo(1), daysAgo(5), daysAgo(12), daysAgo(20)],
    }
  );
  const c2 = await upsertUser(
    "mark.stevens@fullfunnelworks.co.uk",
    "Mark Stevens",
    "consultant",
    {
      lastLoginAt: daysAgo(4),
      loginHistory: [daysAgo(4), daysAgo(11), daysAgo(18)],
    }
  );
  const c3 = await upsertUser(
    "sarah.connor@fullfunnelworks.co.uk",
    "Sarah Connor",
    "consultant",
    {
      lastLoginAt: daysAgo(18),
      loginHistory: [daysAgo(18), daysAgo(25)],
    }
  );
  const c4 = await upsertUser(
    "james.wright@fullfunnelworks.co.uk",
    "James Wright",
    "consultant",
    {
      lastLoginAt: daysAgo(2),
      loginHistory: [daysAgo(2), daysAgo(6), daysAgo(15)],
    }
  );
  const c5 = await upsertUser(
    "emma.thornton@fullfunnelworks.co.uk",
    "Emma Thornton",
    "consultant",
    {
      lastLoginAt: daysAgo(7),
      loginHistory: [daysAgo(7), daysAgo(14), daysAgo(22), daysAgo(30)],
    }
  );
  const c6 = await upsertUser(
    "david.lee@fullfunnelworks.co.uk",
    "David Lee",
    "consultant",
    {
      lastLoginAt: daysAgo(0),
      loginHistory: [daysAgo(0)],
    }
  );
  console.log(
    "👤 Consultants: laura.james, mark.stevens, sarah.connor, james.wright, emma.thornton, david.lee\n"
  );

  // ── 3. PLANS ──────────────────────────────────────────────
  await Plan.deleteMany({});
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
      allowedModules: [
        "assessment",
        "people",
        "product",
        "process",
        "kpis",
        "gtm",
        "hiring",
      ],
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
        "assessment",
        "people",
        "product",
        "process",
        "kpis",
        "gtm",
        "hiring",
        "modeller",
        "revenue-execution",
      ],
      trialDays: 14,
      isActive: true,
    },
  ]);
  console.log("📦 Plans seeded: 3 (Starter, Growth, Enterprise)\n");

  // ── 4. SUBSCRIPTIONS ──────────────────────────────────────
  await Subscription.deleteMany({});
  await Subscription.insertMany([
    // Laura — Growth · active
    {
      consultantId: c1._id,
      planId: growthPlan._id,
      status: "active",
      currentPeriodStart: daysAgo(15),
      currentPeriodEnd: daysFromNow(15),
      cardExpMonth: 9,
      cardExpYear: 2027,
    },
    // Mark — Starter · trialing (ends in 3 days — churn risk)
    {
      consultantId: c2._id,
      planId: starterPlan._id,
      status: "trialing",
      trialEndsAt: daysFromNow(3),
      cardExpMonth: 4,
      cardExpYear: 2026,
    },
    // Sarah — Growth · past_due (churn risk: expired card)
    {
      consultantId: c3._id,
      planId: growthPlan._id,
      status: "past_due",
      currentPeriodStart: daysAgo(35),
      currentPeriodEnd: daysAgo(5),
      cardExpMonth: 11,
      cardExpYear: 2025,
      notes: "Card expired — outreach needed",
    },
    // James — Growth · trialing (ends in 2 days — churn risk)
    {
      consultantId: c4._id,
      planId: growthPlan._id,
      status: "trialing",
      trialEndsAt: daysFromNow(2),
      cardExpMonth: 7,
      cardExpYear: 2026,
    },
    // Emma — Starter · active
    {
      consultantId: c5._id,
      planId: starterPlan._id,
      status: "active",
      currentPeriodStart: daysAgo(8),
      currentPeriodEnd: daysFromNow(22),
      cardExpMonth: 3,
      cardExpYear: 2028,
    },
    // David — Enterprise · active (new)
    {
      consultantId: c6._id,
      planId: enterprisePlan._id,
      status: "active",
      currentPeriodStart: daysAgo(1),
      currentPeriodEnd: daysFromNow(29),
      cardExpMonth: 12,
      cardExpYear: 2029,
    },
  ]);
  console.log("💳 Subscriptions seeded: 6 (active×3, trialing×2, past_due×1)\n");

  // ── 5. CLEAN UP SINGLE-TENANT COLLECTIONS ────────────────
  const { default: Client } = await import("../src/models/Client");
  const { default: Project } = await import("../src/models/Project");
  const { default: Invoice } = await import("../src/models/Invoice");
  const { default: Prospect } = await import("../src/models/Prospect");
  const { default: IntakeResponse } = await import(
    "../src/models/IntakeResponse"
  );
  const { default: HiringPlan } = await import("../src/models/HiringPlan");
  const { default: ModellerBase } = await import("../src/models/ModellerBase");
  const { default: ModellerScenario } = await import(
    "../src/models/ModellerScenario"
  );
  const { default: ConsultantNote } = await import(
    "../src/models/ConsultantNote"
  );

  await Promise.all([
    Client.deleteMany({}),
    Project.deleteMany({}),
    Invoice.deleteMany({}),
    Prospect.deleteMany({}),
    IntakeResponse.deleteMany({}),
    HiringPlan.deleteMany({}),
    ModellerBase.deleteMany({}),
    ModellerScenario.deleteMany({}),
    ConsultantNote.deleteMany({}),
  ]);
  console.log(
    "🗑️  Cleared single-tenant collections (clients, projects, invoices, etc.)\n"
  );

  // ── 6. NOTIFICATIONS ──────────────────────────────────────
  await Notification.deleteMany({});
  await Notification.insertMany([
    {
      userId: admin._id,
      type: "info",
      title: "New sign-up",
      message: "David Lee signed up for Enterprise",
      read: false,
      createdAt: daysAgo(0),
    },
    {
      userId: admin._id,
      type: "warning",
      title: "Subscription past due",
      message: "Sarah Connor — subscription past due",
      read: false,
      createdAt: daysAgo(5),
    },
    {
      userId: admin._id,
      type: "warning",
      title: "Trial ending soon",
      message: "James Wright trial ends in 2 days",
      read: false,
      createdAt: daysAgo(0),
    },
    {
      userId: admin._id,
      type: "warning",
      title: "Trial ending soon",
      message: "Mark Stevens trial ends in 3 days",
      read: true,
      createdAt: daysAgo(1),
    },
    {
      userId: admin._id,
      type: "success",
      title: "Plan upgraded",
      message: "Laura James upgraded to Growth",
      read: true,
      createdAt: daysAgo(10),
    },
  ]);
  console.log("🔔 Notifications seeded: 5\n");

  // ── 7. SETTINGS ───────────────────────────────────────────
  await Settings.deleteMany({ consultantId: { $exists: false } });
  await Settings.create({ autoAssignEnabled: true, ga4Enabled: false });
  console.log("⚙️  Settings seeded\n");

  await mongoose.disconnect();
  console.log("✅  Seed complete.");
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
