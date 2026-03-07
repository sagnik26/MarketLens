/** Information page: tenant-wide view and matchups overview (cached). */

import { Suspense } from "react";
import Link from "next/link";
import { EmptyState, DashboardShimmer } from "@/components/common";
import {
  getInformationOverviewAction,
  type InformationSummary,
  type MatchupRow,
} from "@/actions/information.actions";

type InformationTab = "overview" | "matchups";

function resolveTab(value: string | undefined): InformationTab {
  if (value === "overview") return "overview";
  return "matchups";
}

function WorkspaceOverviewSection({ summary }: { summary: InformationSummary }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Competitor Radar</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Consolidated profile information from pricing, jobs, Product Hunt, and features. Data reflects your
            current competitors; refresh to see newly added ones. Scan results will appear once runs are stored.
          </p>
        </div>
      </header>
      <div className="mt-5">
        {summary.competitorRadar.channels.length === 0 ? (
          <EmptyState
            title="No signals yet"
            description="Once your scans detect signals for pricing, jobs, Product Hunt, or features, they will appear here grouped by channel."
            actionHref="/dashboard/actions/competitor-radar"
            actionLabel="Go to Competitor Radar"
          />
        ) : (
          <div className="space-y-4">
            {summary.competitorRadar.channels.map((group) => {
              if (group.profiles.length === 0) return null;
              return (
                <article
                  key={group.channel}
                  className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/60"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{group.label}</h3>
                    <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                      {group.profiles.length} competitors
                    </span>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
                    {group.profiles.map((item) => (
                      <li key={`${item.competitorId}-${group.channel}`}>
                        <Link
                          href={`/dashboard/information/${group.channel}?competitorId=${encodeURIComponent(item.competitorId)}`}
                          className="block rounded-lg px-2 py-1.5 transition hover:bg-neutral-100 dark:hover:bg-neutral-800/70"
                        >
                          <span className="font-medium">{item.name}</span>
                          <span className="mx-1 text-zinc-400">·</span>
                          <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                            {item.segment}
                          </span>
                          <p className="mt-1 text-[13px] text-zinc-700 dark:text-zinc-200">{item.focus}</p>
                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Last scan: {item.lastScan}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function MatchupsOverviewSection({ rows }: { rows: MatchupRow[] }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-zinc-700 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-zinc-200">
      <header className="mb-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Product matchups</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Matchup-specific views: your product context + competitor scans tagged with a dedicated matchupId.
        </p>
      </header>
      {rows.length === 0 ? (
        <EmptyState
          title="No product matchups yet"
          description="Create a matchup (product + competitor + goal) and run a scan to populate matchup-tagged signals."
          actionHref="/dashboard/actions/product-matchups"
          actionLabel="Create product matchup"
        />
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="min-w-full table-fixed divide-y divide-neutral-200 text-left text-xs dark:divide-neutral-800">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-300">Product</th>
                <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-300">Competitor</th>
                <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-300">Goal</th>
                <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-300">Last scan</th>
                <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-300">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-950/40">
              {rows.map(({ matchup, lastChange }) => (
                <tr key={matchup.id}>
                  <td className="px-3 py-2 text-zinc-900 dark:text-zinc-100">{matchup.productName}</td>
                  <td className="px-3 py-2 text-zinc-900 dark:text-zinc-100">
                    <div className="flex flex-col">
                      <span>{matchup.competitorName}</span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{matchup.competitorUrl}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top max-w-xs whitespace-normal break-words text-[11px] text-zinc-600 dark:text-zinc-300">
                    {matchup.goal}
                  </td>
                  <td className="px-3 py-2 text-[11px] text-zinc-600 dark:text-zinc-300">
                    {lastChange?.detectedAt ? new Date(lastChange.detectedAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {lastChange?.rawExtracted ? (
                      <Link
                        href={`/dashboard/information/matchups/${encodeURIComponent(matchup.id)}`}
                        className="inline-flex items-center rounded-full border border-violet-500 px-3 py-1 text-[11px] font-medium text-violet-700 hover:bg-violet-50 dark:border-violet-400 dark:text-violet-300 dark:hover:bg-violet-900/30"
                      >
                        View details
                      </Link>
                    ) : (
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        Manage matchups in{" "}
        <Link
          href="/dashboard/actions/product-matchups"
          className="font-medium text-violet-600 underline-offset-2 hover:underline dark:text-violet-400"
        >
          Actions → Product Matchups
        </Link>
        .
      </p>
    </section>
  );
}

async function Content({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const tab = resolveTab(sp.tab);
  const result = await getInformationOverviewAction();
  if (!result.success || !result.data) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400" role="alert">
        Unable to load information overview.
      </p>
    );
  }
  const data = result.data;
  return (
    <div className="space-y-8">
      {tab === "overview" ? (
        <WorkspaceOverviewSection summary={data.summary} />
      ) : (
        <MatchupsOverviewSection rows={data.matchupsRows} />
      )}
    </div>
  );
}

export default async function InformationPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  return (
    <div className="min-h-screen px-6 py-8 md:px-8 md:py-10">
      <header className="mb-8">
        <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 px-3 py-1 text-xs font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" aria-hidden />
          Information
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-4xl">
          Information
        </h1>
        <p className="mt-3 max-w-xl text-zinc-600 dark:text-zinc-400">
          Detailed information for each radar: competitor signals by channel today, and product vs competitor
          matchups soon.
        </p>
        <Suspense fallback={null}>
          <Tabs searchParams={searchParams} />
        </Suspense>
      </header>
      <Suspense fallback={<DashboardShimmer />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Tabs({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const active = resolveTab(sp.tab);
  const tabs: { id: InformationTab; label: string; href: string }[] = [
    { id: "matchups", label: "Product matchups", href: "/dashboard/information" },
    { id: "overview", label: "Workspace overview", href: "/dashboard/information?tab=overview" },
  ];
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            active === tab.id
              ? "border-violet-500 bg-violet-600 text-white shadow-sm"
              : "border-neutral-200 bg-white text-zinc-700 hover:border-violet-200 hover:text-violet-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-zinc-300 dark:hover:border-violet-700"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
