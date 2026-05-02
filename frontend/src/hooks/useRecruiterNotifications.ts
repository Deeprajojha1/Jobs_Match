"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createSocket } from "@/services/socket";
import type { User } from "@/services/api";

export type RecruiterNotification = {
  applicationId: string;
  jobTitle: string;
  candidateName: string;
  score: number;
};

export const useRecruiterNotifications = (user: User | null) => {
  const [notifications, setNotifications] = useState<RecruiterNotification[]>([]);
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "disconnected">("idle");

  useEffect(() => {
    if (!user || user.role !== "recruiter") {
      setStatus("idle");
      return;
    }

    const socket = createSocket();
    setStatus("connecting");

    socket.on("connect", () => {
      setStatus("connected");
      socket.emit("user:join", user.id);
    });

    socket.on("connect_error", () => {
      setStatus("disconnected");
    });

    socket.on("disconnect", () => {
      setStatus("disconnected");
    });

    socket.on("application:created", (notification: RecruiterNotification) => {
      setNotifications((current) => [notification, ...current].slice(0, 5));
      toast.success(`${notification.candidateName} applied to ${notification.jobTitle}`);
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
      socket.off("application:created");
      socket.disconnect();
    };
  }, [user]);

  return { notifications, status };
};
