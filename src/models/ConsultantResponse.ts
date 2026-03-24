import mongoose, { Schema, Document, Types } from "mongoose";

export interface IConsultantResponse extends Document {
  projectId: Types.ObjectId;
  section: string;
  sub: string;
  responses: Map<string, unknown>;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ConsultantResponseSchema = new Schema<IConsultantResponse>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    section: { type: String, required: true },
    sub: { type: String, required: true },
    responses: { type: Map, of: Schema.Types.Mixed, default: {} },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

ConsultantResponseSchema.index(
  { projectId: 1, section: 1, sub: 1 },
  { unique: true }
);

const ConsultantResponse =
  mongoose.models.ConsultantResponse ??
  mongoose.model<IConsultantResponse>("ConsultantResponse", ConsultantResponseSchema);

export default ConsultantResponse;
