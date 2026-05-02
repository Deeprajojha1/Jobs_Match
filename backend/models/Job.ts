import mongoose, { type InferSchemaType } from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    skills: [{ type: String, trim: true }],
    deadline: { type: Date, required: true },
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export type JobDocument = InferSchemaType<typeof jobSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Job = mongoose.model<JobDocument>("Job", jobSchema);
