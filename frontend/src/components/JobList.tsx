"use client";

import { useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import { ClipLoader } from "react-spinners";
import type { Job } from "@/services/api";

type Props = {
  jobs: Job[];
  selectedJobId: string;
  onSelect: (jobId: string) => void;
  onDelete?: (jobId: string) => Promise<void> | void;
};

const formatDeadline = (deadline?: string) => {
  if (!deadline) return "Not set";

  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return "Not set";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(deadline));
};

export function JobList({ jobs, selectedJobId, onSelect, onDelete }: Props) {
  const [deletingJobId, setDeletingJobId] = useState("");

  const handleDelete = async (jobId: string) => {
    if (!onDelete) return;

    setDeletingJobId(jobId);
    try {
      await onDelete(jobId);
    } finally {
      setDeletingJobId("");
    }
  };

  return (
    <section className="panel">
      <div className="section-heading">
        <h2>Open jobs</h2>
        <span>{jobs.length} roles</span>
      </div>
      <div className="job-list">
        {jobs.map((job) => (
          <article
            key={job._id}
            className={`job-card ${selectedJobId === job._id ? "selected" : ""}`}
          >
            <button className="job-card-main" onClick={() => onSelect(job._id)} type="button">
              <strong>{job.title}</strong>
              <span>{job.company} - {job.location}</span>
              <p>{job.description}</p>
              <small>{job.skills?.join(", ") || "General role"}</small>
              <small>Deadline: {formatDeadline(job.deadline)}</small>
            </button>
            {onDelete && (
              <button
                className="danger-button button-content"
                type="button"
                onClick={() => handleDelete(job._id)}
                disabled={deletingJobId === job._id}
              >
                {deletingJobId === job._id && <ClipLoader color="#b42318" size={15} />}
                <FiTrash2 aria-hidden="true" />
                Delete
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
