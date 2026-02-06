import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const url = process.env.REDIS_URL || 'redis://localhost:6382';
  return new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
  });
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

const DEFAULT_TTL = 4 * 60 * 60; // 4 hours
const FAIRSCORE_TTL = 7 * 24 * 60 * 60; // 7 days

export async function getCached<T>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  if (!data) return null;
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number = DEFAULT_TTL,
): Promise<void> {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

export async function invalidateCache(key: string): Promise<void> {
  await redis.del(key);
}

export const CacheKeys = {
  fairScore: (wallet: string) => `fs:fairscore:${wallet}`,
  tokenReport: (mint: string) => `fs:report:${mint}`,
  deployerProfile: (wallet: string) => `fs:deployer:${wallet}`,
  trending: () => 'fs:trending',
} as const;

export const CacheTTL = {
  FAIRSCORE: FAIRSCORE_TTL,
  TOKEN_REPORT: DEFAULT_TTL,
  DEPLOYER_PROFILE: 24 * 60 * 60, // 24 hours
  TRENDING: 5 * 60, // 5 minutes
} as const;
