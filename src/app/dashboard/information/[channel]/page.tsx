/** Information drill-down: lists all changes for a given channel (and optional competitor). */

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { informationService } from "@/server/services/information.service";
import { SourceChannel, SOURCE_CHANNEL_LABELS, type SourceChannel as SourceChannelType } from "@/constants";
import { DashboardShimmer } from "@/components/common";

export const dynamic = "force-dynamic";

interface InformationChannelPageProps {
  params: { channel: string };
  searchParams?: { competitorId?: string };
}

function isSourceChannel(value: string): value is SourceChannelType {
  return Object.values(SourceChannel).includes(value as SourceChannelType);
}

async function InformationChannelContent({ params, searchParams }: InformationChannelPageProps) {
  const rawChannel = params.channel;
  if (!isSourceChannel(rawChannel)) {
    notFound();
  }

  const channel = rawChannel as SourceChannelType;
  const competitorId = searchParams?.competitorId;

  const { label, changes } = await informationService.getChannelDetails({ channel, competitorId });

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
        </p>
      </header>

      {changes.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No signals have been recorded yet for this channel{competitorId ? " and competitor" : ""}.
        </p>
      ) : (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm dark:border-neutral-800 dark:bg-neutral-900/60">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {changes.length} signal{changes.length === 1 ? "" : "s"} detected
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
