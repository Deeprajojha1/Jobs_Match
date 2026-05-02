import type { NextFunction, Request, Response } from "express";
import {
  applyToJob,
  getApplicationResumeForUser,
  listApplicationsForUser,
  sendApplicationMessage,
} from "../services/applicationService.js";

export const apply = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const application = await applyToJob({
      candidateId: req.user!.id,
      jobId: req.body.jobId,
      resumeText: req.body.resumeText,
      resumeFile: req.file,
    });

    res.status(201).json({ application });
  } catch (error) {
    next(error);
  }
};

export const getApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applications = await listApplicationsForUser({
      userId: req.user!.id,
      role: req.user!.role,
    });

    res.json({ applications });
  } catch (error) {
    next(error);
  }
};

export const viewResume = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resume = await getApplicationResumeForUser({
      applicationId: String(req.params.applicationId),
      userId: req.user!.id,
      role: req.user!.role,
    });

    res.setHeader("Content-Type", resume.contentType);
    res.setHeader("Content-Disposition", `inline; filename="${resume.fileName.replace(/"/g, "")}"`);
    (resume.body as NodeJS.ReadableStream).pipe(res);
  } catch (error) {
    next(error);
  }
};

export const messageCandidate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const message = await sendApplicationMessage({
      applicationId: String(req.params.applicationId),
      recruiterId: req.user!.id,
      recruiterName: req.user!.name,
      message: req.body.message,
    });

    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
};
