import Redis from "ioredis";
import logger from "./logger.js";

const redisUrl = process.env.REDIS_URL;
let redis;

if (redisUrl && !redisUrl.includes("your-redis-host")) {
  redis = new Redis(redisUrl, {
    connectTimeout: 5000,
    commandTimeout: 200, // Fail fast if Redis takes over 200ms
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });

  redis.on("connect", () => {
    logger.info("[Redis] Connected successfully to Redis cache.");
  });

  redis.on("error", (err) => {
    logger.error(`[Redis] Connection Error: ${err.message}`);
  });
} else {
  redis = {
    get: async () => null,
    setex: async () => null,
    del: async () => null,
  };
}

export default redis;