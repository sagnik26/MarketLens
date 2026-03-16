/** Business logic for automation flows (trigger + webhook actions); CRUD and event execution. */

import { HttpError } from "@/server/api/errors";
import { flowRepository } from "@/server/repositories/flow.repository";
import type { FlowResponse, IFlowAction, IFlowTrigger } from "@/server/models/Flow.model";
import { logger } from "@/server/lib/logger";

export interface CreateFlowInput {
  name: string;
  isEnabled?: boolean;
  trigger: IFlowTrigger;
  competitorId?: string | null;
  complianceSourceId?: string | null;
  matchupId?: string | null;
  actions: IFlowAction[];
}

export interface UpdateFlowInput {
  name?: string;
  isEnabled?: boolean;
  trigger?: IFlowTrigger;
  competitorId?: string | null;
  complianceSourceId?: string | null;
  matchupId?: string | null;
  actions?: IFlowAction[];
}

function isWebhookAction(a: IFlowAction): a is IFlowAction & { type: "webhook" } {
  return a.type === "webhook";
}

function isSlackAction(a: IFlowAction): a is IFlowAction & { type: "slack" } {
  return a.type === "slack";
}

/**
 * Build a Slack Incoming Webhook payload (requires "text" for the message to display).
 */
function formatSlackPayload(eventType: string, payload: Record<string, unknown>): { text: string } {
  if (eventType === "change_created" && payload.change && typeof payload.change === "object") {
    const c = payload.change as Record<string, unknown>;
    const title = typeof c.title === "string" ? c.title : "Change detected";
    const summary = typeof c.summary === "string" ? c.summary : "";
    const changeType = typeof c.changeType === "string" ? c.changeType : "";
    const competitorName = typeof c.competitorName === "string" ? c.competitorName : "";
    const sourceUrl = typeof c.url === "string" ? c.url : "";
    const lines = [
      `*${title}*`,
      competitorName ? `Competitor: ${competitorName}` : "",
      changeType ? `Type: ${changeType}` : "",
      summary,
      sourceUrl,
    ].filter(Boolean);
    return { text: lines.join("\n") || "New change detected." };
  }
  if (eventType === "insight_created" && payload.insight && typeof payload.insight === "object") {
    const i = payload.insight as Record<string, unknown>;
    const title = typeof i.title === "string" ? i.title : "New insight";
    const briefing = typeof i.briefing === "string" ? i.briefing : "";
    const competitorName = typeof i.competitorName === "string" ? i.competitorName : "";
    const lines = [`*${title}*`, competitorName ? `Competitor: ${competitorName}` : "", briefing].filter(Boolean);
    return { text: lines.join("\n") || "New insight generated." };
  }
  if (eventType === "scan_completed") {
    const status = typeof payload.status === "string" ? payload.status : "unknown";
    const scanRunId = payload.scanRunId != null ? String(payload.scanRunId) : "";
    const signals = payload.totalSignals != null ? Number(payload.totalSignals) : 0;
    const insights = payload.totalInsights != null ? Number(payload.totalInsights) : 0;
    const text = [
      "Scan completed.",
      scanRunId ? `Run: ${scanRunId}` : "",
      `Status: ${status}`,
      `Signals: ${signals}, Insights: ${insights}`,
    ]
      .filter(Boolean)
      .join(" ");
    return { text };
  }
  if (eventType === "compliance_scan_completed") {
    const sourceName = typeof payload.sourceName === "string" ? payload.sourceName : "Compliance source";
    const status = typeof payload.status === "string" ? payload.status : "unknown";
    const signals = payload.totalSignals != null ? Number(payload.totalSignals) : 0;
    const insights = payload.totalInsights != null ? Number(payload.totalInsights) : 0;
    const text = [
      `Compliance scan completed: ${sourceName}.`,
      `Status: ${status}`,
      `Signals: ${signals}, Insights: ${insights}`,
    ]
      .filter(Boolean)
      .join(" ");
    return { text };
  }
  const fallback = `Event: ${eventType}. ${JSON.stringify(payload)}`;
  return { text: fallback };
}

async function fireWebhook(
  url: string,
  payload: unknown,
  method: string,
  headers?: Record<string, string>,
): Promise<void> {
  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };
  try {
    const res = await fetch(url, {
      method: method || "POST",
      headers: defaultHeaders,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      (logger as { warn?: (obj: unknown, msg?: string) => void }).warn?.(
        { url, status: res.status, body: bodyText.slice(0, 500) },
        "Flow webhook non-2xx response",
      );
    }
  } catch (err) {
    (logger as { error?: (obj: unknown, msg?: string) => void }).error?.(
      { err, url },
      "Flow webhook request failed",
    );
  }
}

export const flowService = {
  async list(companyId: string): Promise<FlowResponse[]> {
    return flowRepository.findMany(companyId);
  },

  async getById(companyId: string, id: string): Promise<FlowResponse> {
    const flow = await flowRepository.findById(companyId, id);
    if (!flow) throw new HttpError(404, "Flow not found", "NOT_FOUND");
    return flow;
  },

  async create(companyId: string, input: CreateFlowInput): Promise<FlowResponse> {
    const name = input.name?.trim();
    if (!name) throw new HttpError(422, "name is required", "VALIDATION_ERROR");
    if (!input.trigger?.eventType) {
      throw new HttpError(422, "trigger.eventType is required", "VALIDATION_ERROR");
    }
    if (!Array.isArray(input.actions) || input.actions.length === 0) {
      throw new HttpError(422, "At least one action is required", "VALIDATION_ERROR");
    }
    const urlActions = input.actions.filter((a) => isWebhookAction(a) || isSlackAction(a));
    if (urlActions.length === 0) {
      throw new HttpError(422, "At least one webhook or Slack action is required", "VALIDATION_ERROR");
    }
    for (const a of urlActions) {
      if (!a.url?.trim()) {
        throw new HttpError(422, "Every webhook and Slack action must have a url", "VALIDATION_ERROR");
      }
    }
    return flowRepository.create({
      companyId,
      name,
      isEnabled: input.isEnabled ?? true,
      trigger: input.trigger,
      competitorId: input.competitorId ?? null,
      complianceSourceId: input.complianceSourceId ?? null,
      matchupId: input.matchupId ?? null,
      actions: input.actions,
    });
  },

  async update(
    companyId: string,
    id: string,
    input: UpdateFlowInput,
  ): Promise<FlowResponse> {
    await this.getById(companyId, id);
    if (input.actions !== undefined) {
      if (!Array.isArray(input.actions) || input.actions.length === 0) {
        throw new HttpError(422, "At least one action is required", "VALIDATION_ERROR");
      }
      const urlActions = input.actions.filter((a) => isWebhookAction(a) || isSlackAction(a));
      if (urlActions.length === 0) {
        throw new HttpError(422, "At least one webhook or Slack action is required", "VALIDATION_ERROR");
      }
      for (const a of urlActions) {
        if (!a.url?.trim()) {
          throw new HttpError(422, "Every webhook and Slack action must have a url", "VALIDATION_ERROR");
        }
      }
    }
    const updated = await flowRepository.update(companyId, id, input);
    if (!updated) throw new HttpError(404, "Flow not found", "NOT_FOUND");
    return updated;
  },

  async delete(companyId: string, id: string): Promise<void> {
    const ok = await flowRepository.delete(companyId, id);
    if (!ok) throw new HttpError(404, "Flow not found", "NOT_FOUND");
  },

  /**
   * Find enabled flows for the given event type and fire each webhook action.
   * Returns a promise so callers can await and ensure webhooks are triggered before request ends (e.g. serverless).
   * For change_created/insight_created: filters by payload.matchupId (matchup flows) or payload.competitorId (competitor flows).
   * For scan_completed: filters by payload.matchupIds (matchup flows) or payload.competitorIds (competitor flows).
   * For compliance_scan_completed: filters by payload.sourceId.
   * Errors are logged only; promise resolves after flows are found and webhooks fired
   * (does not wait for Slack/webhook responses).
   */
  executeForEvent(
    companyId: string,
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    let promise: Promise<FlowResponse[]>;
    if (
      (eventType === "change_created" || eventType === "insight_created") &&
      payload.matchupId != null &&
      String(payload.matchupId).length > 0
    ) {
      promise = flowRepository.findManyForMatchupEvent(
        companyId,
        eventType,
        String(payload.matchupId),
      );
    } else if (
      (eventType === "change_created" || eventType === "insight_created") &&
      payload.competitorId != null &&
      String(payload.competitorId).length > 0
    ) {
      promise = flowRepository.findManyForCompetitorEvent(
        companyId,
        eventType,
        String(payload.competitorId),
      );
    } else if (
      eventType === "scan_completed" &&
      Array.isArray(payload.matchupIds)
    ) {
      promise = flowRepository.findManyForMatchupScan(
        companyId,
        payload.matchupIds.map(String),
      );
    } else if (
      eventType === "scan_completed" &&
      Array.isArray(payload.competitorIds)
    ) {
      promise = flowRepository.findManyForCompetitorScan(
        companyId,
        payload.competitorIds.map(String),
      );
    } else if (
      eventType === "compliance_scan_completed" &&
      payload.sourceId != null &&
      String(payload.sourceId).length > 0
    ) {
      promise = flowRepository.findManyForComplianceScan(
        companyId,
        String(payload.sourceId),
      );
    } else {
      promise = flowRepository.findManyByEventType(companyId, eventType);
    }

    return promise
      .then((flows) => {
        const body = { event: eventType, ...payload };
        const webhookPromises: Promise<void>[] = [];
        for (const flow of flows) {
          for (const action of flow.actions) {
            if (isWebhookAction(action)) {
              webhookPromises.push(
                fireWebhook(
                  action.url,
                  body,
                  action.method ?? "POST",
                  action.headers,
                ),
              );
            } else if (isSlackAction(action)) {
              const slackBody = formatSlackPayload(eventType, body);
              webhookPromises.push(fireWebhook(action.url, slackBody, "POST"));
            }
          }
        }
        return Promise.all(webhookPromises).then(() => undefined);
      })
      .catch((err) => {
        (logger as { error?: (obj: unknown, msg?: string) => void }).error?.(
          { err, companyId, eventType },
          "Flow executeForEvent failed",
        );
      })
      .then(() => undefined);
  },
};
