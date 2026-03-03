"use client";

import Link from "next/link";

export function LandingNav() {
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
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard/actions/competitor-radar"
            className="text-sm font-medium text-neutral-300 no-underline transition hover:text-white"
          >
            Competitor Radar
          </Link>
          <Link
            href="/dashboard/actions/compliance"
            className="text-sm font-medium text-neutral-300 no-underline transition hover:text-white"
          >
            Compliance Radar
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-900 no-underline transition hover:bg-neutral-100"
          >
            Dashboard
          </Link>
        </div>
      </nav>
    </header>
  );
}
