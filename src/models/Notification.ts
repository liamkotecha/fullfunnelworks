import mongoose, { Schema, Document, Types } from "mongoose";

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      default: "info",
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    link: { type: String },
  },
  { timestamps: true }
);

// Indexes for per-user notification queries
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });

const Notification =
  mongoose.models.Notification ??
  mongoose.model<INotification>("Notification", NotificationSchema);
export default Notification;
