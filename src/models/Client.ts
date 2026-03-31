import mongoose, { Schema, Document, Types } from "mongoose";

export interface IClient extends Document {
  userId: Types.ObjectId;
  teamUserIds: Types.ObjectId[];
  businessName: string;
  status: "invited" | "onboarding" | "active" | "paused";
  onboardingCompletedAt?: Date;
  assignedConsultant?: Types.ObjectId;
  notes?: string;
  // Contact details
  contactName?: string;
  jobTitle?: string;
  contactEmail?: string;
  phone?: string;
  invoicingEmail?: string;
  website?: string;
  // Address
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  country?: string;
  plan?: "standard" | "premium";
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teamUserIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    businessName: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["invited", "onboarding", "active", "paused"],
      default: "invited",
    },
    onboardingCompletedAt: { type: Date },
    assignedConsultant: { type: Schema.Types.ObjectId, ref: "User" },
    notes: { type: String },
    contactName: { type: String, trim: true },
    jobTitle:    { type: String, trim: true },
    contactEmail:{ type: String, trim: true, lowercase: true },
    phone:       { type: String, trim: true },
    invoicingEmail: { type: String, trim: true, lowercase: true },
    website:     { type: String, trim: true },
    addressLine1: { type: String, trim: true },
    addressLine2: { type: String, trim: true },
    city:        { type: String, trim: true },
    postcode:    { type: String, trim: true },
    country:     { type: String, trim: true },
    plan: { type: String, enum: ["standard", "premium"], default: "standard" },
  },
  { timestamps: true }
);

// Indexes for common query patterns
ClientSchema.index({ userId: 1 }, { unique: true });
ClientSchema.index({ status: 1 });

const Client = mongoose.models.Client ?? mongoose.model<IClient>("Client", ClientSchema);
export default Client;
