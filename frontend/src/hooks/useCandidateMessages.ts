"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createSocket } from "@/services/socket";
import type { Application, User } from "@/services/api";

export type CandidateMessageNotification = {
  applicationId: string;
  jobTitle: string;
  company: string;
  message: NonNullable<Application["messages"]>[number];
};

export const useCandidateMessages = (user: User | null) => {
  const [messages, setMessages] = useState<CandidateMessageNotification[]>([]);

  useEffect(() => {
    if (!user || user.role !== "candidate") return;

    const socket = createSocket();

    socket.on("connect", () => {
      socket.emit("user:join", user.id);
    });

    socket.on("application:message", (notification: CandidateMessageNotification) => {
      setMessages((current) => [notification, ...current].slice(0, 10));
      toast.success(`New message for ${notification.jobTitle}`);
    });

    return () => {
      socket.off("connect");
      socket.off("application:message");
      socket.disconnect();
    };
  }, [user]);

  return messages;
};
