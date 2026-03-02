"use client";

import { cn } from "@/lib/utils";

interface MovingBorderProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  borderClassName?: string;
  duration?: number;
}

export function MovingBorder({
  children,
  className,
  containerClassName,
  borderClassName,
  duration = 2000,
}: MovingBorderProps) {
  return (
    <div
      className={cn(
        "relative flex rounded-lg p-[1px]",
        "bg-[linear-gradient(var(--neutral-950),var(--neutral-950))] [--neutral-950:theme(colors.neutral.950)]",
        "dark:[--neutral-950:theme(colors.neutral.950)]",
        containerClassName
      )}
    >
      <div
        className={cn(
          "absolute inset-0 rounded-lg opacity-100 transition-opacity",
          "bg-[linear-gradient(90deg,transparent_0%,theme(colors.violet.500/0.5)_50%,transparent_100%)] bg-[length:200%_100%]",
          "animate-[shimmer_var(--duration)_infinite_linear]",
          borderClassName
        )}
        style={{ "--duration": `${duration}ms` } as React.CSSProperties}
        aria-hidden
      />
      <div className={cn("relative z-10 rounded-[calc(theme(borderRadius.lg)-1px)] bg-neutral-950 px-4 py-2 text-sm font-medium text-white", className)}>
        {children}
      </div>
    </div>
  );
}
