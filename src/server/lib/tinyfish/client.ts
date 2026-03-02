/** Only file that calls fetch to TinyFish API; exposes runSSE, runSync, runAsync. */

import { env } from "@/config/env";
import type { TinyFishRequest, TinyFishSSEResult } from "./tinyfish.types";
import { parseSSEStream } from "./sse-parser";

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

export async function runSSE(body: TinyFishRequest): Promise<TinyFishSSEResult> {
  const response = await fetch(`${BASE_URL}/run-sse`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });

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

