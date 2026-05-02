import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import type { UserRole } from "../types/app.js";

type JwtPayload = {
  sub: string;
  role: UserRole;
};

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const bearerToken = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice("Bearer ".length)
      : undefined;
    const token = req.cookies?.accessToken || bearerToken;
    if (!token) {
      const error = new Error("Authentication required");
      error.statusCode = 401;
      throw error;
    }

    if (!env.jwtSecret) {
      throw new Error("JWT_SECRET is required");
    }

    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    const user = await User.findById(payload.sub).select("_id name email role");
    if (!user) {
      const error = new Error("Authentication required");
      error.statusCode = 401;
      throw error;
    }

    // Attaching a small user object keeps downstream services stateless while
    // avoiding repeated database lookups inside every controller.
    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (error) {
    const authError = error instanceof Error ? error : new Error("Authentication required");
    authError.statusCode = authError.statusCode || 401;
    next(authError);
  }
};

export const requireRole = (role: UserRole) => (req: Request, _res: Response, next: NextFunction) => {
  if (req.user?.role !== role) {
    const error = new Error("You do not have permission to perform this action");
    error.statusCode = 403;
    next(error);
    return;
  }

  next();
};
