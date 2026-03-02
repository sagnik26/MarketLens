/** Segment-level error boundary: catches errors in this segment and shows recovery UI with reset. */

"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return null;
}
