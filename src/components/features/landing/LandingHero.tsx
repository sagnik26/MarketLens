"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { TextGenerateEffect } from "@/components/ui/aceternity";
import { cn } from "@/lib/utils";

const BackgroundBeams = dynamic(
  () =>
    import("@/components/ui/aceternity/background-beams").then((m) => ({
      default: m.BackgroundBeams,
    })),
  { ssr: false, loading: () => <div className="absolute inset-0 bg-neutral-950" /> }
);

export function LandingHero() {
  return (
    <section className="relative flex min-h-[90vh] w-full flex-col items-center justify-center overflow-hidden rounded-md bg-neutral-950 px-4 py-24">
      <BackgroundBeams className="top-0" />
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
          <TextGenerateEffect
            words="Competitor intelligence that moves at market speed."
            className="text-white"
            duration={0.4}
          />
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-neutral-300 sm:text-xl">
          <TextGenerateEffect
            words="Track pricing, jobs, and product changes across competitors. One dashboard. Real-time scans. Actionable insights."
            className="inline text-neutral-300"
            duration={0.35}
          />
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className={cn(
              "rounded-lg bg-white px-6 py-3 text-sm font-semibold text-neutral-900 shadow-lg transition hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-neutral-950"
            )}
          >
            Go to Dashboard
          </Link>
          <Link
            href="/dashboard/actions/competitor-radar"
            className={cn(
              "rounded-lg border border-neutral-600 bg-transparent px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 focus:ring-offset-neutral-950"
            )}
          >
            Competitor Radar
          </Link>
        </div>
      </div>
    </section>
  );
}
