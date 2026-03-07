/** Server Actions: compliance sources, scans, schedules, and alert-check (Integrations). */
"use server";

import { unstable_cache, revalidateTag } from "next/cache";
import type { ActionResponse } from "@/types/actions.types";
import type { BackendChange, BackendInsight, ScanRun } from "@/types";
import { getServerAuthContext } from "@/server/lib/auth/server-context";
import { scanRepository } from "@/server/repositories/scan.repository";
import { scanService } from "@/server/services/scan.service";
import { complianceService } from "@/server/services/compliance.service";
import type { ComplianceSourceResponse } from "@/server/models/ComplianceSource.model";
import type { ComplianceScheduleResponse } from "@/server/models/ComplianceSchedule.model";

const CACHE_REVALIDATE_SECONDS = 2 * 60; // 2 minutes
const COMPLIANCE_TAG = "compliance";

export interface ComplianceSummary {
  lastRun: ScanRun | null;
  changes: BackendChange[];
  insights: BackendInsight[];
}

/** Legacy: run a compliance scan against default BSE URL and return summary. Prefer runComplianceScanAction(sourceId). */
export async function getComplianceSummaryAction(): Promise<ActionResponse<ComplianceSummary>> {
  const { companyId } = await getServerAuthContext();
  const targetUrl = "https://www.bseindia.com/markets/MarketInfo/DispNewNoticesCirculars.aspx";
  const { scanRun, changes, insights } = await scanService.runComplianceScan(companyId, targetUrl, "user");
  return {
    success: true,
    data: { lastRun: scanRun, changes, insights },
  };
}

async function getComplianceSourcesCached(companyId: string) {
  return unstable_cache(
    async () => complianceService.listSources(companyId),
    [COMPLIANCE_TAG, "sources", companyId],
    { revalidate: CACHE_REVALIDATE_SECONDS, tags: [COMPLIANCE_TAG] }
  )();
}

export async function getComplianceSourcesAction(): Promise<ActionResponse<ComplianceSourceResponse[]>> {
  try {
    const { companyId } = await getServerAuthContext();
    const sources = await getComplianceSourcesCached(companyId);
    return { success: true, data: sources };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, error: message };
  }
}

export async function addComplianceSourceAction(formData: FormData): Promise<ActionResponse<ComplianceSourceResponse>> {
  try {
    const { companyId } = await getServerAuthContext();
    const name = (formData.get("name") as string)?.trim();
    const url = (formData.get("url") as string)?.trim();
    if (!name || !url) return { success: false, error: "Name and URL are required." };
    const source = await complianceService.addSource(companyId, { name, url });
    revalidateTag(COMPLIANCE_TAG);
    revalidateTag("compliance-sources"); // invalidate API GET /compliance/sources cache
    return { success: true, data: source };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, error: message };
  }
}

export async function deleteComplianceSourceAction(sourceId: string): Promise<ActionResponse<null>> {
  try {
    const { companyId } = await getServerAuthContext();
    await complianceService.deleteSource(companyId, sourceId);
    revalidateTag(COMPLIANCE_TAG);
    revalidateTag("compliance-sources"); // invalidate API GET /compliance/sources cache
    return { success: true, data: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, error: message };
  }
}

export async function runComplianceScanAction(
  sourceId: string,
): Promise<ActionResponse<{ scanRun: ScanRun; changes: BackendChange[]; insights: BackendInsight[] }>> {
  try {
    const { companyId } = await getServerAuthContext();
    const result = await complianceService.runComplianceScan(companyId, sourceId);
    revalidateTag(COMPLIANCE_TAG);
    return { success: true, data: result };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, error: message };
  }
}

async function getComplianceRecentRunsCached(companyId: string) {
  return unstable_cache(
    async () => {
      const { scanRuns } = await scanRepository.findMany({
        companyId,
        goalName: "compliance_radar_scan",
        page: 1,
        limit: 20,
      });
      return scanRuns;
    },
    [COMPLIANCE_TAG, "recent-runs", companyId],
    { revalidate: CACHE_REVALIDATE_SECONDS, tags: [COMPLIANCE_TAG] }
  )();
}

export async function getComplianceRecentRunsAction(): Promise<ActionResponse<ScanRun[]>> {
  try {
    const { companyId } = await getServerAuthContext();
    const scanRuns = await getComplianceRecentRunsCached(companyId);
    return { success: true, data: scanRuns };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, error: message };
  }
}

async function getComplianceSchedulesCached(companyId: string) {
  return unstable_cache(
    async () => complianceService.listSchedules(companyId),
    [COMPLIANCE_TAG, "schedules", companyId],
    { revalidate: CACHE_REVALIDATE_SECONDS, tags: [COMPLIANCE_TAG] }
  )();
}

export async function getComplianceSchedulesAction(): Promise<ActionResponse<ComplianceScheduleResponse[]>> {
  try {
    const { companyId } = await getServerAuthContext();
    const schedules = await getComplianceSchedulesCached(companyId);
    return { success: true, data: schedules };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, error: message };
  }
}

export async function createComplianceScheduleAction(payload: {
  complianceSourceId: string;
  cronExpression: string;
  isEnabled?: boolean;
}): Promise<ActionResponse<ComplianceScheduleResponse>> {
  try {
    const { companyId } = await getServerAuthContext();
    const schedule = await complianceService.createSchedule(companyId, payload);
    revalidateTag(COMPLIANCE_TAG);
    return { success: true, data: schedule };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, error: message };
  }
}

export async function updateComplianceScheduleAction(
  scheduleId: string,
  payload: { cronExpression?: string; isEnabled?: boolean },
): Promise<ActionResponse<ComplianceScheduleResponse>> {
  try {
    const { companyId } = await getServerAuthContext();
    const schedule = await complianceService.updateSchedule(companyId, scheduleId, payload);
    revalidateTag(COMPLIANCE_TAG);
    return { success: true, data: schedule };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, error: message };
  }
}

export async function deleteComplianceScheduleAction(scheduleId: string): Promise<ActionResponse<null>> {
  try {
    const { companyId } = await getServerAuthContext();
    await complianceService.deleteSchedule(companyId, scheduleId);
    revalidateTag(COMPLIANCE_TAG);
    return { success: true, data: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, error: message };
  }
}

