"use client";

import Link from "next/link";
import { CardHoverEffect } from "@/components/ui/aceternity";
import type { HoverEffectItem } from "@/components/ui/aceternity/card-hover-effect";

const FEATURES: HoverEffectItem[] = [
  {
    title: "Competitor Radar",
    description:
      "Run scans on competitor sites. Detect pricing, careers, and feature changes. Turn updates into action items.",
    badge: "Core module",
    badgeTone: "primary",
    link: (
      <Link
        href="/dashboard/actions/competitor-radar"
        className="inline-flex items-center text-sm font-medium text-violet-400 hover:text-violet-300 no-underline"
      >
        Open Radar →
      </Link>
    ),
  },
  {
    title: "Compliance Radar",
    description:
      "BSE and NSE circulars in one place. Stay on top of regulatory updates without chasing PDFs.",
    badge: "In preview",
    badgeTone: "secondary",
    link: (
      <Link
        href="/dashboard/actions/compliance"
        className="inline-flex items-center text-sm font-medium text-violet-400 hover:text-violet-300 no-underline"
      >
        View Compliance Radar →
      </Link>
    ),
  },
  {
    title: "Signals & Alerts",
    description:
      "Get notified when something changes. Prioritize what matters and skip the noise.",
    badge: "Coming soon",
    badgeTone: "muted",
    link: (
      <span className="text-sm text-neutral-500 dark:text-neutral-400 no-underline">
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
      <div className="w-full px-0 md:px-4">
        <div className="mb-4 flex justify-center">
          <span className="inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
            Modules
          </span>
        </div>
        <h2
          id="features-heading"
          className="text-center text-3xl font-bold text-white sm:text-4xl"
        >
          Everything in one MarketLens workspace
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-neutral-400">
          A set of focused modules for competitor intelligence, compliance monitoring, and decision-ready signals.
        </p>
        <div className="mt-12">
          <CardHoverEffect
            items={FEATURES}
            className="grid-cols-1 gap-6 md:grid-cols-3"
          />
        </div>
      </div>
    </section>
  );
}
