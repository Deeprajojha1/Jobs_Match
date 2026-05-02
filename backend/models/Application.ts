import mongoose, { type InferSchemaType } from "mongoose";

const aiMatchSchema = new mongoose.Schema(
  {
    score: { type: Number, min: 0, max: 100, required: true },
    strengths: [{ type: String }],
    missingSkills: [{ type: String }],
  },
  { _id: false }
);

const applicationMessageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderName: { type: String, required: true },
    message: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    resumeUrl: { type: String, required: true },
    resumeKey: { type: String },
    resumeOriginalName: { type: String },
    resumeContentType: { type: String },
    resumeText: { type: String, required: true },
    aiMatch: { type: aiMatchSchema, required: true },
    messages: [applicationMessageSchema],
    status: {
      type: String,
      enum: ["submitted", "reviewing", "shortlisted", "rejected"],
      default: "submitted",
    },
  },
  { timestamps: true }
);

applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

export type ApplicationDocument = InferSchemaType<typeof applicationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Application = mongoose.model<ApplicationDocument>("Application", applicationSchema);
