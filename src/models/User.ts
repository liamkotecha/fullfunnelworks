import mongoose, { Schema, Document } from "mongoose";

export interface IPasskeyCredential {
  credentialId: string;
  publicKey: string;
  counter: number;
  transports: string[];
}

export interface IConsultantProfile {
  maxActiveClients: number;
  availabilityStatus: "available" | "limited" | "unavailable";
  holidayUntil?: Date;
  specialisms: string[];
  roundRobinWeight: number;
  lastAssignedAt?: Date;
  totalLeadsAssigned: number;
  /** Modules this consultant is permitted to enable for their clients */
  allowedModules: string[];
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
      allowedModules: [{ type: String, trim: true }],
    },
  },
  { timestamps: true }
);

const User = mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
export default User;
