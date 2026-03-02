/** Only file that calls fetch to TinyFish API; exposes runSSE, runSync, runAsync. */

export async function runSSE(): Promise<{ success: boolean; resultJson: unknown }> {
  return { success: false, resultJson: null };
}

export async function runSync(): Promise<{ success: boolean; result: unknown }> {
  return { success: false, result: null };
}

export async function runAsync(): Promise<{ run_id: string }> {
  return { run_id: "" };
}
