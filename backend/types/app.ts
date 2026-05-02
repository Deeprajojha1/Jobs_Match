import type { Request } from "express";
import type { Types } from "mongoose";

export type UserRole = "candidate" | "recruiter";

export type AuthedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type AuthedRequest = Request & {
  user: AuthedUser;
};

export type AiMatch = {
  score: number;
  strengths: string[];
  missingSkills: string[];
};

export type ApplicationMessage = {
  _id?: Types.ObjectId;
  sender: Types.ObjectId | string;
  senderName: string;
  message: string;
  createdAt?: Date;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type CreateJobInput = {
  recruiterId: string;
  title: string;
  company: string;
  location: string;
  description: string;
  skills?: string[];
  deadline: string | Date;
};
