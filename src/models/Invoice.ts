import mongoose, { Schema, Document, Types } from "mongoose";

export type PaymentModel = "upfront" | "on_completion" | "milestone";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "void";

export interface IInvoice extends Document {
  clientId: Types.ObjectId;
  projectId: Types.ObjectId;
  moduleId?: string;
  title: string;
  description?: string;
  amountPence: number;
  status: InvoiceStatus;
  paymentModel: PaymentModel;
  gracePeriodDays?: number;
  gracePeriodEndsAt?: Date;
  stripeInvoiceId?: string;
  stripePaymentUrl?: string;
  paidAt?: Date;
  sentAt?: Date;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    moduleId: { type: String },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    amountPence: { type: Number, required: true },
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "overdue", "void"],
      default: "draft",
    },
    paymentModel: {
      type: String,
      enum: ["upfront", "on_completion", "milestone"],
      required: true,
    },
    gracePeriodDays: { type: Number },
    gracePeriodEndsAt: { type: Date },
    stripeInvoiceId: { type: String },
    stripePaymentUrl: { type: String },
    paidAt: { type: Date },
    sentAt: { type: Date },
    dueDate: { type: Date },
  },
  { timestamps: true }
);

InvoiceSchema.index({ clientId: 1, status: 1 });
InvoiceSchema.index({ projectId: 1 });
InvoiceSchema.index({ stripeInvoiceId: 1 }, { sparse: true });

export default mongoose.models.Invoice ||
  mongoose.model<IInvoice>("Invoice", InvoiceSchema);
