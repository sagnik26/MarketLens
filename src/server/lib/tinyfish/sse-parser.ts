/** Parses TinyFish run-sse ReadableStream into TinyFishSSEResult (events, resultJson, status). */

export interface TinyFishSSEResult {
  success: boolean;
  resultJson: unknown;
  status: string;
  rawEvents: unknown[];
}

export async function parseSSEStream(_response: Response): Promise<TinyFishSSEResult> {
  return { success: false, resultJson: null, status: "FAILED", rawEvents: [] };
}
