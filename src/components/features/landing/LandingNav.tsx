"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";

export function LandingNav() {
  const router = useRouter();
  const { user, hydrated, setUser, clearAuth, setHydrated } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (hydrated) return;
    let cancelled = false;
    async function hydrate() {
      try {
        const res = await fetch("/api/v1/users/me", { credentials: "include" });
        if (cancelled) return;
        if (!res.ok) {
          setHydrated();
          return;
        }
        const json = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          data?: { id: string; email: string; name: string; role: string };
        };
        if (json.success && json.data) {
          setUser(json.data);
        } else {
          setHydrated();
        }
      } catch {
        if (!cancelled) setHydrated();
      }
    }
    hydrate();
    return () => {
      cancelled = true;
    };
  }, [hydrated, setUser, setHydrated]);

  async function handleLogout() {
    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore
    } finally {
      setMenuOpen(false);
      clearAuth();
      router.push("/");
    }
  }

  const displayName = user?.name || user?.email || "";
  const initials = displayName
    ? displayName
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("")
    : "?";

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-neutral-800/50 bg-neutral-950/80 backdrop-blur-md">
      <nav
        className="flex h-14 w-full items-center justify-between px-4 md:px-8"
        aria-label="Main navigation"
      >
        <Link
          href="/"
          className="text-lg font-semibold text-white no-underline transition hover:text-neutral-200"
        >
          MarketLens
        </Link>
        <div className="relative flex items-center gap-6">
          <Link
            href="/dashboard/actions/competitor-radar"
            className="text-sm font-medium text-neutral-300 no-underline transition hover:text-white"
          >
            Competitor Radar
          </Link>
          {!hydrated ? (
            <div
              className="h-8 w-8 shrink-0 rounded-full bg-neutral-700/80"
              aria-hidden
            />
          ) : user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-xs font-semibold text-white shadow-sm hover:bg-violet-500"
                aria-label="Account menu"
              >
                {initials}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-neutral-800 bg-neutral-900/95 p-3 text-sm text-neutral-100 shadow-xl">
                  <div className="mb-3 border-b border-neutral-800 pb-2">
                    <p className="truncate text-sm font-medium">
                      {user.name || "Signed in"}
                    </p>
                    <p className="truncate text-xs text-neutral-400">{user.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-lg bg-neutral-800 px-3 py-1.5 text-left text-xs font-medium text-neutral-100 transition hover:bg-neutral-700"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-900 no-underline transition hover:bg-neutral-100"
            >
              Log in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
