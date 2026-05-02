import { createClient } from "redis";
import { env } from "./env.js";

export const redisClient = env.redisUrl
  ? createClient({
      url: env.redisUrl,
      socket: {
        connectTimeout: 1000,
        reconnectStrategy: false,
      },
    })
  : null;

// Redis is optional during local scaffolding, but production should provide it;
// gracefully degrading keeps the API usable while credentials are added later.
export const connectRedis = async () => {
  if (!redisClient) {
    console.warn("REDIS_URL missing; job cache is disabled");
    return;
  }

  redisClient.on("error", (error) => {
    console.error("Redis error", error);
  });

  try {
    await redisClient.connect();
    console.log("Redis connected");

    await redisClient.set("name", "Deepraj");
    const value = await redisClient.get("name");
    console.log("Redis test value:", value);
  } catch (error) {
    // Cache must improve performance, not become a single point of failure for
    // local development or degraded production reads.
    const message = error instanceof Error ? error.message : "Unknown Redis error";
    console.warn("Redis unavailable; job cache is disabled", message);
  }
};
