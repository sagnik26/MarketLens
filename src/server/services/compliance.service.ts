/** Business logic for Compliance: sources, schedules, and running compliance scans. */

import { complianceSourceRepository } from "@/server/repositories/compliance-source.repository";
import { complianceScheduleRepository } from "@/server/repositories/compliance-schedule.repository";
import { scanService } from "@/server/services/scan.service";
import { flowService } from "@/server/services/flow.service";
import { NotFoundError } from "@/server/api/errors";
import type { ScanRun } from "@/types";
import type { BackendChange, BackendInsight } from "@/types";
import type { ComplianceSourceResponse } from "@/server/models/ComplianceSource.model";
import type { ComplianceScheduleResponse } from "@/server/models/ComplianceSchedule.model";

const COMPLIANCE_SCAN_COMPLETED_EVENT = "compliance_scan_completed";

export const complianceService = {
  async listSources(companyId: string): Promise<ComplianceSourceResponse[]> {
    return complianceSourceRepository.findMany(companyId);
  },

  async getSource(companyId: string, sourceId: string): Promise<ComplianceSourceResponse> {
    const source = await complianceSourceRepository.findById(companyId, sourceId);
    if (!source) throw new NotFoundError("Compliance source");
    return source;
  },

  async addSource(
    companyId: string,
    data: { name: string; url: string },
  ): Promise<ComplianceSourceResponse> {
    return complianceSourceRepository.create(companyId, data);
  },

  async deleteSource(companyId: string, sourceId: string): Promise<void> {
    const found = await complianceSourceRepository.findById(companyId, sourceId);
    if (!found) throw new NotFoundError("Compliance source");
    await complianceSourceRepository.delete(companyId, sourceId);
  },

  async runComplianceScan(
    companyId: string,
    sourceId: string,
  ): Promise<{ scanRun: ScanRun; changes: BackendChange[]; insights: BackendInsight[] }> {
    const source = await complianceSourceRepository.findById(companyId, sourceId);
    if (!source) throw new NotFoundError("Compliance source");
    const result = await scanService.runComplianceScan(companyId, source.url, "user");
    void flowService.executeForEvent(companyId, COMPLIANCE_SCAN_COMPLETED_EVENT, {
      sourceId,
      sourceName: source.name,
      scanRunId: result.scanRun.id,
      status: result.scanRun.status,
      totalSignals: result.scanRun.totalSignals,
      totalInsights: result.scanRun.totalInsights,
    });
    return result;
  },

  async listSchedules(companyId: string): Promise<ComplianceScheduleResponse[]> {
    return complianceScheduleRepository.findMany(companyId);
  },

  async createSchedule(
    companyId: string,
    data: { complianceSourceId: string; cronExpression: string; isEnabled?: boolean },
  ): Promise<ComplianceScheduleResponse> {
    return complianceScheduleRepository.create({
      companyId,
      complianceSourceId: data.complianceSourceId,
      cronExpression: data.cronExpression,
      isEnabled: data.isEnabled ?? false,
    });
  },

  async updateSchedule(
    companyId: string,
    scheduleId: string,
    data: { cronExpression?: string; isEnabled?: boolean },
  ): Promise<ComplianceScheduleResponse> {
    const existing = await complianceScheduleRepository.findById(companyId, scheduleId);
    if (!existing) throw new NotFoundError("Compliance schedule");
    const update: { cronExpression?: string; isEnabled?: boolean } = {};
    if (data.cronExpression !== undefined) update.cronExpression = data.cronExpression;
    if (data.isEnabled !== undefined) update.isEnabled = data.isEnabled;
    const updated = await complianceScheduleRepository.update(companyId, scheduleId, update);
    if (!updated) throw new NotFoundError("Compliance schedule");
    return updated;
  },

  async deleteSchedule(companyId: string, scheduleId: string): Promise<void> {
    const found = await complianceScheduleRepository.findById(companyId, scheduleId);
    if (!found) throw new NotFoundError("Compliance schedule");
    await complianceScheduleRepository.delete(companyId, scheduleId);
  },
};
