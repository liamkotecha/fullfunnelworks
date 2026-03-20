/**
 * Assignment engine — weighted round-robin with capacity, specialism
 * matching, and recency fairness.
 */
import User from "@/models/User";
import type { IUser } from "@/models/User";

export interface AssignmentResult {
  consultantId: string | null;
  consultantName: string | null;
  reason: string;
  skipped: SkippedConsultant[];
}

export interface SkippedConsultant {
  consultantId: string;
  name: string;
  reason: "unavailable" | "at_capacity" | "on_holiday";
}

/**
 * assignConsultant — selects the best consultant for a new lead.
 *
 * @param prospect  - the prospect being assigned (only primaryChallenge needed)
 * @param currentCounts - Map<consultantId, activeClientCount> built by caller
 */
export async function assignConsultant(
  prospect: { primaryChallenge?: string | null },
  currentCounts: Map<string, number>
): Promise<AssignmentResult> {
  const now = new Date();
  const skipped: SkippedConsultant[] = [];

  // Fetch all consultants
  const consultants = await User.find({ role: "consultant" });

  // Auto-clear expired holidays before filtering
  for (const c of consultants) {
    if (
      c.consultantProfile?.holidayUntil &&
      new Date(c.consultantProfile.holidayUntil) < now
    ) {
      c.consultantProfile.holidayUntil = undefined;
      c.consultantProfile.availabilityStatus = "available";
      await User.findByIdAndUpdate(c._id, {
        $unset: { "consultantProfile.holidayUntil": 1 },
        $set: { "consultantProfile.availabilityStatus": "available" },
      });
    }
  }

  // Step 1: Build candidate pool
  const candidates: IUser[] = [];

  for (const c of consultants) {
    const profile = c.consultantProfile;
    const id = String(c._id);
    const name = c.name;
    const maxActive = profile?.maxActiveClients ?? 5;
    const currentActive = currentCounts.get(id) ?? 0;

    // Filter unavailable
    if (profile?.availabilityStatus === "unavailable") {
      skipped.push({ consultantId: id, name, reason: "unavailable" });
      continue;
    }

    // Filter on holiday
    if (profile?.holidayUntil && new Date(profile.holidayUntil) > now) {
      skipped.push({ consultantId: id, name, reason: "on_holiday" });
      continue;
    }

    // Filter at capacity
    if (currentActive >= maxActive) {
      skipped.push({ consultantId: id, name, reason: "at_capacity" });
      continue;
    }

    candidates.push(c);
  }

  if (candidates.length === 0) {
    return {
      consultantId: null,
      consultantName: null,
      reason: "No consultants available",
      skipped,
    };
  }

  // Step 2: Score each candidate
  const scored = candidates.map((c) => {
    const profile = c.consultantProfile;
    const id = String(c._id);
    const maxActive = profile?.maxActiveClients ?? 5;
    const currentActive = currentCounts.get(id) ?? 0;
    const capacityRatio = maxActive > 0 ? currentActive / maxActive : 1;

    // Base score: lower utilisation = higher score
    const baseScore = (1 - capacityRatio) * 100;

    // Weight bonus: weight 1 = +0, weight 5 = +40
    const weight = profile?.roundRobinWeight ?? 1;
    const weightBonus = (weight - 1) * 10;

    // Specialism bonus
    let specialismBonus = 0;
    const challenge = prospect.primaryChallenge?.toLowerCase() ?? "";
    const specialisms = profile?.specialisms ?? [];
    if (challenge && specialisms.length > 0) {
      const hasMatch = specialisms.some((s) =>
        challenge.includes(s.toLowerCase())
      );
      if (hasMatch) specialismBonus = 20;
    }

    // Recency penalty
    let recencyPenalty = 0;
    if (profile?.lastAssignedAt) {
      const minutesSinceLast =
        (now.getTime() - new Date(profile.lastAssignedAt).getTime()) /
        (1000 * 60);
      if (minutesSinceLast < 30) recencyPenalty = 30;
    }

    const finalScore = baseScore + weightBonus + specialismBonus - recencyPenalty;

    return {
      consultant: c,
      score: finalScore,
      lastAssignedAt: profile?.lastAssignedAt
        ? new Date(profile.lastAssignedAt)
        : null,
      capacityPercent: Math.round(capacityRatio * 100),
      specialismMatch: specialismBonus > 0,
    };
  });

  // Step 3: Select top scorer (tie-break by oldest lastAssignedAt)
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Tie-break: oldest lastAssignedAt (or never assigned) wins
    const aTime = a.lastAssignedAt?.getTime() ?? 0;
    const bTime = b.lastAssignedAt?.getTime() ?? 0;
    return aTime - bTime;
  });

  const winner = scored[0];
  const winnerId = String(winner.consultant._id);
  const winnerName = winner.consultant.name;

  // Build reason string
  const reasons: string[] = [];
  reasons.push(`Lowest capacity (${winner.capacityPercent}%)`);
  if (winner.specialismMatch) reasons.push("specialism match");
  else reasons.push("round robin");

  // Step 4: Update consultant
  await User.findByIdAndUpdate(winnerId, {
    $set: { "consultantProfile.lastAssignedAt": now },
    $inc: { "consultantProfile.totalLeadsAssigned": 1 },
  });

  return {
    consultantId: winnerId,
    consultantName: winnerName,
    reason: reasons.join(", "),
    skipped,
  };
}
