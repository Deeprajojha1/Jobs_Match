import { io } from "socket.io-client";

export const createSocket = () => {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  // Socket creation is isolated so the UI can subscribe to domain events
  // without duplicating transport configuration.
  return io(url, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
};
