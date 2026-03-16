/** Client-safe types for Compliance sources and schedules (matches server response shapes). */

export interface ComplianceSourceResponse {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceScheduleResponse {
  id: string;
  complianceSourceId: string;
  cronExpression: string;
  isEnabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}
