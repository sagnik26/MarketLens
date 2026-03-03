/** Parses TinyFish run-sse ReadableStream into TinyFishSSEResult (events, resultJson, status). */

import type { TinyFishSSEEvent, TinyFishSSEResult } from "./tinyfish.types";

export type SSEEventCallback = (event: TinyFishSSEEvent) => void;

/**
 * Parses the SSE stream and calls onEvent for each parsed event, then returns the full result.
 * Use this when you need to forward events (e.g. STREAMING_URL) to the client while the run is in progress.
 */
export async function parseSSEStreamWithCallbacks(
  response: Response,
  onEvent: SSEEventCallback,
): Promise<TinyFishSSEResult> {
  if (!response.body) {
    return {
      success: false,
      resultJson: null,
      status: "FAILED",
      error: "No response body received from TinyFish",
      rawEvents: [],
    };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  const events: TinyFishSSEEvent[] = [];

  let finalResult: unknown = null;
  let failed = false;
  let failureReason: string | null = null;
  let streamingUrl: string | null = null;

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed.startsWith("data:")) continue;

        const jsonString = trimmed.replace(/^data:\s*/, "").trim();
        if (!jsonString) continue;

        try {
          const event = JSON.parse(jsonString) as TinyFishSSEEvent;
          events.push(event);
          onEvent(event);

          if (
            event.type === "ERROR" ||
            event.status === "FAILED" ||
            event.status === "CANCELLED" ||
            (event.type === "COMPLETE" && event.status !== "COMPLETED")
          ) {
            failed = true;
            failureReason =
              event.error ??
              event.message ??
              event.help_message ??
              "TinyFish reported failure";
          }

          if (event.type === "COMPLETE" && event.resultJson !== undefined && event.resultJson !== null) {
            finalResult = event.resultJson;
          }
          const urlFromEvent = event.streaming_url ?? event.streamingUrl;
          if (
            (event.type === "STREAMING_URL" || event.streaming_url != null || event.streamingUrl != null) &&
            typeof urlFromEvent === "string" &&
            !streamingUrl
          ) {
            streamingUrl = urlFromEvent;
          }
        } catch {
          // Swallow malformed chunks; they should not crash the stream parser
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  const hasResult = finalResult !== null;

  return {
    success: hasResult && !failed,
    status: failed ? "FAILED" : hasResult ? "COMPLETED" : "IN_PROGRESS",
    resultJson: finalResult,
    error: failureReason,
    rawEvents: events,
    streamingUrl: streamingUrl ?? undefined,
  };
}

export async function parseSSEStream(response: Response): Promise<TinyFishSSEResult> {
  return parseSSEStreamWithCallbacks(response, () => {});
}

