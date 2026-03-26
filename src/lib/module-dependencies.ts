/**
 * Module dependency map.
 * Defines which modules depend on which, and detects misalignment
 * where a downstream module is significantly further ahead than its prerequisites.
 */

export type ModuleKey =
  | "assessment"
  | "people"
  | "product"
  | "process"
  | "gtm"
  | "revenue_execution"
  | "execution_planning"
  | "kpis"
  | "roadmap"
  | "modeller"
  | "hiring";

export interface ModuleDependency {
  /** The module that has the dependency */
  module: ModuleKey;
  /** Modules that should be completed before this one */
  dependsOn: ModuleKey[];
  /** Human-readable label */
  label: string;
}

export interface MisalignmentWarning {
  module: ModuleKey;
  moduleLabel: string;
  blockedBy: ModuleKey;
  blockedByLabel: string;
  modulePercent: number;
  blockedByPercent: number;
  severity: "warning" | "critical";
}

/** Threshold at which we flag misalignment: downstream is this many points ahead of a prerequisite */
const MISALIGNMENT_GAP = 30;
/** Threshold at which misalignment becomes critical */
const CRITICAL_GAP = 50;

const MODULE_LABELS: Record<ModuleKey, string> = {
  assessment: "Assessment",
  people: "People",
  product: "Product",
  process: "Process",
  gtm: "GTM Playbook",
  revenue_execution: "Revenue Execution",
  execution_planning: "Execution Planning",
  kpis: "KPIs",
  roadmap: "Roadmap",
  modeller: "Modeller",
  hiring: "Hiring Plan",
};

export const MODULE_DEPENDENCIES: ModuleDependency[] = [
  {
    module: "people",
    dependsOn: ["assessment"],
    label: MODULE_LABELS["people"],
  },
  {
    module: "product",
    dependsOn: ["assessment"],
    label: MODULE_LABELS["product"],
  },
  {
    module: "process",
    dependsOn: ["assessment", "product"],
    label: MODULE_LABELS["process"],
  },
  {
    module: "gtm",
    dependsOn: ["product", "process"],
    label: MODULE_LABELS["gtm"],
  },
  {
    module: "revenue_execution",
    dependsOn: ["gtm", "process"],
    label: MODULE_LABELS["revenue_execution"],
  },
  {
    module: "execution_planning",
    dependsOn: ["assessment", "people", "revenue_execution"],
    label: MODULE_LABELS["execution_planning"],
  },
  {
    module: "roadmap",
    dependsOn: ["execution_planning"],
    label: MODULE_LABELS["roadmap"],
  },
  {
    module: "hiring",
    dependsOn: ["people", "execution_planning"],
    label: MODULE_LABELS["hiring"],
  },
];

/**
 * Detects misalignment where a module is significantly ahead of its prerequisites.
 *
 * @param completionPercentages - Map of moduleKey → completion percentage (0–100)
 * @returns Array of misalignment warnings, sorted by severity (critical first)
 */
export function detectMisalignments(
  completionPercentages: Partial<Record<ModuleKey, number>>
): MisalignmentWarning[] {
  const warnings: MisalignmentWarning[] = [];

  for (const dep of MODULE_DEPENDENCIES) {
    const modulePercent = completionPercentages[dep.module] ?? 0;
    // Only flag if the downstream module has actually been started
    if (modulePercent === 0) continue;

    for (const prereq of dep.dependsOn) {
      const prereqPercent = completionPercentages[prereq] ?? 0;
      const gap = modulePercent - prereqPercent;

      if (gap >= MISALIGNMENT_GAP) {
        warnings.push({
          module: dep.module,
          moduleLabel: MODULE_LABELS[dep.module],
          blockedBy: prereq,
          blockedByLabel: MODULE_LABELS[prereq],
          modulePercent,
          blockedByPercent: prereqPercent,
          severity: gap >= CRITICAL_GAP ? "critical" : "warning",
        });
      }
    }
  }

  // Critical first, then by gap size descending
  return warnings.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "critical" ? -1 : 1;
    const gapA = a.modulePercent - a.blockedByPercent;
    const gapB = b.modulePercent - b.blockedByPercent;
    return gapB - gapA;
  });
}
