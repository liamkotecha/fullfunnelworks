import { differenceInDays } from "date-fns";

export type StalenessStatus = "active" | "nudge" | "stalled" | "at_risk" | "terminated";

export interface StalenessResult {
  status: StalenessStatus;
  daysSinceActivity: number;
  shouldNotifyConsultant: boolean;
}

export function calculateStaleness(
  lastActivityAt: Date,
  currentStaleness: StalenessStatus
): StalenessResult {
  if (currentStaleness === "terminated") {
    return {
      status: "terminated",
      daysSinceActivity: 0,
      shouldNotifyConsultant: false,
    };
  }

  const days = differenceInDays(new Date(), lastActivityAt);

  if (days >= 21)
    return {
      status: "at_risk",
      daysSinceActivity: days,
      shouldNotifyConsultant: true,
    };
  if (days >= 14)
    return {
      status: "stalled",
      daysSinceActivity: days,
      shouldNotifyConsultant: true,
    };
  if (days >= 7)
    return {
      status: "nudge",
      daysSinceActivity: days,
      shouldNotifyConsultant: false,
    };
  return {
    status: "active",
    daysSinceActivity: days,
    shouldNotifyConsultant: false,
  };
}
