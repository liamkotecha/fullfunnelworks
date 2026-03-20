import mongoose, { Schema, Document, Types } from "mongoose";

export type ProspectStage =
  | "mql"
  | "sql"
  | "discovery"
  | "proposal"
  | "negotiating"
  | "won"
  | "lost";

export type LeadSource = "web_form" | "manual" | "referral" | "event" | "other";

export interface ILeadScoreBreakdown {
  companySizeScore: number;
  revenueScore: number;
  challengeScore: number;
  completenessScore: number;
  total: number;
}

export interface IProspect extends Document {
  // Core identity
  businessName: string;
  contactName: string;
  contactEmail: string;
  phone?: string;
  website?: string;

  // Qualification data (from form)
  companySize?: "1-10" | "11-50" | "51-200" | "201-500" | "500+";
  revenueRange?: "pre-revenue" | "under-500k" | "500k-2m" | "2m-10m" | "10m+";
  primaryChallenge?: string;
  hearAboutUs?: string;
  message?: string;

  // Pipeline
  stage: ProspectStage;
  dealValue?: number;
  lostReason?: string;
  lostAt?: Date;

  // Assignment
  assignedConsultant?: Types.ObjectId;

  // Lead scoring
  leadScore: number;
  leadScoreBreakdown: ILeadScoreBreakdown;

  // Source tracking
  source: LeadSource;
  gaClientId?: string;
  referrerUrl?: string;

  // Lifecycle timestamps
  qualifiedAt?: Date;
  discoveryAt?: Date;
  proposalSentAt?: Date;
  wonAt?: Date;
  convertedAt?: Date;
  clientId?: Types.ObjectId;

  // Activity log
  activityLog: IActivityLogEntry[];

  // Tasks
  tasks: IProspectTask[];

  // Stage history
  stageEnteredAt: Map<string, Date>;

  // Meta
  notes?: string;
  autoResponseSentAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface IActivityLogEntry {
  _id?: Types.ObjectId;
  type: "stage_change" | "note" | "assignment" | "system";
  message: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
}

export interface IProspectTask {
  _id?: Types.ObjectId;
  title: string;
  dueDate?: Date;
  assignedTo?: Types.ObjectId;
  completedAt?: Date;
  createdAt: Date;
}

const LeadScoreBreakdownSchema = new Schema<ILeadScoreBreakdown>(
  {
    companySizeScore: { type: Number, default: 0 },
    revenueScore: { type: Number, default: 0 },
    challengeScore: { type: Number, default: 0 },
    completenessScore: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

const ProspectSchema = new Schema<IProspect>(
  {
    businessName: { type: String, required: true, trim: true },
    contactName: { type: String, required: true, trim: true },
    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: { type: String, trim: true },
    website: { type: String, trim: true },
    companySize: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "500+"],
    },
    revenueRange: {
      type: String,
      enum: ["pre-revenue", "under-500k", "500k-2m", "2m-10m", "10m+"],
    },
    primaryChallenge: { type: String },
    hearAboutUs: { type: String },
    message: { type: String },
    stage: {
      type: String,
      enum: ["mql", "sql", "discovery", "proposal", "negotiating", "won", "lost"],
      default: "mql",
    },
    dealValue: { type: Number },
    lostReason: { type: String },
    lostAt: { type: Date },
    assignedConsultant: { type: Schema.Types.ObjectId, ref: "User" },
    leadScore: { type: Number, default: 0 },
    leadScoreBreakdown: { type: LeadScoreBreakdownSchema, default: () => ({}) },
    source: {
      type: String,
      enum: ["web_form", "manual", "referral", "event", "other"],
      default: "web_form",
    },
    gaClientId: { type: String },
    referrerUrl: { type: String },
    qualifiedAt: { type: Date },
    discoveryAt: { type: Date },
    proposalSentAt: { type: Date },
    wonAt: { type: Date },
    convertedAt: { type: Date },
    clientId: { type: Schema.Types.ObjectId, ref: "Client" },
    activityLog: [
      {
        type: { type: String, enum: ["stage_change", "note", "assignment", "system"], required: true },
        message: { type: String, required: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    tasks: [
      {
        title: { type: String, required: true },
        dueDate: { type: Date },
        assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
        completedAt: { type: Date },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    stageEnteredAt: {
      type: Map,
      of: Date,
      default: () => new Map([["mql", new Date()]]),
    },
    notes: { type: String },
    autoResponseSentAt: { type: Date },
  },
  { timestamps: true }
);

ProspectSchema.index({ stage: 1, createdAt: -1 });
ProspectSchema.index({ assignedConsultant: 1, stage: 1 });
ProspectSchema.index({ contactEmail: 1 });
ProspectSchema.index({ leadScore: -1 });

const Prospect =
  mongoose.models.Prospect ??
  mongoose.model<IProspect>("Prospect", ProspectSchema);
export default Prospect;
