/**
 * redis.ts — Upstash Redis client singleton.
 *
 * Uses Upstash's HTTP-based client so it works on Vercel Edge / serverless
 * runtimes without connection-pool issues.
 *
 * Falls back to `null` when UPSTASH_REDIS_REST_URL / TOKEN are not set,
 * so the app still works during local dev without any Redis instance.
 *
 * Required env vars (add to .env.local for local dev, Vercel dashboard for prod):
 *   UPSTASH_REDIS_REST_URL=https://<your-endpoint>.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN=<your-token>
 */

import { Redis } from '@upstash/redis';

function createRedisClient(): Redis | null {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(
        '[redis] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set. ' +
        'Running without Redis — in-memory fallback active.'
      );
    }
    return null;
  }

  try {
    return new Redis({ url, token });
  } catch (err) {
    console.error('[redis] Failed to initialise Upstash client:', err);
    return null;
  }
}

// Module-level singleton — instantiated once per cold start.
const redis = createRedisClient();

export default redis;
