import mongoose, { Schema, Document, Types } from "mongoose";

export interface IParticipant extends Document {
  sessionId: Types.ObjectId;
  userId: Types.ObjectId;
  role: string;
  invitedAt: Date;
  invitedBy: Types.ObjectId;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ParticipantSchema = new Schema<IParticipant>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "EngagementSession", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, default: "" },
    invitedAt: { type: Date, default: Date.now },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    submittedAt: { type: Date },
  },
  { timestamps: true }
);

ParticipantSchema.index({ sessionId: 1 });
// Unique: one participant record per user per session
ParticipantSchema.index({ sessionId: 1, userId: 1 }, { unique: true });

const Participant =
  mongoose.models.Participant ??
  mongoose.model<IParticipant>("Participant", ParticipantSchema);

export default Participant;
