/** Information drill-down: lists paginated changes for a given channel (and optional competitor). */

import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { informationService } from "@/server/services/information.service";
import { SourceChannel, SOURCE_CHANNEL_LABELS, type SourceChannel as SourceChannelType } from "@/constants";
import { DashboardShimmer } from "@/components/common";

export const dynamic = "force-dynamic";

interface InformationChannelPageProps {
  /** Next 15 passes params as a Promise that must be awaited in RSCs. */
  params: Promise<{ channel: string }>;
  /** Next 15 also passes searchParams as a Promise. */
  searchParams?: Promise<{ competitorId?: string; page?: string }>;
}

function isSourceChannel(value: string): value is SourceChannelType {
  return Object.values(SourceChannel).includes(value as SourceChannelType);
}

async function InformationChannelContent({ params, searchParams }: InformationChannelPageProps) {
  const { channel: rawChannel } = await params;
  if (!isSourceChannel(rawChannel)) {
    notFound();
  }

  const channel = rawChannel as SourceChannelType;
  const sp = searchParams ? await searchParams : {};
  const competitorId = sp.competitorId;
  const pageFromQuery = sp.page ? Number(sp.page) : 1;
  const currentPage = Number.isFinite(pageFromQuery) && pageFromQuery > 0 ? pageFromQuery : 1;

  const { changes, total, page, totalPages } = await informationService.getChannelDetails({
    channel,
    competitorId,
    page: currentPage,
    limit: 10,
  });

  const titlePrefix = competitorId ? "Channel details" : "Channel overview";

  return (
    <div className="min-h-screen px-6 py-8 md:px-8 md:py-10">
      <header className="mb-8">
        <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 px-3 py-1 text-xs font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" aria-hidden />
          Information · {SOURCE_CHANNEL_LABELS[channel]}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-3xl">
          {competitorId ? `${SOURCE_CHANNEL_LABELS[channel]} details` : `${SOURCE_CHANNEL_LABELS[channel]} signals`}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          {titlePrefix} for{" "}
          <span className="font-medium">{SOURCE_CHANNEL_LABELS[channel]}</span>
          {competitorId ? " for a specific competitor." : " across all competitors."}
          {total > 0 && (
            <>
              {" "}
              · Showing page {page} of {totalPages}
            </>
          )}
        </p>
      </header>

      {changes.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No signals have been recorded yet for this channel{competitorId ? " and competitor" : ""}.
        </p>
      ) : (
        <section className="space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm dark:border-neutral-800 dark:bg-neutral-900/60">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {total} signal{total === 1 ? "" : "s"} detected
            </h2>
            <ul className="mt-4 space-y-3 text-zinc-700 dark:text-zinc-200">
              {changes.map((chg) => (
                <li
                  key={chg.id}
                  className="rounded-lg border border-neutral-200 bg-neutral-50/70 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/70"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {chg.title}
                      </p>
                      <p className="mt-0.5 text-[13px] text-zinc-600 dark:text-zinc-300 line-clamp-2">
                        {chg.summary ?? "No additional summary available."}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      {chg.competitorName}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span>{new Date(chg.detectedAt).toLocaleString()}</span>
                    {chg.url && (
                      <a
                        href={chg.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-violet-600 underline-offset-2 hover:underline dark:text-violet-300"
                      >
                        Open page
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {totalPages > 1 && (
            <nav
              className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400"
              aria-label="Pagination"
            >
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                {page > 1 && (
                  <Link
                    href={{
                      pathname: `/dashboard/information/${channel}`,
                      query: {
                        ...(competitorId ? { competitorId } : {}),
                        page: page - 1,
                      },
                    }}
                    className="rounded-lg border border-neutral-200 px-2 py-1 text-xs font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  >
                    Prev
                  </Link>
                )}
                {(() => {
                  const items: (number | "ellipsis")[] = [];

                  if (totalPages <= 7) {
                    for (let p = 1; p <= totalPages; p += 1) items.push(p);
                  } else {
                    items.push(1);
                    const start = Math.max(2, page - 1);
                    const end = Math.min(totalPages - 1, page + 1);

                    if (start > 2) items.push("ellipsis");

                    for (let p = start; p <= end; p += 1) items.push(p);

                    if (end < totalPages - 1) items.push("ellipsis");

                    items.push(totalPages);
                  }

                  return items.map((item, idx) => {
                    if (item === "ellipsis") {
                      return (
                        <span key={`ellipsis-${idx}`} className="px-2 text-zinc-400">
                          …
                        </span>
                      );
                    }

                    const p = item as number;
                    const isActive = p === page;

                    return (
                      <Link
                        key={p}
                        href={{
                          pathname: `/dashboard/information/${channel}`,
                          query: {
                            ...(competitorId ? { competitorId } : {}),
                            page: p,
                          },
                        }}
                        className={`rounded-lg px-2 py-1 text-xs font-medium ${
                          isActive
                            ? "bg-violet-600 text-white"
                            : "border border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                        }`}
                      >
                        {p}
                      </Link>
                    );
                  });
                })()}
                {page < totalPages && (
                  <Link
                    href={{
                      pathname: `/dashboard/information/${channel}`,
                      query: {
                        ...(competitorId ? { competitorId } : {}),
                        page: page + 1,
                      },
                    }}
                    className="rounded-lg border border-neutral-200 px-2 py-1 text-xs font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  >
                    Next
                  </Link>
                )}
              </div>
            </nav>
          )}
        </section>
      )}
    </div>
  );
}

export default function InformationChannelPage(props: InformationChannelPageProps) {
  return (
    <Suspense fallback={<DashboardShimmer />}>
      <InformationChannelContent {...props} />
    </Suspense>
  );
}
