import mongoose, { Schema, Document, Types } from "mongoose";

export type ResponseSource = "consultant" | "consensus" | "individual";

export interface IResponse extends Document {
  sessionId: Types.ObjectId;
  /**
   * null  → consultant's canonical (or synthesised) answer for this field
   * <id>  → a specific Participant's individual answer
   */
  participantId: Types.ObjectId | null;
  fieldKey: string;
  value: unknown;
  /**
   * Only populated on canonical (participantId=null) responses that have been
   * explicitly synthesised by the consultant.
   */
  source?: ResponseSource;
  divergence?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ResponseSchema = new Schema<IResponse>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "EngagementSession", required: true },
    participantId: { type: Schema.Types.ObjectId, ref: "Participant", default: null },
    fieldKey: { type: String, required: true },
    value: { type: Schema.Types.Mixed },
    source: {
      type: String,
      enum: ["consultant", "consensus", "individual"],
    },
    divergence: { type: Number },
  },
  { timestamps: true }
);

// Bulk load by session (primary access pattern)
ResponseSchema.index({ sessionId: 1 });

// Prevents duplicate saves for the same field per participant within a session.
// participantId is included as a path — null values are treated as equal by MongoDB's
// unique index only when sparse is false (the default), so two null participantId docs
// with the same sessionId+fieldKey are correctly blocked.
ResponseSchema.index(
  { sessionId: 1, participantId: 1, fieldKey: 1 },
  { unique: true }
);

const Response =
  mongoose.models.SessionResponse ??
  mongoose.model<IResponse>("SessionResponse", ResponseSchema);

export default Response;
