export type ConsultantHealthStatus = "healthy" | "at_risk" | "churn_risk" | "new";

export interface ConsultantHealthInput {
  createdAt: Date;
  lastLoginAt: Date | null;
  activeClientCount: number;
  maxClients: number;
  subscription: {
    status: string;
    trialEnd: Date | null;
    cardExpMonth: number | null;
    cardExpYear: number | null;
  } | null;
  healthOverride?: "healthy" | null;
}

export interface ConsultantHealthResult {
  status: ConsultantHealthStatus;
  reasons: string[];
}

/**
 * Returns true if the card expires within the next `withinDays` days,
 * or is already expired. Returns false if expiry data is null.
 *
 * Stripe cardExpMonth is 1-indexed (1=Jan, 12=Dec). A card with
 * exp 03/2026 is valid through 31 March 2026; the first invalid day
 * is 01 April 2026 = new Date(2026, 3, 1) in JS (0-indexed months).
 */
export function isCardExpiringSoon(
  expMonth: number | null,
  expYear: number | null,
  withinDays = 30,
): boolean {
  if (expMonth === null || expYear === null) return false;
  // expMonth is 1-indexed; new Date(year, month, 1) gives first day of the
  // NEXT month because JS months are 0-indexed — exactly what we want.
  const firstInvalidDay = new Date(expYear, expMonth, 1);
  const cutoff = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000);
  return firstInvalidDay <= cutoff;
}

function daysSince(date: Date | null): number | null {
  if (!date) return null;
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function daysUntil(date: Date | null): number | null {
  if (!date) return null;
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/**
 * Pure function — no DB or Stripe calls. Pass all required data as arguments.
 * Returns a health status and human-readable reasons for display in tooltips.
 */
export function computeConsultantHealth(
  consultant: ConsultantHealthInput,
): ConsultantHealthResult {
  const {
    createdAt,
    lastLoginAt,
    activeClientCount,
    maxClients,
    subscription,
    healthOverride,
  } = consultant;

  const accountAgeDays = daysSince(createdAt) ?? 0;
  const loginAge = daysSince(lastLoginAt);
  const utilisation = maxClients > 0 ? activeClientCount / maxClients : 0;

  // Manual admin override — takes precedence over computed status
  if (healthOverride === "healthy") {
    return { status: "healthy", reasons: ["Manually marked healthy by admin"] };
  }

  // 1. NEW — always wins if account < 14 days; don't penalise onboarding lag
  if (accountAgeDays < 14) {
    return { status: "new", reasons: ["Account created less than 14 days ago"] };
  }

  const sub = subscription;
  const subStatus = sub?.status ?? null;
  const trialDaysLeft = daysUntil(sub?.trialEnd ?? null);

  const cardAlreadyExpired = isCardExpiringSoon(
    sub?.cardExpMonth ?? null,
    sub?.cardExpYear ?? null,
    0,
  );
  const cardExpiringSoon =
    !cardAlreadyExpired &&
    isCardExpiringSoon(sub?.cardExpMonth ?? null, sub?.cardExpYear ?? null, 30);

  // 2. CHURN_RISK
  const churnReasons: string[] = [];
  if (loginAge !== null && loginAge >= 22)
    churnReasons.push(`No login in ${loginAge} day${loginAge === 1 ? "" : "s"}`);
  if (subStatus === "past_due")
    churnReasons.push("Subscription payment failed");
  if (cardAlreadyExpired)
    churnReasons.push("Payment card has expired");
  if (
    subStatus === "active" &&
    activeClientCount === 0 &&
    accountAgeDays >= 14 &&
    loginAge !== null &&
    loginAge >= 14
  ) {
    churnReasons.push("Active subscription, 0 clients, no recent login — disengaged");
  }
  if (subStatus === "trialing" && trialDaysLeft !== null && trialDaysLeft <= 2) {
    churnReasons.push(
      `Trial ends in ${Math.max(0, trialDaysLeft)} day${trialDaysLeft === 1 ? "" : "s"} — no upgrade`,
    );
  }
  if (churnReasons.length > 0) return { status: "churn_risk", reasons: churnReasons };

  // 3. AT_RISK
  const riskReasons: string[] = [];
  if (loginAge !== null && loginAge >= 8 && loginAge <= 21)
    riskReasons.push(`Last login ${loginAge} day${loginAge === 1 ? "" : "s"} ago`);
  if (subStatus === "active" && activeClientCount === 0 && accountAgeDays >= 14)
    riskReasons.push("Active subscription but no clients yet");
  if (utilisation < 0.2 && maxClients > 0 && accountAgeDays >= 14)
    riskReasons.push(
      `Low utilisation — ${activeClientCount} of ${maxClients} client slot${maxClients === 1 ? "" : "s"} used`,
    );
  if (cardExpiringSoon) {
    const mm = String(sub!.cardExpMonth).padStart(2, "0");
    const yy = String(sub!.cardExpYear).slice(-2);
    riskReasons.push(`Payment card expiring ${mm}/${yy}`);
  }
  if (subStatus === "trialing" && trialDaysLeft !== null && trialDaysLeft > 2 && trialDaysLeft <= 5)
    riskReasons.push(`Trial ends in ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"}`);
  if (riskReasons.length > 0) return { status: "at_risk", reasons: riskReasons };

  // 4. HEALTHY
  return {
    status: "healthy",
    reasons: [
      loginAge !== null ? `Last login ${loginAge === 0 ? "today" : `${loginAge}d ago`}` : "Login activity normal",
      `${activeClientCount} active client${activeClientCount !== 1 ? "s" : ""}`,
      "Subscription in good standing",
    ],
  };
}
