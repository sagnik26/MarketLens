"use client";

import { cn } from "@/lib/utils";

export interface HoverEffectItem {
  title: string;
  description: string;
  link: React.ReactNode;
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
            "group relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-6 transition duration-300 dark:border-neutral-800 dark:bg-neutral-900",
            "hover:border-violet-200 hover:shadow-[0_0_30px_-10px_rgba(139,92,246,0.3)] dark:hover:border-violet-800"
          )}
        >
          <div
            className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ transform: "translateY(0)" }}
            aria-hidden
          />
          <div className="relative">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {item.title}
            </h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {item.description}
            </p>
            <div className="mt-4">{item.link}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
