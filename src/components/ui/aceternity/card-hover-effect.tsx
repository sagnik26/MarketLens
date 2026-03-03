"use client";

import { cn } from "@/lib/utils";

export interface HoverEffectItem {
  title: string;
  description: string;
  link: React.ReactNode;
  badge?: string;
  badgeTone?: "primary" | "secondary" | "muted";
}

interface CardHoverEffectProps {
  items: HoverEffectItem[];
  className?: string;
}

export function CardHoverEffect({ items, className }: CardHoverEffectProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3",
        className
      )}
    >
      {items.map((item, i) => (
        <div
          key={item.title}
          className={cn(
            "group relative overflow-hidden rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-neutral-900/80 to-neutral-950/90 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.75)] transition duration-300",
            "hover:-translate-y-1 hover:border-violet-500/70 hover:shadow-[0_24px_60px_rgba(76,29,149,0.55)]"
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(129,140,248,0.28),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(45,212,191,0.24),transparent_55%)] opacity-40 transition-opacity duration-300 group-hover:opacity-70"
            aria-hidden
          />
          <div className="relative flex h-full flex-col">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-neutral-50">
                {item.title}
              </h3>
              {item.badge && (
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide",
                    item.badgeTone === "primary" &&
                      "bg-violet-500/20 text-violet-200 border border-violet-400/40",
                    item.badgeTone === "secondary" &&
                      "bg-sky-500/15 text-sky-200 border border-sky-400/40",
                    item.badgeTone === "muted" &&
                      "bg-neutral-800/80 text-neutral-300 border border-neutral-700/80"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-300">
              {item.description}
            </p>
            <div className="mt-4 pt-2 text-sm text-violet-200/90">
              {item.link}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
