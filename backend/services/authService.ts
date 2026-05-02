import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import { User, type UserDocument } from "../models/User.js";
import type { PublicUser, UserRole } from "../types/app.js";

type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
};

type LoginUserInput = {
  email: string;
  password: string;
};

const publicUser = (user: UserDocument): PublicUser => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role as UserRole,
});

export const createToken = (user: UserDocument): string => {
  if (!env.jwtSecret) {
    throw new Error("JWT_SECRET is required");
  }

  // Only stable identity claims go into the token so authorization can evolve
  // without forcing a token schema migration.
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"] };
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, options);
};

export const registerUser = async ({ name, email, password, role }: RegisterUserInput) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  // Password hashing belongs in the auth service because it is business
  // security behavior, not an HTTP controller detail.
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, role });

  return { user: publicUser(user), token: createToken(user) };
};

export const loginUser = async ({ email, password }: LoginUserInput) => {
  const user = await User.findOne({ email });
  const isValidPassword = user
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  if (!user || !isValidPassword) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  return { user: publicUser(user), token: createToken(user) };
};

export const getCurrentUser = async (userId: string): Promise<PublicUser> => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("Authenticated user no longer exists");
    error.statusCode = 401;
    throw error;
  }

  return publicUser(user);
};
