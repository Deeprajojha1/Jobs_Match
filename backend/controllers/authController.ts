import type { CookieOptions, NextFunction, Request, Response } from "express";
import { isProduction } from "../config/env.js";
import { registerUser, loginUser, getCurrentUser } from "../services/authService.js";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict",
  path: "/",
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user, token } = await registerUser(req.body);
    res.cookie("accessToken", token, cookieOptions);
    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user, token } = await loginUser(req.body);
    res.cookie("accessToken", token, cookieOptions);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const logout = async (_req: Request, res: Response) => {
  // Clearing the HTTP-only cookie keeps logout server-controlled and avoids any
  // frontend dependency on token storage.
  res.clearCookie("accessToken", cookieOptions);
  res.json({ message: "Logged out" });
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getCurrentUser(req.user!.id);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};
