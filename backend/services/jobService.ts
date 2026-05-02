import { Job } from "../models/Job.js";
import { Application } from "../models/Application.js";
import { getJson, setJson, deleteKey } from "./cacheService.js";
import type { CreateJobInput } from "../types/app.js";

const JOB_LIST_CACHE_KEY = "jobs:list:v1";
const JOB_LIST_TTL_SECONDS = 60;

export const listJobs = async () => {
  const cachedJobs = await getJson<unknown[]>(JOB_LIST_CACHE_KEY);
  if (cachedJobs) return cachedJobs;

  const jobs = await Job.find()
    .populate("recruiter", "name email")
    .sort({ createdAt: -1 })
    .lean();

  await setJson(JOB_LIST_CACHE_KEY, jobs, JOB_LIST_TTL_SECONDS);
  return jobs;
};

export const createJob = async ({
  recruiterId,
  title,
  company,
  location,
  description,
  skills,
  deadline,
}: CreateJobInput) => {
  if (!deadline) {
    const error = new Error("Application deadline is required");
    error.statusCode = 400;
    throw error;
  }

  const job = await Job.create({
    recruiter: recruiterId,
    title,
    company,
    location,
    description,
    skills: skills || [],
    deadline,
  });

  // Cache-aside requires invalidation on writes so readers do not keep seeing
  // old listings after recruiters publish new roles.
  await deleteKey(JOB_LIST_CACHE_KEY);
  return job.populate("recruiter", "name email");
};

export const getJobById = async (jobId: string) => {
  const job = await Job.findById(jobId).populate("recruiter", "name email").lean();
  if (!job) {
    const error = new Error("Job not found");
    error.statusCode = 404;
    throw error;
  }

  return job;
};

export const deleteJob = async (jobId: string): Promise<void> => {
  const job = await Job.findById(jobId);
  if (!job) {
    const error = new Error("Job not found");
    error.statusCode = 404;
    throw error;
  }

  await Application.deleteMany({ job: jobId });
  await job.deleteOne();
  await deleteKey(JOB_LIST_CACHE_KEY);
};
