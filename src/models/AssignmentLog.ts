import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAssignmentLog extends Document {
  prospectId: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  assignedToName?: string;
  reason: string;
  skipped: { consultantId: string; name: string; reason: string }[];
  autoAssigned: boolean;
  createdAt: Date;
}

const AssignmentLogSchema = new Schema<IAssignmentLog>(
  {
    prospectId: { type: Schema.Types.ObjectId, ref: "Prospect", required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    assignedToName: { type: String },
    reason: { type: String, required: true },
    skipped: [
      {
        consultantId: { type: String, required: true },
        name: { type: String, required: true },
        reason: { type: String, required: true },
      },
    ],
    autoAssigned: { type: Boolean, default: true },
  },
  { timestamps: true }
);

AssignmentLogSchema.index({ createdAt: -1 });
AssignmentLogSchema.index({ prospectId: 1 });

const AssignmentLog =
  mongoose.models.AssignmentLog ??
  mongoose.model<IAssignmentLog>("AssignmentLog", AssignmentLogSchema);
export default AssignmentLog;
