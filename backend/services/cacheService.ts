import { redisClient } from "../config/redis.js";

export const getJson = async <T = unknown>(key: string): Promise<T | null> => {
  if (!redisClient?.isOpen) return null;

  const cached = await redisClient.get(key);
  return cached ? (JSON.parse(cached) as T) : null;
};

export const setJson = async (key: string, value: unknown, ttlSeconds: number): Promise<void> => {
  if (!redisClient?.isOpen) return;

  // A TTL prevents stale listings from living forever while still taking load
  // off MongoDB for the high-read job listing path.
  await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
};

export const deleteKey = async (key: string): Promise<void> => {
  if (!redisClient?.isOpen) return;
  await redisClient.del(key);
};
