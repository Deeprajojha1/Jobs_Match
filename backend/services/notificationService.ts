import { getSocketServer } from "../config/socket.js";

type ApplicationCreatedPayload = {
  applicationId: string;
  jobTitle: string;
  candidateName: string;
  score: number;
};

type CandidateMessagePayload = {
  applicationId: string;
  jobTitle: string;
  company: string;
  message: unknown;
};

export const emitApplicationCreated = ({
  recruiterId,
  payload,
}: {
  recruiterId: string;
  payload: ApplicationCreatedPayload;
}): void => {
  const io = getSocketServer();
  if (!io) return;

  // Recruiters join a stable room based on their user id, which avoids coupling
  // notifications to a single socket connection or browser tab.
  io.to(`user:${recruiterId}`).emit("application:created", payload);
};

export const emitCandidateMessage = ({
  candidateId,
  payload,
}: {
  candidateId: string;
  payload: CandidateMessagePayload;
}): void => {
  const io = getSocketServer();
  if (!io) return;

  io.to(`user:${candidateId}`).emit("application:message", payload);
};
