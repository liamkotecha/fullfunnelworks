import mongoose, { Schema, Document, Types } from "mongoose";
import type { ModuleId } from "@/types";

export interface IPlan extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  monthlyPricePence: number;
  annualPricePence: number;
  maxActiveClients: number;
  maxProjectsPerClient: number;
  allowedModules: ModuleId[];
  trialDays: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    monthlyPricePence: { type: Number, required: true, min: 0 },
    annualPricePence: { type: Number, required: true, min: 0 },
    maxActiveClients: { type: Number, required: true, default: 5, min: 1 },
    maxProjectsPerClient: { type: Number, required: true, default: 1, min: 1 },
    allowedModules: [{ type: String, trim: true }],
    trialDays: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Plan =
  mongoose.models.Plan ?? mongoose.model<IPlan>("Plan", PlanSchema);
export default Plan;
