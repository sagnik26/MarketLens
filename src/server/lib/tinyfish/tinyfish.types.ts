/** All TinyFish request/response and SSE event types; no any, validate resultJson with Zod. */

export interface TinyFishRequest {
  url: string;
  goal: string;
  browser_profile?: "lite" | "stealth";
  proxy_config?: { enabled: boolean; country_code?: string };
}
