# Project Audit
Generated: 2026-03-03 21:44:44

## Quick reference
- Framework: Next.js 14.2.29
- Database: Mongoose ^8.4.0
- Auth: next-auth ^5.0.0-beta.19
- Stripe: NOT FOUND
- Framer Motion: ^11.2.10
- Total models found: 9
- Total API routes found: 25
- Has middleware: YES
- Has tailwind config: YES
- Colour tokens in tailwind: navy, cream, brand (blue, pink, green), gold, slate (portal)

---

### 1. Full file tree
```
./postcss.config.js
./scripts/seed-questions.ts
./scripts/seed.ts
./src/app/(admin)/admin/clients/[id]/activity/page.tsx
./src/app/(admin)/admin/clients/[id]/financial-model/page.tsx
./src/app/(admin)/admin/clients/[id]/hiring-plan/page.tsx
./src/app/(admin)/admin/clients/[id]/kpis/page.tsx
./src/app/(admin)/admin/clients/[id]/layout.tsx
./src/app/(admin)/admin/clients/[id]/onboarding/page.tsx
./src/app/(admin)/admin/clients/[id]/page.tsx
./src/app/(admin)/admin/clients/[id]/responses/page.tsx
./src/app/(admin)/admin/clients/[id]/roadmap/page.tsx
./src/app/(admin)/admin/clients/page.tsx
./src/app/(admin)/admin/dashboard/page.tsx
./src/app/(admin)/admin/page.tsx
./src/app/(admin)/admin/projects/[id]/page.tsx
./src/app/(admin)/admin/projects/page.tsx
./src/app/(admin)/admin/questions/page.tsx
./src/app/(admin)/admin/settings/page.tsx
./src/app/(admin)/admin/voice-preview/page.tsx
./src/app/(admin)/layout.tsx
./src/app/(auth)/layout.tsx
./src/app/(auth)/login/page.tsx
./src/app/(auth)/verify/page.tsx
./src/app/(portal)/layout.tsx
./src/app/(portal)/portal/assessment/checklist/page.tsx
./src/app/(portal)/portal/assessment/gap/page.tsx
./src/app/(portal)/portal/assessment/leadership/page.tsx
./src/app/(portal)/portal/assessment/most/page.tsx
./src/app/(portal)/portal/assessment/page.tsx
./src/app/(portal)/portal/assessment/swot/page.tsx
./src/app/(portal)/portal/dashboard/page.tsx
./src/app/(portal)/portal/gtm/competition/page.tsx
./src/app/(portal)/portal/gtm/market/page.tsx
./src/app/(portal)/portal/gtm/page.tsx
./src/app/(portal)/portal/intake/page.tsx
./src/app/(portal)/portal/kpis/page.tsx
./src/app/(portal)/portal/modeller/hiring/page.tsx
./src/app/(portal)/portal/modeller/page.tsx
./src/app/(portal)/portal/overview/page.tsx
./src/app/(portal)/portal/page.tsx
./src/app/(portal)/portal/people/challenges/page.tsx
./src/app/(portal)/portal/people/methodology/page.tsx
./src/app/(portal)/portal/people/page.tsx
./src/app/(portal)/portal/people/process-builder/page.tsx
./src/app/(portal)/portal/people/structure/page.tsx
./src/app/(portal)/portal/people/team/page.tsx
./src/app/(portal)/portal/process/builder/page.tsx
./src/app/(portal)/portal/process/checklist/page.tsx
./src/app/(portal)/portal/process/methodology/page.tsx
./src/app/(portal)/portal/process/page.tsx
./src/app/(portal)/portal/product/challenges/page.tsx
./src/app/(portal)/portal/product/outcomes/page.tsx
./src/app/(portal)/portal/product/page.tsx
./src/app/(portal)/portal/roadmap/page.tsx
./src/app/api/admin/questions/[id]/route.ts
./src/app/api/admin/questions/reorder/route.ts
./src/app/api/admin/questions/route.ts
./src/app/api/auth/otp/send/route.ts
./src/app/api/auth/otp/verify/route.ts
./src/app/api/auth/passkey/authenticate/route.ts
./src/app/api/auth/passkey/register/route.ts
./src/app/api/auth/passkey/verify/route.ts
./src/app/api/clients/[id]/route.ts
./src/app/api/clients/[id]/session/route.ts
./src/app/api/clients/route.ts
./src/app/api/clients/search/route.ts
./src/app/api/hiring-plan/route.ts
./src/app/api/intake/route.ts
./src/app/api/me/client/route.ts
./src/app/api/modeller/base/route.ts
./src/app/api/modeller/scenarios/[id]/route.ts
./src/app/api/modeller/scenarios/route.ts
./src/app/api/projects/[id]/route.ts
./src/app/api/projects/route.ts
./src/app/api/questions/route.ts
./src/app/api/responses/[clientId]/[section]/[sub]/route.ts
./src/app/api/responses/[clientId]/route.ts
./src/app/api/tts/route.ts
./src/app/layout.tsx
./src/app/page.tsx
./src/components/Providers.tsx
./src/components/admin/GlobalSearch.tsx
./src/components/admin/NotificationsButton.tsx
./src/components/framework/AccordionPhase.tsx
./src/components/framework/AutosaveField.tsx
./src/components/framework/CompletionBurst.tsx
./src/components/framework/EmptyState.tsx
./src/components/framework/FieldCard.tsx
./src/components/framework/FrameworkMap.tsx
./src/components/framework/PaginatedQuestions.tsx
./src/components/framework/QuadrantTabs.tsx
./src/components/framework/ResumeCard.tsx
./src/components/framework/SectionGuidance.tsx
./src/components/framework/SectionHolding.tsx
./src/components/framework/SectionProgressHeader.tsx
./src/components/framework/StepperNav.tsx
./src/components/framework/SuggestedNextStep.tsx
./src/components/framework/TtsButton.tsx
./src/components/framework/WhatsNext.tsx
./src/components/framework/index.ts
./src/components/hiring/BasePLPanel.tsx
./src/components/hiring/HireCard.tsx
./src/components/hiring/KPIStrip.tsx
./src/components/hiring/views/BreakEvenView.tsx
./src/components/hiring/views/HeadcountView.tsx
./src/components/hiring/views/PLWaterfallView.tsx
./src/components/layout/AdminShell.tsx
./src/components/layout/AdminSidebar.tsx
./src/components/layout/FrameworkSidebar.tsx
./src/components/layout/PortalShell.tsx
./src/components/layout/Sidebar.tsx
./src/components/layout/TopBar.tsx
./src/components/modeller/CompareTable.tsx
./src/components/modeller/ImpactPanel.tsx
./src/components/modeller/KPIStrip.tsx
./src/components/modeller/ModellerInput.tsx
./src/components/modeller/OverheadsSection.tsx
./src/components/modeller/PLSummary.tsx
./src/components/modeller/PeopleSection.tsx
./src/components/modeller/RevenueSection.tsx
./src/components/modeller/ScenarioCard.tsx
./src/components/modeller/WaterfallChart.tsx
./src/components/notifications/ToastContext.tsx
./src/components/notifications/Toaster.tsx
./src/components/notifications/ToasterDisplay.tsx
./src/components/portal/PortalSearch.tsx
./src/components/ui/Badge.tsx
./src/components/ui/Button.tsx
./src/components/ui/DataTable.tsx
./src/components/ui/Input.tsx
./src/components/ui/Modal.tsx
./src/components/ui/NumberRadixSlider.tsx
./src/components/ui/Skeleton.tsx
./src/context/ProgressContext.tsx
./src/hooks/useHiringPlan.ts
./src/hooks/useModellerAutosave.ts
./src/hooks/usePortalClient.ts
./src/hooks/useQuestions.ts
./src/hooks/useResponses.ts
./src/lib/api-helpers.ts
./src/lib/auth.ts
./src/lib/concept-map.ts
./src/lib/db.ts
./src/lib/email-templates/block-raised.ts
./src/lib/email-templates/onboarding-invite.ts
./src/lib/email-templates/otp.ts
./src/lib/email-templates/project-update.ts
./src/lib/email-templates/wrapper.ts
./src/lib/framework-nav.ts
./src/lib/hiring/calc.ts
./src/lib/hiring/departments.ts
./src/lib/modeller/calc.ts
./src/lib/modeller/defaults.ts
./src/lib/modeller/format.ts
./src/lib/otp.ts
./src/lib/sendgrid.ts
./src/lib/typography.ts
./src/lib/utils.ts
./src/lib/webauthn.ts
./src/middleware.ts
./src/models/Client.ts
./src/models/FrameworkQuestion.ts
./src/models/HiringPlan.ts
./src/models/IntakeResponse.ts
./src/models/ModellerBase.ts
./src/models/ModellerScenario.ts
./src/models/Notification.ts
./src/models/Project.ts
./src/models/User.ts
./src/types/index.ts
./tailwind.config.ts
```

### 2. package.json
```json
{
  "name": "full-funnel-portal",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "dev:clean": "rm -rf .next && next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "seed": "npx tsx scripts/seed.ts"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@hookform/resolvers": "^3.6.0",
    "@radix-ui/react-slider": "^1.3.6",
    "@sendgrid/mail": "^8.1.3",
    "@simplewebauthn/browser": "^10.0.0",
    "@simplewebauthn/server": "^10.0.0",
    "bcryptjs": "^3.0.3",
    "clsx": "^2.1.1",
    "date-fns": "^3.6.0",
    "framer-motion": "^11.2.10",
    "lucide-react": "^0.383.0",
    "mongoose": "^8.4.0",
    "msedge-tts": "^2.0.4",
    "next": "14.2.29",
    "next-auth": "^5.0.0-beta.19",
    "nodemailer": "^6.9.13",
    "otplib": "^12.0.1",
    "react": "^18",
    "react-dom": "^18",
    "react-hook-form": "^7.51.5",
    "tailwind-merge": "^2.3.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20",
    "@types/nodemailer": "^6.4.15",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "dotenv": "^17.3.1",
    "eslint": "^8",
    "eslint-config-next": "14.2.29",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "tsx": "^4.21.0",
    "typescript": "^5"
  }
}

```

### 3. tailwind.config.ts
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0F1F3D",
          50: "#E8EDF5",
          100: "#C5D0E6",
          200: "#8FA5CC",
          300: "#5A7AB2",
          400: "#2D5099",
          500: "#0F1F3D",
          600: "#0B1830",
          700: "#081023",
          800: "#050B17",
          900: "#02050A",
        },
        cream: "#FAFAF8",
        brand: {
          blue:  'rgb(108, 194, 255)',  // PRIMARY — buttons, active states, progress
          pink:  'rgb(255, 118, 184)',  // SECONDARY — highlights, resume CTA
          green: 'rgb(112, 255, 162)', // SUCCESS — answered, complete, ticks
        },
        gold: {
          DEFAULT: "#C9A84C",
          light: "#DFC070",
          dark: "#A8882E",
        },
        slate: {
          portal: "#64748B",
        },
      },
      fontFamily: {
        // Body text — readable, neutral
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        // Headings, labels, nav, display — Inter for consistency
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
        // Keep serif as alias for display (backwards compat)
        serif: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.04)",
        "card-hover": "0 6px 16px -2px rgba(0,0,0,0.1), 0 2px 6px -2px rgba(0,0,0,0.06)",
        modal: "0 20px 60px rgba(15, 31, 61, 0.2)",
      },
      animation: {
        "fade-up": "fadeUp 0.3s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-in-right": "slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-out-right": "slideOutRight 0.3s ease-in",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(100%)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideOutRight: {
          "0%": { opacity: "1", transform: "translateX(0)" },
          "100%": { opacity: "0", transform: "translateX(100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

```

### 4. All Mongoose models

Files found:
```
./src/models/Client.ts
./src/models/FrameworkQuestion.ts
./src/models/HiringPlan.ts
./src/models/IntakeResponse.ts
./src/models/ModellerBase.ts
./src/models/ModellerScenario.ts
./src/models/Notification.ts
./src/models/Project.ts
./src/models/User.ts
```

#### ./src/models/Client.ts
```typescript
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IClient extends Document {
  userId: Types.ObjectId;
  businessName: string;
  status: "invited" | "onboarding" | "active" | "paused";
  onboardingCompletedAt?: Date;
  assignedConsultant?: Types.ObjectId;
  intakeResponses?: Types.ObjectId;
  notes?: string;
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
  plan?: "standard" | "premium";
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    businessName: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["invited", "onboarding", "active", "paused"],
      default: "invited",
    },
    onboardingCompletedAt: { type: Date },
    assignedConsultant: { type: Schema.Types.ObjectId, ref: "User" },
    intakeResponses: { type: Schema.Types.ObjectId, ref: "IntakeResponse" },
    notes: { type: String },
    contactName: { type: String, trim: true },
    jobTitle:    { type: String, trim: true },
    contactEmail:{ type: String, trim: true, lowercase: true },
    phone:       { type: String, trim: true },
    invoicingEmail: { type: String, trim: true, lowercase: true },
    website:     { type: String, trim: true },
    addressLine1: { type: String, trim: true },
    addressLine2: { type: String, trim: true },
    city:        { type: String, trim: true },
    postcode:    { type: String, trim: true },
    country:     { type: String, trim: true },
    plan: { type: String, enum: ["standard", "premium"], default: "standard" },
  },
  { timestamps: true }
);

// Indexes for common query patterns
ClientSchema.index({ userId: 1 }, { unique: true });
ClientSchema.index({ status: 1 });

const Client = mongoose.models.Client ?? mongoose.model<IClient>("Client", ClientSchema);
export default Client;

```

#### ./src/models/FrameworkQuestion.ts
```typescript
/**
 * FrameworkQuestion — stores every editable question / field in the Growth Strategy Framework.
 * Seeded from concept-map.ts, managed by admin via /admin/questions.
 */
import mongoose, { Schema, Document } from "mongoose";

export interface IFrameworkQuestion extends Document {
  fieldId: string;
  section: string;          // "assessment", "people", "product", "process", "gtm", "kpis", "roadmap"
  subSection: string;       // "swot", "checklist", "challenges", "methodology", etc.
  group?: string;           // Sub-grouping, e.g. "strengths", "weaknesses", "mission", "objectives"
  question: string;         // The main question / label text
  subPrompt?: string;       // Optional secondary prompt (Leadership, GTM Market)
  label?: string;           // Short label for compact views
  type: "textarea" | "text" | "checkbox" | "slider" | "select";
  placeholder?: string;
  weightFieldId?: string;   // For SWOT questions with an importance weight
  order: number;            // Sort order within section + subSection + group
  active: boolean;          // Soft delete — inactive questions hidden from portal
  metadata?: Record<string, unknown>; // Extra config: min/max for sliders, options for selects, etc.
  createdAt: Date;
  updatedAt: Date;
}

const FrameworkQuestionSchema = new Schema<IFrameworkQuestion>(
  {
    fieldId: { type: String, required: true, unique: true },
    section: { type: String, required: true },
    subSection: { type: String, required: true },
    group: { type: String, default: null },
    question: { type: String, required: true },
    subPrompt: { type: String, default: null },
    label: { type: String, default: null },
    type: {
      type: String,
      enum: ["textarea", "text", "checkbox", "slider", "select"],
      default: "textarea",
    },
    placeholder: { type: String, default: null },
    weightFieldId: { type: String, default: null },
    order: { type: Number, required: true, default: 0 },
    active: { type: Boolean, default: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Compound index for efficient queries
FrameworkQuestionSchema.index({ section: 1, subSection: 1, group: 1, order: 1 });

export default mongoose.models.FrameworkQuestion ||
  mongoose.model<IFrameworkQuestion>("FrameworkQuestion", FrameworkQuestionSchema);

```

#### ./src/models/HiringPlan.ts
```typescript
import mongoose, { Schema } from "mongoose"

const HireSchema = new Schema({
  id:                  String,
  role:                String,
  department:          String,
  startMonth:          Number,
  salary:              Number,
  revenueContribution: Number,
  rampMonths:          Number,
  hiringCost:          Number,
}, { _id: false })

const HiringPlanSchema = new Schema({
  clientId:     { type: Schema.Types.ObjectId, ref: "Client", required: true, unique: true },
  hires:        [HireSchema],
  useModeller:  { type: Boolean, default: true },
  baseOverride: {
    monthlyRevenue:        Number,
    grossMarginPct:        Number,
    existingPeopleMonthly: Number,
    monthlyOverheads:      Number,
  },
  updatedAt: { type: Date, default: Date.now },
})

HiringPlanSchema.index({ clientId: 1 }, { unique: true })

export default mongoose.models.HiringPlan || mongoose.model("HiringPlan", HiringPlanSchema)

```

#### ./src/models/IntakeResponse.ts
```typescript
import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISubSectionProgress {
  answeredCount: number;
  totalCount: number;
  lastSavedAt: Date | null;
}

export interface IIntakeResponse extends Document {
  clientId: Types.ObjectId;
  completedBy: "client" | "admin";
  responses: Map<string, unknown>;
  sectionProgress: Map<string, boolean>;
  subSectionProgress: Map<string, ISubSectionProgress>;
  lastActiveSub: string;
  submittedAt?: Date;
  lastSavedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubSectionProgressSchema = new Schema(
  {
    answeredCount: { type: Number, default: 0 },
    totalCount: { type: Number, default: 0 },
    lastSavedAt: { type: Date, default: null },
  },
  { _id: false }
);

const IntakeResponseSchema = new Schema<IIntakeResponse>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    completedBy: {
      type: String,
      enum: ["client", "admin"],
      default: "client",
    },
    responses: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
    sectionProgress: {
      type: Map,
      of: Boolean,
      default: {},
    },
    subSectionProgress: {
      type: Map,
      of: SubSectionProgressSchema,
      default: {},
    },
    lastActiveSub: { type: String, default: "" },
    submittedAt: { type: Date },
    lastSavedAt: { type: Date },
  },
  { timestamps: true }
);

// clientId is queried on almost every request (autosave, load, progress)
IntakeResponseSchema.index({ clientId: 1 }, { unique: true });

const IntakeResponse =
  mongoose.models.IntakeResponse ??
  mongoose.model<IIntakeResponse>("IntakeResponse", IntakeResponseSchema);
export default IntakeResponse;

```

#### ./src/models/ModellerBase.ts
```typescript
import mongoose, { Schema } from "mongoose"

const RevenueLineSchema = new Schema({
  id:       String,
  name:     String,
  price:    Number,
  volume:   Number,
  cogsPct:  Number,
}, { _id: false })

const PeopleLineSchema = new Schema({
  id:         String,
  name:       String,
  salary:     Number,
  headcount:  Number,
  pensionPct: Number,
}, { _id: false })

const OverheadLineSchema = new Schema({
  id:     String,
  name:   String,
  amount: Number,
  period: { type: String, enum: ["monthly", "annual"] },
}, { _id: false })

const ModellerBaseSchema = new Schema({
  clientId:  { type: Schema.Types.ObjectId, ref: "Client", required: true, unique: true },
  revenue:   [RevenueLineSchema],
  people:    [PeopleLineSchema],
  overheads: [OverheadLineSchema],
  updatedAt: { type: Date, default: Date.now },
})

ModellerBaseSchema.index({ clientId: 1 }, { unique: true })

export { RevenueLineSchema, PeopleLineSchema, OverheadLineSchema }
export default mongoose.models.ModellerBase || mongoose.model("ModellerBase", ModellerBaseSchema)

```

#### ./src/models/ModellerScenario.ts
```typescript
import mongoose, { Schema } from "mongoose"
import { RevenueLineSchema, PeopleLineSchema, OverheadLineSchema } from "./ModellerBase"

const ModellerScenarioSchema = new Schema({
  clientId:    { type: Schema.Types.ObjectId, ref: "Client", required: true },
  name:        { type: String, default: "New scenario" },
  description: String,
  type:        { type: String, enum: ["hire", "price", "revenue", "client"] },
  data: {
    revenue:   [RevenueLineSchema],
    people:    [PeopleLineSchema],
    overheads: [OverheadLineSchema],
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

ModellerScenarioSchema.index({ clientId: 1 })

export default mongoose.models.ModellerScenario || mongoose.model("ModellerScenario", ModellerScenarioSchema)

```

#### ./src/models/Notification.ts
```typescript
import mongoose, { Schema, Document, Types } from "mongoose";

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      default: "info",
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    link: { type: String },
  },
  { timestamps: true }
);

// Indexes for per-user notification queries
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });

const Notification =
  mongoose.models.Notification ??
  mongoose.model<INotification>("Notification", NotificationSchema);
export default Notification;

```

#### ./src/models/Project.ts
```typescript
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBlock {
  reason: string;
  raisedAt: Date;
  resolvedAt?: Date;
}

export interface IMilestone {
  title: string;
  dueDate?: Date;
  completedAt?: Date;
}

export interface IProject extends Document {
  clientId: Types.ObjectId;
  title: string;
  description?: string;
  status: "not_started" | "in_progress" | "blocked" | "completed";
  blocks: IBlock[];
  package: string;
  milestones: IMilestone[];
  assignedTo?: Types.ObjectId;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BlockSchema = new Schema<IBlock>({
  reason: { type: String, required: true },
  raisedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
});

const MilestoneSchema = new Schema<IMilestone>({
  title: { type: String, required: true },
  dueDate: { type: Date },
  completedAt: { type: Date },
});

const ProjectSchema = new Schema<IProject>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "blocked", "completed"],
      default: "not_started",
    },
    blocks: [BlockSchema],
    package: { type: String, required: true },
    milestones: [MilestoneSchema],
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    dueDate: { type: Date },
  },
  { timestamps: true }
);

// Indexes for common query patterns
ProjectSchema.index({ clientId: 1, status: 1 });
ProjectSchema.index({ assignedTo: 1 });

const Project = mongoose.models.Project ?? mongoose.model<IProject>("Project", ProjectSchema);
export default Project;

```

#### ./src/models/User.ts
```typescript
import mongoose, { Schema, Document } from "mongoose";

export interface IPasskeyCredential {
  credentialId: string;
  publicKey: string;
  counter: number;
  transports: string[];
}

export interface IUser extends Document {
  email: string;
  name: string;
  password?: string;
  role: "admin" | "consultant" | "client";
  passkeyCredentials: IPasskeyCredential[];
  otpSecret?: string;
  otpExpiry?: Date;
  currentChallenge?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PasskeyCredentialSchema = new Schema<IPasskeyCredential>({
  credentialId: { type: String, required: true },
  publicKey: { type: String, required: true },
  counter: { type: Number, required: true, default: 0 },
  transports: [String],
});

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    password: { type: String },
    role: {
      type: String,
      enum: ["admin", "consultant", "client"],
      default: "client",
    },
    passkeyCredentials: [PasskeyCredentialSchema],
    otpSecret: { type: String },
    otpExpiry: { type: Date },
    currentChallenge: { type: String },
  },
  { timestamps: true }
);

const User = mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
export default User;

```

### 5. All API routes

Files found:
```
./src/app/api/admin/questions/[id]/route.ts
./src/app/api/admin/questions/reorder/route.ts
./src/app/api/admin/questions/route.ts
./src/app/api/auth/[...nextauth]/route.ts
./src/app/api/auth/otp/send/route.ts
./src/app/api/auth/otp/verify/route.ts
./src/app/api/auth/passkey/authenticate/route.ts
./src/app/api/auth/passkey/register/route.ts
./src/app/api/auth/passkey/verify/route.ts
./src/app/api/clients/[id]/route.ts
./src/app/api/clients/[id]/session/route.ts
./src/app/api/clients/route.ts
./src/app/api/clients/search/route.ts
./src/app/api/hiring-plan/route.ts
./src/app/api/intake/route.ts
./src/app/api/me/client/route.ts
./src/app/api/modeller/base/route.ts
./src/app/api/modeller/scenarios/[id]/route.ts
./src/app/api/modeller/scenarios/route.ts
./src/app/api/projects/[id]/route.ts
./src/app/api/projects/route.ts
./src/app/api/questions/route.ts
./src/app/api/responses/[clientId]/[section]/[sub]/route.ts
./src/app/api/responses/[clientId]/route.ts
./src/app/api/tts/route.ts
```

#### ./src/app/api/admin/questions/[id]/route.ts
```typescript
/**
 * GET    /api/admin/questions/[id]  — get single question
 * PATCH  /api/admin/questions/[id]  — update question fields
 * DELETE /api/admin/questions/[id]  — soft-delete (set active: false)
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FrameworkQuestion from "@/models/FrameworkQuestion";
import { z } from "zod";
import { requireAuth } from "@/lib/api-helpers";

const updateSchema = z.object({
  question: z.string().min(1).optional(),
  subPrompt: z.string().nullable().optional(),
  label: z.string().nullable().optional(),
  type: z.enum(["textarea", "text", "checkbox", "slider", "select"]).optional(),
  placeholder: z.string().nullable().optional(),
  order: z.number().optional(),
  active: z.boolean().optional(),
  group: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { id } = await params;
    await connectDB();

    const question = await FrameworkQuestion.findById(id).lean();
    if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ question });
  } catch (error) {
    console.error("[ADMIN QUESTION GET]", error);
    return NextResponse.json({ error: "Failed to fetch question" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }

    await connectDB();

    const question = await FrameworkQuestion.findByIdAndUpdate(
      id,
      { $set: parsed.data },
      { new: true }
    ).lean();

    if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ question });
  } catch (error) {
    console.error("[ADMIN QUESTION PATCH]", error);
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { id } = await params;
    await connectDB();

    const question = await FrameworkQuestion.findByIdAndUpdate(
      id,
      { $set: { active: false } },
      { new: true }
    ).lean();

    if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ question, message: "Question deactivated" });
  } catch (error) {
    console.error("[ADMIN QUESTION DELETE]", error);
    return NextResponse.json({ error: "Failed to deactivate question" }, { status: 500 });
  }
}

```

#### ./src/app/api/admin/questions/reorder/route.ts
```typescript
/**
 * POST /api/admin/questions/reorder
 * Bulk update question order within a section/subSection.
 * Body: { items: [{ id: string, order: number }] }
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FrameworkQuestion from "@/models/FrameworkQuestion";
import { z } from "zod";
import { requireAuth } from "@/lib/api-helpers";

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      order: z.number(),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const body = await req.json();
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }

    await connectDB();

    const ops = parsed.data.items.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { order: item.order } },
      },
    }));

    const result = await FrameworkQuestion.bulkWrite(ops);

    return NextResponse.json({
      modified: result.modifiedCount,
      total: parsed.data.items.length,
    });
  } catch (error) {
    console.error("[ADMIN QUESTIONS REORDER]", error);
    return NextResponse.json({ error: "Failed to reorder questions" }, { status: 500 });
  }
}

```

#### ./src/app/api/admin/questions/route.ts
```typescript
/**
 * GET  /api/admin/questions           — list all questions (with optional filters)
 * POST /api/admin/questions           — create a new question
 *
 * Query params: ?section=&subSection=&group=&active=true
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FrameworkQuestion from "@/models/FrameworkQuestion";
import { z } from "zod";
import { requireAuth } from "@/lib/api-helpers";

const createSchema = z.object({
  fieldId: z.string().min(1),
  section: z.string().min(1),
  subSection: z.string().min(1),
  group: z.string().optional(),
  question: z.string().min(1),
  subPrompt: z.string().optional(),
  label: z.string().optional(),
  type: z.enum(["textarea", "text", "checkbox", "slider", "select"]).default("textarea"),
  placeholder: z.string().optional(),
  weightFieldId: z.string().optional(),
  order: z.number().default(0),
  active: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { searchParams } = new URL(req.url);
    const filter: Record<string, unknown> = {};

    const section = searchParams.get("section");
    const subSection = searchParams.get("subSection");
    const group = searchParams.get("group");
    const active = searchParams.get("active");

    if (section) filter.section = section;
    if (subSection) filter.subSection = subSection;
    if (group) filter.group = group;
    if (active !== null) filter.active = active !== "false";

    await connectDB();

    const questions = await FrameworkQuestion.find(filter)
      .sort({ section: 1, subSection: 1, group: 1, order: 1 })
      .lean();

    // Build summary stats
    const stats = {
      total: questions.length,
      active: questions.filter((q) => q.active).length,
      sections: Array.from(new Set(questions.map((q) => q.section))),
    };

    return NextResponse.json({ questions, stats });
  } catch (error) {
    console.error("[ADMIN QUESTIONS GET]", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }

    await connectDB();

    // Check for duplicate fieldId
    const exists = await FrameworkQuestion.findOne({ fieldId: parsed.data.fieldId });
    if (exists) {
      return NextResponse.json({ error: "A question with this fieldId already exists" }, { status: 409 });
    }

    const question = await FrameworkQuestion.create(parsed.data);
    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN QUESTIONS POST]", error);
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 });
  }
}

```

#### ./src/app/api/auth/[...nextauth]/route.ts
```typescript
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;

```

#### ./src/app/api/auth/otp/send/route.ts
```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateAndStoreOTP } from "@/lib/otp";
import { sendEmail } from "@/lib/sendgrid";
import { otpEmail } from "@/lib/email-templates/otp";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);
    const code = await generateAndStoreOTP(email);

    // DEV: skip email, log code to terminal
    if (process.env.NODE_ENV === "development") {
      console.log(`\n🔑  DEV OTP for ${email}: ${code}\n`);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    await sendEmail({
      to: email,
      subject: "Your Full Funnel sign-in code",
      html: otpEmail({ code }),
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[OTP SEND]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}

```

#### ./src/app/api/auth/otp/verify/route.ts
```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyOTP } from "@/lib/otp";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code } = schema.parse(body);
    const userId = await verifyOTP(email, code);
    if (!userId) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
    }
    // Return userId so client can call signIn("otp")
    return NextResponse.json({ success: true, userId }, { status: 200 });
  } catch (error) {
    console.error("[OTP VERIFY]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

```

#### ./src/app/api/auth/passkey/authenticate/route.ts
```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticationOptions } from "@/lib/webauthn";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const schema = z.object({ email: z.string().email().optional() });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);
    const options = await getAuthenticationOptions(email);

    // Tell the client whether this user already has credentials registered
    let hasCredentials = false;
    if (email) {
      await connectDB();
      const user = await User.findOne({ email: email.toLowerCase() });
      hasCredentials = !!(user?.passkeyCredentials?.length);
    }

    return NextResponse.json({ options, hasCredentials }, { status: 200 });
  } catch (error) {
    console.error("[PASSKEY AUTHENTICATE]", error);
    return NextResponse.json({ error: "Failed to generate authentication options" }, { status: 500 });
  }
}

```

#### ./src/app/api/auth/passkey/register/route.ts
```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRegistrationOptions } from "@/lib/webauthn";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const schema = z.object({ email: z.string().email(), name: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name } = schema.parse(body);
    await connectDB();

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({ email: email.toLowerCase(), name, role: "client" });
    }

    const options = await getRegistrationOptions(user._id.toString(), email);
    return NextResponse.json({ options, userId: user._id.toString() }, { status: 200 });
  } catch (error) {
    console.error("[PASSKEY REGISTER]", error);
    return NextResponse.json({ error: "Failed to generate registration options" }, { status: 500 });
  }
}

```

#### ./src/app/api/auth/passkey/verify/route.ts
```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAuthentication, verifyRegistration } from "@/lib/webauthn";

const authSchema = z.object({
  type: z.literal("authenticate"),
  email: z.string().email(),
  response: z.unknown(),
  challenge: z.string(),
});

const regSchema = z.object({
  type: z.literal("register"),
  userId: z.string(),
  response: z.unknown(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.type === "register") {
      const { userId, response } = regSchema.parse(body);
      const result = await verifyRegistration(userId, response as never);
      if (!result.verified) {
        return NextResponse.json({ error: "Registration verification failed" }, { status: 400 });
      }
      return NextResponse.json({ success: true, userId }, { status: 200 });
    }

    if (body.type === "authenticate") {
      const { email, response, challenge } = authSchema.parse(body);
      const { verification, userId } = await verifyAuthentication(email, response as never, challenge);
      if (!verification.verified) {
        return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
      }
      return NextResponse.json({ success: true, userId }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("[PASSKEY VERIFY]", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

```

#### ./src/app/api/clients/[id]/route.ts
```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";
import { requireAuth, toClientDTO } from "@/lib/api-helpers";

const updateSchema = z.object({
  businessName:   z.string().min(1).optional(),
  status: z.enum(["invited", "onboarding", "active", "paused"]).optional(),
  notes: z.string().optional(),
  assignedConsultant: z.string().optional().nullable(),
  contactName:    z.string().optional(),
  jobTitle:       z.string().optional(),
  contactEmail:   z.string().email().optional().or(z.literal("")),
  phone:          z.string().optional(),
  invoicingEmail: z.string().email().optional().or(z.literal("")),
  website:        z.string().optional(),
  addressLine1:   z.string().optional(),
  addressLine2:   z.string().optional(),
  city:           z.string().optional(),
  postcode:       z.string().optional(),
  country:        z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    await connectDB();
    const client = await Client.findById(params.id)
      .populate("userId", "email name")
      .populate("assignedConsultant", "name email")
      .lean();

    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    return NextResponse.json({ data: toClientDTO(client) }, { status: 200 });
  } catch (error) {
    console.error("[CLIENT GET]", error);
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const body = await req.json();
    const data = updateSchema.parse(body);

    await connectDB();
    const client = await Client.findByIdAndUpdate(params.id, data, { new: true })
      .populate("userId", "email name")
      .populate("assignedConsultant", "name email")
      .lean();
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    return NextResponse.json({ data: toClientDTO(client) }, { status: 200 });
  } catch (error) {
    console.error("[CLIENT PATCH]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    await connectDB();
    const client = await Client.findByIdAndDelete(params.id);
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[CLIENT DELETE]", error);
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
  }
}

```

#### ./src/app/api/clients/[id]/session/route.ts
```typescript
/**
 * PATCH /api/clients/[id]/session
 * Update the client's last active sub-section.
 *
 * Body: { lastActiveSub: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import IntakeResponse from "@/models/IntakeResponse";
import { z } from "zod";
import { requireAuth } from "@/lib/api-helpers";

const bodySchema = z.object({
  lastActiveSub: z.string().min(1),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userOrRes = await requireAuth();
  if (userOrRes instanceof NextResponse) return userOrRes;

  const { id: clientId } = await params;
  const body = await req.json();
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  await connectDB();

  await IntakeResponse.updateOne(
    { clientId },
    { $set: { lastActiveSub: parsed.data.lastActiveSub } },
    { upsert: true }
  );

  return NextResponse.json({ ok: true });
}

```

#### ./src/app/api/clients/route.ts
```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";
import User from "@/models/User";
import IntakeResponse from "@/models/IntakeResponse";
import { sendEmail } from "@/lib/sendgrid";
import { onboardingInviteEmail } from "@/lib/email-templates/onboarding-invite";
import { getAllFieldIds, calculateProgress } from "@/lib/framework-nav";
import { requireAuth } from "@/lib/api-helpers";
import type { IIntakeResponse } from "@/models/IntakeResponse";

const createSchema = z.object({
  businessName: z.string().min(1),
  email: z.string().email(),
  name: z.string().optional(),
  assignedConsultant: z.string().optional(),
});

interface PopulatedClient {
  _id: unknown;
  [key: string]: unknown;
}

interface LeanIntakeResponse {
  clientId: unknown;
  responses?: Record<string, unknown> | Map<string, unknown>;
  [key: string]: unknown;
}

export async function GET() {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    await connectDB();

    const clients = await Client.find()
      .populate("userId", "email name")
      .populate("assignedConsultant", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // Batch-fetch intake responses and compute overallProgress per client
    const clientIds = (clients as PopulatedClient[]).map((c) => c._id);
    const intakeResponses = await IntakeResponse.find({ clientId: { $in: clientIds } }).lean() as unknown as LeanIntakeResponse[];

    const responseMap = new Map<string, LeanIntakeResponse>();
    for (const r of intakeResponses) {
      responseMap.set(String(r.clientId), r);
    }

    const allFieldIds = getAllFieldIds();
    const clientsWithProgress = (clients as PopulatedClient[]).map((client) => {
      const intake = responseMap.get(String(client._id));
      const overallProgress = intake
        ? calculateProgress(allFieldIds, (intake.responses ?? {}) as Record<string, unknown>).percent
        : 0;
      return { ...client, id: String(client._id), overallProgress };
    });

    return NextResponse.json({ data: clientsWithProgress }, { status: 200 });
  } catch (error) {
    console.error("[CLIENTS GET]", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const body = await req.json();
    const { businessName, email, name, assignedConsultant } = createSchema.parse(body);
    const resolvedName = name || businessName;

    await connectDB();

    // Create or find user
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({ email: email.toLowerCase(), name: resolvedName, role: "client" });
    }

    // Create client record
    const client = await Client.create({
      userId: user._id,
      businessName,
      status: "invited",
      assignedConsultant: assignedConsultant || undefined,
    });

    // Send invite email
    const portalUrl = `${process.env.NEXTAUTH_URL}/login`;
    await sendEmail({
      to: email,
      subject: `Welcome to Full Funnel — ${businessName}`,
      html: onboardingInviteEmail({
        clientName: resolvedName,
        portalUrl,
        firmName: process.env.SENDGRID_FROM_NAME,
      }),
    });

    return NextResponse.json({ data: client }, { status: 201 });
  } catch (error) {
    console.error("[CLIENTS POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}

```

#### ./src/app/api/clients/search/route.ts
```typescript
/**
 * GET /api/clients/search?q=term
 * Lightweight search-only endpoint — returns the bare minimum fields
 * needed for the search UI. Requires an authenticated admin/consultant session.
 * Never exposes contact details, address, notes, or invoicing data.
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";
import { requireAuth, escapeRegex } from "@/lib/api-helpers";

interface SearchResult {
  id: string;
  businessName: string;
  status: string;
}

export async function GET(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (!q) return NextResponse.json({ data: [] });

    await connectDB();

    const clients = await Client.find(
      { businessName: { $regex: escapeRegex(q), $options: "i" } },
      { _id: 1, businessName: 1, status: 1 }   // projection — nothing else
    )
      .limit(8)
      .lean();

    const data: SearchResult[] = (clients as unknown as Array<{ _id: unknown; businessName: string; status: string }>).map((c) => ({
      id: String(c._id),
      businessName: c.businessName,
      status: c.status,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[CLIENTS SEARCH]", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

```

#### ./src/app/api/hiring-plan/route.ts
```typescript
/**
 * GET /api/hiring-plan   — fetch plan for current client
 * PUT /api/hiring-plan   — save/replace entire plan (autosave)
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";
import HiringPlan from "@/models/HiringPlan";
import { requireAuth, apiError, type AuthenticatedUser } from "@/lib/api-helpers";

async function resolveClientId(user: AuthenticatedUser): Promise<string | null> {
  const client = await Client.findOne(
    user.role === "admin" ? {} : { userId: user.id }
  )
    .sort({ createdAt: 1 })
    .select("_id")
    .lean() as { _id: unknown } | null;
  return client ? String(client._id) : null;
}

export async function GET() {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;

    await connectDB();
    const clientId = await resolveClientId(user);
    if (!clientId) return NextResponse.json({ error: "No client found" }, { status: 404 });

    const doc = await HiringPlan.findOne({ clientId }).lean() as Record<string, any> | null;

    if (!doc) {
      return NextResponse.json({
        clientId,
        hires: [],
        useModeller: true,
        baseOverride: {
          monthlyRevenue: 0,
          grossMarginPct: 60,
          existingPeopleMonthly: 0,
          monthlyOverheads: 0,
        },
        updatedAt: null,
      });
    }

    return NextResponse.json({
      clientId: String(doc.clientId),
      hires: doc.hires ?? [],
      useModeller: doc.useModeller ?? true,
      baseOverride: doc.baseOverride ?? {
        monthlyRevenue: 0,
        grossMarginPct: 60,
        existingPeopleMonthly: 0,
        monthlyOverheads: 0,
      },
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    return apiError("HIRING_PLAN_GET", err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;

    await connectDB();
    const clientId = await resolveClientId(user);
    if (!clientId) return NextResponse.json({ error: "No client found" }, { status: 404 });

    const body = await req.json();
    const { hires, useModeller, baseOverride } = body;

    const doc = await HiringPlan.findOneAndUpdate(
      { clientId },
      { clientId, hires, useModeller, baseOverride, updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean() as Record<string, any>;

    return NextResponse.json({
      clientId: String(doc.clientId),
      hires: doc.hires,
      useModeller: doc.useModeller,
      baseOverride: doc.baseOverride,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    return apiError("HIRING_PLAN_PUT", err);
  }
}

```

#### ./src/app/api/intake/route.ts
```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import IntakeResponse from "@/models/IntakeResponse";
import Client from "@/models/Client";
import { requireAuth } from "@/lib/api-helpers";

const saveSchema = z.object({
  clientId: z.string(),
  completedBy: z.enum(["client", "admin"]),
  responses: z.record(z.unknown()),
  sectionProgress: z.record(z.boolean()),
  submit: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json({ error: "clientId required" }, { status: 400 });
    }

    const intake = await IntakeResponse.findOne({ clientId }).lean();
    return NextResponse.json({ data: intake ?? null }, { status: 200 });
  } catch (error) {
    console.error("[INTAKE GET]", error);
    return NextResponse.json({ error: "Failed to fetch intake" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const body = await req.json();
    const { clientId, completedBy, responses, sectionProgress, submit } = saveSchema.parse(body);

    await connectDB();

    const now = new Date();

    // Build $set for atomic partial update (avoids overwriting entire map)
    const responseEntries: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(responses)) {
      responseEntries[`responses.${key}`] = val;
    }
    const progressEntries: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(sectionProgress)) {
      progressEntries[`sectionProgress.${key}`] = val;
    }

    const submitFields: Record<string, unknown> = submit
      ? { submittedAt: now }
      : {};

    const doc = await IntakeResponse.findOneAndUpdate(
      { clientId },
      {
        $set: {
          ...responseEntries,
          ...progressEntries,
          ...submitFields,
          lastSavedAt: now,
          completedBy,
        },
      },
      { upsert: true, new: true }
    );

    if (submit) {
      await Client.findByIdAndUpdate(clientId, { status: "active", onboardingCompletedAt: now });
    }

    return NextResponse.json({ data: doc }, { status: 200 });
  } catch (error) {
    console.error("[INTAKE POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to save intake" }, { status: 500 });
  }
}

```

#### ./src/app/api/me/client/route.ts
```typescript
/**
 * GET /api/me/client
 * Returns the Client record associated with the logged-in user.
 * If the user is an admin, returns the first client (for demo purposes).
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";
import { requireAuth, type AuthenticatedUser } from "@/lib/api-helpers";

export async function GET() {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;

    await connectDB();

    // Try to find a client by userId
    let client = await Client.findOne({ userId: user.id }).lean() as Record<string, unknown> | null;

    // For admin users in dev, fall back to the first client
    if (!client && user.role === "admin") {
      client = await Client.findOne().sort({ createdAt: 1 }).lean() as Record<string, unknown> | null;
    }

    if (!client) {
      return NextResponse.json({ error: "No client found" }, { status: 404 });
    }

    return NextResponse.json({
      clientId: String(client._id),
      businessName: client.businessName,
      status: client.status,
      plan: client.plan ?? "standard",
    });
  } catch (error) {
    console.error("[ME CLIENT]", error);
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 });
  }
}

```

#### ./src/app/api/modeller/base/route.ts
```typescript
/**
 * GET /api/modeller/base   — fetch base model for current client
 * PUT /api/modeller/base   — save/replace entire base model
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";
import ModellerBase from "@/models/ModellerBase";
import { requireAuth, apiError, type AuthenticatedUser } from "@/lib/api-helpers";
import { defaultBase } from "@/lib/modeller/defaults";

async function resolveClientId(user: AuthenticatedUser): Promise<string | null> {
  const client = await Client.findOne(
    user.role === "admin" ? {} : { userId: user.id }
  )
    .sort({ createdAt: 1 })
    .select("_id")
    .lean() as { _id: unknown } | null;
  return client ? String(client._id) : null;
}

export async function GET() {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;

    await connectDB();
    const clientId = await resolveClientId(user);
    if (!clientId) return NextResponse.json({ error: "No client found" }, { status: 404 });

    const doc = await ModellerBase.findOne({ clientId }).lean() as Record<string, any> | null;

    if (!doc) {
      // Return defaults (not yet persisted)
      return NextResponse.json({
        clientId,
        ...defaultBase,
        updatedAt: null,
      });
    }

    return NextResponse.json({
      clientId: String(doc.clientId),
      revenue: doc.revenue ?? [],
      people: doc.people ?? [],
      overheads: doc.overheads ?? [],
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    return apiError("MODELLER_BASE_GET", err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;

    await connectDB();
    const clientId = await resolveClientId(user);
    if (!clientId) return NextResponse.json({ error: "No client found" }, { status: 404 });

    const body = await req.json();
    const { revenue, people, overheads } = body;

    const doc = await ModellerBase.findOneAndUpdate(
      { clientId },
      { clientId, revenue, people, overheads, updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean() as Record<string, any>;

    return NextResponse.json({
      clientId: String(doc.clientId),
      revenue: doc.revenue,
      people: doc.people,
      overheads: doc.overheads,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    return apiError("MODELLER_BASE_PUT", err);
  }
}

```

#### ./src/app/api/modeller/scenarios/[id]/route.ts
```typescript
/**
 * PUT    /api/modeller/scenarios/[id]  — update scenario
 * DELETE /api/modeller/scenarios/[id]  — delete scenario
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";
import ModellerScenario from "@/models/ModellerScenario";
import { requireAuth, apiError, type AuthenticatedUser } from "@/lib/api-helpers";

async function resolveClientId(user: AuthenticatedUser): Promise<string | null> {
  const client = await Client.findOne(
    user.role === "admin" ? {} : { userId: user.id }
  )
    .sort({ createdAt: 1 })
    .select("_id")
    .lean() as { _id: unknown } | null;
  return client ? String(client._id) : null;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;

    await connectDB();
    const clientId = await resolveClientId(user);
    if (!clientId) return NextResponse.json({ error: "No client found" }, { status: 404 });

    const { id } = await params;
    const body = await req.json();

    // Accept data either wrapped as { data: { revenue, people, overheads } }
    // or flat { revenue, people, overheads } (from autosave)
    const dataPayload = body.data ?? (body.revenue ? { revenue: body.revenue, people: body.people, overheads: body.overheads } : undefined);

    const doc = await ModellerScenario.findOneAndUpdate(
      { _id: id, clientId },
      {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.type !== undefined && { type: body.type }),
        ...(dataPayload !== undefined && { data: dataPayload }),
        updatedAt: new Date(),
      },
      { new: true }
    ).lean() as Record<string, any> | null;

    if (!doc) return NextResponse.json({ error: "Scenario not found" }, { status: 404 });

    return NextResponse.json({
      id: String(doc._id),
      name: doc.name,
      type: doc.type,
      description: doc.description ?? "",
      data: doc.data,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    return apiError("MODELLER_SCENARIO_PUT", err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;

    await connectDB();
    const clientId = await resolveClientId(user);
    if (!clientId) return NextResponse.json({ error: "No client found" }, { status: 404 });

    const { id } = await params;
    const result = await ModellerScenario.deleteOne({ _id: id, clientId });

    if (result.deletedCount === 0)
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError("MODELLER_SCENARIO_DELETE", err);
  }
}

```

#### ./src/app/api/modeller/scenarios/route.ts
```typescript
/**
 * GET  /api/modeller/scenarios       — list all scenarios for current client
 * POST /api/modeller/scenarios       — create new scenario (clones current base)
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";
import ModellerBase from "@/models/ModellerBase";
import ModellerScenario from "@/models/ModellerScenario";
import { requireAuth, apiError, type AuthenticatedUser } from "@/lib/api-helpers";
import { defaultBase } from "@/lib/modeller/defaults";

async function resolveClientId(user: AuthenticatedUser): Promise<string | null> {
  const client = await Client.findOne(
    user.role === "admin" ? {} : { userId: user.id }
  )
    .sort({ createdAt: 1 })
    .select("_id")
    .lean() as { _id: unknown } | null;
  return client ? String(client._id) : null;
}

function uid() {
  return `sc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET() {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;

    await connectDB();
    const clientId = await resolveClientId(user);
    if (!clientId) return NextResponse.json({ error: "No client found" }, { status: 404 });

    const docs = await ModellerScenario.find({ clientId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      docs.map((d: Record<string, any>) => ({
        id: String(d._id),
        name: d.name,
        type: d.type,
        description: d.description ?? "",
        data: d.data,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      }))
    );
  } catch (err) {
    return apiError("MODELLER_SCENARIOS_GET", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;

    await connectDB();
    const clientId = await resolveClientId(user);
    if (!clientId) return NextResponse.json({ error: "No client found" }, { status: 404 });

    const body = await req.json();
    const { type, name } = body as { type: string; name: string };

    // Clone current base (or defaults if none saved yet)
    const baseDoc = await ModellerBase.findOne({ clientId }).lean() as Record<string, any> | null;
    const baseData = baseDoc
      ? { revenue: baseDoc.revenue, people: baseDoc.people, overheads: baseDoc.overheads }
      : { ...defaultBase };

    // Deep-clone and give new IDs so scenario rows are independent
    const cloned = JSON.parse(JSON.stringify(baseData));
    cloned.revenue.forEach((r: any) => (r.id = uid()));
    cloned.people.forEach((p: any) => (p.id = uid()));
    cloned.overheads.forEach((o: any) => (o.id = uid()));

    const doc = await ModellerScenario.create({
      clientId,
      name: name || "New scenario",
      type: type || "revenue",
      data: cloned,
    });

    return NextResponse.json(
      {
        id: String(doc._id),
        name: doc.name,
        type: doc.type,
        description: doc.description ?? "",
        data: doc.data,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
      { status: 201 }
    );
  } catch (err) {
    return apiError("MODELLER_SCENARIOS_POST", err);
  }
}

```

#### ./src/app/api/projects/[id]/route.ts
```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import User from "@/models/User";
import Client from "@/models/Client";
import { sendEmail } from "@/lib/sendgrid";
import { blockRaisedEmail } from "@/lib/email-templates/block-raised";
import { formatDateTime } from "@/lib/utils";
import { requireAuth } from "@/lib/api-helpers";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["not_started", "in_progress", "blocked", "completed"]).optional(),
  package: z.string().optional(),
  assignedTo: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  // Block actions
  action: z.enum(["raiseBlock", "resolveBlock"]).optional(),
  reason: z.string().optional(),
  blockId: z.string().optional(),
  // Milestone
  addMilestone: z.object({
    title: z.string().min(1),
    dueDate: z.string().optional(),
  }).optional(),
  completeMilestone: z.number().optional(),
}).passthrough();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    await connectDB();
    const project = await Project.findById(params.id)
      .populate("clientId", "businessName")
      .populate("assignedTo", "name email")
      .lean();

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    return NextResponse.json({ data: { ...project, id: String((project as Record<string, unknown>)._id) } });
  } catch (error) {
    console.error("[PROJECT GET]", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    await connectDB();
    const body = patchSchema.parse(await req.json());

    const project = await Project.findById(params.id)
      .populate("assignedTo")
      .populate("clientId");

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    // ── Raise block ────────────────────────────────────────
    if (body.action === "raiseBlock") {
      if (!body.reason) return NextResponse.json({ error: "reason required" }, { status: 400 });
      project.blocks.push({ reason: body.reason, raisedAt: new Date() });
      project.status = "blocked";
      await project.save();

      // Notify assigned consultant
      if (project.assignedTo) {
        const consultant = await User.findById(project.assignedTo);
        const client = await Client.findById(project.clientId).populate("userId", "name");
        if (consultant) {
          await sendEmail({
            to: consultant.email,
            subject: `🚧 Project Blocked: ${project.title}`,
            html: blockRaisedEmail({
              consultantName: consultant.name,
              clientName: (client?.userId as { name: string })?.name ?? "Unknown",
              projectTitle: project.title,
              blockReason: body.reason,
              raisedAt: formatDateTime(new Date()),
              portalUrl: `${process.env.NEXTAUTH_URL}/portal/projects/${params.id}`,
            }),
          });
        }
      }

      return NextResponse.json({ data: project.toObject() });
    }

    // ── Resolve block ──────────────────────────────────────
    if (body.action === "resolveBlock") {
      const openBlock = project.blocks.find((b: { resolvedAt?: Date }) => !b.resolvedAt);
      if (openBlock) openBlock.resolvedAt = new Date();
      const stillBlocked = project.blocks.some((b: { resolvedAt?: Date }) => !b.resolvedAt);
      if (!stillBlocked) project.status = "in_progress";
      await project.save();
      return NextResponse.json({ data: project.toObject() });
    }

    // ── Add milestone ──────────────────────────────────────
    if (body.addMilestone) {
      project.milestones.push({
        title: body.addMilestone.title,
        dueDate: body.addMilestone.dueDate ? new Date(body.addMilestone.dueDate) : undefined,
      });
      await project.save();
      return NextResponse.json({ data: project.toObject() });
    }

    // ── Complete milestone ─────────────────────────────────
    if (body.completeMilestone !== undefined) {
      const milestone = project.milestones[body.completeMilestone];
      if (milestone) milestone.completedAt = new Date();
      await project.save();
      return NextResponse.json({ data: project.toObject() });
    }

    // ── General field update ───────────────────────────────
    const allowed = ["title", "description", "status", "package", "assignedTo", "dueDate"] as const;
    for (const key of allowed) {
      if (body[key] !== undefined) {
        (project as Record<string, unknown>)[key] = body[key] ?? null;
      }
    }
    await project.save();

    return NextResponse.json({ data: project.toObject() });
  } catch (error) {
    console.error("[PROJECT PATCH]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    await connectDB();
    const project = await Project.findByIdAndDelete(params.id);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    return NextResponse.json({ message: "Project deleted" });
  } catch (error) {
    console.error("[PROJECT DELETE]", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}

```

#### ./src/app/api/projects/route.ts
```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import Client from "@/models/Client";
import { sendEmail } from "@/lib/sendgrid";
import { blockRaisedEmail } from "@/lib/email-templates/block-raised";
import User from "@/models/User";
import { formatDateTime } from "@/lib/utils";
import { requireAuth } from "@/lib/api-helpers";

const createSchema = z.object({
  clientId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  package: z.string().default(""),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
  milestones: z.array(z.object({ title: z.string(), dueDate: z.string().optional() })).optional(),
});

const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["not_started", "in_progress", "blocked", "completed"]).optional(),
  package: z.string().optional(),
  assignedTo: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

const blockSchema = z.object({
  action: z.enum(["raise", "resolve"]),
  blockId: z.string().optional(),
  reason: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (clientId) filter.clientId = clientId;

    const projects = await Project.find(filter)
      .populate("clientId", "businessName")
      .populate("assignedTo", "name")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ data: (projects as Array<{ _id: unknown; [k: string]: unknown }>).map((p) => ({ ...p, id: String(p._id) })) }, { status: 200 });
  } catch (error) {
    console.error("[PROJECTS GET]", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const body = await req.json();

    // Handle block operations
    if (body.action === "raise" || body.action === "resolve") {
      const { action, blockId, reason } = blockSchema.parse(body);
      const projectId = body.projectId;
      await connectDB();
      const project = await Project.findById(projectId).populate("assignedTo").populate("clientId");

      if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

      if (action === "raise" && reason) {
        project.blocks.push({ reason, raisedAt: new Date() });
        project.status = "blocked";
        await project.save();

        // Notify assigned consultant
        if (project.assignedTo) {
          const consultant = await User.findById(project.assignedTo);
          const client = await Client.findById(project.clientId).populate("userId", "name");
          if (consultant) {
            await sendEmail({
              to: consultant.email,
              subject: `🚧 Project Blocked: ${project.title}`,
              html: blockRaisedEmail({
                consultantName: consultant.name,
                clientName: (client?.userId as { name: string })?.name ?? "Unknown",
                projectTitle: project.title,
                blockReason: reason,
                raisedAt: formatDateTime(new Date()),
                portalUrl: `${process.env.NEXTAUTH_URL}/portal/projects/${project._id}`,
              }),
            });
          }
        }
      } else if (action === "resolve" && blockId) {
        const block = project.blocks.id(blockId);
        if (block) block.resolvedAt = new Date();
        const hasActiveBlocks = project.blocks.some((b: { resolvedAt?: Date }) => !b.resolvedAt);
        if (!hasActiveBlocks) project.status = "in_progress";
        await project.save();
      }

      return NextResponse.json({ data: project }, { status: 200 });
    }

    const data = createSchema.parse(body);
    await connectDB();

    const project = await Project.create({
      ...data,
      milestones: data.milestones ?? [],
    });

    // Update client status to onboarding if needed
    if (data.clientId) {
      await Client.findByIdAndUpdate(data.clientId, { $set: { status: "onboarding" } });
    }

    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error) {
    console.error("[PROJECTS POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const body = await req.json();
    const { id, ...updateData } = body;
    if (!id) return NextResponse.json({ error: "Project ID required" }, { status: 400 });

    const data = updateSchema.parse(updateData);
    await connectDB();

    const project = await Project.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    return NextResponse.json({ data: project }, { status: 200 });
  } catch (error) {
    console.error("[PROJECTS PATCH]", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

```

#### ./src/app/api/questions/route.ts
```typescript
/**
 * GET /api/questions?section=&subSection=
 * Public (authenticated) endpoint — returns active questions for portal pages.
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FrameworkQuestion from "@/models/FrameworkQuestion";
import { requireAuth } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { searchParams } = new URL(req.url);
    const section = searchParams.get("section");
    const subSection = searchParams.get("subSection");

    if (!section || !subSection) {
      return NextResponse.json({ error: "section and subSection are required" }, { status: 400 });
    }

    await connectDB();

    const questions = await FrameworkQuestion.find({
      section,
      subSection,
      active: true,
    })
      .sort({ group: 1, order: 1 })
      .select("fieldId group question subPrompt label type placeholder weightFieldId order metadata")
      .lean();

    return NextResponse.json(
      {
        questions: questions.map((q) => ({
          _id: q._id,
          fieldId: q.fieldId,
          group: q.group,
          question: q.question,
          subPrompt: q.subPrompt,
          label: q.label,
          type: q.type,
          placeholder: q.placeholder,
          weightFieldId: q.weightFieldId,
          order: q.order,
          metadata: q.metadata,
        })),
      },
      {
        headers: {
          // Questions change infrequently — cache for 60s, revalidate in background
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("[QUESTIONS GET]", error);
    return NextResponse.json({ error: "Failed to load questions" }, { status: 500 });
  }
}

```

#### ./src/app/api/responses/[clientId]/[section]/[sub]/route.ts
```typescript
/**
 * PATCH /api/responses/[clientId]/[section]/[sub]
 * Save a single field response and recalculate sub-section progress.
 *
 * Body: { fieldId: string, value: string | number | boolean }
 * Response: { answeredCount, totalCount, lastSavedAt }
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import IntakeResponse from "@/models/IntakeResponse";
import { getSubSectionFieldIds, isFieldAnswered, calculateProgress } from "@/lib/framework-nav";
import { z } from "zod";
import { requireAuth } from "@/lib/api-helpers";

const bodySchema = z.object({
  fieldId: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string; section: string; sub: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { clientId, section, sub } = await params;
    const subSectionId = `${section}-${sub}`;

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }

    const { fieldId, value } = parsed.data;

    await connectDB();

    // Upsert the response document
    const now = new Date();
    const doc = await IntakeResponse.findOneAndUpdate(
      { clientId },
      {
        $set: {
          [`responses.${fieldId}`]: value,
          lastSavedAt: now,
          lastActiveSub: `${section}/${sub}`,
        },
      },
      { upsert: true, new: true }
    );

    // Recalculate sub-section progress
    const fieldIds = getSubSectionFieldIds(subSectionId);
    const responses: Record<string, unknown> = {};
    if (doc.responses) {
      for (const [k, v] of doc.responses.entries()) {
        responses[k] = v;
      }
    }

    const progress = calculateProgress(fieldIds, responses);

    // Store sub-section progress in the same document (single atomic operation)
    await IntakeResponse.updateOne(
      { clientId },
      {
        $set: {
          [`subSectionProgress.${subSectionId}`]: {
            answeredCount: progress.answered,
            totalCount: progress.total,
            lastSavedAt: now,
          },
        },
      }
    );

    return NextResponse.json({
      answeredCount: progress.answered,
      totalCount: progress.total,
      lastSavedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("[RESPONSES PATCH]", error);
    return NextResponse.json({ error: "Failed to save response" }, { status: 500 });
  }
}

```

#### ./src/app/api/responses/[clientId]/route.ts
```typescript
/**
 * GET /api/responses/[clientId]
 * Load all responses and progress for a client.
 *
 * Response: {
 *   responses: Record<string, unknown>,
 *   subSectionProgress: Record<string, { answeredCount, totalCount, lastSavedAt }>,
 *   lastActiveSub: string,
 *   overallProgress: number
 * }
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import IntakeResponse from "@/models/IntakeResponse";
import { getAllFieldIds, calculateProgress } from "@/lib/framework-nav";
import { requireAuth } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { clientId } = await params;

    await connectDB();

    const doc = (await IntakeResponse.findOne({ clientId }).lean()) as Record<string, unknown> | null;

    if (!doc) {
      return NextResponse.json({
        responses: {},
        subSectionProgress: {},
        lastActiveSub: "",
        overallProgress: 0,
      });
    }

    // .lean() returns plain objects, not Map instances — no instanceof Map check needed
    const responses = (doc.responses as Record<string, unknown>) ?? {};
    const subSectionProgress = (doc.subSectionProgress as Record<string, unknown>) ?? {};

    // Calculate overall progress
    const allFieldIds = getAllFieldIds();
    const overall = calculateProgress(allFieldIds, responses);

    return NextResponse.json({
      responses,
      subSectionProgress,
      lastActiveSub: doc.lastActiveSub ?? "",
      overallProgress: overall.percent,
    });
  } catch (error) {
    console.error("[RESPONSES GET]", error);
    return NextResponse.json({ error: "Failed to load responses" }, { status: 500 });
  }
}

```

#### ./src/app/api/tts/route.ts
```typescript
/**
 * Edge TTS API route — converts text to speech using Microsoft Edge's TTS service.
 * POST { text: string } → audio/mpeg stream
 */
import { NextRequest, NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const DEFAULT_VOICE = "en-GB-RyanNeural"; // Natural British male voice
const MAX_LENGTH = 2000; // Max characters per request

/** Allowed voice short-names to prevent abuse */
const ALLOWED_VOICES = new Set([
  // GB
  "en-GB-SoniaNeural", "en-GB-RyanNeural", "en-GB-LibbyNeural",
  "en-GB-MaisieNeural", "en-GB-ThomasNeural",
  // US
  "en-US-AvaNeural", "en-US-AndrewNeural", "en-US-EmmaNeural",
  "en-US-BrianNeural", "en-US-AriaNeural", "en-US-JennyNeural",
  "en-US-GuyNeural", "en-US-ChristopherNeural", "en-US-MichelleNeural",
  "en-US-EricNeural", "en-US-RogerNeural", "en-US-SteffanNeural",
  // AU
  "en-AU-NatashaNeural", "en-AU-WilliamMultilingualNeural",
  // IE
  "en-IE-ConnorNeural", "en-IE-EmilyNeural",
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = (body.text ?? "").trim();
    const voice = (body.voice ?? "").trim();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    if (text.length > MAX_LENGTH) {
      return NextResponse.json(
        { error: `Text too long (max ${MAX_LENGTH} chars)` },
        { status: 400 },
      );
    }

    const selectedVoice = voice && ALLOWED_VOICES.has(voice) ? voice : DEFAULT_VOICE;

    // Instantiate a new TTS client per request (manages its own websocket)
    const edgeTts = new MsEdgeTTS();
    await edgeTts.setMetadata(
      selectedVoice,
      OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3,
    );

    const { audioStream } = edgeTts.toStream(text, {
      rate: "-5%",  // Slightly slower for comprehension
      pitch: "+0Hz",
    });

    // Collect audio chunks into a single buffer
    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(Buffer.from(chunk));
    }
    const audioBuffer = Buffer.concat(chunks);

    edgeTts.close();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Content-Length": String(audioBuffer.byteLength),
      },
    });
  } catch (error) {
    console.error("[TTS] Edge TTS error:", error);
    return NextResponse.json(
      { error: "TTS generation failed" },
      { status: 500 },
    );
  }
}

```

### 6. Auth configuration
```typescript
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import type { Session, User as NextAuthUser } from "next-auth";
import type { JWT } from "next-auth/jwt";

/** Convert a lean User document to the shape NextAuth expects. */
function toAuthUser(doc: Record<string, unknown>): {
  id: string;
  email: string;
  name: string;
  role: string;
} {
  return {
    id: String(doc._id),
    email: doc.email as string,
    name: doc.name as string,
    role: doc.role as string,
  };
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      id: "password",
      name: "Password",
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectDB();
        const user = await User.findOne({ email: (credentials.email as string).toLowerCase() }).lean();
        if (!user || !(user as Record<string, unknown>).password) return null;
        const valid = await bcrypt.compare(
          credentials.password as string,
          (user as Record<string, unknown>).password as string
        );
        if (!valid) return null;
        return toAuthUser(user as Record<string, unknown>);
      },
    }),
    // OTP and Passkey providers share the same lookup-by-ID logic
    ...(["otp", "passkey"] as const).map((id) =>
      CredentialsProvider({
        id,
        name: id === "otp" ? "Email OTP" : "Passkey",
        credentials: {
          userId: { type: "text" },
        },
        async authorize(credentials) {
          if (!credentials?.userId) return null;
          await connectDB();
          const user = await User.findById(credentials.userId as string).lean();
          if (!user) return null;
          return toAuthUser(user as Record<string, unknown>);
        },
      })
    ),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: NextAuthUser }) {
      if (user) {
        token.id = user.id;
        token.role = (user as NextAuthUser & { role: string }).role;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token && session.user) {
        (session.user as Session["user"] & { id: string; role: string }).id = token.id as string;
        (session.user as Session["user"] & { id: string; role: string }).role = token.role as string;
      }
      return session;
    },
  },
});

```

### 7. Middleware
```typescript
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes — allow through
  const publicPaths = ["/login", "/verify", "/api/auth"];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Edge-compatible JWT check (no mongoose)
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // DEV BYPASS — remove before production
  if (process.env.NODE_ENV === "development") return NextResponse.next();

  // If no session, redirect to login
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based redirect on root
  if (pathname === "/") {
    const role = (token as { role?: string }).role;
    if (role === "admin" || role === "consultant") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/portal/overview", req.url));
  }

  // Block clients from admin routes
  const role = (token as { role?: string }).role;
  if (pathname.startsWith("/admin") && role !== "admin" && role !== "consultant") {
    return NextResponse.redirect(new URL("/portal/overview", req.url));
  }

  // Block admins from portal routes (optional — remove if admins should access)
  // if (pathname.startsWith("/portal") && (role === "admin" || role === "consultant")) {
  //   return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

```

### 8. Sidebar components

Files found:
```
./src/components/layout/AdminSidebar.tsx
./src/components/layout/FrameworkSidebar.tsx
./src/components/layout/Sidebar.tsx
```

#### ./src/components/layout/AdminSidebar.tsx
```typescript
/**
 * AdminSidebar — admin/consultant navigation.
 * Shows client count badge + blocked project count.
 */
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Settings,
  FileQuestion,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Counts {
  clients: number;
  blockedProjects: number;
}

interface AdminSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ open = true, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [counts, setCounts] = useState<Counts>({ clients: 0, blockedProjects: 0 });

  useEffect(() => {
    Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
    ])
      .then(([c, p]) => {
        const allClients: { status: string }[] = c.data ?? [];
        const allProjects: { status: string }[] = p.data ?? [];
        setCounts({
          clients: allClients.length,
          blockedProjects: allProjects.filter((x) => x.status === "blocked").length,
        });
      })
      .catch(() => {});
  }, []);

  type NavItem = {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    badge: { label: string; className: string } | null;
  };

  const NAV_MAIN: NavItem[] = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, badge: null },
    {
      href: "/admin/clients",
      label: "Clients",
      icon: Users,
      badge: counts.clients > 0 ? { label: String(counts.clients), className: "bg-white/20 text-white/80" } : null,
    },
    {
      href: "/admin/projects",
      label: "Projects",
      icon: FolderKanban,
      badge:
        counts.blockedProjects > 0
          ? { label: String(counts.blockedProjects), className: "bg-red-500/80 text-white" }
          : null,
    },
    { href: "/admin/questions", label: "Questions", icon: FileQuestion, badge: null },
  ];

  const NAV_BOTTOM: NavItem[] = [
    { href: "/admin/settings", label: "Settings", icon: Settings, badge: null },
  ];

  const renderItem = (item: NavItem) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative",
            isActive
              ? "bg-white/15 text-white"
              : "text-white/70 hover:bg-white/10 hover:text-white"
          )}
        >
          <item.icon
            className={cn(
              "w-[1.1rem] h-[1.1rem] flex-shrink-0 transition-colors",
              isActive ? "text-white" : "text-white/60 group-hover:text-white"
            )}
          />
          <span className="flex-1">{item.label}</span>
          {item.badge && (
            <span
              className={cn(
                "inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-semibold tabular-nums",
                item.badge.className
              )}
            >
              {item.badge.label}
            </span>
          )}
        </Link>
      </li>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 w-64 h-screen flex flex-col",
          "transition-transform duration-300 ease-in-out",
          "md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ backgroundColor: "#141414" }}
        aria-label="Admin navigation"
      >
        {/* Logo */}
        <div className="flex items-center px-4 h-16 border-b border-white/10 flex-shrink-0">
          <Image
            src="/logo_blue_650.webp"
            alt="Full Funnel"
            width={140}
            height={40}
            className="object-contain h-9 w-auto"
            priority
          />
        </div>

        {/* Nav */}
        <div className="flex flex-col flex-1 overflow-y-auto py-4 px-3">
          {/* Section label */}
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
            Navigation
          </p>

          <ul className="space-y-0.5 flex-1">
            {NAV_MAIN.map(renderItem)}
          </ul>

          {/* Divider */}
          <div className="my-3 border-t border-white/10" />

          <ul className="space-y-0.5">
            {NAV_BOTTOM.map(renderItem)}
          </ul>
        </div>
      </aside>
    </>
  );
}

```

#### ./src/components/layout/FrameworkSidebar.tsx
```typescript
/**
 * FrameworkSidebar — client-only sidebar with the Growth Strategy Framework nav tree.
 * Proper /portal/[section]/[sub] links. Live progress. No admin stats.
 */
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback, useMemo, memo, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Search,
  Users,
  Target,
  Settings,
  MapPin,
  BarChart3,
  Map,
  Calculator,
  Check,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FieldStatus } from "@/lib/framework-nav";
import { useProgress } from "@/context/ProgressContext";

// ── Nav structure — proper hrefs ─────────────────────────────

interface NavChild {
  id: string;
  label: string;
  href: string;
  badge?: string;
}

interface NavSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  children?: NavChild[];
}

const FRAMEWORK_NAV: NavSection[] = [
  {
    id: "overview",
    label: "Overview",
    icon: <LayoutDashboard className="w-[18px] h-[18px]" />,
    href: "/portal/overview",
  },
  {
    id: "assessment",
    label: "Assessment",
    icon: <Search className="w-[18px] h-[18px]" />,
    children: [
      { id: "checklist", label: "Assessment Checklist", href: "/portal/assessment/checklist" },
      { id: "swot", label: "SWOT Analysis", href: "/portal/assessment/swot" },
      { id: "most", label: "MOST Analysis", href: "/portal/assessment/most" },
      { id: "gap", label: "Gap Analysis", href: "/portal/assessment/gap" },
      { id: "leadership", label: "Leadership Questions", href: "/portal/assessment/leadership" },
    ],
  },
  {
    id: "people",
    label: "People",
    icon: <Users className="w-[18px] h-[18px]" />,
    children: [
      { id: "team", label: "Team Members", href: "/portal/people/team" },
      { id: "structure", label: "Company Structure", href: "/portal/people/structure" },
      { id: "challenges", label: "Challenges & Strategy", href: "/portal/people/challenges" },
      { id: "methodology", label: "Team Capability Tracker", href: "/portal/people/methodology" },
    ],
  },
  {
    id: "product",
    label: "Product",
    icon: <Target className="w-[18px] h-[18px]" />,
    children: [
      { id: "challenges", label: "Product Challenges", href: "/portal/product/challenges" },
      { id: "outcomes", label: "Outcome Mapper", href: "/portal/product/outcomes" },
    ],
  },
  {
    id: "process",
    label: "Process",
    icon: <Settings className="w-[18px] h-[18px]" />,
    children: [
      { id: "checklist", label: "Process Checklist", href: "/portal/process/checklist" },
      { id: "methodology", label: "Sales Methodology", href: "/portal/process/methodology" },
      { id: "builder", label: "Sales Process Builder", href: "/portal/process/builder" },
    ],
  },
  {
    id: "roadmap",
    label: "Roadmap",
    icon: <MapPin className="w-[18px] h-[18px]" />,
    href: "/portal/roadmap",
  },
  {
    id: "kpis",
    label: "KPIs",
    icon: <BarChart3 className="w-[18px] h-[18px]" />,
    href: "/portal/kpis",
  },
  {
    id: "gtm",
    label: "GTM Playbook",
    icon: <Map className="w-[18px] h-[18px]" />,
    children: [
      { id: "market", label: "Market Intelligence", href: "/portal/gtm/market" },
      { id: "competition", label: "Competition", href: "/portal/gtm/competition" },
    ],
  },
  {
    id: "tools",
    label: "Tools",
    icon: <Calculator className="w-[18px] h-[18px]" />,
    children: [
      { id: "modeller", label: "Financial Modeller", href: "/portal/modeller", badge: "PRO" },
      { id: "hiring-plan", label: "Hiring Plan", href: "/portal/modeller/hiring", badge: "PRO" },
    ],
  },
];

// ── Status dot ───────────────────────────────────────────────

function StatusDot({ status }: { status: FieldStatus }) {
  return (
    <span
      className={cn(
        "inline-block w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-300",
        status === "complete" && "bg-brand-green",
        status === "in_progress" && "bg-amber-400",
        status === "not_started" && "bg-white/30"
      )}
    />
  );
}

// ── Pulsing status dot for top-level items ───────────────────

function TopLevelStatusDot({ status }: { status: FieldStatus }) {
  if (status === "complete") {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-2 h-2 rounded-full bg-brand-green flex-shrink-0"
      />
    );
  }
  if (status === "in_progress") {
    return (
      <span className="relative flex-shrink-0 w-2 h-2">
        <motion.span
          className="absolute inset-0 rounded-full bg-amber-400/40"
          animate={{ scale: [1, 1.9, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="absolute inset-0 rounded-full bg-amber-400" />
      </span>
    );
  }
  return <span className="w-2 h-2 rounded-full bg-white/20 flex-shrink-0" />;
}

// ── Mini progress bar ────────────────────────────────────────

function MiniProgress({ percent, status }: { percent: number; status: FieldStatus }) {
  return (
    <div className="w-12 h-1.5 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
      <motion.div
        className={cn(
          "h-full rounded-full",
          status === "complete" && "bg-brand-green",
          status === "in_progress" && "bg-amber-400",
          status === "not_started" && "bg-white/20"
        )}
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}

// ── Nav Item (leaf) ──────────────────────────────────────────

const NavItem = memo(function NavItem({
  label,
  href,
  isActive,
  progress = 0,
  status = "not_started",
  badge,
  onClick,
}: {
  label: string;
  href: string;
  isActive: boolean;
  progress?: number;
  status?: FieldStatus;
  badge?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      title={label}
      data-nav-active={isActive ? "true" : undefined}
      className={cn(
        "flex items-center gap-2 py-1.5 px-2 rounded-md text-sm transition-all duration-150 group relative",
        isActive
          ? "bg-white/15 text-white"
          : "text-white/65 hover:bg-white/10 hover:text-white"
      )}
    >
      {!badge && <StatusDot status={status} />}
      <span className="flex-1 min-w-0">{label}</span>
      {badge && (
        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 leading-none">
          {badge}
        </span>
      )}
      {!badge && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <MiniProgress percent={progress} status={status} />
        {status === "complete" ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.3 }}
          >
            <Check className="w-3.5 h-3.5 text-brand-green" />
          </motion.div>
        ) : (
          <span className="text-xs text-white/40 w-7 text-right tabular-nums">
            {progress}%
          </span>
        )}
      </div>
      )}
    </Link>
  );
});

// ── Section Group (collapsible parent) ───────────────────────

const SectionGroup = memo(function SectionGroup({
  section,
  isActive,
  activePathname,
  progress = 0,
  status = "not_started",
  isOpen,
  onToggle,
  onChildClick,
  getChildProgress,
}: {
  section: NavSection;
  isActive: boolean;
  activePathname: string;
  progress?: number;
  status?: FieldStatus;
  isOpen: boolean;
  onToggle: (id: string) => void;
  onChildClick?: () => void;
  getChildProgress?: (sectionId: string, childId: string) => { percent: number; status: FieldStatus };
}) {

  // If flat section (no children), render as direct link
  if (!section.children || section.children.length === 0) {
    return (
      <Link
        href={section.href || "#"}
        onClick={onChildClick}
        title={section.label}
        className={cn(
          "flex items-center gap-2.5 py-2 px-2 rounded-lg text-sm font-medium transition-all duration-150 group relative",
          isActive
            ? "bg-white/15 text-white"
            : "text-white/80 hover:bg-white/10 hover:text-white"
        )}
      >
        <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
          {section.icon}
        </span>
        <span className="flex-1 min-w-0">{section.label}</span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {section.id !== "overview" && <MiniProgress percent={progress} status={status} />}
          {status === "complete" && section.id !== "overview" ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ duration: 0.3 }}>
              <Check className="w-3.5 h-3.5 text-brand-green" />
            </motion.div>
          ) : section.id !== "overview" ? (
            <span className="text-xs text-white/40 w-7 text-right tabular-nums">{progress}%</span>
          ) : null}
        </div>
      </Link>
    );
  }

  // Has children — collapsible group
  const anyChildActive = section.children.some(
    (c) => activePathname === c.href || activePathname.startsWith(c.href + "/")
  );

  return (
    <div>
      <button
        onClick={() => onToggle(section.id)}
        className="flex items-center gap-2.5 py-2 px-2 rounded-lg text-sm font-medium w-full text-left transition-all duration-150 text-white/80 hover:bg-white/10 hover:text-white"
      >
        <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
          {section.icon}
        </span>
        <span className="flex-1 min-w-0">{section.label}</span>
        {section.id !== "tools" && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <TopLevelStatusDot status={status} />
            <span className={cn(
              "text-xs tabular-nums w-7 text-right",
              status === "complete" && "text-brand-green",
              status === "in_progress" && "text-amber-400",
              status === "not_started" && "text-white/40"
            )}>{progress}%</span>
          </div>
        )}
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-0.5 flex-shrink-0"
        >
          <ChevronRight className="w-3.5 h-3.5 text-white/40" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-7 mt-0.5 space-y-0.5 border-l border-white/10 pl-2">
              {section.children.map((child) => {
                const childActive =
                  activePathname === child.href ||
                  activePathname.startsWith(child.href + "/");
                const cp = getChildProgress?.(section.id, child.id) ?? { percent: 0, status: "not_started" as FieldStatus };
                return (
                  <NavItem
                    key={child.id}
                    label={child.label}
                    href={child.href}
                    isActive={childActive}
                    progress={cp.percent}
                    status={cp.status}
                    badge={child.badge}
                    onClick={onChildClick}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ── Inner (uses hooks) ───────────────────────────────────────

function FrameworkSidebarInner({
  open = true,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { progress: progressData, refreshAll } = useProgress();

  // Fallback: keep sidebar progress in sync even if a save event is missed
  // (e.g. fast navigation during debounced autosave).
  useEffect(() => {
    void refreshAll();
  }, [pathname, refreshAll]);

  useEffect(() => {
    const id = setInterval(() => {
      void refreshAll();
    }, 10000);
    return () => clearInterval(id);
  }, [refreshAll]);

  // Derive which group is active from the current path
  const activeGroup = pathname.split("/")[2] ?? null;

  // Accordion state — only one group open at a time
  const [openGroup, setOpenGroup] = useState<string | null>(activeGroup);

  // When pathname changes, auto-open the matching group
  useEffect(() => {
    setOpenGroup(activeGroup);
  }, [activeGroup]);

  const toggleGroup = useCallback(
    (groupId: string) => {
      setOpenGroup((prev) => (prev === groupId ? null : groupId));
    },
    []
  );

  // Auto-scroll active child into view
  useEffect(() => {
    const timer = setTimeout(() => {
      const el = document.querySelector('[data-nav-active="true"]');
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Compute child progress from context
  const getChildProgress = useCallback(
    (sectionId: string, childId: string): { percent: number; status: FieldStatus } => {
      const key = `${sectionId}-${childId}`;
      const p = progressData[key];
      if (!p || p.totalCount === 0) return { percent: 0, status: "not_started" };
      const pct = Math.round((p.answeredCount / p.totalCount) * 100);
      return {
        percent: pct,
        status: pct >= 100 ? "complete" : pct > 0 ? "in_progress" : "not_started",
      };
    },
    [progressData]
  );

  // Compute section-level progress (average of children, or flat lookup)
  const sectionProgressMap = useMemo(() => {
    const map: Record<string, { percent: number; status: FieldStatus }> = {};
    for (const section of FRAMEWORK_NAV) {
      if (!section.children || section.children.length === 0) {
        // Flat sections store progress under "{sectionId}-{sectionId}"
        const key = `${section.id}-${section.id}`;
        const p = progressData[key];
        if (p && p.totalCount > 0) {
          const pct = Math.round((p.answeredCount / p.totalCount) * 100);
          map[section.id] = {
            percent: pct,
            status: pct >= 100 ? "complete" : pct > 0 ? "in_progress" : "not_started",
          };
        } else {
          map[section.id] = { percent: 0, status: "not_started" };
        }
        continue;
      }
      const childPcts = section.children.map(
        (c) => getChildProgress(section.id, c.id).percent
      );
      const avg =
        childPcts.length > 0
          ? Math.round(childPcts.reduce((a, b) => a + b, 0) / childPcts.length)
          : 0;
      map[section.id] = {
        percent: avg,
        status: avg >= 100 ? "complete" : avg > 0 ? "in_progress" : "not_started",
      };
    }
    return map;
  }, [getChildProgress, progressData]);

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 w-64 h-screen",
          "transition-transform duration-300 ease-in-out",
          "md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ backgroundColor: "#141414" }}
        aria-label="Framework navigation"
      >
        {/* Logo */}
        <div className="flex items-center px-4 h-16 border-b border-white/10 flex-shrink-0">
          <Image
            src="/logo_blue_650.webp"
            alt="Full Funnel"
            width={140}
            height={40}
            className="object-contain h-9 w-auto"
            priority
          />
        </div>

        {/* Nav tree */}
        <div
          className="flex flex-col overflow-y-auto py-3 px-2 scrollbar-thin scrollbar-thumb-white/10"
          style={{ height: "calc(100vh - 4rem)" }}
        >
          <nav className="space-y-1 flex-1">
            {FRAMEWORK_NAV.map((section) => {
              const isActive =
                section.href
                  ? pathname === section.href || pathname.startsWith(section.href + "/")
                  : section.children?.some(
                      (c) =>
                        pathname === c.href ||
                        pathname.startsWith(c.href + "/")
                    ) ?? false;

              const sp = sectionProgressMap[section.id] ?? { percent: 0, status: "not_started" as FieldStatus };

              return (
                <SectionGroup
                  key={section.id}
                  section={section}
                  isActive={!section.children && isActive}
                  activePathname={pathname}
                  progress={sp.percent}
                  status={sp.status}
                  isOpen={openGroup === section.id}
                  onToggle={toggleGroup}
                  onChildClick={onClose}
                  getChildProgress={getChildProgress}
                />
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}

// ── Export with Suspense boundary ────────────────────────────

interface FrameworkSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function FrameworkSidebar(props: FrameworkSidebarProps) {
  return (
    <Suspense fallback={null}>
      <FrameworkSidebarInner {...props} />
    </Suspense>
  );
}

```

#### ./src/components/layout/Sidebar.tsx
```typescript
"use client";

import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Search,
  Users,
  Target,
  Settings,
  MapPin,
  BarChart3,
  Map,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FRAMEWORK_NAV,
  buildProgressMap,
  progressToStatus,
  type FieldStatus,
} from "@/lib/framework-nav";

// NOTE: SidebarNavItem module was never created. This entire component is unused
// (replaced by FrameworkSidebar). Keeping stub types so the file compiles.
type SidebarSectionProps = {
  label: string; icon: React.ReactNode; progress: number; status: FieldStatus;
  isCollapsed: boolean; href?: string; isActive?: boolean; onClick?: () => void;
  children?: React.ReactNode;
};
function SidebarSection(props: SidebarSectionProps) { return null; }
type SidebarNavItemProps = {
  label: string; href: string; progress: number; status: FieldStatus;
  isActive: boolean; isCollapsed: boolean; onClick?: () => void;
};
function SidebarNavItem(props: SidebarNavItemProps) { return null; }

// ── Icon map ─────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="w-4.5 h-4.5" />,
  Search: <Search className="w-4.5 h-4.5" />,
  Users: <Users className="w-4.5 h-4.5" />,
  Target: <Target className="w-4.5 h-4.5" />,
  Settings: <Settings className="w-4.5 h-4.5" />,
  MapPin: <MapPin className="w-4.5 h-4.5" />,
  BarChart3: <BarChart3 className="w-4.5 h-4.5" />,
  Map: <Map className="w-4.5 h-4.5" />,
};

// ── Types ────────────────────────────────────────────────────

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  clientId?: string;
}

type ProgressMap = Record<
  string,
  { answered: number; total: number; percent: number; status: FieldStatus }
>;

// ── Inner component that uses useSearchParams ────────────────

function SidebarInner({ open = true, onClose, clientId }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progressMap, setProgressMap] = useState<ProgressMap>({});
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Determine active sub from URL
  const activeSection = searchParams.get("section") || "";
  const activeSub = searchParams.get("sub") || "";
  const activeTab = searchParams.get("tab") || "";

  // Fetch progress data
  const fetchProgress = useCallback(async () => {
    if (!clientId) return;
    try {
      const res = await fetch(`/api/responses/${clientId}`);
      if (!res.ok) return;
      const data = await res.json();
      const responses = data.responses || {};
      const map = buildProgressMap(responses);
      setProgressMap(map);
    } catch {
      // silently fail — progress just shows 0
    }
  }, [clientId]);

  useEffect(() => {
    fetchProgress();
    // Re-fetch progress every 10s for live updates
    const interval = setInterval(fetchProgress, 10000);
    return () => clearInterval(interval);
  }, [fetchProgress]);

  // Listen for custom progress update events (fired by AutosaveField)
  useEffect(() => {
    const handler = () => fetchProgress();
    window.addEventListener("progress-updated", handler);
    return () => window.removeEventListener("progress-updated", handler);
  }, [fetchProgress]);

  // Build href with clientId
  function buildHref(template: string): string {
    return template.replace("CLIENT_ID", clientId || "");
  }

  function isItemActive(sectionId: string, subId?: string): boolean {
    if (sectionId === "overview") {
      return pathname === "/portal/overview";
    }
    if (sectionId === "gtm") {
      if (!subId) return pathname === "/portal/gtm";
      if (subId === "gtm-marketplace") return activeTab === "marketplace" || (!activeTab && pathname === "/portal/gtm");
      if (subId === "gtm-competition") return activeTab === "competition";
    }
    if (subId) {
      const subShort = subId.split("-").slice(1).join("-");
      return activeSection === sectionId && activeSub === subShort;
    }
    return pathname.includes(sectionId);
  }

  const getProgress = (id: string) =>
    progressMap[id] || { answered: 0, total: 0, percent: 0, status: "not_started" as FieldStatus };

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen",
          "transition-all duration-300 ease-in-out",
          "md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-16" : "w-64"
        )}
        style={{ backgroundColor: "#141414" }}
        aria-label="Sidebar navigation"
      >
        {/* Logo area */}
        <div className="flex items-center px-4 h-16 border-b border-white/10 flex-shrink-0">
          <Image
            src="/logo_blue_650.webp"
            alt="Full Funnel"
            width={140}
            height={40}
            className={cn("object-contain h-9 w-auto", isCollapsed && "hidden")}
            priority
          />
          {isCollapsed && (
            <Image
              src="/logo_blue_650.webp"
              alt="Full Funnel"
              width={32}
              height={32}
              className="object-contain h-7 w-auto mx-auto"
              priority
            />
          )}
        </div>

        {/* Nav tree */}
        <div
          className="flex flex-col overflow-y-auto py-3 px-2 scrollbar-thin scrollbar-thumb-white/10"
          style={{ height: "calc(100vh - 4rem)" }}
        >
          <nav className="space-y-1 flex-1">
            {FRAMEWORK_NAV.map((section) => {
              const sp = getProgress(section.id);

              // Flat section (no children)
              if (section.children.length === 0) {
                return (
                  <SidebarSection
                    key={section.id}
                    label={section.label}
                    icon={ICON_MAP[section.icon] || <LayoutDashboard className="w-4.5 h-4.5" />}
                    progress={sp.percent}
                    status={sp.status}
                    isCollapsed={isCollapsed}
                    href={buildHref(section.href || "#")}
                    isActive={isItemActive(section.id)}
                    onClick={onClose}
                  />
                );
              }

              // Section with children
              return (
                <SidebarSection
                  key={section.id}
                  label={section.label}
                  icon={ICON_MAP[section.icon] || <LayoutDashboard className="w-4.5 h-4.5" />}
                  progress={sp.percent}
                  status={sp.status}
                  isCollapsed={isCollapsed}
                >
                  {section.children.map((child) => {
                    const cp = getProgress(child.id);
                    return (
                      <SidebarNavItem
                        key={child.id}
                        label={child.label}
                        href={buildHref(child.href)}
                        progress={cp.percent}
                        status={cp.status}
                        isActive={isItemActive(section.id, child.id)}
                        isCollapsed={isCollapsed}
                        onClick={onClose}
                      />
                    );
                  })}
                </SidebarSection>
              );
            })}
          </nav>

          {/* Collapse toggle — desktop only */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center mt-4 py-2 text-white/40 hover:text-white/70 transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <motion.svg
              animate={{ rotate: isCollapsed ? 180 : 0 }}
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </motion.svg>
          </button>
        </div>
      </aside>
    </>
  );
}

// ── Exported wrapper with Suspense ───────────────────────────

export function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={null}>
      <SidebarInner {...props} />
    </Suspense>
  );
}

```

### 9. All layout files

Files found:
```
./src/app/(admin)/admin/clients/[id]/layout.tsx
./src/app/(admin)/layout.tsx
./src/app/(auth)/layout.tsx
./src/app/(portal)/layout.tsx
./src/app/layout.tsx
```

#### ./src/app/(admin)/admin/clients/[id]/layout.tsx
```typescript
/**
 * Client detail layout — wraps all /admin/clients/[id]/* sub-pages.
 * Renders a breadcrumb and persistent tab bar so the user can switch
 * between Overview, Responses, KPIs, Roadmap, and Activity.
 */
"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Overview",        suffix: "" },
  { label: "Responses",       suffix: "/responses" },
  { label: "KPIs",            suffix: "/kpis" },
  { label: "Roadmap",         suffix: "/roadmap" },
  { label: "Financial Model", suffix: "/financial-model" },
  { label: "Hiring Plan",     suffix: "/hiring-plan" },
  { label: "Activity",        suffix: "/activity" },
] as const;

export default function ClientDetailLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const [clientName, setClientName] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/clients/${id}`)
      .then((r) => r.json())
      .then((d) => setClientName(d.data?.businessName ?? "Client"))
      .catch(() => {});
  }, [id]);

  const base = `/admin/clients/${id}`;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <button
        onClick={() => router.push("/admin/clients")}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-5 mt-1"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        All clients
      </button>

      {/* Client name */}
      {clientName && (
        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-sans font-bold text-2xl text-slate-900 mb-4"
        >
          {clientName}
        </motion.h1>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 bg-[#141414] rounded-lg p-1.5 mb-6 w-fit">
        {TABS.map((tab) => {
          const href = base + tab.suffix;
          const isActive = tab.suffix === ""
            ? pathname === base || pathname === base + "/"
            : pathname.startsWith(href);
          return (
            <button
              key={tab.label}
              onClick={() => router.push(href)}
              className="relative px-4 py-2 rounded-md text-sm font-semibold transition-colors z-10"
              style={{ color: isActive ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.55)" }}
            >
              {isActive && (
                <motion.div
                  layoutId="client-tab-pill"
                  className="absolute inset-0 bg-white/15 rounded-md"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  style={{ zIndex: -1 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Page content */}
      <div>{children}</div>
    </div>
  );
}

```

#### ./src/app/(admin)/layout.tsx
```typescript
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import type { SessionUser } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin — Full Funnel",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as SessionUser;

  return (
    <AdminShell userName={user.name} userEmail={user.email}>
      {children}
    </AdminShell>
  );
}

```

#### ./src/app/(auth)/layout.tsx
```typescript
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

```

#### ./src/app/(portal)/layout.tsx
```typescript
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PortalShell } from "@/components/layout/PortalShell";
import type { SessionUser } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Portal — Full Funnel",
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as SessionUser;

  return (
    <PortalShell
      userName={user.name}
      userEmail={user.email}
    >
      {children}
    </PortalShell>
  );
}


```

#### ./src/app/layout.tsx
```typescript
import type { Metadata } from "next";
import { Josefin_Sans, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const josefinSans = Josefin_Sans({
  weight: ["300", "400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-josefin",
  display: "swap",
});

const inter = Inter({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Full Funnel — Growth Strategy Portal",
  description: "Private client portal for Full Funnel business consulting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${josefinSans.variable} ${inter.variable} font-sans bg-white text-navy antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

```

### 10. Environment variables (keys only, no values)
```
MONGODB_URI=REDACTED
NEXTAUTH_SECRET=REDACTED
NEXTAUTH_URL=REDACTED
SENDGRID_API_KEY=REDACTED
SENDGRID_FROM_EMAIL=REDACTED
SENDGRID_FROM_NAME=REDACTED
WEBAUTHN_RP_NAME=REDACTED
WEBAUTHN_RP_ID=REDACTED
WEBAUTHN_ORIGIN=REDACTED
```

### 11. Database connection
```typescript
import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend the NodeJS global type
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URI environment variable in .env.local"
    );
  }
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
    };
    cached!.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

```

### 12. Existing types / interfaces

Files found:
```
./src/types/index.ts
```

#### ./src/types/index.ts
```typescript
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
  clientId: string;
  clientName?: string;
  dueDate?: string | null;
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

export const CLIENT_STATUS_META: Record<ClientStatus, { label: string; badge: string }> = {
  invited:     { label: "Invited",     badge: "info" },
  onboarding:  { label: "Onboarding",  badge: "warning" },
  active:      { label: "Active",      badge: "success" },
  paused:      { label: "Paused",      badge: "neutral" },
};

```

### 13. Any existing context providers

Files found:
```
./src/components/Providers.tsx
./src/components/notifications/ToastContext.tsx
./src/context/ProgressContext.tsx
```

#### ./src/components/Providers.tsx
```typescript
"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/notifications/ToastContext";
import { ToasterDisplay } from "@/components/notifications/ToasterDisplay";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        {children}
        <ToasterDisplay />
      </ToastProvider>
    </SessionProvider>
  );
}

```

#### ./src/components/notifications/ToastContext.tsx
```typescript
"use client";
import { createContext, useContext, useState, useCallback, useRef } from "react";
import type { Toast, ToastVariant } from "@/types";
import { generateId } from "@/lib/utils";

interface ToastContextValue {
  toasts: Toast[];
  toast: (opts: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const toast = useCallback(
    (opts: Omit<Toast, "id">) => {
      const id = generateId();
      const duration = opts.duration ?? 5000;
      setToasts((prev) => [...prev, { ...opts, id }]);
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  const make = useCallback(
    (variant: ToastVariant) =>
      (title: string, message?: string) =>
        toast({ variant, title, message }),
    [toast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        toast,
        dismiss,
        success: make("success"),
        error: make("error"),
        warning: make("warning"),
        info: make("info"),
      }}
    >
      {children}
    </ToastContext.Provider>
  );
}

```

#### ./src/context/ProgressContext.tsx
```typescript
/**
 * ProgressContext — global progress state for the portal.
 * Sidebar and pages both read from this context.
 * AutosaveField updates it after every successful save.
 */
"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

interface SubSectionProgress {
  answeredCount: number;
  totalCount: number;
  lastSavedAt: string | null;
}

interface ProgressContextValue {
  clientId: string | null;
  /** Keyed by sub-section ID, e.g. "assessment-swot" */
  progress: Record<string, SubSectionProgress>;
  /** True once the first server fetch has completed */
  loaded: boolean;
  /** Update a single sub-section after a successful autosave */
  updateSubSection: (
    subSectionId: string,
    data: { answeredCount: number; totalCount: number; lastSavedAt: string }
  ) => void;
  /** Re-fetch all progress from the server */
  refreshAll: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextValue>({
  clientId: null,
  progress: {},
  loaded: false,
  updateSubSection: () => {},
  refreshAll: async () => {},
});

export function useProgress() {
  return useContext(ProgressContext);
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [clientId, setClientId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, SubSectionProgress>>(
    {}
  );
  const [loaded, setLoaded] = useState(false);

  // Fetch client ID on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me/client");
        if (!res.ok) return;
        const json = await res.json();
        setClientId(json.clientId);
      } catch {
        /* silent */
      }
    })();
  }, []);

  // Fetch all progress when clientId is known
  const refreshAll = useCallback(async () => {
    if (!clientId) return;
    try {
      const res = await fetch(`/api/responses/${clientId}`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.subSectionProgress) {
        setProgress(json.subSectionProgress);
      }
    } catch {
      /* silent */
    } finally {
      setLoaded(true);
    }
  }, [clientId]);

  useEffect(() => {
    if (clientId) refreshAll();
  }, [clientId, refreshAll]);

  const updateSubSection = useCallback(
    (
      subSectionId: string,
      data: { answeredCount: number; totalCount: number; lastSavedAt: string }
    ) => {
      setProgress((prev) => ({ ...prev, [subSectionId]: data }));
    },
    []
  );

  return (
    <ProgressContext.Provider
      value={{ clientId, progress, loaded, updateSubSection, refreshAll }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

```

### 14. Current Client model specifically
```typescript
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IClient extends Document {
  userId: Types.ObjectId;
  businessName: string;
  status: "invited" | "onboarding" | "active" | "paused";
  onboardingCompletedAt?: Date;
  assignedConsultant?: Types.ObjectId;
  intakeResponses?: Types.ObjectId;
  notes?: string;
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
  plan?: "standard" | "premium";
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    businessName: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["invited", "onboarding", "active", "paused"],
      default: "invited",
    },
    onboardingCompletedAt: { type: Date },
    assignedConsultant: { type: Schema.Types.ObjectId, ref: "User" },
    intakeResponses: { type: Schema.Types.ObjectId, ref: "IntakeResponse" },
    notes: { type: String },
    contactName: { type: String, trim: true },
    jobTitle:    { type: String, trim: true },
    contactEmail:{ type: String, trim: true, lowercase: true },
    phone:       { type: String, trim: true },
    invoicingEmail: { type: String, trim: true, lowercase: true },
    website:     { type: String, trim: true },
    addressLine1: { type: String, trim: true },
    addressLine2: { type: String, trim: true },
    city:        { type: String, trim: true },
    postcode:    { type: String, trim: true },
    country:     { type: String, trim: true },
    plan: { type: String, enum: ["standard", "premium"], default: "standard" },
  },
  { timestamps: true }
);

// Indexes for common query patterns
ClientSchema.index({ userId: 1 }, { unique: true });
ClientSchema.index({ status: 1 });

const Client = mongoose.models.Client ?? mongoose.model<IClient>("Client", ClientSchema);
export default Client;

```

### 15. Current User model specifically
```typescript
import mongoose, { Schema, Document } from "mongoose";

export interface IPasskeyCredential {
  credentialId: string;
  publicKey: string;
  counter: number;
  transports: string[];
}

export interface IUser extends Document {
  email: string;
  name: string;
  password?: string;
  role: "admin" | "consultant" | "client";
  passkeyCredentials: IPasskeyCredential[];
  otpSecret?: string;
  otpExpiry?: Date;
  currentChallenge?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PasskeyCredentialSchema = new Schema<IPasskeyCredential>({
  credentialId: { type: String, required: true },
  publicKey: { type: String, required: true },
  counter: { type: Number, required: true, default: 0 },
  transports: [String],
});

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    password: { type: String },
    role: {
      type: String,
      enum: ["admin", "consultant", "client"],
      default: "client",
    },
    passkeyCredentials: [PasskeyCredentialSchema],
    otpSecret: { type: String },
    otpExpiry: { type: Date },
    currentChallenge: { type: String },
  },
  { timestamps: true }
);

const User = mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
export default User;

```

