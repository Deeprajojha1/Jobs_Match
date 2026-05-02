import { Application } from "../models/Application.js";
import { getJobById } from "./jobService.js";
import { getResumeFromS3, uploadResumeToS3 } from "./storageService.js";
import { matchResumeToJob } from "./aiService.js";
import { emitApplicationCreated, emitCandidateMessage } from "./notificationService.js";
import type { Express } from "express";
import type { Types } from "mongoose";
import type { UserRole } from "../types/app.js";

type ApplyToJobInput = {
  candidateId: string;
  jobId: string;
  resumeFile?: Express.Multer.File;
  resumeText: string;
};

type UserQuery = {
  userId: string;
  role: UserRole;
};

type ResumeQuery = {
  applicationId: string;
  userId: string;
  role: UserRole;
};

type SendMessageInput = {
  applicationId: string;
  recruiterId: string;
  recruiterName: string;
  message?: string;
};

type PopulatedJob = {
  _id: Types.ObjectId;
  title: string;
  company: string;
  recruiter: Types.ObjectId | { _id: Types.ObjectId };
};

type PopulatedCandidate = {
  _id: Types.ObjectId;
  name: string;
  email: string;
};

type DuplicateKeyError = Error & {
  code?: number;
};

const resumeKeyFromUrl = (resumeUrl: string): string => {
  if (!resumeUrl) return "";

  try {
    return decodeURIComponent(new URL(resumeUrl).pathname.replace(/^\/+/, ""));
  } catch {
    return "";
  }
};

export const applyToJob = async ({ candidateId, jobId, resumeFile, resumeText }: ApplyToJobInput) => {
  if (!resumeText?.trim()) {
    const error = new Error("Resume text is required for AI matching");
    error.statusCode = 400;
    throw error;
  }

  const existingApplication = await Application.findOne({
    job: jobId,
    candidate: candidateId,
  });
  if (existingApplication) {
    const error = new Error("You have already applied to this job");
    error.statusCode = 409;
    throw error;
  }

  const job = await getJobById(jobId);
  if (job.deadline) {
    const deadline = new Date(job.deadline);
    deadline.setHours(23, 59, 59, 999);

    if (deadline < new Date()) {
      const error = new Error("Application deadline has passed");
      error.statusCode = 400;
      throw error;
    }
  }

  const resumeUpload = await uploadResumeToS3({ file: resumeFile, userId: candidateId });
  const aiMatch = await matchResumeToJob({
    resumeText,
    jobDescription: job.description,
  });

  let application;
  try {
    application = await Application.create({
      job: job._id,
      candidate: candidateId,
      resumeUrl: resumeUpload.resumeUrl,
      resumeKey: resumeUpload.resumeKey,
      resumeOriginalName: resumeUpload.resumeOriginalName,
      resumeContentType: resumeUpload.resumeContentType,
      resumeText,
      aiMatch,
    });
  } catch (error) {
    const mongoError = error as DuplicateKeyError;
    if (mongoError.code === 11000) {
      const duplicateError = new Error("You have already applied to this job");
      duplicateError.statusCode = 409;
      throw duplicateError;
    }

    throw error;
  }

  const populated = await application.populate([
    { path: "job", select: "title company recruiter" },
    { path: "candidate", select: "name email" },
  ]);

  emitApplicationCreated({
    recruiterId: job.recruiter._id.toString(),
    payload: {
      applicationId: populated._id.toString(),
      jobTitle: job.title,
      candidateName: (populated.candidate as unknown as PopulatedCandidate).name,
      score: aiMatch.score,
    },
  });

  return populated;
};

export const listApplicationsForUser = async ({ userId, role }: UserQuery) => {
  const query = role === "recruiter" ? {} : { candidate: userId };

  const applications = await Application.find(query)
    .populate({
      path: "job",
      select: "title company recruiter",
      match: role === "recruiter" ? { recruiter: userId } : undefined,
    })
    .populate("candidate", "name email")
    .sort({ createdAt: -1 })
    .lean();

  // Recruiter filtering happens after populate because Mongo cannot directly
  // filter parent documents by populated document fields without aggregation.
  return role === "recruiter"
    ? applications.filter((application) => application.job)
    : applications;
};

export const getApplicationResumeForUser = async ({ applicationId, userId, role }: ResumeQuery) => {
  const application = await Application.findById(applicationId).populate("job", "recruiter");
  if (!application) {
    const error = new Error("Application not found");
    error.statusCode = 404;
    throw error;
  }

  const job = application.job as unknown as Pick<PopulatedJob, "recruiter"> | undefined;
  const isCandidate = application.candidate.toString() === userId;
  const isRecruiter = job?.recruiter?.toString() === userId;
  if ((role === "candidate" && !isCandidate) || (role === "recruiter" && !isRecruiter)) {
    const error = new Error("You do not have permission to view this resume");
    error.statusCode = 403;
    throw error;
  }

  const resumeKey = application.resumeKey || resumeKeyFromUrl(application.resumeUrl);
  if (!resumeKey) {
    const error = new Error("Resume file location is missing");
    error.statusCode = 404;
    throw error;
  }

  const object = await getResumeFromS3({ key: resumeKey });
  return {
    body: object.Body,
    contentType: application.resumeContentType || object.ContentType || "application/octet-stream",
    fileName: application.resumeOriginalName || "resume",
  };
};

export const sendApplicationMessage = async ({
  applicationId,
  recruiterId,
  recruiterName,
  message,
}: SendMessageInput) => {
  const cleanMessage = message?.trim();
  if (!cleanMessage) {
    const error = new Error("Message is required");
    error.statusCode = 400;
    throw error;
  }

  const application = await Application.findById(applicationId)
    .populate("job", "title company recruiter")
    .populate("candidate", "name email");

  if (!application) {
    const error = new Error("Application not found");
    error.statusCode = 404;
    throw error;
  }

  const job = application.job as unknown as PopulatedJob;
  const candidate = application.candidate as unknown as PopulatedCandidate;

  if (job?.recruiter?.toString() !== recruiterId) {
    const error = new Error("You do not have permission to message this candidate");
    error.statusCode = 403;
    throw error;
  }

  application.messages.push({
    sender: recruiterId,
    senderName: recruiterName,
    message: cleanMessage,
  });
  await application.save();

  const savedMessage = application.messages[application.messages.length - 1];
  const payload = {
    applicationId: application._id.toString(),
    jobTitle: job.title,
    company: job.company,
    message: savedMessage.toObject(),
  };

  emitCandidateMessage({
    candidateId: candidate._id.toString(),
    payload,
  });

  return payload.message;
};
