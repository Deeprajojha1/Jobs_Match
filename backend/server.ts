import http from "http";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { Server } from "socket.io";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { connectRedis } from "./config/redis.js";
import { setSocketServer } from "./config/socket.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

const app = express();
const server = http.createServer(app);

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${env.port} is already in use. Stop the existing backend server or change PORT in backend/.env.`);
    process.exit(1);
  }

  console.error("Server error", error);
  process.exit(1);
});

const io = new Server(server, {
  cors: {
    origin: env.frontendUrl,
    credentials: true,
  },
});

setSocketServer(io);

// Security and parsing middleware sit near the top so every route gets the same
// production defaults and request shape.
app.use(helmet());
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api", applicationRoutes);
app.use(notFound);
app.use(errorHandler);

io.on("connection", (socket) => {
  socket.on("user:join", (userId) => {
    if (userId) socket.join(`user:${userId}`);
  });

  socket.on("disconnect", () => {
    // Socket.IO handles room cleanup automatically; this hook is retained for
    // observability and future connection metrics.
  });
});

const startServer = async () => {
  await connectDatabase();
  await connectRedis();

  server.listen(env.port, () => {
    console.log(`API listening on port ${env.port}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
