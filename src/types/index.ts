import type { SectionId } from "@/lib/concept-map";

// ── Auth ─────────────────────────────────────────────────────

export type UserRole = "admin" | "consultant" | "client";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// ── Client ────────────────────────────────────────────────────

export type ClientStatus = "invited" | "onboarding" | "active" | "paused";

export interface ClientDTO {
  _id: string;
  id: string;
  businessName: string;
  status: ClientStatus;
  email: string;
  name: string;
  notes?: string;
  assignedConsultant?: { _id: string; name: string; email: string } | null;
  onboardingCompletedAt?: string | null;
  overallProgress?: number;
  // Contact details
  contactName?: string;
  jobTitle?: string;
  contactEmail?: string;
  phone?: string;
  invoicingEmail?: string;
  website?: string;
  // Address
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Modules ───────────────────────────────────────────────────

export type ModuleId =
  | "assessment"
  | "people"
  | "product"
  | "process"
  | "roadmap"
  | "kpis"
  | "gtm"
  | "modeller"
  | "hiring"
  | "revenue_execution"
  | "execution_planning";

export type StalenessStatus = "active" | "nudge" | "stalled" | "at_risk" | "terminated";

// ── Invoice ───────────────────────────────────────────────────

export type PaymentModel = "upfront" | "on_completion" | "milestone";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "void";

export interface InvoiceClientInfo {
  businessName?: string;
  contactName?: string;
  contactEmail?: string;
  invoicingEmail?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  country?: string;
}

export interface InvoiceDTO {
  id: string;
  clientId: string;
  clientName?: string;
  client?: InvoiceClientInfo;
  projectId: string;
  moduleId?: string;
  title: string;
  description?: string;
  amountPence: number;
  amountFormatted: string;
  status: InvoiceStatus;
  paymentModel: PaymentModel;
  gracePeriodDays?: number;
  gracePeriodEndsAt?: string | null;
  stripePaymentUrl?: string | null;
  paidAt?: string | null;
  sentAt?: string | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const INVOICE_STATUS_META: Record<InvoiceStatus, { label: string; badge: string }> = {
  draft:   { label: "Draft",   badge: "neutral" },
  sent:    { label: "Sent",    badge: "warning" },
  paid:    { label: "Paid",    badge: "success" },
  overdue: { label: "Overdue", badge: "error" },
  void:    { label: "Void",    badge: "neutral" },
};

export const PAYMENT_MODEL_META: Record<PaymentModel, { label: string; description: string }> = {
  upfront:       { label: "Upfront",       description: "Module locked until paid" },
  on_completion: { label: "On completion", description: "Module unlocked, due on completion" },
  milestone:     { label: "Milestone",     description: "Module unlocked with grace period" },
};

export const MODULE_META: Record<ModuleId, { label: string; description: string; icon: string }> = {
  assessment:          { label: "Assessment",            description: "SWOT, MOST, Gap Analysis and Leadership review", icon: "Search" },
  people:              { label: "People",                description: "Team structure, challenges and capability mapping", icon: "Users" },
  product:             { label: "Product",               description: "Product challenges and outcome mapping", icon: "Target" },
  process:             { label: "Process",               description: "Sales process, methodology and checklist", icon: "Settings" },
  roadmap:             { label: "Roadmap",               description: "Strategic milestones and 90-day planning", icon: "MapPin" },
  kpis:                { label: "KPIs",                  description: "Key performance indicators and tracking", icon: "BarChart3" },
  gtm:                 { label: "GTM Playbook",          description: "Market intelligence and competitive analysis", icon: "Map" },
  modeller:            { label: "Financial Modeller",    description: "P&L scenario modelling and forecasting", icon: "Calculator" },
  hiring:              { label: "Hiring Plan",           description: "12-month hiring plan with financial impact", icon: "UserPlus" },
  revenue_execution:   { label: "Revenue Execution",     description: "Sales methodology adoption, CRM discipline and balanced scorecard", icon: "TrendingUp" },
  execution_planning:  { label: "Execution Planning",    description: "90-day action plans, accountability and governance", icon: "ClipboardCheck" },
};

// ── Project ───────────────────────────────────────────────────

export type ProjectStatus = "not_started" | "in_progress" | "blocked" | "completed";

export interface BlockDTO {
  _id: string;
  reason: string;
  raisedAt: string;
  resolvedAt?: string | null;
}

export interface MilestoneDTO {
  _id: string;
  title: string;
  dueDate?: string | null;
  completedAt?: string | null;
}

export interface ProjectDTO {
  _id: string;
  id: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  blocks: BlockDTO[];
  package: string;
  milestones: MilestoneDTO[];
  assignedTo?: { _id: string; name: string } | null;
  clientId: string | { _id: string; businessName: string };
  clientName?: string;
  dueDate?: string | null;
  activeModules: ModuleId[];
  projectPrincipal?: { name: string; email: string; role?: string } | null;
  lastActivityAt: string;
  staleness: StalenessStatus;
  terminatedAt?: string | null;
  terminatedReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Intake ────────────────────────────────────────────────────

export interface IntakeResponseDTO {
  _id: string;
  clientId: string;
  completedBy: "client" | "admin";
  responses: Record<string, unknown>;
  sectionProgress: Record<SectionId, boolean>;
  submittedAt?: string | null;
  lastSavedAt?: string | null;
}

// ── Consultant Notes ──────────────────────────────────────────

export interface ConsultantNoteDTO {
  fieldId: string;
  note: string;
  updatedAt: string;
}

// ── Toast ─────────────────────────────────────────────────────

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration?: number;
}

// ── Pagination ────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ── API ───────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  details?: unknown;
}

// ── Onboarding Wizard ─────────────────────────────────────────

export type OnboardingStep = "invite" | "intake" | "package" | "review";

export const ONBOARDING_STEPS: { id: OnboardingStep; label: string; description: string }[] = [
  { id: "invite",  label: "Invite Client",    description: "Send onboarding invitation" },
  { id: "intake",  label: "Complete Intake",  description: "Fill the growth strategy form" },
  { id: "package", label: "Assign Package",   description: "Select consulting package" },
  { id: "review",  label: "Review & Confirm", description: "Confirm and save" },
];

// ── Consulting Packages ───────────────────────────────────────

export const CONSULTING_PACKAGES = [
  { id: "growth-starter",    name: "Growth Starter",    description: "90-day foundation programme for early-stage SMBs" },
  { id: "scale-accelerator", name: "Scale Accelerator", description: "6-month full funnel transformation" },
  { id: "enterprise-growth", name: "Enterprise Growth", description: "12-month comprehensive capability build" },
  { id: "advisory-retainer", name: "Advisory Retainer", description: "Ongoing monthly strategic advisory" },
] as const;

export type PackageId = typeof CONSULTING_PACKAGES[number]["id"];

// ── Project Status Labels ─────────────────────────────────────

export const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; color: string; badge: string }> = {
  not_started: { label: "Not Started",  color: "gray",    badge: "neutral" },
  in_progress:  { label: "In Progress", color: "blue",    badge: "info" },
  blocked:      { label: "Blocked",     color: "red",     badge: "error" },
  completed:    { label: "Completed",   color: "emerald", badge: "success" },
};

export const CLIENT_STATUS_META: Record<ClientStatus, { label: string; badge: string; pill: string; dot: string }> = {
  invited:     { label: "Invited",     badge: "info",    pill: "bg-sky-50 text-sky-700",     dot: "bg-sky-400" },
  onboarding:  { label: "Onboarding",  badge: "warning", pill: "bg-amber-50 text-amber-700",  dot: "bg-amber-400" },
  active:      { label: "Active",      badge: "success", pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  paused:      { label: "Paused",      badge: "neutral", pill: "bg-slate-100 text-slate-500",  dot: "bg-slate-400" },
};

// ── Prospect / CRM ───────────────────────────────────────────

export type ProspectStage = "mql" | "sql" | "discovery" | "proposal" | "negotiating" | "won" | "lost";
export type LeadSource = "web_form" | "manual" | "referral" | "event" | "other";

export interface ProspectDTO {
  id: string;
  businessName: string;
  contactName: string;
  contactEmail: string;
  phone?: string;
  website?: string;
  companySize?: string;
  revenueRange?: string;
  primaryChallenge?: string;
  hearAboutUs?: string;
  message?: string;
  stage: ProspectStage;
  dealValue?: number;
  dealValueFormatted?: string;
  lostReason?: string;
  assignedConsultant?: { id: string; name: string; email: string } | null;
  leadScore: number;
  leadScoreBreakdown: {
    companySizeScore: number;
    revenueScore: number;
    challengeScore: number;
    completenessScore: number;
    total: number;
  };
  source: LeadSource;
  gaClientId?: string;
  qualifiedAt?: string | null;
  proposalSentAt?: string | null;
  wonAt?: string | null;
  convertedAt?: string | null;
  clientId?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  daysInStage: number;
  activityLog?: ActivityLogEntryDTO[];
  tasks?: ProspectTaskDTO[];
  stageEnteredAt?: Record<string, string>;
}

export interface ActivityLogEntryDTO {
  _id: string;
  type: "stage_change" | "note" | "assignment" | "system";
  message: string;
  createdBy?: { _id: string; name: string } | null;
  createdAt: string;
}

export interface ProspectTaskDTO {
  _id: string;
  title: string;
  dueDate?: string | null;
  assignedTo?: { _id: string; name: string } | null;
  completedAt?: string | null;
  createdAt: string;
}

export const PROSPECT_STAGE_META: Record<ProspectStage, { label: string; colour: string }> = {
  mql:         { label: "MQL",         colour: "blue" },
  sql:         { label: "SQL",         colour: "indigo" },
  discovery:   { label: "Discovery",   colour: "purple" },
  proposal:    { label: "Proposal",    colour: "amber" },
  negotiating: { label: "Negotiating", colour: "orange" },
  won:         { label: "Won",         colour: "green" },
  lost:        { label: "Lost",        colour: "gray" },
};

// ── Settings ──────────────────────────────────────────────────

export interface GA4EventConfigDTO {
  leadReceived: boolean;
  leadQualified: boolean;
  proposalSent: boolean;
  dealWon: boolean;
  dealLost: boolean;
  clientConverted: boolean;
  assessmentStarted: boolean;
  sectionCompleted: boolean;
  moduleCompleted: boolean;
  invoicePaid: boolean;
  reportDownloaded: boolean;
}

export interface SettingsDTO {
  leadNotificationEmail?: string;
  autoResponseReplyTo?: string;
  calendlyUrl?: string;
  autoAssignEnabled: boolean;
  ga4MeasurementId?: string;
  ga4ApiSecret?: string;
  ga4Enabled: boolean;
  ga4TrackedEvents: GA4EventConfigDTO;
}

// ── Consultant Capacity ───────────────────────────────────────

export interface PlanDTO {
  id: string;
  name: string;
  description?: string | null;
  monthlyPricePence: number;
  annualPricePence: number;
  maxActiveClients: number;
  maxProjectsPerClient: number;
  allowedModules: ModuleId[];
  trialDays: number;
  isActive: boolean;
  consultantCount: number;
  createdAt: string;
}

export interface PlanSummaryDTO {
  id: string;
  name: string;
  maxActiveClients: number;
  maxProjectsPerClient: number;
  allowedModules: ModuleId[];
  trialDays: number;
  monthlyPricePence: number;
  annualPricePence: number;
}

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "paused";

export interface SubscriptionDTO {
  id: string;
  consultantId: string;
  consultantName: string;
  consultantEmail: string;
  planId: string;
  planName: string;
  monthlyPricePence: number;
  mrrPence?: number;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  canceledAt: string | null;
  stripeSubscriptionId: string | null;
  notes: string | null;
  createdAt: string;
}

export interface ConsultantProfileDTO {
  maxActiveClients: number;
  currentActiveClients: number;
  capacityPercent: number;
  specialisms: string[];
  allowedModules?: ModuleId[];
  activeClientCount?: number;
  subscriptionStatus?: string | null;
  planName?: string | null;
  // Plan info (populated from Plan doc)
  plan: PlanSummaryDTO | null;
  planStartedAt?: string | null;
  trialEndsAt?: string | null;
  // Availability/scheduling
  availabilityStatus?: string;
  holidayUntil?: string | null;
  roundRobinWeight?: number;
  // Subscription card + status (for health scoring)
  subscription?: {
    id?: string;
    status: string;
    cardExpMonth: number | null;
    cardExpYear: number | null;
    trialEndsAt: string | null;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
    canceledAt?: string | null;
    notes?: string | null;
    stripeSubscriptionId?: string | null;
    lastPaymentError?: {
      code: string;
      message: string;
      failedAt: string;
    } | null;
  } | null;
  // Admin health override
  healthOverride?: "healthy" | null;
  healthOverrideNote?: string | null;
  healthOverrideAt?: string | null;
}

export interface ConsultantDTO {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  lastLoginAt: string | null;
  loginHistory?: string[];
  profile: ConsultantProfileDTO;
}

// ── Assignment Log ────────────────────────────────────────────

// ── Consultant Health ─────────────────────────────────────────

export type ConsultantHealthStatus = "healthy" | "at_risk" | "churn_risk" | "new";

export type AdminEmailType = "payment_reminder" | "check_in" | "upgrade_nudge";

export interface AdminEmailDTO {
  id: string;
  consultantId: string;
  emailType: AdminEmailType;
  subject: string;
  body: string;
  sentAt: string;
  createdAt: string;
}

// ── Assignment Log ────────────────────────────────────────────

export interface AssignmentLogDTO {
  id: string;
  prospectId: string;
  prospectName?: string;
  assignedTo?: string | null;
  assignedToName?: string | null;
  reason: string;
  skipped: { consultantId: string; name: string; reason: string }[];
  autoAssigned: boolean;
  createdAt: string;
}
