/** Profile page: shows current user details and logout action. */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";

interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId: string;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/v1/users/me", { credentials: "include" });
        if (!res.ok) {
          if (!cancelled) setError("Unable to load profile.");
          if (res.status === 401 && !cancelled) router.push("/login");
          return;
        }
        const json = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          data?: CurrentUser;
        };
        if (!cancelled && json.success && json.data) setUser(json.data);
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Unexpected error loading profile.",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleLogout() {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // ignore
    } finally {
      useAuthStore.getState().clearAuth();
      window.location.assign("/");
    }
  }

  const createdAt = user?.createdAt ? new Date(user.createdAt) : null;

  return (
    <div className="min-h-screen px-6 py-8 md:px-8 md:py-10">
      <header className="mb-8">
        <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 px-3 py-1 text-xs font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" aria-hidden />
          Profile
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-4xl">
          Your account
        </h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
          Manage your MarketLens account details and sign out of this workspace.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/60">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Account details
          </h2>
          {loading ? (
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              Loading profile…
            </p>
          ) : error ? (
            <p className="mt-4 text-sm text-red-500 dark:text-red-400">{error}</p>
          ) : !user ? (
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              No user information available.
            </p>
          ) : (
            <dl className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-zinc-200">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Name
                </dt>
                <dd>{user.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Email
                </dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Role
                </dt>
                <dd className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-zinc-700 dark:bg-neutral-800 dark:text-zinc-200">
                  {user.role}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Company id
                </dt>
                <dd className="break-all text-xs text-zinc-500 dark:text-zinc-400">
                  {user.companyId}
                </dd>
              </div>
              {createdAt && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Joined
                  </dt>
                  <dd>{createdAt.toLocaleString()}</dd>
                </div>
              )}
            </dl>
          )}
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/60">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Session
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Sign out of MarketLens on this device. You&apos;ll need to log in again to
            access the dashboard.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 inline-flex items-center justify-center rounded-lg border border-red-500/60 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-600 transition hover:border-red-500 hover:bg-red-500/20 dark:border-red-400/60 dark:text-red-300 dark:hover:border-red-400"
          >
            Logout
          </button>
        </section>
      </div>
    </div>
  );
}

