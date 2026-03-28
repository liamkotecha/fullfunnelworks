import mongoose, { Schema, Document } from "mongoose";

export interface IPasskeyCredential {
  credentialId: string;
  publicKey: string;
  counter: number;
  transports: string[];
}

export interface IConsultantProfile {
  // Plan-derived (read from plan at runtime, stored for quick access)
  maxActiveClients: number;
  allowedModules: string[];
  // Platform-managed
  planId?: mongoose.Types.ObjectId;
  planStartedAt?: Date;
  trialEndsAt?: Date;
  // Consultant-managed
  availabilityStatus: "available" | "limited" | "unavailable";
  holidayUntil?: Date;
  specialisms: string[];
  roundRobinWeight: number;
  lastAssignedAt?: Date;
  totalLeadsAssigned: number;
  // Health override — admin can manually mark a consultant as healthy
  healthOverride?: "healthy" | null;
  healthOverrideNote?: string;
  healthOverrideAt?: Date;
}

export interface IUser extends Document {
  email: string;
  name: string;
  password?: string;
  role: "admin" | "consultant" | "client";
  passkeyCredentials: IPasskeyCredential[];
  otpSecret?: string;
  otpExpiry?: Date;
  currentChallenge?: string;
  consultantProfile?: IConsultantProfile;
  lastLoginAt?: Date;
  loginHistory?: Date[];
  createdAt: Date;
  updatedAt: Date;
}

const PasskeyCredentialSchema = new Schema<IPasskeyCredential>({
  credentialId: { type: String, required: true },
  publicKey: { type: String, required: true },
  counter: { type: Number, required: true, default: 0 },
  transports: [String],
});

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    password: { type: String },
    role: {
      type: String,
      enum: ["admin", "consultant", "client"],
      default: "client",
    },
    passkeyCredentials: [PasskeyCredentialSchema],
    otpSecret: { type: String },
    otpExpiry: { type: Date },
    currentChallenge: { type: String },
    consultantProfile: {
      maxActiveClients: { type: Number, default: 5 },
      allowedModules: [{ type: String, trim: true }],
      planId: { type: Schema.Types.ObjectId, ref: "Plan" },
      planStartedAt: { type: Date },
      trialEndsAt: { type: Date },
      availabilityStatus: {
        type: String,
        enum: ["available", "limited", "unavailable"],
        default: "available",
      },
      holidayUntil: { type: Date },
      specialisms: [{ type: String, trim: true }],
      roundRobinWeight: { type: Number, default: 1, min: 1, max: 5 },
      lastAssignedAt: { type: Date },
      totalLeadsAssigned: { type: Number, default: 0 },
      healthOverride: { type: String, enum: ["healthy", null], default: null },
      healthOverrideNote: { type: String },
      healthOverrideAt: { type: Date },
    },
    lastLoginAt: { type: Date },
    loginHistory: [{ type: Date }],
  },
  { timestamps: true }
);

const User = mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
export default User;
