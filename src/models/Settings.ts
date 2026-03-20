import mongoose, { Schema, Document } from "mongoose";

export interface IGA4EventConfig {
  leadReceived: boolean;
  leadQualified: boolean;
  proposalSent: boolean;
  dealWon: boolean;
  dealLost: boolean;
  clientConverted: boolean;
  assessmentStarted: boolean;
  sectionCompleted: boolean;
  moduleCompleted: boolean;
  invoicePaid: boolean;
  reportDownloaded: boolean;
}

export interface ISettings extends Document {
  leadNotificationEmail?: string;
  autoResponseReplyTo?: string;
  calendlyUrl?: string;
  autoAssignEnabled: boolean;
  ga4MeasurementId?: string;
  ga4ApiSecret?: string;
  ga4Enabled: boolean;
  ga4TrackedEvents: IGA4EventConfig;
  createdAt: Date;
  updatedAt: Date;
}

const GA4EventConfigSchema = new Schema<IGA4EventConfig>(
  {
    leadReceived: { type: Boolean, default: true },
    leadQualified: { type: Boolean, default: true },
    proposalSent: { type: Boolean, default: true },
    dealWon: { type: Boolean, default: true },
    dealLost: { type: Boolean, default: false },
    clientConverted: { type: Boolean, default: true },
    assessmentStarted: { type: Boolean, default: true },
    sectionCompleted: { type: Boolean, default: false },
    moduleCompleted: { type: Boolean, default: true },
    invoicePaid: { type: Boolean, default: true },
    reportDownloaded: { type: Boolean, default: false },
  },
  { _id: false }
);

const SettingsSchema = new Schema<ISettings>(
  {
    leadNotificationEmail: { type: String, trim: true, lowercase: true },
    autoResponseReplyTo: { type: String, trim: true, lowercase: true },
    calendlyUrl: { type: String, trim: true },
    autoAssignEnabled: { type: Boolean, default: false },
    ga4MeasurementId: { type: String, trim: true },
    ga4ApiSecret: { type: String, trim: true },
    ga4Enabled: { type: Boolean, default: false },
    ga4TrackedEvents: { type: GA4EventConfigSchema, default: () => ({}) },
  },
  { timestamps: true }
);

const Settings =
  mongoose.models.Settings ??
  mongoose.model<ISettings>("Settings", SettingsSchema);
export default Settings;
