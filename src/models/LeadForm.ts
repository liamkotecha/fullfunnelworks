import mongoose, { Schema, Document, Types } from "mongoose";

export type FormFieldType = "text" | "email" | "phone" | "textarea" | "select";

export interface IFormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // for select fields
}

export interface ILeadForm extends Document {
  consultantId: Types.ObjectId;
  name: string; // internal name, shown in dashboard
  slug: string; // URL-safe, unique per consultant
  active: boolean;
  primaryColor: string; // hex, used in the hosted form
  fields: IFormField[];
  successMessage: string;
  redirectUrl?: string; // if set, redirect after submit instead of success message
  submissionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const FormFieldSchema = new Schema<IFormField>(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ["text", "email", "phone", "textarea", "select"], required: true },
    label: { type: String, required: true, trim: true },
    placeholder: { type: String, trim: true },
    required: { type: Boolean, default: false },
    options: [{ type: String, trim: true }],
  },
  { _id: false }
);

const LeadFormSchema = new Schema<ILeadForm>(
  {
    consultantId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    active: { type: Boolean, default: true },
    primaryColor: { type: String, default: "#6CC2FF" },
    fields: { type: [FormFieldSchema], default: [] },
    successMessage: { type: String, default: "Thanks! We'll be in touch soon." },
    redirectUrl: { type: String, trim: true },
    submissionCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// slug must be unique per consultant
LeadFormSchema.index({ consultantId: 1, slug: 1 }, { unique: true });

const LeadForm =
  mongoose.models.LeadForm ?? mongoose.model<ILeadForm>("LeadForm", LeadFormSchema);
export default LeadForm;
