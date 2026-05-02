"use client";

import type { RecruiterNotification } from "@/hooks/useRecruiterNotifications";

type Props = {
  items: RecruiterNotification[];
  status: "idle" | "connecting" | "connected" | "disconnected";
};

export function Notifications({ items, status }: Props) {
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>Live notifications</h2>
        <span>{items.length}</span>
      </div>
      <p className={`socket-status ${status}`}>
        {status === "connected"
          ? "Connected"
          : status === "connecting"
            ? "Connecting..."
            : status === "disconnected"
              ? "Disconnected"
              : "Waiting"}
      </p>
      {items.length === 0 ? (
        <p className="muted">New candidate applications will appear here in real time.</p>
      ) : (
        <div className="notification-list">
          {items.map((item) => (
            <div className="notification" key={item.applicationId}>
              <strong>{item.candidateName}</strong>
              <span>applied to {item.jobTitle}</span>
              <b>{item.score}%</b>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
