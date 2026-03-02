/** Zod-validated environment variables; single import for process.env (NEXT_PUBLIC_*, MONGODB_URI, TINYFISH_API_KEY, etc.). Add zod schema parse at startup. */

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  MONGODB_URI: process.env.MONGODB_URI,
  REDIS_URL: process.env.REDIS_URL,
  TINYFISH_API_KEY: process.env.TINYFISH_API_KEY,
} as const;

export type Env = typeof env;
