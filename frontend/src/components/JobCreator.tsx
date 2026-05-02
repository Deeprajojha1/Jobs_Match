"use client";

import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { FiSend } from "react-icons/fi";
import { ClipLoader } from "react-spinners";
import { jobsApi, type Job } from "@/services/api";

type Props = {
  onCreated: (job: Job) => void;
};

export function JobCreator({ onCreated }: Props) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    try {
      const result = await jobsApi.create({
        title: String(form.get("title")),
        company: String(form.get("company")),
        location: String(form.get("location")),
        description: String(form.get("description")),
        deadline: String(form.get("deadline")),
        skills: String(form.get("skills"))
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
      });

      formElement.reset();
      onCreated(result.job);
      toast.success("Job published successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Could not publish job";
      setMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="panel form-stack" onSubmit={handleSubmit}>
      <h2>Post a job</h2>
      <label>
        Title
        <input name="title" required placeholder="Senior Backend Engineer" />
      </label>
      <label>
        Company
        <input name="company" required placeholder="Acme Talent" />
      </label>
      <label>
        Location
        <input name="location" required placeholder="Remote, India" />
      </label>
      <label>
        Skills
        <input name="skills" placeholder="Node.js, MongoDB, Redis" />
      </label>
      <label>
        Application deadline
        <input name="deadline" type="date" required />
      </label>
      <label>
        Description
        <textarea name="description" required rows={5} placeholder="Role responsibilities and requirements" />
      </label>
      {message && <p className="error">{message}</p>}
      <button className="primary button-content" type="submit" disabled={isSubmitting}>
        {isSubmitting && <ClipLoader color="#fff" size={16} />}
        <FiSend aria-hidden="true" />
        Publish job
      </button>
    </form>
  );
}
