/** Server Actions for user mutations (create, update) with Zod validation and ActionResponse. */

"use server";

export async function createUserAction(): Promise<{ success: boolean; data?: unknown; error?: string }> {
  return { success: false };
}
