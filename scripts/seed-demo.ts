/**
 * seed-demo.ts — Creates named demo accounts for each role.
 * Safe to re-run — uses upsert.
 *
 * Run: npx tsx scripts/seed-demo.ts
 *
 * Accounts created:
 *   admin@demo.fullf.io    / demo1234  (admin)
 *   consultant@demo.fullf.io / demo1234  (consultant)
 *   client@demo.fullf.io   / demo1234  (client)
 */

import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import User from "../src/models/User";
import Client from "../src/models/Client";
import Project from "../src/models/Project";
import EngagementSession from "../src/models/EngagementSession";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI not set in .env.local");
  process.exit(1);
}

const DEMO_PASSWORD = "demo1234";

const DEMO_USERS = [
  { email: "admin@demo.fullf.io",      name: "Demo Admin",      role: "admin"      as const },
  { email: "consultant@demo.fullf.io", name: "Demo Consultant", role: "consultant" as const },
  { email: "client@demo.fullf.io",     name: "Demo Client",     role: "client"     as const },
];

async function main() {
  await mongoose.connect(MONGODB_URI!);
  console.log("✅  Connected\n");

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const created: Record<string, typeof DEMO_USERS[0] & { _id: mongoose.Types.ObjectId }> = {};

  for (const u of DEMO_USERS) {
    const doc = await User.findOneAndUpdate(
      { email: u.email },
      {
        $set: {
          email: u.email,
          name: u.name,
          role: u.role,
          password: hash,
          ...(u.role === "consultant"
            ? {
                consultantProfile: {
                  maxActiveClients: 10,
                  availabilityStatus: "available",
                  specialisms: ["GTM", "Sales Process"],
                  roundRobinWeight: 1,
                  totalLeadsAssigned: 0,
                },
              }
            : {}),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    created[u.role] = { ...u, _id: doc._id };
    console.log(`👤 ${u.role}: ${u.email} / ${DEMO_PASSWORD}`);
  }

  // Ensure the demo client has a Client record wired to the consultant
  const clientUser = created["client"];
  const consultantUser = created["consultant"];

  const clientRecord = await Client.findOneAndUpdate(
    { userId: clientUser._id },
    {
      $set: {
        userId: clientUser._id,
        businessName: "Demo Company Ltd",
        status: "active",
        assignedConsultant: consultantUser._id,
        contactName: "Demo Client",
        contactEmail: clientUser.email,
        plan: "premium",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Ensure a project exists for the demo client
  let project = await Project.findOne({ clientId: clientRecord._id });
  if (!project) {
    project = await Project.create({
      clientId: clientRecord._id,
      title: "Demo Project",
      description: "Sandbox project for demo purposes",
      status: "in_progress",
      package: "scale-accelerator",
      assignedTo: consultantUser._id,
      activeModules: ["assessment", "people", "product", "process", "roadmap", "kpis", "gtm", "modeller"],
      lastActivityAt: new Date(),
      staleness: "active",
    });
    console.log("📁 Created demo project");
  }

  // Ensure an EngagementSession exists for the demo client
  const existingSession = await EngagementSession.findOne({ projectId: project._id });
  if (!existingSession) {
    await EngagementSession.create({
      projectId: project._id,
      teamMode: false,
      status: "active",
      lastActiveSub: "assessment/checklist",
    });
    console.log("📝 Created EngagementSession for demo client");
  }

  console.log("\n✅  Demo seed complete");
  console.log("─────────────────────────────────────");
  console.log("  admin@demo.fullf.io      → /admin/dashboard");
  console.log("  consultant@demo.fullf.io → /admin/dashboard");
  console.log("  client@demo.fullf.io     → /portal/overview");
  console.log("  Password: demo1234");
  console.log("─────────────────────────────────────\n");

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
