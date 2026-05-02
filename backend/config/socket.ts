import type { Server } from "socket.io";

let ioInstance: Server | undefined;

// Socket.IO is stored behind tiny accessors so application services can emit
// domain events without importing the HTTP server or breaking testability.
export const setSocketServer = (io: Server) => {
  ioInstance = io;
};

export const getSocketServer = (): Server | undefined => ioInstance;
