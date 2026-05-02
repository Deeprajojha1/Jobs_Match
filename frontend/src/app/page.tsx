"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { FiFileText, FiLogOut, FiMessageSquare, FiSend } from "react-icons/fi";
import { BeatLoader } from "react-spinners";
import { ApplyPanel } from "@/components/ApplyPanel";
import { AuthPanel } from "@/components/AuthPanel";
import { JobCreator } from "@/components/JobCreator";
import { JobList } from "@/components/JobList";
import { Notifications } from "@/components/Notifications";
import { useCandidateMessages } from "@/hooks/useCandidateMessages";
import { useRecruiterNotifications } from "@/hooks/useRecruiterNotifications";
import {
  applicationsApi,
  authApi,
  clearAccessToken,
  jobsApi,
  openApplicationResume,
  type Application,
  type Job,
  type User,
} from "@/services/api";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [error, setError] = useState("");
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [sendingMessageId, setSendingMessageId] = useState("");
  const candidateMessages = useCandidateMessages(user);
  const notifications = useRecruiterNotifications(user);

  const selectedJob = useMemo(
    () => jobs.find((job) => job._id === selectedJobId),
    [jobs, selectedJobId]
  );

  const hasAlreadyAppliedToSelectedJob = useMemo(
    () =>
      Boolean(
        selectedJobId &&
          applications.some((application) => application.job?._id === selectedJobId),
      ),
    [applications, selectedJobId],
  );

  const loadJobs = useCallback(async () => {
    const result = await jobsApi.list();
    setJobs(result.jobs);
    setSelectedJobId((current) => current || result.jobs[0]?._id || "");
  }, []);

  const loadApplications = useCallback(async () => {
    if (!user) return;
    const result = await applicationsApi.list();
    setApplications(result.applications);
  }, [user]);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsPageLoading(true);

      try {
        await loadJobs();
      } catch (loadError) {
        const errorMessage = loadError instanceof Error ? loadError.message : "Could not load jobs";
        setError(errorMessage);
        toast.error(errorMessage);
      }

      try {
        const result = await authApi.me();
        setUser(result.user);
      } catch {
        // An unauthenticated visitor can still browse jobs; no noisy error is
        // needed until they perform an authenticated action.
      } finally {
        setIsPageLoading(false);
      }
    };

    loadInitialData();
  }, [loadJobs]);

  useEffect(() => {
    loadApplications().catch((loadError) => {
      toast.error(loadError instanceof Error ? loadError.message : "Could not load applications");
    });
  }, [loadApplications]);

  useEffect(() => {
    if (user?.role !== "recruiter" || notifications.notifications.length === 0) return;

    loadApplications().catch((loadError) => {
      toast.error(loadError instanceof Error ? loadError.message : "Could not refresh applications");
    });
  }, [loadApplications, notifications.notifications.length, user?.role]);

  useEffect(() => {
    if (user?.role !== "candidate" || candidateMessages.length === 0) return;

    loadApplications().catch((loadError) => {
      toast.error(loadError instanceof Error ? loadError.message : "Could not refresh messages");
    });
  }, [candidateMessages.length, loadApplications, user?.role]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      clearAccessToken();
      setUser(null);
      setApplications([]);
      toast.success("Logged out successfully");
    } catch (logoutError) {
      toast.error(logoutError instanceof Error ? logoutError.message : "Logout failed");
    }
  };

  const handleOpenResume = async (applicationId: string) => {
    try {
      await openApplicationResume(applicationId);
      toast.success("Opening resume");
    } catch (resumeError) {
      toast.error(resumeError instanceof Error ? resumeError.message : "Could not open resume");
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm("Delete this published job and its applications?")) return;

    try {
      await jobsApi.delete(jobId);
      setJobs((current) => {
        const nextJobs = current.filter((job) => job._id !== jobId);
        setSelectedJobId((currentSelected) =>
          currentSelected === jobId ? nextJobs[0]?._id || "" : currentSelected
        );
        return nextJobs;
      });
      setApplications((current) => current.filter((application) => application.job?._id && application.job._id !== jobId));
      toast.success("Job deleted successfully");
    } catch (deleteError) {
      const errorMessage = deleteError instanceof Error ? deleteError.message : "Could not delete job";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleSendCandidateMessage = async (applicationId: string) => {
    const message = messageDrafts[applicationId]?.trim();
    if (!message) {
      toast.error("Message is required");
      return;
    }

    setSendingMessageId(applicationId);
    try {
      const result = await applicationsApi.messageCandidate(applicationId, message);
      setApplications((current) =>
        current.map((application) =>
          application._id === applicationId
            ? {
                ...application,
                messages: [...(application.messages || []), result.message],
              }
            : application,
        ),
      );
      setMessageDrafts((current) => ({ ...current, [applicationId]: "" }));
      toast.success("Message sent to candidate");
    } catch (messageError) {
      toast.error(messageError instanceof Error ? messageError.message : "Could not send message");
    } finally {
      setSendingMessageId("");
    }
  };

  if (isPageLoading) {
    return (
      <main className="page-loader">
        <Toaster position="top-right" />
        <div className="page-loader-dots">
          <BeatLoader color="#0f766e" size={14} />
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <Toaster position="top-right" />
      <header className="topbar">
        <div>
          <p className="eyebrow">Full-stack matching platform</p>
          <h1>JobMatch Pro</h1>
        </div>
        {user && (
          <div className="user-pill">
            <span>{user.name}</span>
            <small>{user.role}</small>
            <button className="button-content" type="button" onClick={handleLogout}>
              <FiLogOut aria-hidden="true" />
              Logout
            </button>
          </div>
        )}
      </header>

      {error && <p className="error banner">{error}</p>}

      {!user ? (
        <AuthPanel onAuthenticated={setUser} />
      ) : (
        <div className="workspace">
          <div className="left-column">
            {user.role === "recruiter" && (
              <>
                <JobCreator onCreated={(job) => setJobs((current) => [job, ...current])} />
                <Notifications items={notifications.notifications} status={notifications.status} />
              </>
            )}
            <JobList
              jobs={jobs}
              selectedJobId={selectedJobId}
              onSelect={setSelectedJobId}
              onDelete={user.role === "recruiter" ? handleDeleteJob : undefined}
            />
          </div>

          <div className="right-column">
            {user.role === "candidate" ? (
              <ApplyPanel
                selectedJob={selectedJob}
                hasAlreadyApplied={hasAlreadyAppliedToSelectedJob}
                onApplied={(application) => setApplications((current) => [application, ...current])}
              />
            ) : (
              <section className="panel">
                <h2>Recruiter dashboard</h2>
                <p className="muted">
                  Publish jobs and keep this page open to receive real-time candidate alerts.
                </p>
              </section>
            )}

            <section className="panel">
              <div className="section-heading">
                <h2>Applications</h2>
                <span>{applications.length}</span>
              </div>
              {applications.length === 0 ? (
                <p className="muted">No applications yet.</p>
              ) : (
                <div className="application-list">
                  {applications.map((application) => (
                    <article className="application-card" key={application._id}>
                      <div className="application-card-header">
                        <div className="application-title-block">
                          <strong>{application.job?.title}</strong>
                          <span>{application.job?.company}</span>
                        </div>
                        <button
                          className="resume-button"
                          type="button"
                          onClick={() => handleOpenResume(application._id)}
                        >
                          <FiFileText aria-hidden="true" />
                          View resume
                        </button>
                      </div>
                      <b>{application.aiMatch.score}% match</b>
                      <p>Strengths: {application.aiMatch.strengths.join(", ") || "None returned"}</p>
                      <p>Missing: {application.aiMatch.missingSkills.join(", ") || "None returned"}</p>
                      {user.role === "recruiter" && (
                        <div className="message-composer">
                          <label>
                            Message candidate
                            <textarea
                              rows={3}
                              value={messageDrafts[application._id] || ""}
                              onChange={(event) =>
                                setMessageDrafts((current) => ({
                                  ...current,
                                  [application._id]: event.target.value,
                                }))
                              }
                              placeholder="Write a message about this application"
                            />
                          </label>
                          <button
                            className="primary button-content"
                            type="button"
                            disabled={sendingMessageId === application._id}
                            onClick={() => handleSendCandidateMessage(application._id)}
                          >
                            <FiSend aria-hidden="true" />
                            Send message
                          </button>
                        </div>
                      )}
                      {user.role === "candidate" && Boolean(application.messages?.length) && (
                        <div className="candidate-messages">
                          <strong className="message-heading">
                            <FiMessageSquare aria-hidden="true" />
                            Messages
                          </strong>
                          {application.messages?.map((item) => (
                            <div className="candidate-message" key={item._id}>
                              <span>{item.senderName}</span>
                              <p>{item.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </main>
  );
}
