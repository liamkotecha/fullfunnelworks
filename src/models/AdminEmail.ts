import mongoose, { Schema, Document, Types } from "mongoose";

export type AdminEmailType = "payment_reminder" | "check_in" | "upgrade_nudge";

export interface IAdminEmail extends Document {
  consultantId: Types.ObjectId;
  sentByAdminId: Types.ObjectId;
  emailType: AdminEmailType;
  subject: string;
  body: string;
  sentAt: Date;
  createdAt: Date;
}

const AdminEmailSchema = new Schema<IAdminEmail>(
  {
    consultantId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sentByAdminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    emailType: {
      type: String,
      enum: ["payment_reminder", "check_in", "upgrade_nudge"],
      required: true,
    },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    sentAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

AdminEmailSchema.index({ consultantId: 1, sentAt: -1 });

const AdminEmail =
  mongoose.models.AdminEmail ??
  mongoose.model<IAdminEmail>("AdminEmail", AdminEmailSchema);
export default AdminEmail;
