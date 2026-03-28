import mongoose, { Schema, Document, Types } from "mongoose";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "paused";

export interface ISubscription extends Document {
  _id: Types.ObjectId;
  consultantId: Types.ObjectId;
  planId: Types.ObjectId;
  status: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  trialEndsAt?: Date;
  canceledAt?: Date;
  stripeSubscriptionId?: string;
  cardExpMonth?: number | null;
  cardExpYear?: number | null;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    consultantId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    status: {
      type: String,
      enum: ["trialing", "active", "past_due", "canceled", "paused"],
      default: "trialing",
    },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    trialEndsAt: { type: Date },
    canceledAt: { type: Date },
    stripeSubscriptionId: { type: String },
    cardExpMonth: { type: Number, default: null },
    cardExpYear: { type: Number, default: null },
    notes: { type: String },
  },
  { timestamps: true }
);

SubscriptionSchema.index({ consultantId: 1 });
SubscriptionSchema.index({ planId: 1 });
SubscriptionSchema.index({ status: 1 });

const Subscription =
  mongoose.models.Subscription ??
  mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
export default Subscription;
