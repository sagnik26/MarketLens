/** Only file that calls fetch to TinyFish API; exposes runSSE, runSync, runAsync. */

import { env } from "@/config/env";
import type { TinyFishRequest, TinyFishSSEEvent, TinyFishSSEResult } from "./tinyfish.types";
import { parseSSEStream, parseSSEStreamWithCallbacks } from "./sse-parser";

const BASE_URL = "https://agent.tinyfish.ai/v1/automation";

function buildHeaders() {
  if (!env.TINYFISH_API_KEY) {
    throw new Error("TINYFISH_API_KEY is not configured");
  }

  return {
    "X-API-Key": env.TINYFISH_API_KEY,
    "Content-Type": "application/json",
  };
}

function toTinyFishError(err: unknown): string {
  if (err instanceof Error) {
    const cause = err.cause instanceof Error ? err.cause.message : String(err.cause ?? "");
    const extra = cause ? ` (${cause})` : "";
    return `${err.message}${extra}`;
  }
  return String(err);
}

export async function runSSE(body: TinyFishRequest): Promise<TinyFishSSEResult> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/run-sse`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(body),
    });
  } catch (err) {
    const message = toTinyFishError(err);
    return {
      success: false,
      resultJson: null,
      status: "FAILED",
      error: `TinyFish request failed: ${message}`,
      rawEvents: [],
    };
  }

  if (!response.ok) {
    const text = await response.text();
    let message = `TinyFish HTTP ${response.status}`;
    try {
      const json = JSON.parse(text) as { error?: string; message?: string };
      message = (json.error ?? json.message ?? text) || message;
    } catch {
      if (text) message = text.slice(0, 200);
    }
    return {
      success: false,
      resultJson: null,
      status: "FAILED",
      error: message,
      rawEvents: [],
    };
  }

  return parseSSEStream(response);
}

export type RunSSEEventCallback = (event: TinyFishSSEEvent) => void;

/**
 * Same as runSSE but calls onEvent for each SSE event as it arrives (e.g. STREAMING_URL, PROGRESS).
 * Use when streaming events to the client while the run is in progress.
 */
export async function runSSEWithCallbacks(
  body: TinyFishRequest,
  onEvent: RunSSEEventCallback,
): Promise<TinyFishSSEResult> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/run-sse`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(body),
    });
  } catch (err) {
    const message = toTinyFishError(err);
    return {
      success: false,
      resultJson: null,
      status: "FAILED",
      error: `TinyFish request failed: ${message}`,
      rawEvents: [],
    };
  }

  if (!response.ok) {
    const text = await response.text();
    let message = `TinyFish HTTP ${response.status}`;
    try {
      const json = JSON.parse(text) as { error?: string; message?: string };
      message = (json.error ?? json.message ?? text) || message;
    } catch {
      if (text) message = text.slice(0, 200);
    }
    return {
      success: false,
      resultJson: null,
      status: "FAILED",
      error: message,
      rawEvents: [],
    };
  }

  return parseSSEStreamWithCallbacks(response, onEvent);
}

export async function runSync(
  body: TinyFishRequest,
): Promise<{ success: boolean; result: unknown; status: string }> {
  const response = await fetch(`${BASE_URL}/run`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });

  const json = (await response.json()) as { status?: string; result?: unknown };
  const status = json.status ?? (response.ok ? "COMPLETED" : "FAILED");

  return {
    success: status === "COMPLETED",
    status,
    result: json.result ?? null,
  };
}

export async function runAsync(body: TinyFishRequest): Promise<{ run_id: string }> {
  const response = await fetch(`${BASE_URL}/run-async`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });

  const json = (await response.json()) as { run_id: string };
  return { run_id: json.run_id };
}

