import { cn } from "@/lib/utils";

interface DashboardShimmerProps {
  className?: string;
}

export function DashboardShimmer({ className }: DashboardShimmerProps) {
  return (
    <div
      className={cn(
        "w-full h-full bg-neutral-950/0",
        className
      )}
    >
      <div className="h-full w-full rounded-3xl border border-neutral-800/60 bg-neutral-900/70 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.7)]">
        <div className="mb-6 h-6 w-40 animate-pulse rounded-full bg-neutral-800" />
        <div className="mb-2 h-8 w-64 animate-pulse rounded-lg bg-neutral-800" />
        <div className="mb-6 h-4 w-72 animate-pulse rounded-lg bg-neutral-800" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="h-4 w-32 animate-pulse rounded bg-neutral-800" />
            <div className="h-24 animate-pulse rounded-2xl bg-neutral-900" />
            <div className="h-20 animate-pulse rounded-2xl bg-neutral-900" />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-24 animate-pulse rounded bg-neutral-800" />
            <div className="h-32 animate-pulse rounded-2xl bg-neutral-900" />
          </div>
        </div>
      </div>
    </div>
  );
}

