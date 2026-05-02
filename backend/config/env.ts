import dotenv from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load backend/.env by absolute path so the API gets the same configuration
// whether it is started from /backend or from the repository root.
dotenv.config({ path: resolve(__dirname, "../.env") });

const geminiModel =
  !process.env.GEMINI_MODEL || process.env.GEMINI_MODEL === "gemini-1.5-flash"
    ? "gemini-2.0-flash"
    : process.env.GEMINI_MODEL;

const normalizeOrigin = (origin: string) => origin.replace(/\/+$/, "");

// Centralizing environment access keeps runtime configuration auditable and
// prevents secret names from being scattered through controllers and services.
export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  frontendUrl: normalizeOrigin(process.env.FRONTEND_URL || "http://localhost:3000"),
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  redisUrl: process.env.REDIS_URL,
  awsRegion: process.env.AWS_REGION,
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsS3Bucket: process.env.AWS_S3_BUCKET,
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel,
  enableGeminiAi: process.env.ENABLE_GEMINI_AI === "true",
};

export const isProduction = env.nodeEnv === "production";
