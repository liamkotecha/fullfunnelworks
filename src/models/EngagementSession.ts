import mongoose, { Schema, Document, Types } from "mongoose";

export type SessionStatus = "active" | "submitted" | "synthesised";

export interface IEngagementSession extends Document {
  projectId: Types.ObjectId;
  teamMode: boolean;
  status: SessionStatus;
  /** Last visited subsection key in "section/subSection" format — UX state only */
  lastActiveSub: string;
  synthesisCompletedAt?: Date;
  synthesisCompletedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EngagementSessionSchema = new Schema<IEngagementSession>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    teamMode: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["active", "submitted", "synthesised"],
      default: "active",
    },
    lastActiveSub: { type: String, default: "" },
    synthesisCompletedAt: { type: Date },
    synthesisCompletedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Canonical selection rule: resolveClientSession always uses
// findOne({ projectId, status: { $ne: "synthesised" } }).sort({ createdAt: -1 })
// This index supports that query pattern.
EngagementSessionSchema.index({ projectId: 1, status: 1, createdAt: -1 });

const EngagementSession =
  mongoose.models.EngagementSession ??
  mongoose.model<IEngagementSession>("EngagementSession", EngagementSessionSchema);

export default EngagementSession;
