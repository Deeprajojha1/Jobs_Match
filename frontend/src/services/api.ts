const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const TOKEN_STORAGE_KEY = "jobmatch_access_token";

export const setAccessToken = (token: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

export const clearAccessToken = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
};

const getAccessToken = () => {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(TOKEN_STORAGE_KEY) || "";
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: "candidate" | "recruiter";
};

export type Job = {
  _id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  skills: string[];
  deadline: string;
  recruiter: { _id: string; name: string; email: string };
};

export type Application = {
  _id: string;
  job: { _id: string; title: string; company: string };
  candidate: { _id: string; name: string; email: string };
  resumeUrl: string;
  messages?: Array<{
    _id: string;
    sender: string;
    senderName: string;
    message: string;
    createdAt: string;
  }>;
  aiMatch: {
    score: number;
    strengths: string[];
    missingSkills: string[];
  };
};

export const applicationResumeUrl = (applicationId: string) =>
  `${API_BASE_URL}/api/applications/${applicationId}/resume`;

export const openApplicationResume = async (applicationId: string) => {
  const token = getAccessToken();
  const response = await fetch(applicationResumeUrl(applicationId), {
    credentials: "include",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Could not open resume");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => window.URL.revokeObjectURL(url), 30000);
};

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

const request = async <T>(path: string, options: RequestOptions = {}) => {
  const isForm = options.body instanceof FormData;
  const requestBody: BodyInit | undefined = isForm
    ? (options.body as FormData)
    : options.body
      ? JSON.stringify(options.body)
      : undefined;

  // All API traffic is centralized here so credentials are consistently sent
  // and components never need to know how cookie auth is transported.
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
      ...options.headers,
    },
    body: requestBody,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data as T;
};

export const authApi = {
  register: (payload: {
    name: string;
    email: string;
    password: string;
    role: "candidate" | "recruiter";
  }) => request<{ user: User; token: string }>("/api/auth/register", { method: "POST", body: payload }),
  login: (payload: { email: string; password: string }) =>
    request<{ user: User; token: string }>("/api/auth/login", { method: "POST", body: payload }),
  logout: () => request<{ message: string }>("/api/auth/logout", { method: "POST" }),
  me: () => request<{ user: User }>("/api/auth/me"),
};

export const jobsApi = {
  list: () => request<{ jobs: Job[] }>("/api/jobs"),
  create: (payload: {
    title: string;
    company: string;
    location: string;
    description: string;
    skills: string[];
    deadline: string;
  }) => request<{ job: Job }>("/api/jobs", { method: "POST", body: payload }),
  delete: (jobId: string) =>
    request<{ message: string }>(`/api/jobs/${jobId}`, { method: "DELETE" }),
};

export const applicationsApi = {
  apply: (payload: { jobId: string; resumeText: string; resume: File }) => {
    const form = new FormData();
    form.append("jobId", payload.jobId);
    form.append("resumeText", payload.resumeText);
    form.append("resume", payload.resume);

    return request<{ application: Application }>("/api/apply", {
      method: "POST",
      body: form,
    });
  },
  list: () => request<{ applications: Application[] }>("/api/applications"),
  messageCandidate: (applicationId: string, message: string) =>
    request<{ message: NonNullable<Application["messages"]>[number] }>(
      `/api/applications/${applicationId}/messages`,
      {
        method: "POST",
        body: { message },
      },
    ),
};
