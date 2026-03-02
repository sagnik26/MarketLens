import { parseSSEStream } from "./sse-parser";
import type { TinyFishSSEEvent } from "./tinyfish.types";

function buildSSEBody(events: TinyFishSSEEvent[]): string {
  return events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("");
}

function createMockResponse(events: TinyFishSSEEvent[]): Response {
  const body = buildSSEBody(events);
  return new Response(body);
}

describe("parseSSEStream", () => {
  it("returns failed result when response has no body", async () => {
    const response = new Response(null);
    Object.defineProperty(response, "body", { value: null });

    const result = await parseSSEStream(response);
    expect(result.success).toBe(false);
    expect(result.status).toBe("FAILED");
  });

  it("extracts resultJson from COMPLETE event and marks success", async () => {
    const response = createMockResponse([
      { type: "LOG", message: "Starting run" },
      { type: "COMPLETE", status: "COMPLETED", resultJson: { ok: true } },
    ]);

    const result = await parseSSEStream(response);
    expect(result.success).toBe(true);
    expect(result.status).toBe("COMPLETED");
    expect(result.resultJson).toEqual({ ok: true });
    expect(result.rawEvents.length).toBe(2);
  });

  it("marks failure when ERROR event is emitted", async () => {
    const response = createMockResponse([
      { type: "ERROR", status: "FAILED", error: "Bad request" },
    ]);

    const result = await parseSSEStream(response);
    expect(result.success).toBe(false);
    expect(result.status).toBe("FAILED");
    expect(result.error).toContain("Bad request");
  });
});

