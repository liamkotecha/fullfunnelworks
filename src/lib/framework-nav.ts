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
    // Short inputs (name, feature, role, etc.)
    if (
      fieldId.includes("-name") || fieldId.includes("-role") ||
      fieldId.includes("-feature") || fieldId.includes("outcome-") ||
      fieldId.startsWith("overview_") || fieldId.includes("kpi") ||
      fieldId.startsWith("proc_stage_")
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
