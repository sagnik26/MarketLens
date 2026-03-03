/** Sidebar navigation with Aceternity-style gradient, glow, and motion. */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const OVERVIEW_ITEM = {
  href: "/dashboard",
  label: "Overview",
  icon: IconOverview,
} as const;

const ACTIONS_GROUP = {
  label: "Actions",
  icon: IconActions,
  children: [{ href: "/dashboard/actions/competitor-radar", label: "Competitor Radar", icon: IconRadar }],
} as const;

const OTHER_ITEMS = [
  { href: "/dashboard/status", label: "Status", icon: IconStatus },
  { href: "/dashboard/information", label: "Information", icon: IconInformation },
  { href: "/dashboard/insights", label: "Insights", icon: IconInsights },
] as const;

function IconOverview({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function IconActions({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function IconRadar({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  );
}

function IconCompliance({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function IconStatus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12a9 9 0 1118 0 9 9 0 01-18 0zm9-10.5v10.5m0-10.5a10.5 10.5 0 00-10.5 10.5m10.5-10.5a10.5 10.5 0 0110.5 10.5" />
    </svg>
  );
}

function IconInformation({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zm.75-13.5v5.25m0-5.25h-1.5m1.5 0c0-.828.672-1.5 1.5-1.5s1.5.672 1.5 1.5-.672 1.5-1.5 1.5h-1.5" />
    </svg>
  );
}

function IconInsights({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  nested?: boolean;
}

function NavItem({ href, label, icon: Icon, isActive, nested }: NavItemProps) {
  return (
    <motion.div
      initial={false}
      animate={{
        backgroundColor: isActive ? "rgba(139, 92, 246, 0.12)" : "transparent",
      }}
      transition={{ duration: 0.2 }}
      className={cn("relative rounded-xl", nested && "ml-2")}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-violet-500 dark:bg-violet-400"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          aria-hidden
        />
      )}
      <Link
        href={href}
        className={cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
          nested && "py-2",
          isActive
            ? "text-violet-700 dark:text-violet-200"
            : "text-zinc-600 hover:bg-violet-500/10 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100"
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5 shrink-0",
            nested && "h-4 w-4",
            isActive ? "text-violet-600 dark:text-violet-400" : "text-zinc-500 group-hover:text-zinc-400 dark:group-hover:text-zinc-300"
          )}
        />
        {label}
      </Link>
    </motion.div>
  );
}

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "relative flex w-64 flex-col border-r",
        "border-neutral-200 bg-gradient-to-b from-neutral-50/95 to-violet-50/30 dark:border-neutral-800/60 dark:from-neutral-950 dark:to-violet-950/20",
        "backdrop-blur-sm"
      )}
      aria-label="Dashboard navigation"
    >
      {/* Left edge accent */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-violet-400/60 to-transparent dark:via-violet-500/50"
        aria-hidden
      />
      {/* Soft glow (dark only) */}
      <div
        className="absolute left-0 top-1/4 h-48 w-32 rounded-full bg-violet-500/10 blur-3xl dark:block hidden"
        aria-hidden
      />

      <div className="relative flex flex-1 flex-col p-5">
        <Link
          href="/"
          className="mb-8 flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-violet-500/10 dark:hover:bg-white/5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-md shadow-violet-500/30">
            <span className="text-sm font-bold text-white">M</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            MarketLens
          </span>
        </Link>

        <nav className="flex flex-col gap-1">
          {/* Overview */}
          <NavItem
            href={OVERVIEW_ITEM.href}
            label={OVERVIEW_ITEM.label}
            icon={OVERVIEW_ITEM.icon}
            isActive={pathname === "/dashboard"}
          />

          {/* Actions group as always-open dropdown (no standalone page) */}
          <div className="mt-1 flex flex-col gap-0.5">
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              <IconActions className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
              <span>Actions</span>
            </div>
            <ul className="flex flex-col gap-0.5 pl-4" aria-label="Actions submenu">
              {ACTIONS_GROUP.children.map((child) => (
                <li key={child.href}>
                  <NavItem
                    href={child.href}
                    label={child.label}
                    icon={child.icon}
                    isActive={pathname === child.href}
                    nested
                  />
                </li>
              ))}
            </ul>
          </div>

          {/* Status, Information, Insights */}
          {OTHER_ITEMS.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={pathname === item.href}
            />
          ))}
        </nav>

        <div className="mt-auto border-t border-neutral-200 dark:border-neutral-800/80 pt-5">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-500 transition hover:bg-neutral-100 hover:text-zinc-700 dark:hover:bg-white/5 dark:hover:text-zinc-300"
          >
            <IconHome className="h-5 w-5 shrink-0" />
            Back to home
          </Link>
        </div>
      </div>
    </aside>
  );
}
