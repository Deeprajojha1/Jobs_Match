"use client";

import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { FiUploadCloud } from "react-icons/fi";
import { ClipLoader } from "react-spinners";
import { applicationsApi, type Application, type Job } from "@/services/api";

type Props = {
  selectedJob: Job | undefined;
  hasAlreadyApplied: boolean;
  onApplied: (application: Application) => void;
};

export function ApplyPanel({ selectedJob, hasAlreadyApplied, onApplied }: Props) {
  const [message, setMessage] = useState("");
  const [latestMatch, setLatestMatch] = useState<Application["aiMatch"] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedJob) return;

    if (hasAlreadyApplied) {
      toast.error("You have already applied to this job");
      return;
    }

    setMessage("");
    setIsSubmitting(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const resume = form.get("resume");

    if (!(resume instanceof File)) {
      setMessage("Resume file is required");
      toast.error("Resume file is required");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await applicationsApi.apply({
        jobId: selectedJob._id,
        resumeText: String(form.get("resumeText")),
        resume,
      });

      setLatestMatch(result.application.aiMatch);
      onApplied(result.application);
      formElement.reset();
      toast.success("Application submitted successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Application failed";
      setMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="panel">
      <h2>Apply with AI match</h2>
      {selectedJob ? (
        <form className="form-stack" onSubmit={handleSubmit}>
          <p className="muted">Selected: {selectedJob.title} at {selectedJob.company}</p>
          {hasAlreadyApplied ? (
            <p className="success banner">You have already applied to this job.</p>
          ) : (
            <>
              <label>
                Resume file
                <input name="resume" type="file" required />
              </label>
              <label>
                Resume text
                <textarea name="resumeText" required rows={7} placeholder="Paste resume text so OpenAI can compare it with the job description." />
              </label>
              {message && <p className="error">{message}</p>}
              <button className="primary button-content" type="submit" disabled={isSubmitting}>
                {isSubmitting && <ClipLoader color="#fff" size={16} />}
                <FiUploadCloud aria-hidden="true" />
                Submit application
              </button>
            </>
          )}
        </form>
      ) : (
        <p className="muted">Select a job to apply.</p>
      )}

      {latestMatch && (
        <div className="match-box">
          <strong>{latestMatch.score}% match</strong>
          <p>Strengths: {latestMatch.strengths.join(", ") || "None returned"}</p>
          <p>Missing skills: {latestMatch.missingSkills.join(", ") || "None returned"}</p>
        </div>
      )}
    </section>
  );
}
