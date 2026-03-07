/** Orchestrates TinyFish via client: creates ScanRun, runs agents (run-sse/run-async), updates status. */

import { revalidateTag } from "next/cache";
import type { TinyFishRequest } from "@/server/lib/tinyfish/tinyfish.types";
import { runSSE, runSSEWithCallbacks } from "@/server/lib/tinyfish/client";
import {
  buildPricingGoal,
  buildJobsGoal,
  buildReviewsGoal,
  buildChangelogGoal,
  buildFeaturesGoal,
  buildComplianceGoal,
  buildMatchupGoal,
} from "@/server/lib/tinyfish/goals";
import type { BackendChange, BackendInsight, ScanRun } from "@/types";
import { ChangeType, Priority, SignalType, SourceChannel } from "@/constants";
import { scanRepository } from "@/server/repositories/scan.repository";
import { changeRepository } from "@/server/repositories/change.repository";
import { flowService } from "@/server/services/flow.service";

type CompetitorChannel =
  | typeof SourceChannel.PRICING
  | typeof SourceChannel.JOBS
  | typeof SourceChannel.PRODUCT
  | typeof SourceChannel.FEATURES
  | typeof SourceChannel.CHANGELOG
  | typeof SourceChannel.REVIEWS;

interface CompetitorPageTarget {
  competitorId: string;
  competitorName: string;
  url: string;
  channel: CompetitorChannel;
  matchupId?: string;
  matchupContext?: {
    productName: string;
    productSegment?: string | null;
    productPositioning?: string | null;
    productPricingModel?: string | null;
    productUrl?: string | null;
    competitorUrl: string;
    goal: string;
  };
}

interface RunCompetitorScanResult {
  scanRun: ScanRun;
  changes: BackendChange[];
  insights: BackendInsight[];
}

interface JobsResultJson {
  jobs?: {
    title?: string;
    department?: string | null;
    location?: string | null;
    isRemote?: boolean;
    postedAt?: string | null;
    seniorityLevel?: string | null;
    isNewProductSignal?: boolean;
    productSignalReason?: string | null;
  }[];
  totalCount?: number;
}

interface PricingResultJson {
  plans?: {
    name?: string;
    monthlyPrice?: number | null;
    annualPrice?: number | null;
    currency?: string;
    features?: string[];
    usageLimits?: string | null;
    ctaText?: string | null;
    isPopular?: boolean;
  }[];
  hasPricingHidden?: boolean;
  hiddenNote?: string | null;
}

interface FeaturesResultJson {
  features?: {
    name?: string;
    category?: string | null;
    description?: string | null;
    highlighted?: boolean;
  }[];
  totalFound?: number;
}

interface ReviewsResultJson {
  reviews?: {
    rating?: number;
    reviewerRole?: string | null;
    companySizeRange?: string | null;
    pros?: string;
    cons?: string;
    summary?: string;
    postedAt?: string | null;
  }[];
  averageRating?: number | null;
  totalReviews?: number | null;
}

interface ChangelogResultJson {
  entries?: {
    title?: string;
    publishedAt?: string | null;
    url?: string | null;
    summary?: string;
    isFeatureAnnouncement?: boolean;
    isPivotSignal?: boolean;
  }[];
  totalFound?: number;
}

function normalizeDetectedAt(raw: unknown, fallbackIso: string): string {
  if (typeof raw === "string") {
    const parsed = Date.parse(raw);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }
  return fallbackIso;
}

function resolveGoal(channel: CompetitorChannel): string {
  switch (channel) {
    case SourceChannel.PRICING:
      return buildPricingGoal();
    case SourceChannel.JOBS:
      return buildJobsGoal();
    case SourceChannel.FEATURES:
      return buildFeaturesGoal();
    case SourceChannel.PRODUCT:
      return buildChangelogGoal();
    case SourceChannel.CHANGELOG:
      return buildChangelogGoal();
    case SourceChannel.REVIEWS:
      return buildReviewsGoal();
    default:
      return buildPricingGoal();
  }
}

function resolveGoalForPage(page: CompetitorPageTarget): string {
  if (page.matchupContext) {
    return buildMatchupGoal({
      productName: page.matchupContext.productName,
      productSegment: page.matchupContext.productSegment ?? null,
      productPositioning: page.matchupContext.productPositioning ?? null,
      productPricingModel: page.matchupContext.productPricingModel ?? null,
      productUrl: page.matchupContext.productUrl ?? null,
      competitorName: page.competitorName,
      competitorUrl: page.matchupContext.competitorUrl,
      goal: page.matchupContext.goal,
    });
  }
  return resolveGoal(page.channel);
}

/** Event forwarded to the client during a streaming scan (includes page context). */
export interface StreamingScanEvent {
  type: string;
  status?: string;
  streaming_url?: string;
  resultJson?: unknown;
  error?: string;
  message?: string;
  help_message?: string;
  pageIndex: number;
  competitorId: string;
  competitorName: string;
}

export const scanService = {
  /**
   * Runs Tinyfish scans for a set of competitor pages (one or more SourceChannels per competitor)
   * and returns a ScanRun plus normalized Changes and Insights.
   *
   * NOTE: This currently uses Promise.allSettled and does not persist to the database.
   */
  async runCompetitorScan(
    companyId: string,
    pages: CompetitorPageTarget[],
  ): Promise<RunCompetitorScanResult> {
    const startedAt = new Date().toISOString();

    const pageResults = await Promise.allSettled(
      pages.map(async (page) => {
        const body: TinyFishRequest = {
          url: page.url,
          goal: resolveGoalForPage(page),
          browser_profile:
            page.channel === SourceChannel.PRICING ||
            page.channel === SourceChannel.JOBS ||
            page.channel === SourceChannel.PRODUCT
              ? "stealth"
              : "lite",
          proxy_config: { enabled: false },
        };

        const result = await runSSE(body);
        return { page, result };
      }),
    );

    const resolved = pageResults.map((entry, index) => {
      if (entry.status === "fulfilled") return entry.value;
      const page = pages[index];
      return {
        page: page ?? pages[0],
        result: {
          success: false,
          resultJson: null,
          status: "FAILED",
          error: String(entry.reason),
          rawEvents: [],
        },
      };
    });

    const allFailed = resolved.every((r) => !r.result.success);
    const someFailed = resolved.some((r) => !r.result.success);
    const status: ScanRun["status"] = allFailed || someFailed ? "failed" : "completed";

    const firstError =
      resolved.find((r) => !r.result.success)?.result?.error ??
      (someFailed ? "One or more pages failed to scan" : undefined);

    // Map TinyFish resultJson into backend-normalized changes/insights.
    const changes: BackendChange[] = [];
    const insights: BackendInsight[] = [];

    for (const { page, result } of resolved) {
      if (!result.success) continue;

      const raw = result.resultJson as unknown;
      if (!raw || typeof raw !== "object") continue;

      if (page.matchupContext) {
        const ctx = page.matchupContext;
        const rawObj = raw as Record<string, unknown>;
        const summary =
          typeof rawObj.summary === "string"
            ? rawObj.summary
            : typeof rawObj.briefing === "string"
              ? rawObj.briefing
              : null;

        const change: BackendChange = {
          id: `matchup-${page.competitorId}-${Date.now()}`,
          competitorId: page.competitorId,
          competitorName: page.competitorName,
          matchupId: page.matchupId,
          changeType: ChangeType.CUSTOM,
          signalType: SignalType.INFORMATIONAL,
          priority: Priority.MEDIUM,
          title: `Matchup scan: ${ctx.productName} vs ${page.competitorName}`,
          summary: summary ?? null,
          rawExtracted: rawObj,
          isRead: false,
          isDismissed: false,
          detectedAt: startedAt,
          pageType: SourceChannel.PRODUCT,
          url: page.url,
        };
        changes.push(change);

        const insight: BackendInsight = {
          id: `insight-matchup-${page.competitorId}-${Date.now()}`,
          competitorId: page.competitorId,
          competitorName: page.competitorName,
          matchupId: page.matchupId,
          title: `Matchup insight: ${ctx.productName} vs ${page.competitorName}`,
          briefing:
            summary ??
            `Matchup scan completed for ${ctx.productName} vs ${page.competitorName}.`,
          signalType: SignalType.INFORMATIONAL,
          priority: Priority.MEDIUM,
          recommendedActions: [],
          generatedAt: startedAt,
          pageType: SourceChannel.PRODUCT,
          score: 0.6,
          tags: ["matchup"],
        };
        insights.push(insight);
        continue;
      }

      if (page.matchupContext) {
        const ctx = page.matchupContext as {
          productName: string;
        };
        const rawObj = raw as Record<string, unknown>;
        const summary =
          typeof rawObj.summary === "string"
            ? rawObj.summary
            : typeof rawObj.briefing === "string"
              ? rawObj.briefing
              : null;

        const change: BackendChange = {
          id: `matchup-${page.competitorId}-${Date.now()}`,
          competitorId: page.competitorId,
          competitorName: page.competitorName,
          matchupId: page.matchupId,
          changeType: ChangeType.CUSTOM,
          signalType: SignalType.INFORMATIONAL,
          priority: Priority.MEDIUM,
          title: `Matchup scan: ${ctx.productName} vs ${page.competitorName}`,
          summary: summary ?? null,
          rawExtracted: rawObj,
          isRead: false,
          isDismissed: false,
          detectedAt: startedAt,
          pageType: SourceChannel.PRODUCT,
          url: page.url,
        };
        changes.push(change);

        const insight: BackendInsight = {
          id: `insight-matchup-${page.competitorId}-${Date.now()}`,
          competitorId: page.competitorId,
          competitorName: page.competitorName,
          matchupId: page.matchupId,
          title: `Matchup insight: ${ctx.productName} vs ${page.competitorName}`,
          briefing:
            summary ??
            `Matchup scan completed for ${ctx.productName} vs ${page.competitorName}.`,
          signalType: SignalType.INFORMATIONAL,
          priority: Priority.MEDIUM,
          recommendedActions: [],
          generatedAt: startedAt,
          pageType: SourceChannel.PRODUCT,
          score: 0.6,
          tags: ["matchup"],
        };
        insights.push(insight);
        continue;
      }

      if (page.channel === SourceChannel.JOBS) {
        const jobsJson = raw as JobsResultJson;
        if (!Array.isArray(jobsJson.jobs)) continue;

        const pageType = SourceChannel.JOBS;

        jobsJson.jobs.forEach((job, index) => {
          if (!job || !job.title) return;

          const isNewSignal = Boolean(job.isNewProductSignal);
          const detectedAt = normalizeDetectedAt(job.postedAt, startedAt);

          const change: BackendChange = {
            id: `job-${page.competitorId}-${Date.now()}-${index}`,
            competitorId: page.competitorId,
            competitorName: page.competitorName,
            changeType: ChangeType.JOB_SIGNAL,
            signalType: isNewSignal ? SignalType.OPPORTUNITY : SignalType.INFORMATIONAL,
            priority: isNewSignal ? Priority.HIGH : Priority.MEDIUM,
            title: job.title,
            summary:
              job.productSignalReason ??
              (([
                job.department,
                job.location,
                job.seniorityLevel,
                job.isRemote ? "Remote" : null,
              ]
                .filter(Boolean)
                .join(" • ")) || null),
            isRead: false,
            isDismissed: false,
            detectedAt,
            pageType,
            url: page.url,
          };

          changes.push(change);
        });

        const totalJobs = jobsJson.jobs.length;
        const newSignals = jobsJson.jobs.filter((j) => j?.isNewProductSignal).length;

        if (totalJobs > 0) {
          const insight: BackendInsight = {
            id: `insight-jobs-${page.competitorId}-${Date.now()}`,
            competitorId: page.competitorId,
            competitorName: page.competitorName,
            title: `Hiring signals from jobs page`,
            briefing: `Found ${totalJobs} open roles on the jobs page for ${page.competitorName}, including ${newSignals} roles flagged as potential new product signals.`,
            signalType: newSignals > 0 ? SignalType.OPPORTUNITY : SignalType.INFORMATIONAL,
            priority: newSignals > 0 ? Priority.HIGH : Priority.MEDIUM,
            recommendedActions: [
              "Review these roles to understand focus areas and product bets.",
              "Track changes over time to see if hiring velocity increases or decreases.",
            ],
            generatedAt: startedAt,
            pageType: pageType,
            score: newSignals > 0 ? 0.8 : 0.4,
            tags: ["jobs", "hiring", "product-signal"],
          };

          insights.push(insight);
        }
      } else if (page.channel === SourceChannel.PRICING) {
        const pricingJson = raw as PricingResultJson;
        if (!Array.isArray(pricingJson.plans) || pricingJson.plans.length === 0) continue;

        const pageType = SourceChannel.PRICING;
        pricingJson.plans.forEach((plan, index) => {
          if (!plan || !plan.name) return;

          const detectedAt = startedAt;
          const priceSummaryParts: string[] = [];
          if (typeof plan.monthlyPrice === "number") priceSummaryParts.push(`$${plan.monthlyPrice}/mo`);
          if (typeof plan.annualPrice === "number") priceSummaryParts.push(`$${plan.annualPrice}/yr`);

          const change: BackendChange = {
            id: `pricing-${page.competitorId}-${Date.now()}-${index}`,
            competitorId: page.competitorId,
            competitorName: page.competitorName,
            changeType: ChangeType.PRICING,
            signalType: SignalType.INFORMATIONAL,
            priority: Priority.MEDIUM,
            title: `${plan.name} pricing for ${page.competitorName}`,
            summary:
              priceSummaryParts.join(" · ") ||
              (pricingJson.hasPricingHidden ? "Pricing requires contacting sales" : null),
            isRead: false,
            isDismissed: false,
            detectedAt,
            pageType,
            url: page.url,
          };

          changes.push(change);
        });

        const totalPlans = pricingJson.plans.length;
        if (totalPlans > 0) {
          const insight: BackendInsight = {
            id: `insight-pricing-${page.competitorId}-${Date.now()}`,
            competitorId: page.competitorId,
            competitorName: page.competitorName,
            title: `Pricing structure for ${page.competitorName}`,
            briefing: `Detected ${totalPlans} pricing plan${totalPlans === 1 ? "" : "s"} on the pricing page.`,
            signalType: SignalType.INFORMATIONAL,
            priority: pricingJson.hasPricingHidden ? Priority.HIGH : Priority.MEDIUM,
            recommendedActions: [],
            generatedAt: startedAt,
            pageType,
            score: pricingJson.hasPricingHidden ? 0.7 : 0.4,
            tags: ["pricing"],
          };
          insights.push(insight);
        }
      } else if (page.channel === SourceChannel.FEATURES) {
        const featuresJson = raw as FeaturesResultJson;
        if (!Array.isArray(featuresJson.features) || featuresJson.features.length === 0) continue;

        const pageType = SourceChannel.FEATURES;
        featuresJson.features.forEach((feat, index) => {
          if (!feat || !feat.name) return;

          const detectedAt = startedAt;
          const change: BackendChange = {
            id: `feature-${page.competitorId}-${Date.now()}-${index}`,
            competitorId: page.competitorId,
            competitorName: page.competitorName,
            changeType: ChangeType.FEATURE_ADD,
            signalType: SignalType.INFORMATIONAL,
            priority: feat.highlighted ? Priority.HIGH : Priority.MEDIUM,
            title: `Feature: ${feat.name}`,
            summary: feat.description ?? feat.category ?? null,
            isRead: false,
            isDismissed: false,
            detectedAt,
            pageType,
            url: page.url,
          };
          changes.push(change);
        });

        const totalFeatures = featuresJson.features.length;
        if (totalFeatures > 0) {
          const insight: BackendInsight = {
            id: `insight-features-${page.competitorId}-${Date.now()}`,
            competitorId: page.competitorId,
            competitorName: page.competitorName,
            title: `Product capabilities for ${page.competitorName}`,
            briefing: `Detected ${totalFeatures} feature${totalFeatures === 1 ? "" : "s"} on the features page.`,
            signalType: SignalType.INFORMATIONAL,
            priority: Priority.MEDIUM,
            recommendedActions: [],
            generatedAt: startedAt,
            pageType,
            score: 0.4,
            tags: ["features"],
          };
          insights.push(insight);
        }
      } else if (page.channel === SourceChannel.PRODUCT) {
        const changelogJson = raw as ChangelogResultJson;
        if (!Array.isArray(changelogJson.entries) || changelogJson.entries.length === 0) continue;

        const pageType = SourceChannel.PRODUCT;
        changelogJson.entries.forEach((entry, index) => {
          if (!entry || !entry.title) return;

          const detectedAt = entry.publishedAt && typeof entry.publishedAt === "string" ? entry.publishedAt : startedAt;
          const isFeature = Boolean(entry.isFeatureAnnouncement);
          const isPivot = Boolean(entry.isPivotSignal);

          const change: BackendChange = {
            id: `changelog-${page.competitorId}-${Date.now()}-${index}`,
            competitorId: page.competitorId,
            competitorName: page.competitorName,
            changeType: ChangeType.CHANGELOG,
            signalType: isPivot
              ? SignalType.THREAT
              : isFeature
                ? SignalType.OPPORTUNITY
                : SignalType.INFORMATIONAL,
            priority: isPivot ? Priority.HIGH : isFeature ? Priority.MEDIUM : Priority.LOW,
            title: entry.title,
            summary: entry.summary ?? null,
            isRead: false,
            isDismissed: false,
            detectedAt,
            pageType,
            url: entry.url ?? page.url,
          };
          changes.push(change);
        });

        const totalEntries = changelogJson.entries.length;
        if (totalEntries > 0) {
          const insight: BackendInsight = {
            id: `insight-product-${page.competitorId}-${Date.now()}`,
            competitorId: page.competitorId,
            competitorName: page.competitorName,
            title: `Recent product updates for ${page.competitorName}`,
            briefing: `Detected ${totalEntries} recent changelog entr${totalEntries === 1 ? "y" : "ies"} on the product page.`,
            signalType: SignalType.INFORMATIONAL,
            priority: Priority.MEDIUM,
            recommendedActions: [],
            generatedAt: startedAt,
            pageType,
            score: 0.5,
            tags: ["product", "changelog"],
          };
          insights.push(insight);
        }
      } else if (page.channel === SourceChannel.CHANGELOG) {
        const changelogJson = raw as ChangelogResultJson;
        if (!Array.isArray(changelogJson.entries) || changelogJson.entries.length === 0) continue;

        const pageType = SourceChannel.CHANGELOG;
        changelogJson.entries.forEach((entry, index) => {
          if (!entry || !entry.title) return;

          const detectedAt = entry.publishedAt && typeof entry.publishedAt === "string" ? entry.publishedAt : startedAt;
          const isFeature = Boolean(entry.isFeatureAnnouncement);
          const isPivot = Boolean(entry.isPivotSignal);

          const change: BackendChange = {
            id: `changelog-${page.competitorId}-${Date.now()}-${index}`,
            competitorId: page.competitorId,
            competitorName: page.competitorName,
            changeType: ChangeType.CHANGELOG,
            signalType: isPivot
              ? SignalType.THREAT
              : isFeature
                ? SignalType.OPPORTUNITY
                : SignalType.INFORMATIONAL,
            priority: isPivot ? Priority.HIGH : isFeature ? Priority.MEDIUM : Priority.LOW,
            title: entry.title,
            summary: entry.summary ?? null,
            isRead: false,
            isDismissed: false,
            detectedAt,
            pageType,
            url: entry.url ?? page.url,
          };
          changes.push(change);
        });

        const totalEntries = changelogJson.entries.length;
        if (totalEntries > 0) {
          const insight: BackendInsight = {
            id: `insight-changelog-${page.competitorId}-${Date.now()}`,
            competitorId: page.competitorId,
            competitorName: page.competitorName,
            title: `Recent changelog for ${page.competitorName}`,
            briefing: `Detected ${totalEntries} recent changelog entr${totalEntries === 1 ? "y" : "ies"}.`,
            signalType: SignalType.INFORMATIONAL,
            priority: Priority.MEDIUM,
            recommendedActions: [],
            generatedAt: startedAt,
            pageType,
            score: 0.5,
            tags: ["changelog"],
          };
          insights.push(insight);
        }
      } else if (page.channel === SourceChannel.REVIEWS) {
        const reviewsJson = raw as ReviewsResultJson;
        if (!Array.isArray(reviewsJson.reviews) || reviewsJson.reviews.length === 0) continue;

        const pageType = SourceChannel.REVIEWS;
        reviewsJson.reviews.forEach((rev, index) => {
          if (!rev) return;

          const detectedAt = normalizeDetectedAt(rev.postedAt, startedAt);
          const summary = rev.summary ?? rev.pros ?? rev.cons ?? null;

          const change: BackendChange = {
            id: `review-${page.competitorId}-${Date.now()}-${index}`,
            competitorId: page.competitorId,
            competitorName: page.competitorName,
            changeType: ChangeType.REVIEW_TREND,
            signalType: SignalType.INFORMATIONAL,
            priority: Priority.MEDIUM,
            title: `Review (${rev.rating ?? "NR"}/5) for ${page.competitorName}`,
            summary,
            isRead: false,
            isDismissed: false,
            detectedAt,
            pageType,
            url: page.url,
          };
          changes.push(change);
        });

        const totalReviews = reviewsJson.totalReviews ?? reviewsJson.reviews.length;
        const avgRating = reviewsJson.averageRating ?? null;
        const insight: BackendInsight = {
          id: `insight-reviews-${page.competitorId}-${Date.now()}`,
          competitorId: page.competitorId,
          competitorName: page.competitorName,
          title: `Review sentiment for ${page.competitorName}`,
          briefing:
            avgRating != null
              ? `Average rating ${avgRating.toFixed(1)}/5 from ${totalReviews} review${totalReviews === 1 ? "" : "s"}.`
              : `Detected ${totalReviews} review${totalReviews === 1 ? "" : "s"} on the reviews page.`,
          signalType: SignalType.INFORMATIONAL,
          priority: Priority.MEDIUM,
          recommendedActions: [],
          generatedAt: startedAt,
          pageType,
          score: 0.5,
          tags: ["reviews"],
        };
        insights.push(insight);
      }
    }

    const nowIso = new Date().toISOString();
    const totalCompetitors = new Set(pages.map((p) => p.competitorId)).size;

    const scanRun = await scanRepository.create({
      companyId,
      goalName: pages[0]?.matchupId ? "product_matchup_scan" : "competitor_radar_scan",
      status,
      startedAt,
      completedAt: nowIso,
      totalSignals: changes.length,
      totalInsights: insights.length,
      totalCompetitors,
      errorMessage: firstError,
    });

    const matchupId = pages[0]?.matchupId;

    if (changes.length) {
      await changeRepository.createMany({
        companyId,
        scanRunId: scanRun.id,
        matchupId,
        changes,
      });
    }

    const competitorIds = [...new Set(pages.map((p) => p.competitorId).filter(Boolean))] as string[];
    const matchupIds = [...new Set(pages.map((p) => p.matchupId).filter(Boolean))] as string[];
    const flowPromises: Promise<void>[] = [];
    for (const c of changes) {
      flowPromises.push(
        flowService.executeForEvent(companyId, "change_created", {
          change: c,
          competitorId: c.competitorId ?? undefined,
          matchupId: c.matchupId ?? undefined,
        }),
      );
    }
    for (const i of insights) {
      flowPromises.push(
        flowService.executeForEvent(companyId, "insight_created", {
          insight: i,
          competitorId: i.competitorId ?? undefined,
          matchupId: i.matchupId ?? undefined,
        }),
      );
    }
    flowPromises.push(
      flowService.executeForEvent(companyId, "scan_completed", {
        scanRunId: scanRun.id,
        status: scanRun.status,
        totalSignals: scanRun.totalSignals,
        totalInsights: scanRun.totalInsights,
        competitorIds,
        matchupIds,
      }),
    );
    await Promise.all(flowPromises);

    revalidateTag("status");
    revalidateTag("insights");
    revalidateTag("information");

    return { scanRun, changes, insights };
  },

  /**
   * Same as runCompetitorScan but calls onEvent for each TinyFish SSE event (e.g. STREAMING_URL, PROGRESS)
   * so the client can show live progress and embed the streaming URL in an iframe.
   */
  async runCompetitorScanStreaming(
    companyId: string,
    pages: CompetitorPageTarget[],
    onEvent: (event: StreamingScanEvent) => void,
  ): Promise<RunCompetitorScanResult> {
    const startedAt = new Date().toISOString();

    const pageResults = await Promise.allSettled(
      pages.map(async (page, pageIndex) => {
        const body: TinyFishRequest = {
          url: page.url,
          goal: resolveGoalForPage(page),
          browser_profile:
            page.channel === SourceChannel.PRICING ||
            page.channel === SourceChannel.JOBS ||
            page.channel === SourceChannel.PRODUCT
              ? "stealth"
              : "lite",
          proxy_config: { enabled: false },
        };

        const result = await runSSEWithCallbacks(body, (evt) => {
          onEvent({
            type: evt.type,
            status: evt.status,
            streaming_url: evt.streaming_url ?? evt.streamingUrl ?? undefined,
            resultJson: evt.resultJson,
            error: evt.error,
            message: evt.message,
            help_message: evt.help_message,
            pageIndex,
            competitorId: page.competitorId,
            competitorName: page.competitorName,
          });
        });
        return { page, result };
      }),
    );

    const resolved = pageResults.map((entry, index) => {
      if (entry.status === "fulfilled") return entry.value;
      const page = pages[index];
      return {
        page: page ?? pages[0],
        result: {
          success: false,
          resultJson: null,
          status: "FAILED",
          error: String(entry.reason),
          rawEvents: [],
        },
      };
    });

    const allFailed = resolved.every((r) => !r.result.success);
    const someFailed = resolved.some((r) => !r.result.success);
    const status: ScanRun["status"] = allFailed || someFailed ? "failed" : "completed";

    const firstError =
      resolved.find((r) => !r.result.success)?.result?.error ??
      (someFailed ? "One or more pages failed to scan" : undefined);

    const changes: BackendChange[] = [];
    const insights: BackendInsight[] = [];

    for (const { page, result } of resolved) {
      if (!result.success) continue;

      const raw = result.resultJson as unknown;
      if (!raw || typeof raw !== "object") continue;

      if (page.matchupContext) {
        const rawObj = raw as Record<string, unknown>;
        const summary =
          typeof rawObj.summary === "string"
            ? rawObj.summary
            : typeof rawObj.briefing === "string"
              ? rawObj.briefing
              : null;

        const change: BackendChange = {
          id: `matchup-${page.competitorId}-${Date.now()}`,
          competitorId: page.competitorId,
          competitorName: page.competitorName,
          matchupId: page.matchupId,
          changeType: ChangeType.CUSTOM,
          signalType: SignalType.INFORMATIONAL,
          priority: Priority.MEDIUM,
          title: `Matchup scan: ${page.matchupContext.productName} vs ${page.competitorName}`,
          summary: summary ?? null,
          rawExtracted: rawObj,
          isRead: false,
          isDismissed: false,
          detectedAt: startedAt,
          pageType: SourceChannel.PRODUCT,
          url: page.url,
        };
        changes.push(change);

        const insight: BackendInsight = {
          id: `insight-matchup-${page.competitorId}-${Date.now()}`,
          competitorId: page.competitorId,
          competitorName: page.competitorName,
          matchupId: page.matchupId,
          title: `Matchup insight: ${page.matchupContext.productName} vs ${page.competitorName}`,
          briefing:
            summary ??
            `Matchup scan completed for ${page.matchupContext.productName} vs ${page.competitorName}.`,
          signalType: SignalType.INFORMATIONAL,
          priority: Priority.MEDIUM,
          recommendedActions: [],
          generatedAt: startedAt,
          pageType: SourceChannel.PRODUCT,
          score: 0.6,
          tags: ["matchup"],
        };
        insights.push(insight);
        continue;
      }

      if (page.channel === SourceChannel.JOBS) {
        const jobsJson = raw as JobsResultJson;
        if (!Array.isArray(jobsJson.jobs)) continue;

        const pageType = SourceChannel.JOBS;

        jobsJson.jobs.forEach((job, index) => {
          if (!job || !job.title) return;

          const isNewSignal = Boolean(job.isNewProductSignal);
          const detectedAt = normalizeDetectedAt(job.postedAt, startedAt);

          const change: BackendChange = {
            id: `job-${page.competitorId}-${Date.now()}-${index}`,
            competitorId: page.competitorId,
            competitorName: page.competitorName,
            changeType: ChangeType.JOB_SIGNAL,
            signalType: isNewSignal ? SignalType.OPPORTUNITY : SignalType.INFORMATIONAL,
            priority: isNewSignal ? Priority.HIGH : Priority.MEDIUM,
            title: job.title,
            summary:
              job.productSignalReason ??
              (([
                job.department,
                job.location,
                job.seniorityLevel,
                job.isRemote ? "Remote" : null,
              ]
                .filter(Boolean)
                .join(" • ")) || null),
            isRead: false,
            isDismissed: false,
            detectedAt,
            pageType,
            url: page.url,
          };

          changes.push(change);
        });

        const totalJobs = jobsJson.jobs.length;
        const newSignals = jobsJson.jobs.filter((j) => j?.isNewProductSignal).length;

        if (totalJobs > 0) {
          const insight: BackendInsight = {
            id: `insight-jobs-${page.competitorId}-${Date.now()}`,
            competitorId: page.competitorId,
            competitorName: page.competitorName,
            title: `Hiring signals from jobs page`,
            briefing: `Found ${totalJobs} open roles on the jobs page for ${page.competitorName}, including ${newSignals} roles flagged as potential new product signals.`,
            signalType: newSignals > 0 ? SignalType.OPPORTUNITY : SignalType.INFORMATIONAL,
            priority: newSignals > 0 ? Priority.HIGH : Priority.MEDIUM,
            recommendedActions: [
              "Review these roles to understand focus areas and product bets.",
              "Track changes over time to see if hiring velocity increases or decreases.",
            ],
            generatedAt: startedAt,
            pageType: pageType,
            score: newSignals > 0 ? 0.8 : 0.4,
            tags: ["jobs", "hiring", "product-signal"],
          };

          insights.push(insight);
        }
      } else if (page.channel === SourceChannel.PRICING) {
        const pricingJson = raw as PricingResultJson;
        if (!Array.isArray(pricingJson.plans) || pricingJson.plans.length === 0) continue;

        const pageType = SourceChannel.PRICING;
        pricingJson.plans.forEach((plan, index) => {
          if (!plan || !plan.name) return;

          const detectedAt = startedAt;
          const priceSummaryParts: string[] = [];
          if (typeof plan.monthlyPrice === "number") priceSummaryParts.push(`$${plan.monthlyPrice}/mo`);
          if (typeof plan.annualPrice === "number") priceSummaryParts.push(`$${plan.annualPrice}/yr`);

          const change: BackendChange = {
            id: `pricing-${page.competitorId}-${Date.now()}-${index}`,
            competitorId: page.competitorId,
            competitorName: page.competitorName,
            changeType: ChangeType.PRICING,
            signalType: SignalType.INFORMATIONAL,
            priority: Priority.MEDIUM,
            title: `${plan.name} pricing for ${page.competitorName}`,
            summary:
              priceSummaryParts.join(" · ") ||
              (pricingJson.hasPricingHidden ? "Pricing requires contacting sales" : null),
            isRead: false,
            isDismissed: false,
            detectedAt,
            pageType,
            url: page.url,
          };

          changes.push(change);
        });

        const totalPlans = pricingJson.plans.length;
        if (totalPlans > 0) {
          const insight: BackendInsight = {
            id: `insight-pricing-${page.competitorId}-${Date.now()}`,
            competitorId: page.competitorId,
            competitorName: page.competitorName,
            title: `Pricing structure for ${page.competitorName}`,
            briefing: `Detected ${totalPlans} pricing plan${totalPlans === 1 ? "" : "s"} on the pricing page.`,
            signalType: SignalType.INFORMATIONAL,
            priority: pricingJson.hasPricingHidden ? Priority.HIGH : Priority.MEDIUM,
            recommendedActions: [],
            generatedAt: startedAt,
            pageType,
            score: pricingJson.hasPricingHidden ? 0.7 : 0.4,
            tags: ["pricing"],
          };
          insights.push(insight);
        }
      } else if (page.channel === SourceChannel.FEATURES) {
        const featuresJson = raw as FeaturesResultJson;
        if (!Array.isArray(featuresJson.features) || featuresJson.features.length === 0) continue;

        const pageType = SourceChannel.FEATURES;
        featuresJson.features.forEach((feat, index) => {
          if (!feat || !feat.name) return;

          const detectedAt = startedAt;
          const change: BackendChange = {
            id: `feature-${page.competitorId}-${Date.now()}-${index}`,
            competitorId: page.competitorId,
            competitorName: page.competitorName,
            changeType: ChangeType.FEATURE_ADD,
            signalType: SignalType.INFORMATIONAL,
            priority: feat.highlighted ? Priority.HIGH : Priority.MEDIUM,
            title: `Feature: ${feat.name}`,
            summary: feat.description ?? feat.category ?? null,
            isRead: false,
            isDismissed: false,
            detectedAt,
            pageType,
            url: page.url,
          };
          changes.push(change);
        });

        const totalFeatures = featuresJson.features.length;
        if (totalFeatures > 0) {
          const insight: BackendInsight = {
            id: `insight-features-${page.competitorId}-${Date.now()}`,
            competitorId: page.competitorId,
            competitorName: page.competitorName,
            title: `Product capabilities for ${page.competitorName}`,
            briefing: `Detected ${totalFeatures} feature${totalFeatures === 1 ? "" : "s"} on the features page.`,
            signalType: SignalType.INFORMATIONAL,
            priority: Priority.MEDIUM,
            recommendedActions: [],
            generatedAt: startedAt,
            pageType,
            score: 0.4,
            tags: ["features"],
          };
          insights.push(insight);
        }
      } else if (page.channel === SourceChannel.PRODUCT) {
        const changelogJson = raw as ChangelogResultJson;
        if (!Array.isArray(changelogJson.entries) || changelogJson.entries.length === 0) continue;

        const pageType = SourceChannel.PRODUCT;
        changelogJson.entries.forEach((entry, index) => {
          if (!entry || !entry.title) return;

          const detectedAt = entry.publishedAt && typeof entry.publishedAt === "string" ? entry.publishedAt : startedAt;
          const isFeature = Boolean(entry.isFeatureAnnouncement);
          const isPivot = Boolean(entry.isPivotSignal);

          const change: BackendChange = {
            id: `changelog-${page.competitorId}-${Date.now()}-${index}`,
            competitorId: page.competitorId,
            competitorName: page.competitorName,
            changeType: ChangeType.CHANGELOG,
            signalType: isPivot
              ? SignalType.THREAT
              : isFeature
                ? SignalType.OPPORTUNITY
                : SignalType.INFORMATIONAL,
            priority: isPivot ? Priority.HIGH : isFeature ? Priority.MEDIUM : Priority.LOW,
            title: entry.title,
            summary: entry.summary ?? null,
            isRead: false,
            isDismissed: false,
            detectedAt,
            pageType,
            url: entry.url ?? page.url,
          };
          changes.push(change);
        });

        const totalEntries = changelogJson.entries.length;
        if (totalEntries > 0) {
          const insight: BackendInsight = {
            id: `insight-product-${page.competitorId}-${Date.now()}`,
            competitorId: page.competitorId,
            competitorName: page.competitorName,
            title: `Recent product updates for ${page.competitorName}`,
            briefing: `Detected ${totalEntries} recent changelog entr${totalEntries === 1 ? "y" : "ies"} on the product page.`,
            signalType: SignalType.INFORMATIONAL,
            priority: Priority.MEDIUM,
            recommendedActions: [],
            generatedAt: startedAt,
            pageType,
            score: 0.5,
            tags: ["product", "changelog"],
          };
          insights.push(insight);
        }
      } else if (page.channel === SourceChannel.CHANGELOG) {
        const changelogJson = raw as ChangelogResultJson;
        if (!Array.isArray(changelogJson.entries) || changelogJson.entries.length === 0) continue;

        const pageType = SourceChannel.CHANGELOG;
        changelogJson.entries.forEach((entry, index) => {
          if (!entry || !entry.title) return;

          const detectedAt = entry.publishedAt && typeof entry.publishedAt === "string" ? entry.publishedAt : startedAt;
          const isFeature = Boolean(entry.isFeatureAnnouncement);
          const isPivot = Boolean(entry.isPivotSignal);

          const change: BackendChange = {
            id: `changelog-${page.competitorId}-${Date.now()}-${index}`,
            competitorId: page.competitorId,
            competitorName: page.competitorName,
            changeType: ChangeType.CHANGELOG,
            signalType: isPivot
              ? SignalType.THREAT
              : isFeature
                ? SignalType.OPPORTUNITY
                : SignalType.INFORMATIONAL,
            priority: isPivot ? Priority.HIGH : isFeature ? Priority.MEDIUM : Priority.LOW,
            title: entry.title,
            summary: entry.summary ?? null,
            isRead: false,
            isDismissed: false,
            detectedAt,
            pageType,
            url: entry.url ?? page.url,
          };
          changes.push(change);
        });

        const totalEntries = changelogJson.entries.length;
        if (totalEntries > 0) {
          const insight: BackendInsight = {
            id: `insight-changelog-${page.competitorId}-${Date.now()}`,
            competitorId: page.competitorId,
            competitorName: page.competitorName,
            title: `Recent changelog for ${page.competitorName}`,
            briefing: `Detected ${totalEntries} recent changelog entr${totalEntries === 1 ? "y" : "ies"}.`,
            signalType: SignalType.INFORMATIONAL,
            priority: Priority.MEDIUM,
            recommendedActions: [],
            generatedAt: startedAt,
            pageType,
            score: 0.5,
            tags: ["changelog"],
          };
          insights.push(insight);
        }
      } else if (page.channel === SourceChannel.REVIEWS) {
        const reviewsJson = raw as ReviewsResultJson;
        if (!Array.isArray(reviewsJson.reviews) || reviewsJson.reviews.length === 0) continue;

        const pageType = SourceChannel.REVIEWS;
        reviewsJson.reviews.forEach((rev, index) => {
          if (!rev) return;

          const detectedAt = normalizeDetectedAt(rev.postedAt, startedAt);
          const summary = rev.summary ?? rev.pros ?? rev.cons ?? null;

          const change: BackendChange = {
            id: `review-${page.competitorId}-${Date.now()}-${index}`,
            competitorId: page.competitorId,
            competitorName: page.competitorName,
            changeType: ChangeType.REVIEW_TREND,
            signalType: SignalType.INFORMATIONAL,
            priority: Priority.MEDIUM,
            title: `Review (${rev.rating ?? "NR"}/5) for ${page.competitorName}`,
            summary,
            isRead: false,
            isDismissed: false,
            detectedAt,
            pageType,
            url: page.url,
          };
          changes.push(change);
        });

        const totalReviews = reviewsJson.totalReviews ?? reviewsJson.reviews.length;
        const avgRating = reviewsJson.averageRating ?? null;
        const insight: BackendInsight = {
          id: `insight-reviews-${page.competitorId}-${Date.now()}`,
          competitorId: page.competitorId,
          competitorName: page.competitorName,
          title: `Review sentiment for ${page.competitorName}`,
          briefing:
            avgRating != null
              ? `Average rating ${avgRating.toFixed(1)}/5 from ${totalReviews} review${totalReviews === 1 ? "" : "s"}.`
              : `Detected ${totalReviews} review${totalReviews === 1 ? "" : "s"} on the reviews page.`,
          signalType: SignalType.INFORMATIONAL,
          priority: Priority.MEDIUM,
          recommendedActions: [],
          generatedAt: startedAt,
          pageType,
          score: 0.5,
          tags: ["reviews"],
        };
        insights.push(insight);
      }
    }

    const nowIso = new Date().toISOString();
    const totalCompetitors = new Set(pages.map((p) => p.competitorId)).size;

    const scanRun = await scanRepository.create({
      companyId,
      goalName: pages[0]?.matchupId ? "product_matchup_scan" : "competitor_radar_scan",
      status,
      startedAt,
      completedAt: nowIso,
      totalSignals: changes.length,
      totalInsights: insights.length,
      totalCompetitors,
      errorMessage: firstError,
    });

    const matchupId = pages[0]?.matchupId;

    if (changes.length) {
      await changeRepository.createMany({
        companyId,
        scanRunId: scanRun.id,
        matchupId,
        changes,
      });
    }

    const competitorIds = [...new Set(pages.map((p) => p.competitorId).filter(Boolean))] as string[];
    const matchupIds = [...new Set(pages.map((p) => p.matchupId).filter(Boolean))] as string[];
    const flowPromises: Promise<void>[] = [];
    for (const c of changes) {
      flowPromises.push(
        flowService.executeForEvent(companyId, "change_created", {
          change: c,
          competitorId: c.competitorId ?? undefined,
          matchupId: c.matchupId ?? undefined,
        }),
      );
    }
    for (const i of insights) {
      flowPromises.push(
        flowService.executeForEvent(companyId, "insight_created", {
          insight: i,
          competitorId: i.competitorId ?? undefined,
          matchupId: i.matchupId ?? undefined,
        }),
      );
    }
    flowPromises.push(
      flowService.executeForEvent(companyId, "scan_completed", {
        scanRunId: scanRun.id,
        status: scanRun.status,
        totalSignals: scanRun.totalSignals,
        totalInsights: scanRun.totalInsights,
        competitorIds,
        matchupIds,
      }),
    );
    await Promise.all(flowPromises);

    revalidateTag("status");
    revalidateTag("insights");
    revalidateTag("information");

    return { scanRun, changes, insights };
  },

  /**
   * Runs a compliance-focused TinyFish scan (BSE/NSE circulars etc.), persists a ScanRun, and emits scan_completed
   * so Integration flows can send alerts. companyId is required for multi-tenancy and flow execution.
   */
  async runComplianceScan(
    companyId: string,
    targetUrl: string,
    _triggeredBy: "user" | "automation" = "user",
  ): Promise<{
    scanRun: ScanRun;
    changes: BackendChange[];
    insights: BackendInsight[];
  }> {
    const startedAt = new Date().toISOString();

    const body: TinyFishRequest = {
      url: targetUrl,
      goal: buildComplianceGoal(),
      browser_profile: "lite",
      proxy_config: { enabled: false },
    };

    const result = await runSSE(body);

    const nowIso = new Date().toISOString();
    const status: ScanRun["status"] = result.success ? "completed" : "failed";
    const totalSignals = 0;
    const totalInsights = 0;
    const totalCompetitors = 0;
    const errorMessage = result.success ? undefined : result.error ?? "Compliance scan failed";

    const scanRun = await scanRepository.create({
      companyId,
      goalName: "compliance_radar_scan",
      status,
      startedAt,
      completedAt: nowIso,
      totalSignals,
      totalInsights,
      totalCompetitors,
      errorMessage,
    });

    if (result.success) {
      void flowService.executeForEvent(companyId, "scan_completed", {
        scanRunId: scanRun.id,
        status: scanRun.status,
        totalSignals: scanRun.totalSignals,
        totalInsights: scanRun.totalInsights,
      });
    }

    revalidateTag("status");
    revalidateTag("insights");
    revalidateTag("information");

    const changes: BackendChange[] = [];
    const insights: BackendInsight[] = [];

    return { scanRun, changes, insights };
  },
};

