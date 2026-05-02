import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";
import type { AiMatch } from "../types/app.js";

const STOP_WORDS = new Set([
  "and",
  "are",
  "for",
  "from",
  "have",
  "job",
  "the",
  "this",
  "that",
  "with",
  "will",
  "you",
  "your",
]);

type MatchInput = {
  resumeText: string;
  jobDescription: string;
};

const getKeywords = (text: string): Set<string> => {
  const words = String(text || "")
    .toLowerCase()
    .match(/[a-z0-9+#.]+/g);

  return new Set(
    (words || []).filter((word) => word.length > 2 && !STOP_WORDS.has(word)),
  );
};

const localMatch = ({ resumeText, jobDescription }: MatchInput): AiMatch => {
  const resumeKeywords = getKeywords(resumeText);
  const jobKeywords = [...getKeywords(jobDescription)];
  const matched = jobKeywords.filter((keyword) => resumeKeywords.has(keyword));
  const missing = jobKeywords.filter((keyword) => !resumeKeywords.has(keyword));
  const ratio = jobKeywords.length ? matched.length / jobKeywords.length : 0.5;
  const score = Math.max(35, Math.min(95, Math.round(ratio * 100)));

  return {
    score,
    strengths: matched.length
      ? matched.slice(0, 6)
      : ["Resume received successfully"],
    missingSkills: missing.length
      ? missing.slice(0, 6)
      : ["No major keyword gaps found"],
  };
};

const fallbackMatch = ({ resumeText, jobDescription }: MatchInput): AiMatch =>
  localMatch({ resumeText, jobDescription });

const extractJson = (text: string): Partial<AiMatch> | null => {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    // Best-effort extraction when the model wraps JSON in extra text.
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

export const matchResumeToJob = async ({ resumeText, jobDescription }: MatchInput): Promise<AiMatch> => {
  if (!env.enableGeminiAi || !env.geminiApiKey) {
    return fallbackMatch({ resumeText, jobDescription });
  }

  const prompt = [
    "You are an expert technical recruiter.",
    "Compare the candidate resume with the job description.",
    "Return only JSON with keys: score, strengths, missingSkills.",
    "Score must be an integer from 0 to 100.",
    `Resume:\n${resumeText}`,
    `Job description:\n${jobDescription}`,
  ].join("\n\n");

  let content = "";

  try {
    const client = new GoogleGenerativeAI(env.geminiApiKey);
    const model = client.getGenerativeModel({ model: env.geminiModel });
    const result = await model.generateContent(prompt);
    content = result?.response?.text();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gemini matching failed";

    if (message.includes("429") || message.toLowerCase().includes("quota")) {
      return fallbackMatch({ resumeText, jobDescription });
    }

    console.error("Gemini match failed:", message);
    return fallbackMatch({ resumeText, jobDescription });
  }

  const parsed = extractJson(content);
  if (!parsed) return fallbackMatch({ resumeText, jobDescription });

  return {
    score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
  };
};
