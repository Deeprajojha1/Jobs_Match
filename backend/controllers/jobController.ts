import type { NextFunction, Request, Response } from "express";
import { createJob, deleteJob, getJobById, listJobs } from "../services/jobService.js";

export const getJobs = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const jobs = await listJobs();
    res.json({ jobs });
  } catch (error) {
    next(error);
  }
};

export const postJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await createJob({ recruiterId: req.user!.id, ...req.body });
    res.status(201).json({ job });
  } catch (error) {
    next(error);
  }
};

export const getJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await getJobById(String(req.params.id));
    res.json({ job });
  } catch (error) {
    next(error);
  }
};

export const removeJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteJob(String(req.params.id));
    res.json({ message: "Job deleted" });
  } catch (error) {
    next(error);
  }
};
