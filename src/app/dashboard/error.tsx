"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  const router = useRouter();

  const isAuthError =
    /access token/i.test(error.message) ||
    /unauthorized/i.test(error.message) ||
    /session/i.test(error.message);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);

  useEffect(() => {
    // In production you could send this to Sentry or another error tracker.
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  async function handleOk() {
    try {
      setIsSubmitting(true);
      setRefreshFailed(false);

      const res = await fetch("/api/v1/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        // New access_token cookie is set; send user back to dashboard.
        window.location.href = "/dashboard";
        return;
      }

      // Refresh token invalid/expired – show login option.
      setRefreshFailed(true);
      setIsSubmitting(false);
    } catch {
      setRefreshFailed(true);
      setIsSubmitting(false);
    }
  }

  function handleGoToLogin() {
    router.push("/login?redirect=/dashboard");
  }

  if (isAuthError) {
    const heading = refreshFailed ? "Session expired" : "Session timed out";
    const body = refreshFailed
      ? "Your session has expired. Please log in again."
      : "Your session has timed out. Please click OK to continue.";

    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-xl border border-neutral-200 bg-white p-6 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            {heading}
          </h2>
          <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
            {body}
          </p>

          {!refreshFailed ? (
            <button
              type="button"
              onClick={handleOk}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
            >
              {isSubmitting ? "Working..." : "OK"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGoToLogin}
              className="inline-flex items-center justify-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
            >
              Go to login
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md rounded-xl border border-neutral-200 bg-white p-6 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          Something went wrong
        </h2>
        <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
          An unexpected error occurred while loading your dashboard.
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
