import mongoose, { Schema, Document, Types } from "mongoose";

export interface IConsultantNote extends Document {
  clientId: Types.ObjectId;
  fieldId: string;
  note: string;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ConsultantNoteSchema = new Schema<IConsultantNote>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    fieldId: { type: String, required: true },
    note: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

ConsultantNoteSchema.index({ clientId: 1, fieldId: 1 }, { unique: true });

const ConsultantNote =
  mongoose.models.ConsultantNote ??
  mongoose.model<IConsultantNote>("ConsultantNote", ConsultantNoteSchema);

export default ConsultantNote;
