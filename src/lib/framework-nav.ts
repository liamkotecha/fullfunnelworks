/**
 * FRAMEWORK NAV CONFIG
 *
 * Maps every section and sub-section for sidebar navigation + progress tracking.
 * Field IDs reference concept-map.ts — this is the single source for nav structure.
 */

// ── Types ────────────────────────────────────────────────────

export type FieldStatus = "not_started" | "in_progress" | "complete";

export interface SubSection {
  id: string;
  label: string;
  /** All trackable field IDs within this sub-section */
  fieldIds: string[];
  /** Route path for navigation */
  href: string;
}

export interface NavSection {
  id: string;
  label: string;
  icon: string; // lucide icon name
  /** Sub-sections (empty array = flat section) */
  children: SubSection[];
  /** If flat section (no children), field IDs go here */
  fieldIds?: string[];
  /** Route when clicked — only used for flat sections */
  href?: string;
}

// ── Field ID helpers ─────────────────────────────────────────

function range(prefix: string, start: number, end: number): string[] {
  return Array.from({ length: end - start + 1 }, (_, i) => `${prefix}${start + i}`);
}

function withWeights(ids: string[]): string[] {
  return ids.flatMap((id) => [id, `${id}-weight`]);
}

// ── SWOT field IDs ───────────────────────────────────────────

// Only track textarea question IDs for progress (weights are supplementary)
const SWOT_STRENGTHS = range("swot-s", 1, 5);
const SWOT_WEAKNESSES = range("swot-w", 1, 5);
const SWOT_OPPORTUNITIES = range("swot-o", 1, 5);
const SWOT_THREATS = range("swot-t", 1, 5);
const SWOT_ALL = [...SWOT_STRENGTHS, ...SWOT_WEAKNESSES, ...SWOT_OPPORTUNITIES, ...SWOT_THREATS];

// ── MOST field IDs ───────────────────────────────────────────

const MOST_MISSION = range("most-m", 1, 5);
const MOST_OBJECTIVES = range("most-o", 1, 5);
const MOST_STRATEGY = range("most-s", 1, 5);
const MOST_TACTICS = range("most-t", 1, 5);
const MOST_ALL = [...MOST_MISSION, ...MOST_OBJECTIVES, ...MOST_STRATEGY, ...MOST_TACTICS];

// ── Leadership Questions ─────────────────────────────────────

const LEADERSHIP_ALL = range("lq-", 1, 10);

// ── Assessment Checklist (9 items) ───────────────────────────

const ASSESSMENT_CHECKLIST = Array.from({ length: 9 }, (_, i) => `assessment_checklist_${i}`);

// ── Gap Analysis (3 fields) ─────────────────────────────────

const GAP_ANALYSIS = ["gap-priority", "gap-impact", "gap-timeline"];

// ── People fields ────────────────────────────────────────────

const PEOPLE_CHECKLIST = Array.from({ length: 10 }, (_, i) => `people_checklist_${i}`);
const PEOPLE_TEAM = [
  "member-name", "member-role", "member-sales", "member-digital",
  "member-leadership", "member-training",
];

// ── Product fields ───────────────────────────────────────────

const PRODUCT_CHECKLIST = Array.from({ length: 10 }, (_, i) => `product_checklist_${i}`);
const PRODUCT_OUTCOME = ["outcome-feature", "outcome-problem", "outcome-outcome", "outcome-impact"];

// ── Process fields ───────────────────────────────────────────

const PROCESS_CHECKLIST = Array.from({ length: 12 }, (_, i) => `process_checklist_${i}`);
const SALES_METHODOLOGY = [
  ...range("discovery-q", 1, 3),
  ...range("impact-q", 1, 3),
  ...range("future-q", 1, 3),
  "proof-q1", "proof-q2",
  ...range("commitment-q", 1, 3),
];
const SALES_PROCESS = [
  "proc_stage_qualification_0", "proc_stage_qualification_1",
  "proc_stage_discovery_0", "proc_stage_discovery_1",
  "proc_stage_solution_0", "proc_stage_solution_1",
  "proc_stage_negotiation_0", "proc_stage_negotiation_1",
  "proc_stage_close_0", "proc_stage_close_1",
];

// ── Roadmap fields ───────────────────────────────────────────

const ROADMAP_ALL = range("roadmap_notes_", 1, 5);

// ── KPI fields ───────────────────────────────────────────────

const KPI_COMPANY = Array.from({ length: 5 }, (_, i) => [
  `company-kpi${i + 1}-name`, `company-kpi${i + 1}-outcome`,
]).flat();
const KPI_DEPT = Array.from({ length: 5 }, (_, i) => [
  `dept-kpi${i + 1}-name`, `dept-kpi${i + 1}-outcome`,
]).flat();
const KPI_ALL = [...KPI_COMPANY, ...KPI_DEPT];

// ── GTM fields ───────────────────────────────────────────────

function gtmRange(prefix: string, sections: number, questions: number): string[] {
  const ids: string[] = [];
  for (let s = 1; s <= sections; s++) {
    for (let q = 1; q <= questions; q++) {
      ids.push(`${prefix}-${s}-${q}`);
    }
  }
  return ids;
}

const GTM_COMPETITION = gtmRange("comp", 5, 5);
const GTM_MARKETPLACE_IDS = gtmRange("mkt", 5, 5);
const GTM_MARKETPLACE = GTM_MARKETPLACE_IDS.flatMap((id) => [`${id}-current`, `${id}-next`]);

// ── Overview fields ──────────────────────────────────────────

const OVERVIEW_FIELDS = [
  "overview_businessName", "overview_industry", "overview_yearFounded",
  "overview_revenue", "overview_target", "overview_topPriority",
];

// ── S2: Revenue Execution fields ─────────────────────────────

const S2_METHODOLOGY = [
  "s2-methodology-current", "s2-methodology-fit", "s2-methodology-journey", "s2-methodology-qual",
  ...["s2-methodology-m1", "s2-methodology-m2", "s2-methodology-m3", "s2-methodology-m4", "s2-methodology-m5"]
    .flatMap((id) => [`${id}-current`, `${id}-target`, `${id}-rag`, `${id}-owner`]),
  "s2-methodology-actions",
];

const S2_ADOPTION = [
  "s2-adoption-duration", "s2-adoption-coaching", "s2-adoption-leadership", "s2-adoption-reinforce",
  ...["s2-adoption-m1", "s2-adoption-m2", "s2-adoption-m3", "s2-adoption-m4", "s2-adoption-m5"]
    .flatMap((id) => [`${id}-current`, `${id}-target`, `${id}-rag`, `${id}-owner`]),
  "s2-adoption-actions",
];

const S2_OWNERSHIP = [
  "s2-ownership-matrix", "s2-ownership-escalation",
  ...["s2-ownership-m1", "s2-ownership-m2", "s2-ownership-m3"]
    .flatMap((id) => [`${id}-current`, `${id}-target`, `${id}-rag`, `${id}-owner`]),
];

const S2_CRM = [
  "s2-crm-platform", "s2-crm-quality", "s2-crm-fields", "s2-crm-dashboards",
  ...["s2-crm-m1", "s2-crm-m2", "s2-crm-m3", "s2-crm-m4"]
    .flatMap((id) => [`${id}-current`, `${id}-target`, `${id}-rag`, `${id}-owner`]),
  "s2-crm-actions",
];

const S2_CAMPAIGNS = [
  "s2-campaigns-calendar", "s2-campaigns-mql", "s2-campaigns-sql",
  "s2-campaigns-objective", "s2-campaigns-audience", "s2-campaigns-predicted",
  "s2-campaigns-actual", "s2-campaigns-review",
  ...["s2-campaigns-m1", "s2-campaigns-m2", "s2-campaigns-m3", "s2-campaigns-m4", "s2-campaigns-m5"]
    .flatMap((id) => [`${id}-current`, `${id}-target`, `${id}-rag`, `${id}-owner`]),
];

const S2_SCORECARD = [
  ...["s2-scorecard-fin1", "s2-scorecard-fin2", "s2-scorecard-fin3",
    "s2-scorecard-cust1", "s2-scorecard-cust2", "s2-scorecard-cust3",
    "s2-scorecard-proc1", "s2-scorecard-proc2",
    "s2-scorecard-ppl1", "s2-scorecard-ppl2"]
    .flatMap((id) => [`${id}-current`, `${id}-target`, `${id}-rag`]),
  "s2-scorecard-narrative",
];

const S2_QBR = [
  "s2-qbr-date", "s2-qbr-agenda", "s2-qbr-corrective-actions",
];

const S2_PEOPLE_CAP = [
  "s2-people-cap-framework", "s2-people-cap-succession", "s2-people-cap-gaps",
  ...["s2-people-cap-m1", "s2-people-cap-m2", "s2-people-cap-m3"]
    .flatMap((id) => [`${id}-current`, `${id}-target`, `${id}-rag`, `${id}-owner`]),
  "s2-people-cap-actions",
];

// ── S3: Execution Planning fields ────────────────────────────

const S3_PRIORITIES = [
  "s3-priorities-top5", "s3-priorities-qstart", "s3-priorities-qend", "s3-priorities-deps",
  ...["s3-priorities-m1", "s3-priorities-m2", "s3-priorities-m3"]
    .flatMap((id) => [`${id}-current`, `${id}-target`, `${id}-rag`, `${id}-owner`]),
];

const S3_90DAY = [
  "s3-90day-revenue-actions", "s3-90day-marketing-actions", "s3-90day-crm-actions",
  "s3-90day-people-actions", "s3-90day-proposition-actions",
  ...["s3-90day-m1", "s3-90day-m2", "s3-90day-m3"]
    .flatMap((id) => [`${id}-current`, `${id}-target`, `${id}-rag`, `${id}-owner`]),
];

const S3_ACCOUNTABILITY = [
  "s3-accountability-matrix",
  ...["s3-accountability-m1", "s3-accountability-m2", "s3-accountability-m3"]
    .flatMap((id) => [`${id}-current`, `${id}-target`, `${id}-rag`, `${id}-owner`]),
];

const S3_RISK = [
  "s3-risk-register", "s3-risk-resources",
  ...["s3-risk-m1", "s3-risk-m2"]
    .flatMap((id) => [`${id}-current`, `${id}-target`, `${id}-rag`, `${id}-owner`]),
];

const S3_GOVERNANCE = [
  "s3-governance-calendar", "s3-governance-rights", "s3-governance-agenda",
];

const S3_KPI_DASHBOARD = [
  "s3-kpi-dashboard-interventions",
];

const S3_RESET = [
  "s3-reset-summary", "s3-reset-lessons", "s3-reset-annual",
  ...["s3-reset-m1", "s3-reset-m2", "s3-reset-m3"]
    .flatMap((id) => [`${id}-current`, `${id}-target`, `${id}-rag`, `${id}-owner`]),
];

// ── Nav tree ─────────────────────────────────────────────────

export const FRAMEWORK_NAV: NavSection[] = [
  {
    id: "overview",
    label: "Overview",
    icon: "LayoutDashboard",
    children: [],
    fieldIds: OVERVIEW_FIELDS,
    href: "/portal/overview",
  },
  {
    id: "assessment",
    label: "Assessment",
    icon: "Search",
    children: [
      {
        id: "assessment-checklist",
        label: "Assessment Checklist",
        fieldIds: ASSESSMENT_CHECKLIST,
        href: "/portal/assessment/checklist",
      },
      {
        id: "assessment-swot",
        label: "SWOT Analysis",
        fieldIds: SWOT_ALL,
        href: "/portal/assessment/swot",
      },
      {
        id: "assessment-most",
        label: "MOST Analysis",
        fieldIds: MOST_ALL,
        href: "/portal/assessment/most",
      },
      {
        id: "assessment-gap",
        label: "Gap Analysis",
        fieldIds: GAP_ANALYSIS,
        href: "/portal/assessment/gap",
      },
      {
        id: "assessment-leadership",
        label: "Leadership Questions",
        fieldIds: LEADERSHIP_ALL,
        href: "/portal/assessment/leadership",
      },
    ],
  },
  {
    id: "people",
    label: "People",
    icon: "Users",
    children: [
      {
        id: "people-team",
        label: "Team Members",
        fieldIds: ["team-members"],
        href: "/portal/people/team",
      },
      {
        id: "people-structure",
        label: "Company Structure",
        fieldIds: ["company-structure"],
        href: "/portal/people/structure",
      },
      {
        id: "people-challenges",
        label: "Challenges & Strategy",
        fieldIds: PEOPLE_CHECKLIST,
        href: "/portal/people/challenges",
      },
      {
        id: "people-methodology",
        label: "Team Capability Tracker",
        fieldIds: ["team-capability"],
        href: "/portal/people/methodology",
      },
    ],
  },
  {
    id: "product",
    label: "Product",
    icon: "Target",
    children: [
      {
        id: "product-challenges",
        label: "Product Challenges",
        fieldIds: PRODUCT_CHECKLIST,
        href: "/portal/product/challenges",
      },
      {
        id: "product-outcomes",
        label: "Outcome Mapper",
        fieldIds: PRODUCT_OUTCOME,
        href: "/portal/product/outcomes",
      },
    ],
  },
  {
    id: "process",
    label: "Process",
    icon: "Settings",
    children: [
      {
        id: "process-checklist",
        label: "Process Checklist",
        fieldIds: PROCESS_CHECKLIST,
        href: "/portal/process/checklist",
      },
      {
        id: "process-methodology",
        label: "Sales Methodology",
        fieldIds: SALES_METHODOLOGY,
        href: "/portal/process/methodology",
      },
      {
        id: "process-builder",
        label: "Sales Process Builder",
        fieldIds: SALES_PROCESS,
        href: "/portal/process/builder",
      },
    ],
  },
  {
    id: "roadmap",
    label: "Roadmap",
    icon: "MapPin",
    children: [],
    fieldIds: ROADMAP_ALL,
    href: "/portal/roadmap",
  },
  {
    id: "kpis",
    label: "KPIs",
    icon: "BarChart3",
    children: [],
    fieldIds: KPI_ALL,
    href: "/portal/kpis",
  },
  {
    id: "gtm",
    label: "GTM Playbook",
    icon: "Map",
    children: [
      {
        id: "gtm-market",
        label: "Market Intelligence",
        fieldIds: GTM_MARKETPLACE,
        href: "/portal/gtm/market",
      },
      {
        id: "gtm-competition",
        label: "Competition",
        fieldIds: GTM_COMPETITION,
        href: "/portal/gtm/competition",
      },
    ],
  },
  {
    id: "revenue_execution",
    label: "Revenue Execution",
    icon: "TrendingUp",
    children: [
      {
        id: "revenue_execution-methodology",
        label: "Sales Methodology",
        fieldIds: S2_METHODOLOGY,
        href: "/portal/revenue-execution/methodology",
      },
      {
        id: "revenue_execution-adoption",
        label: "Adoption & Embedding",
        fieldIds: S2_ADOPTION,
        href: "/portal/revenue-execution/adoption",
      },
      {
        id: "revenue_execution-ownership",
        label: "Commercial Ownership",
        fieldIds: S2_OWNERSHIP,
        href: "/portal/revenue-execution/ownership",
      },
      {
        id: "revenue_execution-crm",
        label: "CRM & Revenue Process",
        fieldIds: S2_CRM,
        href: "/portal/revenue-execution/crm",
      },
      {
        id: "revenue_execution-campaigns",
        label: "Campaign Performance",
        fieldIds: S2_CAMPAIGNS,
        href: "/portal/revenue-execution/campaigns",
      },
      {
        id: "revenue_execution-scorecard",
        label: "Balanced Scorecard",
        fieldIds: S2_SCORECARD,
        href: "/portal/revenue-execution/scorecard",
      },
      {
        id: "revenue_execution-qbr",
        label: "QBR & Annual Reset",
        fieldIds: S2_QBR,
        href: "/portal/revenue-execution/qbr",
      },
      {
        id: "revenue_execution-people-cap",
        label: "People & Capability",
        fieldIds: S2_PEOPLE_CAP,
        href: "/portal/revenue-execution/people-capability",
      },
    ],
  },
  {
    id: "execution_planning",
    label: "Execution Planning",
    icon: "ClipboardCheck",
    children: [
      {
        id: "execution_planning-priorities",
        label: "Priority Setting",
        fieldIds: S3_PRIORITIES,
        href: "/portal/execution-planning/priorities",
      },
      {
        id: "execution_planning-90day",
        label: "90-Day Action Plans",
        fieldIds: S3_90DAY,
        href: "/portal/execution-planning/90-day",
      },
      {
        id: "execution_planning-accountability",
        label: "Accountability",
        fieldIds: S3_ACCOUNTABILITY,
        href: "/portal/execution-planning/accountability",
      },
      {
        id: "execution_planning-risk",
        label: "Risk & Dependencies",
        fieldIds: S3_RISK,
        href: "/portal/execution-planning/risk",
      },
      {
        id: "execution_planning-governance",
        label: "Governance",
        fieldIds: S3_GOVERNANCE,
        href: "/portal/execution-planning/governance",
      },
      {
        id: "execution_planning-kpi-dashboard",
        label: "KPI Dashboard",
        fieldIds: S3_KPI_DASHBOARD,
        href: "/portal/execution-planning/kpi-dashboard",
      },
      {
        id: "execution_planning-reset",
        label: "Quarterly Reset",
        fieldIds: S3_RESET,
        href: "/portal/execution-planning/reset",
      },
    ],
  },
];

// ── Utility fns ──────────────────────────────────────────────

/** Get all field IDs for a section (children + own) */
export function getSectionFieldIds(sectionId: string): string[] {
  const section = FRAMEWORK_NAV.find((s) => s.id === sectionId);
  if (!section) return [];
  if (section.children.length === 0) return section.fieldIds ?? [];
  return section.children.flatMap((c) => c.fieldIds);
}

/** Get all field IDs for a sub-section (cached) */
const _subSectionCache = new Map<string, string[]>();
export function getSubSectionFieldIds(subSectionId: string): string[] {
  const cached = _subSectionCache.get(subSectionId);
  if (cached) return cached;

  for (const section of FRAMEWORK_NAV) {
    const child = section.children.find((c) => c.id === subSectionId);
    if (child) {
      _subSectionCache.set(subSectionId, child.fieldIds);
      return child.fieldIds;
    }
    // Flat sections use {id}-{id} pattern (e.g. "roadmap-roadmap")
    if (
      section.children.length === 0 &&
      subSectionId === `${section.id}-${section.id}` &&
      section.fieldIds
    ) {
      _subSectionCache.set(subSectionId, section.fieldIds);
      return section.fieldIds;
    }
  }
  _subSectionCache.set(subSectionId, []);
  return [];
}

/** Get all field IDs across the entire framework (cached at module level) */
let _allFieldIdsCache: string[] | null = null;
export function getAllFieldIds(): string[] {
  if (!_allFieldIdsCache) {
    _allFieldIdsCache = FRAMEWORK_NAV.flatMap((s) => getSectionFieldIds(s.id));
  }
  return _allFieldIdsCache;
}

/**
 * Check if a field value counts as "answered" per the UX brief rules.
 */
export function isFieldAnswered(fieldId: string, value: unknown): boolean {
  if (value === null || value === undefined) return false;

  // Checkbox / boolean
  if (typeof value === "boolean") return value;

  // Number
  if (typeof value === "number") return !isNaN(value);

  // String
  if (typeof value === "string") {
    const trimmed = value.trim();
    // Weight selects (SWOT) — just needs a value
    if (fieldId.endsWith("-weight")) return trimmed.length > 0;
    // Checklist items — boolean-like
    if (fieldId.includes("_checklist_")) return trimmed.length > 0;
    // S2/S3 select fields — just needs a value
    if (
      fieldId.startsWith("s2-") && (fieldId.endsWith("-current") || fieldId.endsWith("-fit") ||
        fieldId.endsWith("-duration") || fieldId.endsWith("-coaching") || fieldId.endsWith("-platform") ||
        fieldId.endsWith("-quality") || fieldId.endsWith("-mql") || fieldId.endsWith("-sql") ||
        fieldId.endsWith("-framework") || fieldId.endsWith("-succession") ||
        fieldId.endsWith("-rag") || fieldId.endsWith("-owner"))
    ) return trimmed.length > 0;
    if (
      fieldId.startsWith("s3-") && (fieldId.endsWith("-rag") || fieldId.endsWith("-owner") ||
        fieldId.endsWith("-current") || fieldId.endsWith("-target"))
    ) return trimmed.length > 0;
    // S2/S3 JSON table fields (actions, matrices, registers)
    if (fieldId.endsWith("-actions") || fieldId.endsWith("-matrix") ||
        fieldId.endsWith("-register") || fieldId.endsWith("-calendar") ||
        fieldId.endsWith("-interventions") || fieldId.endsWith("-corrective-actions")) {
      return trimmed.length > 2; // must be valid JSON or non-empty
    }
    // Short inputs (name, feature, role, etc.)
    if (
      fieldId.includes("-name") || fieldId.includes("-role") ||
      fieldId.includes("-feature") || fieldId.includes("outcome-") ||
      fieldId.startsWith("overview_") || fieldId.includes("kpi") ||
      fieldId.startsWith("proc_stage_") ||
      fieldId.endsWith("-date") || fieldId.endsWith("-qstart") || fieldId.endsWith("-qend")
    ) {
      return trimmed.length >= 1;
    }
    // Textarea fields — need ≥ 3 chars
    return trimmed.length >= 3;
  }

  return false;
}

/**
 * Calculate progress for a set of field IDs against a responses map.
 */
export function calculateProgress(
  fieldIds: string[],
  responses: Record<string, unknown>
): { answered: number; total: number; percent: number } {
  const total = fieldIds.length;
  if (total === 0) return { answered: 0, total: 0, percent: 0 };
  const answered = fieldIds.filter((id) => isFieldAnswered(id, responses[id])).length;
  const percent = Math.round((answered / total) * 100);
  return { answered, total, percent };
}

/**
 * Get the status for a progress percentage.
 */
export function progressToStatus(percent: number): FieldStatus {
  if (percent >= 100) return "complete";
  if (percent > 0) return "in_progress";
  return "not_started";
}

/**
 * Build full progress map for all sections and sub-sections.
 */
export function buildProgressMap(responses: Record<string, unknown>) {
  const map: Record<string, { answered: number; total: number; percent: number; status: FieldStatus }> = {};

  for (const section of FRAMEWORK_NAV) {
    // Section-level (aggregate)
    const sectionFieldIds = getSectionFieldIds(section.id);
    const sectionProgress = calculateProgress(sectionFieldIds, responses);
    map[section.id] = { ...sectionProgress, status: progressToStatus(sectionProgress.percent) };

    // Sub-section level
    for (const child of section.children) {
      const childProgress = calculateProgress(child.fieldIds, responses);
      map[child.id] = { ...childProgress, status: progressToStatus(childProgress.percent) };
    }
  }

  return map;
}
