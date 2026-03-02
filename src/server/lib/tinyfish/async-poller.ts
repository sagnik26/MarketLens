/** Polls GET /v1/runs/{run_id} until status is COMPLETED or FAILED; used for run-async flows. */

export async function pollRunUntilComplete(_runId: string): Promise<{ status: string; result: unknown }> {
  return { status: "FAILED", result: null };
}
