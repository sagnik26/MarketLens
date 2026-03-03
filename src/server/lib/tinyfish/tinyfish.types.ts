/** All TinyFish request/response and SSE event types; validate resultJson with Zod before use. */

export interface TinyFishRequest {
  url: string;
  goal: string;
  browser_profile?: "lite" | "stealth";
  proxy_config?: {
    enabled: boolean;
    country_code?: string;
  };
  api_integration?: string;
  feature_flags?: {
    enable_agent_memory?: boolean;
  };
}

export interface TinyFishSSEEvent {
  type: string;
  status?: string;
  resultJson?: unknown;
  error?: string;
  message?: string;
  help_message?: string;
  /** URL to watch browser live (valid ~24h). Present when type is STREAMING_URL. */
  streaming_url?: string;
  /** CamelCase variant — TinyFish may send either. */
  streamingUrl?: string;
}

export interface TinyFishSSEResult {
  success: boolean;
  resultJson: unknown; // treat as unknown until validated
  status: string;
  error?: string | null;
  rawEvents: TinyFishSSEEvent[];
  /** First streaming URL from the run, if any — use in an iframe to show live browser. */
  streamingUrl?: string | null;
}
