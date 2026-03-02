/** Typed response helpers: apiSuccess, apiError, apiPaginated for consistent API envelope. */

export function apiSuccess<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 500, code?: string): Response {
  return Response.json({ success: false, error: { message, code } }, { status });
}
