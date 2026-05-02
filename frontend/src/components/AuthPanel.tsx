"use client";

import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { FiEye, FiEyeOff, FiLogIn, FiUserPlus, FiUsers, FiUserCheck } from "react-icons/fi";
import { ClipLoader } from "react-spinners";
import { authApi, setAccessToken, type User } from "@/services/api";

type Props = {
  onAuthenticated: (user: User) => void;
};

export function AuthPanel({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<"candidate" | "recruiter">("candidate");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    try {
      const result =
        mode === "register"
          ? await authApi.register({
              name: String(form.get("name")),
              email,
              password,
              role,
            })
          : await authApi.login({ email, password });

      setAccessToken(result.token);
      onAuthenticated(result.user);
      toast.success(mode === "login" ? "Logged in successfully" : "Account created successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Authentication failed";
      setMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-panel">
      <div>
        <p className="eyebrow">Secure access</p>
        <h1>JobMatch Pro</h1>
        <p className="muted">
          Candidate matching, resume intelligence, and recruiter notifications in
          one production-ready workflow.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="form-stack">
        <div className="segmented">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            <FiLogIn aria-hidden="true" />
            Login
          </button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
            <FiUserPlus aria-hidden="true" />
            Register
          </button>
        </div>

        {mode === "register" && (
          <>
            <label>
              Name
              <input name="name" required placeholder="Asha Sharma" suppressHydrationWarning />
            </label>
            <div className="segmented">
              <button type="button" className={role === "candidate" ? "active" : ""} onClick={() => setRole("candidate")}>
                <FiUserCheck aria-hidden="true" />
                Candidate
              </button>
              <button type="button" className={role === "recruiter" ? "active" : ""} onClick={() => setRole("recruiter")}>
                <FiUsers aria-hidden="true" />
                Recruiter
              </button>
            </div>
          </>
        )}

        <label>
          Email
          <input
            name="email"
            type="email"
            required
            placeholder="you@company.com"
            suppressHydrationWarning
          />
        </label>
        <label>
          Password
          <span className="password-field">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              placeholder="Minimum 8 characters"
              suppressHydrationWarning
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
            </button>
          </span>
        </label>
        {message && <p className="error">{message}</p>}
        <button className="primary button-content" type="submit" disabled={isSubmitting}>
          {isSubmitting && <ClipLoader color="#fff" size={16} />}
          {mode === "login" ? <FiLogIn aria-hidden="true" /> : <FiUserPlus aria-hidden="true" />}
          {mode === "login" ? "Login" : "Create account"}
        </button>
      </form>
    </section>
  );
}
