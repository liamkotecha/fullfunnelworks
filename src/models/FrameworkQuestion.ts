/**
 * FrameworkQuestion — stores every editable question / field in the Growth Strategy Framework.
 * Seeded from concept-map.ts, managed by admin via /admin/questions.
 */
import mongoose, { Schema, Document } from "mongoose";

export interface IFrameworkQuestion extends Document {
  fieldId: string;
  section: string;          // "assessment", "people", "product", "process", "gtm", "kpis", "roadmap"
  subSection: string;       // "swot", "checklist", "challenges", "methodology", etc.
  group?: string;           // Sub-grouping, e.g. "strengths", "weaknesses", "mission", "objectives"
  question: string;         // The main question / label text
  subPrompt?: string;       // Optional secondary prompt (Leadership, GTM Market)
  label?: string;           // Short label for compact views
  type: "textarea" | "text" | "checkbox" | "slider" | "select" | "measure-table" | "action-table" | "ownership-matrix" | "risk-register" | "governance-calendar" | "intervention-rules";
  placeholder?: string;
  weightFieldId?: string;   // For SWOT questions with an importance weight
  order: number;            // Sort order within section + subSection + group
  active: boolean;          // Soft delete — inactive questions hidden from portal
  metadata?: Record<string, unknown>; // Extra config: min/max for sliders, options for selects, etc.
  createdAt: Date;
  updatedAt: Date;
}

const FrameworkQuestionSchema = new Schema<IFrameworkQuestion>(
  {
    fieldId: { type: String, required: true, unique: true },
    section: { type: String, required: true },
    subSection: { type: String, required: true },
    group: { type: String, default: null },
    question: { type: String, required: true },
    subPrompt: { type: String, default: null },
    label: { type: String, default: null },
    type: {
      type: String,
      enum: ["textarea", "text", "checkbox", "slider", "select", "measure-table", "action-table", "ownership-matrix", "risk-register", "governance-calendar", "intervention-rules"],
      default: "textarea",
    },
    placeholder: { type: String, default: null },
    weightFieldId: { type: String, default: null },
    order: { type: Number, required: true, default: 0 },
    active: { type: Boolean, default: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Compound index for efficient queries
FrameworkQuestionSchema.index({ section: 1, subSection: 1, group: 1, order: 1 });

export default mongoose.models.FrameworkQuestion ||
  mongoose.model<IFrameworkQuestion>("FrameworkQuestion", FrameworkQuestionSchema);
