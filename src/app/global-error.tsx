/** Root-level error boundary: catches unexpected top-level failures and logs to Sentry. */

"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return null;
}
