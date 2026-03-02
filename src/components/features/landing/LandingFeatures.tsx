"use client";

import Link from "next/link";
import { CardHoverEffect } from "@/components/ui/aceternity";

const FEATURES = [
  {
    title: "Competitor Radar",
    description:
      "Run scans on competitor sites. Detect pricing, careers, and feature changes. Turn updates into action items.",
    link: (
      <Link
        href="/dashboard/actions/competitor-radar"
        className="inline-flex items-center text-sm font-medium text-violet-400 hover:text-violet-300"
      >
        Open Radar →
      </Link>
    ),
  },
  {
    title: "Compliance Radar",
    description:
      "BSE and NSE circulars in one place. Stay on top of regulatory updates without chasing PDFs.",
    link: (
      <Link
        href="/dashboard/actions/compliance"
        className="inline-flex items-center text-sm font-medium text-violet-400 hover:text-violet-300"
      >
        View Compliance Radar →
      </Link>
    ),
  },
  {
    title: "Signals & Alerts",
    description:
      "Get notified when something changes. Prioritize what matters and skip the noise.",
    link: (
      <span className="text-sm text-neutral-500 dark:text-neutral-400">
        Coming soon
      </span>
    ),
  },
];

export function LandingFeatures() {
  return (
    <section
      className="border-t border-neutral-800 bg-neutral-950 px-4 py-20"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="features-heading"
          className="text-center text-3xl font-bold text-white sm:text-4xl"
        >
          Built for product and strategy teams
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-neutral-400">
          One workspace to monitor competitors and compliance—so you can focus on building.
        </p>
        <div className="mt-12">
          <CardHoverEffect
            items={FEATURES}
            className="grid-cols-1 md:grid-cols-3"
          />
        </div>
      </div>
    </section>
  );
}
