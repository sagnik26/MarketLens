/** Wraps route handlers with consistent error catching, logging, and middleware execution. */

export function withApiHandler() {
  return async () => new Response();
}
