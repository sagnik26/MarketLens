import Link from "next/link";
import { notFound } from "next/navigation";
import { changeRepository } from "@/server/repositories/change.repository";
import { productMatchupService } from "@/server/services/product-matchup.service";
import { getServerAuthContext } from "@/server/lib/auth/server-context";

interface MatchupDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function MatchupDetailsPage(props: MatchupDetailsPageProps) {
  const { id } = await props.params;
  const { companyId } = await getServerAuthContext();

  const matchup = await productMatchupService.getById(companyId, id);
  if (!matchup) notFound();

  const recent = await changeRepository.findRecentByCompany({
    companyId,
    matchupId: matchup.id,
    limit: 1,
  });
  const lastChange = recent[0] ?? null;
  const raw = lastChange?.rawExtracted as any | null;

  const summary: string | null =
    raw && typeof raw.summary === "string" ? raw.summary : lastChange?.summary ?? null;
  const pricingTiers: any[] = Array.isArray(raw?.pricing?.tiers) ? raw.pricing.tiers : [];
  const featureSignals: any[] = Array.isArray(raw?.featureSignals) ? raw.featureSignals : [];
  const risks: any[] = Array.isArray(raw?.risks) ? raw.risks : [];
  const opportunities: any[] = Array.isArray(raw?.opportunities) ? raw.opportunities : [];

  const messaging = raw?.messaging ?? null;
  const positioningClaims: any[] = Array.isArray(messaging?.positioningClaims)
    ? messaging.positioningClaims
    : typeof messaging?.positioning_claims === "string"
      ? [messaging.positioning_claims]
      : [];
  const targetAudience: any[] = Array.isArray(messaging?.targetAudience)
    ? messaging.targetAudience
    : typeof messaging?.target_audience === "string"
      ? [messaging.target_audience]
      : [];
  const differentiators: any[] = Array.isArray(messaging?.differentiators)
    ? messaging.differentiators
    : typeof messaging?.differentiators === "string"
      ? [messaging.differentiators]
      : [];

  return (
    <div className="min-h-screen px-6 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/dashboard/information?tab=matchups"
            className="inline-flex items-center rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-zinc-200 dark:hover:bg-neutral-800/70"
          >
            ← Back to Product matchups
          </Link>
        </div>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-zinc-700 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-zinc-200">
          <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {matchup.productName}{" "}
                <span className="text-zinc-400">vs</span> {matchup.competitorName}
              </p>
              <p className="mt-1 max-w-xl break-words text-xs text-zinc-500 dark:text-zinc-400">
                Goal: {matchup.goal}
              </p>
              <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                {matchup.competitorUrl}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
              <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                Last scan:{" "}
                {lastChange?.detectedAt
                  ? new Date(lastChange.detectedAt).toLocaleString()
                  : "—"}
              </span>
            </div>
          </header>

          {!raw ? (
            <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
              No structured details stored yet. Run a matchup scan to populate pricing, messaging,
              risks, and opportunities.
            </p>
          ) : (
            <div className="mt-6 space-y-6">
              {summary ? (
                <section>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Summary
                  </p>
                  <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
                    {summary}
                  </p>
                </section>
              ) : null}

              {pricingTiers.length > 0 ? (
                <section>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Pricing
                  </p>
                  <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950/30">
                    <div className="grid grid-cols-1 gap-0 border-b border-neutral-200 bg-neutral-50 px-3 py-2 text-[11px] font-semibold text-zinc-600 md:grid-cols-[minmax(0,180px)_minmax(0,120px)_1fr] dark:border-neutral-800 dark:bg-neutral-900 dark:text-zinc-300">
                      <span>Tier</span>
                      <span>Price</span>
                      <span>Packaging</span>
                    </div>
                    <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {pricingTiers.slice(0, 10).map((tier: any, idx: number) => (
                        <div
                          key={idx}
                          className="grid grid-cols-1 gap-0 px-3 py-2 text-[12px] text-zinc-700 md:grid-cols-[minmax(0,180px)_minmax(0,120px)_1fr] dark:text-zinc-200"
                        >
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {tier?.name ?? "Tier"}
                          </span>
                          <span className="text-zinc-600 dark:text-zinc-300">
                            {tier?.price ?? "—"}
                          </span>
                          <span className="text-zinc-600 dark:text-zinc-300">
                            {tier?.packaging ?? "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              ) : null}

              {positioningClaims.length + targetAudience.length + differentiators.length > 0 ? (
                <section>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Messaging
                  </p>
                  <div className="mt-3 grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950/30">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Claims
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-zinc-700 dark:text-zinc-200">
                        {positioningClaims.slice(0, 8).map((s: any, idx: number) => (
                          <li key={idx}>{String(s)}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950/30">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Target audience
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-zinc-700 dark:text-zinc-200">
                        {targetAudience.slice(0, 8).map((s: any, idx: number) => (
                          <li key={idx}>{String(s)}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950/30">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Differentiators
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-zinc-700 dark:text-zinc-200">
                        {differentiators.slice(0, 8).map((s: any, idx: number) => (
                          <li key={idx}>{String(s)}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>
              ) : null}

              <div className="grid gap-4 md:grid-cols-3">
                <section className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950/30">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Feature signals
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-zinc-700 dark:text-zinc-200">
                    {(featureSignals.length ? featureSignals : ["—"])
                      .slice(0, 10)
                      .map((s: any, idx: number) => (
                        <li key={idx}>{String(s)}</li>
                      ))}
                  </ul>
                </section>
                <section className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950/30">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Risks
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-zinc-700 dark:text-zinc-200">
                    {(risks.length ? risks : ["—"])
                      .slice(0, 10)
                      .map((s: any, idx: number) => (
                        <li key={idx}>{String(s)}</li>
                      ))}
                  </ul>
                </section>
                <section className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950/30">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Opportunities
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-zinc-700 dark:text-zinc-200">
                    {(opportunities.length ? opportunities : ["—"])
                      .slice(0, 10)
                      .map((s: any, idx: number) => (
                        <li key={idx}>{String(s)}</li>
                      ))}
                  </ul>
                </section>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

