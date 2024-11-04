import mongoose, { Document, Schema } from "mongoose";

export interface IMeeting extends Document {
  userId: string;
  title: string;
  date: Date;
  endDate?: Date;
  duration?: number;
  participants: string[];
  transcript: string;
  summary: string;
  actionItems: string[];
}

const meetingSchema = new Schema<IMeeting>({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  date: { type: Date, required: true },
  endDate: { type: Date },
  duration: { type: Number },
  participants: { type: [String], required: true },
  transcript: { type: String, default: "" },
  summary: { type: String, default: "" },
  actionItems: { type: [String], default: [] },
});

export const Meeting = mongoose.model<IMeeting>("Meeting", meetingSchema);
