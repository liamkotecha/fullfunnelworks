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
  sponsorId?: Types.ObjectId;
  dueDate?: Date;
  projectPrincipal?: { name: string; email: string; role?: string };
  activeModules: string[];
  lastActivityAt: Date;
  staleness: "active" | "nudge" | "stalled" | "at_risk" | "terminated";
  terminatedAt?: Date;
  terminatedReason?: string;
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
    sponsorId: { type: Schema.Types.ObjectId, ref: "User" },
    dueDate: { type: Date },
    projectPrincipal: {
      type: new Schema({ name: String, email: String, role: String }, { _id: false }),
      required: false,
    },
    activeModules: {
      type: [String],
      enum: [
        "assessment",
        "people",
        "product",
        "process",
        "roadmap",
        "kpis",
        "gtm",
        "modeller",
        "hiring",
        "revenue_execution",
        "execution_planning",
      ],
      default: ["assessment"],
    },
    lastActivityAt: { type: Date, default: Date.now },
    staleness: {
      type: String,
      enum: ["active", "nudge", "stalled", "at_risk", "terminated"],
      default: "active",
    },
    terminatedAt: { type: Date },
    terminatedReason: { type: String },
  },
  { timestamps: true }
);

// Indexes for common query patterns
ProjectSchema.index({ clientId: 1, status: 1 });
ProjectSchema.index({ assignedTo: 1 });

const Project = mongoose.models.Project ?? mongoose.model<IProject>("Project", ProjectSchema);
export default Project;
