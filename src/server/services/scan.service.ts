/** Orchestrates TinyFish via client: creates ScanRun, runs agents (run-sse/run-async), updates status. */

import type { TinyFishRequest } from "@/server/lib/tinyfish/tinyfish.types";
import { runSSE } from "@/server/lib/tinyfish/client";
import {
  buildPricingGoal,
  buildJobsGoal,
  buildChangelogGoal,
  buildFeaturesGoal,
  buildComplianceGoal,
} from "@/server/lib/tinyfish/goals";
import type { BackendChange, BackendInsight, ScanRun } from "@/types";
import { ChangeType, Priority, SignalType, SourceChannel } from "@/constants";
import { scanRepository } from "@/server/repositories/scan.repository";
import { changeRepository } from "@/server/repositories/change.repository";

type CompetitorChannel =
  | typeof SourceChannel.PRICING
  | typeof SourceChannel.JOBS
  | typeof SourceChannel.PRODUCT_HUNT
  | typeof SourceChannel.FEATURES;

interface CompetitorPageTarget {
  competitorId: string;
  competitorName: string;
  url: string;
  channel: CompetitorChannel;
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

function resolveGoal(channel: CompetitorChannel): string {
  switch (channel) {
    case SourceChannel.PRICING:
      return buildPricingGoal();
    case SourceChannel.JOBS:
      return buildJobsGoal();
    case SourceChannel.FEATURES:
      return buildFeaturesGoal();
    case SourceChannel.PRODUCT_HUNT:
      return buildChangelogGoal();
    default:
      return buildPricingGoal();
  }
}

const DEMO_COMPANY_ID = "000000000000000000000000";

export const scanService = {
  /**
   * Runs Tinyfish scans for a set of competitor pages (one or more SourceChannels per competitor)
   * and returns a ScanRun plus normalized Changes and Insights.
   *
   * NOTE: This currently uses Promise.allSettled and does not persist to the database.
   */
  async runCompetitorScan(pages: CompetitorPageTarget[]): Promise<RunCompetitorScanResult> {
    const startedAt = new Date().toISOString();

    const pageResults = await Promise.allSettled(
      pages.map(async (page) => {
        const body: TinyFishRequest = {
          url: page.url,
          goal: resolveGoal(page.channel),
          browser_profile: page.channel === SourceChannel.PRICING || page.channel === SourceChannel.JOBS ? "stealth" : "lite",
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

      if (page.channel === SourceChannel.JOBS) {
        const raw = result.resultJson as unknown;
        if (!raw || typeof raw !== "object") continue;

        const jobsJson = raw as JobsResultJson;
        if (!Array.isArray(jobsJson.jobs)) continue;

        const pageType = SourceChannel.JOBS;

        jobsJson.jobs.forEach((job, index) => {
          if (!job || !job.title) return;

          const isNewSignal = Boolean(job.isNewProductSignal);
          const detectedAt = job.postedAt && typeof job.postedAt === "string" ? job.postedAt : startedAt;

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
      }
    }

    const nowIso = new Date().toISOString();
    const totalCompetitors = new Set(pages.map((p) => p.competitorId)).size;

    const scanRun = await scanRepository.create({
      companyId: DEMO_COMPANY_ID,
      goalName: "competitor_radar_scan",
      status,
      startedAt,
      completedAt: nowIso,
      totalSignals: changes.length,
      totalInsights: insights.length,
      totalCompetitors,
      errorMessage: firstError,
    });

    if (changes.length) {
      await changeRepository.createMany({
        companyId: DEMO_COMPANY_ID,
        scanRunId: scanRun.id,
        changes,
      });
    }

    return { scanRun, changes, insights };
  },

  /**
   * Runs a compliance-focused TinyFish scan (BSE/NSE circulars etc.) and returns a ScanRun plus changes/insights.
   * For now this is a thin wrapper that uses a dedicated compliance goal and marks changes as coming from compliance.
   */
  async runComplianceScan(targetUrl: string): Promise<{
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

    const scanRun: ScanRun = {
      id: `compliance-${Date.now()}`,
      tinyfishRunId: "",
      goalName: "compliance_radar_scan",
      status,
      startedAt,
      completedAt: nowIso,
      totalSignals: 0,
      totalInsights: 0,
      totalCompetitors: 0,
      errorMessage: result.success ? undefined : result.error ?? "Compliance scan failed",
    };

    const changes: BackendChange[] = [];
    const insights: BackendInsight[] = [];

    return { scanRun, changes, insights };
  },
};

