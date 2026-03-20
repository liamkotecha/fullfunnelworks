import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISubSectionProgress {
  answeredCount: number;
  totalCount: number;
  lastSavedAt: Date | null;
}

export interface ITeamMember {
  userId: Types.ObjectId;
  name: string;
  email: string;
  role: string;
  invitedAt: Date;
  submittedAt?: Date;
  invitedBy: Types.ObjectId;
}

export interface ISynthesisEntry {
  value: unknown;
  source: "consultant" | "consensus" | "individual";
  writtenBy?: Types.ObjectId;
  writtenAt?: Date;
  divergence?: number;
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
  // Team collaboration
  teamMode: boolean;
  teamMembers: ITeamMember[];
  individualResponses: Map<string, Map<string, unknown>>;
  synthesisResponses: Map<string, ISynthesisEntry>;
  synthesisCompletedAt?: Date;
  synthesisCompletedBy?: Types.ObjectId;
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

const TeamMemberSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, default: "" },
    invitedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { _id: false }
);

const SynthesisEntrySchema = new Schema(
  {
    value: { type: Schema.Types.Mixed },
    source: { type: String, enum: ["consultant", "consensus", "individual"], default: "consultant" },
    writtenBy: { type: Schema.Types.ObjectId, ref: "User" },
    writtenAt: { type: Date },
    divergence: { type: Number },
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
    // Team collaboration
    teamMode: { type: Boolean, default: false },
    teamMembers: [TeamMemberSchema],
    individualResponses: {
      type: Map,
      of: { type: Map, of: Schema.Types.Mixed },
      default: {},
    },
    synthesisResponses: {
      type: Map,
      of: SynthesisEntrySchema,
      default: {},
    },
    synthesisCompletedAt: { type: Date },
    synthesisCompletedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// clientId is queried on almost every request (autosave, load, progress)
IntakeResponseSchema.index({ clientId: 1 }, { unique: true });

const IntakeResponse =
  mongoose.models.IntakeResponse ??
  mongoose.model<IIntakeResponse>("IntakeResponse", IntakeResponseSchema);
export default IntakeResponse;
