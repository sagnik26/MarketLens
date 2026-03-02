/** Redis client singleton for rate limiting and application-level caching. */

export const redis = {} as {
  get: (k: string) => Promise<string | null>;
  setex: (k: string, t: number, v: string) => Promise<void>;
  del: (k: string) => Promise<void>;
};
