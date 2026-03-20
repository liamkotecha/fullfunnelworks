import type { ILeadScoreBreakdown } from "@/models/Prospect";

export interface LeadScoringInput {
  companySize?: string;
  revenueRange?: string;
  primaryChallenge?: string;
  message?: string;
  phone?: string;
  website?: string;
  hearAboutUs?: string;
}

const COMPANY_SIZE_SCORES: Record<string, number> = {
  "1-10": 5,
  "11-50": 10,
  "51-200": 18,
  "201-500": 22,
  "500+": 25,
};

const REVENUE_SCORES: Record<string, number> = {
  "pre-revenue": 0,
  "under-500k": 8,
  "500k-2m": 15,
  "2m-10m": 22,
  "10m+": 25,
};

const HIGH_VALUE_KEYWORDS = [
  "scale",
  "revenue",
  "growth",
  "sales",
  "gtm",
  "go-to-market",
  "process",
  "team",
  "hiring",
  "strategy",
];

/**
 * calculateLeadScore — scores a lead 0–100 based on qualification signals.
 *
 * Company size (0–25):
 *   1-10: 5 | 11-50: 10 | 51-200: 18 | 201-500: 22 | 500+: 25
 *
 * Revenue range (0–25):
 *   pre-revenue: 0 | under-500k: 8 | 500k-2m: 15 | 2m-10m: 22 | 10m+: 25
 *
 * Primary challenge (0–25):
 *   Any value provided: 15
 *   Matches high-value keywords: +10 (capped at 25)
 *
 * Completeness (0–25):
 *   Each present field adds 5: phone, website, hearAboutUs, message (>20 chars), primaryChallenge
 */
export function calculateLeadScore(input: LeadScoringInput): {
  breakdown: ILeadScoreBreakdown;
  total: number;
} {
  // Company size score (0-25)
  const companySizeScore = COMPANY_SIZE_SCORES[input.companySize ?? ""] ?? 0;

  // Revenue score (0-25)
  const revenueScore = REVENUE_SCORES[input.revenueRange ?? ""] ?? 0;

  // Challenge score (0-25)
  let challengeScore = 0;
  if (input.primaryChallenge && input.primaryChallenge.trim().length > 0) {
    challengeScore = 15;
    const lower = input.primaryChallenge.toLowerCase();
    if (HIGH_VALUE_KEYWORDS.some((kw) => lower.includes(kw))) {
      challengeScore = 25;
    }
  }

  // Completeness score (0-25)
  let completenessScore = 0;
  if (input.phone && input.phone.trim().length > 0) completenessScore += 5;
  if (input.website && input.website.trim().length > 0) completenessScore += 5;
  if (input.hearAboutUs && input.hearAboutUs.trim().length > 0) completenessScore += 5;
  if (input.message && input.message.trim().length > 20) completenessScore += 5;
  if (input.primaryChallenge && input.primaryChallenge.trim().length > 0) completenessScore += 5;

  const total = Math.min(
    companySizeScore + revenueScore + challengeScore + completenessScore,
    100
  );

  const breakdown: ILeadScoreBreakdown = {
    companySizeScore,
    revenueScore,
    challengeScore,
    completenessScore,
    total,
  };

  return { breakdown, total };
}
