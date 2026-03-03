"use client";

import { cn } from "@/lib/utils";

interface FullPageLoaderProps {
  className?: string;
}

export function FullPageLoader({ className }: FullPageLoaderProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen items-center justify-center bg-neutral-950",
        className
      )}
    >
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full border-2 border-violet-500/30" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
      </div>
    </div>
  );
}

