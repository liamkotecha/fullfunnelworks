/**
 * Migration: IntakeResponse → EngagementSession / Participant / Response
 *
 * For each IntakeResponse that has not yet been migrated (no migratedAt field),
 * this script:
 *   1. Finds or creates a Project for the Client
 *   2. Creates an EngagementSession
 *   3. Creates Participant docs from teamMembers[]
 *   4. Upserts Response docs from responses map (participantId=null)
 *   5. Upserts Response docs from individualResponses (participantId=participant._id)
 *   6. Upserts canonical Response docs from synthesisResponses (overwriting step 4)
 *   7. Syncs Client.teamUserIds
 *   8. Re-reads the IntakeResponse for any saves that arrived during steps 1–7
 *      and upserts those values (idempotent due to unique index)
 *   9. Sets IntakeResponse.migratedAt = now  ← routing gate flips here
 *
 * Safety:
 *   - Non-destructive: IntakeResponse docs are never deleted
 *   - Idempotent: checks migratedAt before processing; all upserts use the
 *     unique index on { sessionId, participantId, fieldKey }
 *   - --dry-run flag: prints plan without writing anything
 *   - --client <id> flag: run for a single clientId only
 *
 * Usage:
 *   npx tsx scripts/migrate-to-session-model.ts
 *   npx tsx scripts/migrate-to-session-model.ts --dry-run
 *   npx tsx scripts/migrate-to-session-model.ts --client 6612abc123def456
 */

import mongoose, { Types } from "mongoose";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI is not set");
  process.exit(1);
}

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const CLIENT_ARG = (() => {
  const idx = args.indexOf("--client");
  return idx !== -1 ? args[idx + 1] : null;
})();

if (DRY_RUN) console.log("🔍  DRY-RUN mode — no writes will occur\n");
if (CLIENT_ARG) console.log(`🎯  Single-client mode — targeting clientId: ${CLIENT_ARG}\n`);

async function migrate() {
  await mongoose.connect(MONGODB_URI!);
  console.log("✅  Connected to MongoDB\n");

  // ── Model imports ────────────────────────────────────────────
  const { default: IntakeResponse } = await import("../src/models/IntakeResponse");
  const { default: Client } = await import("../src/models/Client");
  const { default: Project } = await import("../src/models/Project");
  const { default: EngagementSession } = await import("../src/models/EngagementSession");
  const { default: Participant } = await import("../src/models/Participant");
  const { default: Response } = await import("../src/models/Response");

  // ── Query ────────────────────────────────────────────────────
  const query: Record<string, unknown> = { migratedAt: { $exists: false } };
  if (CLIENT_ARG) {
    query.clientId = new Types.ObjectId(CLIENT_ARG);
  }

  const intakes = await IntakeResponse.find(query).lean() as Array<Record<string, any>>;
  console.log(`📋  Found ${intakes.length} IntakeResponse doc(s) to migrate\n`);

  let succeeded = 0;
  let skipped = 0;
  let failed = 0;

  for (const intake of intakes) {
    const clientId = String(intake.clientId);
    console.log(`→  Processing clientId: ${clientId}`);

    try {
      // ── Step 1: Find or create Project ─────────────────────
      const client = await Client.findById(clientId)
        .select("assignedConsultant businessName")
        .lean() as Record<string, any> | null;

      if (!client) {
        console.warn(`   ⚠️  Client not found for clientId ${clientId} — skipping`);
        skipped++;
        continue;
      }

      let project = await Project.findOne({
        clientId: intake.clientId,
        status: "in_progress",
      })
        .sort({ createdAt: -1 })
        .lean() as Record<string, any> | null;

      let projectCreated = false;
      if (!project) {
        // Fall back to any project for this client
        project = await Project.findOne({ clientId: intake.clientId })
          .sort({ createdAt: -1 })
          .lean() as Record<string, any> | null;
      }

      if (!project) {
        if (DRY_RUN) {
          console.log(
            `   [DRY] Would create Project "Initial Engagement" for client "${client.businessName ?? clientId}"`
          );
          console.log(`   ⚠️  NOTE: activeModules will be ["assessment"] — review after migration`);
        } else {
          const created = await Project.create({
            clientId: intake.clientId,
            title: "Initial Engagement",
            status: "in_progress",
            package: "standard",
            activeModules: ["assessment"],
            assignedTo: client.assignedConsultant ?? undefined,
            lastActivityAt: intake.updatedAt ?? new Date(),
          });
          project = created.toObject();
          projectCreated = true;
          console.log(
            `   ✨  Created Project "Initial Engagement" (id: ${project!._id}) — ⚠️  review activeModules`
          );
        }
      }

      if (!project && DRY_RUN) {
        // Dry run: no project to reference, continue to next
        console.log(`   [DRY] Skipping remaining steps for this doc (no project _id yet)\n`);
        continue;
      }

      // ── Step 2: Create EngagementSession ───────────────────
      const sessionStatus = intake.synthesisCompletedAt
        ? "synthesised"
        : (intake.teamMembers ?? []).some((m: any) => m.submittedAt)
        ? "submitted"
        : "active";

      let session: Record<string, any> | null = null;

      if (DRY_RUN) {
        console.log(
          `   [DRY] Would create EngagementSession (status: ${sessionStatus}, teamMode: ${intake.teamMode ?? false})`
        );
      } else {
        // Check if session already exists for this project (idempotency)
        session = await EngagementSession.findOne({
          projectId: project!._id,
          status: { $ne: "synthesised" },
        })
          .sort({ createdAt: -1 })
          .lean() as Record<string, any> | null;

        if (!session) {
          const created = await EngagementSession.create({
            projectId: project!._id,
            teamMode: intake.teamMode ?? false,
            status: sessionStatus,
            lastActiveSub: intake.lastActiveSub ?? "",
            synthesisCompletedAt: intake.synthesisCompletedAt ?? undefined,
            synthesisCompletedBy: intake.synthesisCompletedBy ?? undefined,
          });
          session = created.toObject();
          console.log(`   ✨  Created EngagementSession (id: ${session!._id})`);
        } else {
          console.log(`   ♻️  EngagementSession already exists (id: ${session!._id}), reusing`);
        }
      }

      // ── Step 3: Create Participants ────────────────────────
      const participantIdMap = new Map<string, Types.ObjectId>(); // userId string → Participant._id

      const teamMembers: Array<Record<string, any>> = intake.teamMembers ?? [];
      if (DRY_RUN) {
        console.log(`   [DRY] Would create ${teamMembers.length} Participant doc(s)`);
      } else {
        for (const member of teamMembers) {
          const userId = String(member.userId);
          // Upsert — idempotent
          const existing = await Participant.findOne({
            sessionId: session!._id,
            userId: member.userId,
          }).lean() as Record<string, any> | null;

          if (existing) {
            participantIdMap.set(userId, existing._id as Types.ObjectId);
          } else {
            const p = await Participant.create({
              sessionId: session!._id,
              userId: member.userId,
              role: member.role ?? "",
              invitedAt: member.invitedAt ?? new Date(),
              invitedBy: member.invitedBy ?? member.userId,
              submittedAt: member.submittedAt ?? undefined,
            });
            participantIdMap.set(userId, p._id as Types.ObjectId);
          }
        }
        console.log(`   ✅  ${teamMembers.length} Participant(s) upserted`);
      }

      // ── Helper: upsert a single Response row ───────────────
      const upsertResponse = async (
        doc: Record<string, unknown>
      ) => {
        if (DRY_RUN) return;
        await Response.findOneAndUpdate(
          { sessionId: session!._id, participantId: doc.participantId ?? null, fieldKey: doc.fieldKey },
          { $set: { value: doc.value, ...(doc.source ? { source: doc.source } : {}), ...(doc.divergence !== undefined ? { divergence: doc.divergence } : {}), updatedAt: doc.updatedAt ?? new Date() } },
          { upsert: true, new: true }
        );
      };

      // ── Step 4: Canonical responses (participantId=null) ───
      const responsesMap: Map<string, unknown> = intake.responses ?? new Map();
      const responseEntries = responsesMap instanceof Map
        ? [...responsesMap.entries()]
        : Object.entries(responsesMap as Record<string, unknown>);

      if (DRY_RUN) {
        console.log(`   [DRY] Would upsert ${responseEntries.length} canonical Response doc(s)`);
      } else {
        for (const [fieldKey, value] of responseEntries) {
          await upsertResponse({ participantId: null, fieldKey, value });
        }
        console.log(`   ✅  ${responseEntries.length} canonical Response(s) upserted`);
      }

      // ── Step 5: Individual responses (per participant) ─────
      const individualMap: Map<string, Map<string, unknown>> = intake.individualResponses ?? new Map();
      const individualEntries = individualMap instanceof Map
        ? [...individualMap.entries()]
        : Object.entries(individualMap as Record<string, Record<string, unknown>>);

      let individualCount = 0;
      if (DRY_RUN) {
        const total = individualEntries.reduce((n, [, fields]) => {
          const f = fields instanceof Map ? fields.size : Object.keys(fields as object).length;
          return n + f;
        }, 0);
        console.log(`   [DRY] Would upsert ${total} individual Response doc(s)`);
      } else {
        for (const [userId, fieldMap] of individualEntries) {
          const participantId = participantIdMap.get(userId);
          if (!participantId) {
            console.warn(`   ⚠️  No Participant found for userId ${userId} — skipping individualResponses`);
            continue;
          }
          const fields =
            fieldMap instanceof Map
              ? [...fieldMap.entries()]
              : Object.entries(fieldMap as Record<string, unknown>);
          for (const [fieldKey, value] of fields) {
            await upsertResponse({ participantId, fieldKey, value });
            individualCount++;
          }
        }
        console.log(`   ✅  ${individualCount} individual Response(s) upserted`);
      }

      // ── Step 6: Synthesis responses (overwrite canonical) ──
      const synthesisMap: Map<string, Record<string, unknown>> = intake.synthesisResponses ?? new Map();
      const synthesisEntries = synthesisMap instanceof Map
        ? [...synthesisMap.entries()]
        : Object.entries(synthesisMap as Record<string, Record<string, unknown>>);

      if (DRY_RUN) {
        console.log(`   [DRY] Would upsert ${synthesisEntries.length} synthesis Response doc(s)`);
      } else {
        for (const [fieldKey, entry] of synthesisEntries) {
          await upsertResponse({
            participantId: null,
            fieldKey,
            value: entry.value,
            source: entry.source,
            divergence: entry.divergence,
            updatedAt: entry.writtenAt ?? new Date(),
          });
        }
        console.log(`   ✅  ${synthesisEntries.length} synthesis Response(s) upserted`);
      }

      // ── Step 7: Sync Client.teamUserIds ────────────────────
      const participantUserIds = teamMembers.map((m) => m.userId);
      if (DRY_RUN) {
        console.log(`   [DRY] Would $addToSet ${participantUserIds.length} userId(s) to Client.teamUserIds`);
      } else if (participantUserIds.length > 0) {
        await Client.updateOne(
          { _id: clientId },
          { $addToSet: { teamUserIds: { $each: participantUserIds } } }
        );
        console.log(`   ✅  Client.teamUserIds synced`);
      }

      // ── Step 8: Final sync — re-read IntakeResponse for any ──
      //    saves that arrived between steps 4-7 and migratedAt being set.
      if (!DRY_RUN) {
        const fresh = await IntakeResponse.findById(intake._id).lean() as Record<string, any> | null;
        if (fresh) {
          const freshResponseEntries =
            fresh.responses instanceof Map
              ? [...(fresh.responses as Map<string, unknown>).entries()]
              : Object.entries((fresh.responses ?? {}) as Record<string, unknown>);

          for (const [fieldKey, value] of freshResponseEntries) {
            await upsertResponse({ participantId: null, fieldKey, value });
          }
        }
      }

      // ── Step 9: Seal — set migratedAt ─────────────────────
      if (DRY_RUN) {
        console.log(`   [DRY] Would set IntakeResponse.migratedAt = now\n`);
      } else {
        await IntakeResponse.updateOne(
          { _id: intake._id },
          { $set: { migratedAt: new Date() } }
        );
        console.log(`   ✅  IntakeResponse.migratedAt sealed — routing gate now active\n`);
        succeeded++;
      }
    } catch (err) {
      console.error(`   ❌  Failed for clientId ${clientId}:`, err);
      failed++;
    }
  }

  console.log("\n── Summary ─────────────────────────────────────────────");
  if (DRY_RUN) {
    console.log(`  DRY RUN complete — ${intakes.length} doc(s) would be processed`);
  } else {
    console.log(`  Succeeded: ${succeeded}`);
    console.log(`  Skipped:   ${skipped}`);
    console.log(`  Failed:    ${failed}`);
  }
  console.log("────────────────────────────────────────────────────────\n");

  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
