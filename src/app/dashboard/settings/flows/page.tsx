/** Flows: visual automation builder (trigger + webhook actions) for n8n. */

"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  Controls,
  Background,
  BackgroundVariant,
  type NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  TriggerNode,
  WebhookActionNode,
  SlackActionNode,
  TRIGGER_NODE_TYPE,
  WEBHOOK_NODE_TYPE,
  SLACK_NODE_TYPE,
  type TriggerNodeData,
  type WebhookActionNodeData,
  type SlackActionNodeData,
} from "@/components/features/flows";
import { DashboardShimmer } from "@/components/common";

const FLOW_TRIGGER_EVENT_TYPE = {
  CHANGE_CREATED: "change_created",
  INSIGHT_CREATED: "insight_created",
  SCAN_COMPLETED: "scan_completed",
  COMPLIANCE_SCAN_COMPLETED: "compliance_scan_completed",
} as const;

/** 1st level: Actions (Competitor | Compliance | Product matchup). */
const FLOW_ACTION = {
  COMPETITOR: "competitor",
  COMPLIANCE: "compliance",
  PRODUCT_MATCHUP: "product_matchup",
} as const;

/** 2nd level: Events (Changes | Insights | Scans). */
const FLOW_EVENT = {
  CHANGES: "changes",
  INSIGHTS: "insights",
  SCANS: "scans",
} as const;

/** Map (action, event) → eventType. */
const ACTION_EVENT_TO_EVENT_TYPE: Record<string, Record<string, string>> = {
  [FLOW_ACTION.COMPETITOR]: {
    [FLOW_EVENT.CHANGES]: FLOW_TRIGGER_EVENT_TYPE.CHANGE_CREATED,
    [FLOW_EVENT.INSIGHTS]: FLOW_TRIGGER_EVENT_TYPE.INSIGHT_CREATED,
    [FLOW_EVENT.SCANS]: FLOW_TRIGGER_EVENT_TYPE.SCAN_COMPLETED,
  },
  [FLOW_ACTION.COMPLIANCE]: {
    [FLOW_EVENT.SCANS]: FLOW_TRIGGER_EVENT_TYPE.COMPLIANCE_SCAN_COMPLETED,
  },
  [FLOW_ACTION.PRODUCT_MATCHUP]: {
    [FLOW_EVENT.CHANGES]: FLOW_TRIGGER_EVENT_TYPE.CHANGE_CREATED,
    [FLOW_EVENT.INSIGHTS]: FLOW_TRIGGER_EVENT_TYPE.INSIGHT_CREATED,
    [FLOW_EVENT.SCANS]: FLOW_TRIGGER_EVENT_TYPE.SCAN_COMPLETED,
  },
};

/** Map eventType + optional flow (for scope) → (action, event). Use flow.matchupId / flow.complianceSourceId to infer action. */
function eventTypeToActionEvent(
  eventType: string,
  flow?: { matchupId?: string | null; complianceSourceId?: string | null },
): { action: string; event: string } {
  if (eventType === FLOW_TRIGGER_EVENT_TYPE.COMPLIANCE_SCAN_COMPLETED) {
    return { action: FLOW_ACTION.COMPLIANCE, event: FLOW_EVENT.SCANS };
  }
  if (flow?.matchupId != null && flow.matchupId !== "") {
    if (eventType === FLOW_TRIGGER_EVENT_TYPE.CHANGE_CREATED) return { action: FLOW_ACTION.PRODUCT_MATCHUP, event: FLOW_EVENT.CHANGES };
    if (eventType === FLOW_TRIGGER_EVENT_TYPE.INSIGHT_CREATED) return { action: FLOW_ACTION.PRODUCT_MATCHUP, event: FLOW_EVENT.INSIGHTS };
    if (eventType === FLOW_TRIGGER_EVENT_TYPE.SCAN_COMPLETED) return { action: FLOW_ACTION.PRODUCT_MATCHUP, event: FLOW_EVENT.SCANS };
  }
  if (eventType === FLOW_TRIGGER_EVENT_TYPE.CHANGE_CREATED) return { action: FLOW_ACTION.COMPETITOR, event: FLOW_EVENT.CHANGES };
  if (eventType === FLOW_TRIGGER_EVENT_TYPE.INSIGHT_CREATED) return { action: FLOW_ACTION.COMPETITOR, event: FLOW_EVENT.INSIGHTS };
  if (eventType === FLOW_TRIGGER_EVENT_TYPE.SCAN_COMPLETED) return { action: FLOW_ACTION.COMPETITOR, event: FLOW_EVENT.SCANS };
  return { action: FLOW_ACTION.COMPETITOR, event: FLOW_EVENT.CHANGES };
}

const ACTION_LABELS: Record<string, string> = {
  [FLOW_ACTION.COMPETITOR]: "Competitor",
  [FLOW_ACTION.COMPLIANCE]: "Compliance",
  [FLOW_ACTION.PRODUCT_MATCHUP]: "Product matchup",
};

const EVENT_LABELS: Record<string, string> = {
  [FLOW_EVENT.CHANGES]: "Changes",
  [FLOW_EVENT.INSIGHTS]: "Insights",
  [FLOW_EVENT.SCANS]: "Scans",
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  [FLOW_TRIGGER_EVENT_TYPE.CHANGE_CREATED]: "New change",
  [FLOW_TRIGGER_EVENT_TYPE.INSIGHT_CREATED]: "New insight",
  [FLOW_TRIGGER_EVENT_TYPE.SCAN_COMPLETED]: "Scan completed",
  [FLOW_TRIGGER_EVENT_TYPE.COMPLIANCE_SCAN_COMPLETED]: "Compliance scan completed",
};

const nodeTypes: NodeTypes = {
  [TRIGGER_NODE_TYPE]: TriggerNode,
  [WEBHOOK_NODE_TYPE]: WebhookActionNode,
  [SLACK_NODE_TYPE]: SlackActionNode,
};

interface ComplianceSourceOption {
  id: string;
  name: string;
  url: string;
}

interface CompetitorOption {
  id: string;
  name: string;
}

interface MatchupOption {
  id: string;
  productName: string;
  competitorName: string;
}

interface FlowRecord {
  id: string;
  name: string;
  isEnabled: boolean;
  trigger: { eventType: string };
  competitorId?: string | null;
  complianceSourceId?: string | null;
  matchupId?: string | null;
  actions: Array<{ type: string; url: string; method?: string; label?: string }>;
  createdAt: string;
  updatedAt: string;
}

function flowToNodesAndEdges(flow: FlowRecord): {
  nodes: Node[];
  edges: Edge[];
  competitorId: string | null;
  complianceSourceId: string | null;
  matchupId: string | null;
} {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const triggerId = "trigger-1";
  const eventType = flow.trigger.eventType as TriggerNodeData["eventType"];
  const competitorId = flow.competitorId ?? null;
  const complianceSourceId = flow.complianceSourceId ?? null;
  const matchupId = flow.matchupId ?? null;
  nodes.push({
    id: triggerId,
    type: TRIGGER_NODE_TYPE,
    position: { x: 80, y: 120 },
    data: {
      label: EVENT_TYPE_LABELS[eventType] ?? eventType,
      eventType,
    } as TriggerNodeData,
    deletable: false,
  });
  let webhookCount = 0;
  let slackCount = 0;
  flow.actions.forEach((action, i) => {
    if (action.type === "webhook") {
      webhookCount += 1;
      const id = `webhook-${webhookCount}`;
      nodes.push({
        id,
        type: WEBHOOK_NODE_TYPE,
        position: { x: 380 + (i * 220), y: 100 + (i * 40) },
        data: {
          label: action.label || "Webhook",
          url: action.url,
        } as WebhookActionNodeData,
      });
      edges.push({ id: `e-${triggerId}-${id}`, source: triggerId, target: id });
    } else if (action.type === "slack") {
      slackCount += 1;
      const id = `slack-${slackCount}`;
      nodes.push({
        id,
        type: SLACK_NODE_TYPE,
        position: { x: 380 + (i * 220), y: 100 + (i * 40) },
        data: {
          label: action.label || "Slack",
          url: action.url,
        } as SlackActionNodeData,
      });
      edges.push({ id: `e-${triggerId}-${id}`, source: triggerId, target: id });
    }
  });
  return { nodes, edges, competitorId, complianceSourceId, matchupId };
}

type FlowActionPayload =
  | { type: "webhook"; url: string; method?: string; label?: string }
  | { type: "slack"; url: string; label?: string };

function nodesEdgesToPayload(
  nodes: Node[],
  edges: Edge[],
  name: string,
  flowAction: string,
  competitorId: string | null,
  complianceSourceId: string | null,
  matchupId: string | null,
): {
  name: string;
  trigger: { eventType: string };
  competitorId: string | null;
  complianceSourceId: string | null;
  matchupId: string | null;
  actions: FlowActionPayload[];
} | null {
  const triggerNode = nodes.find((n) => n.type === TRIGGER_NODE_TYPE);
  if (!triggerNode || !triggerNode.data) return null;
  const eventType = (triggerNode.data as TriggerNodeData).eventType;
  const targetIds = new Set(edges.filter((e) => e.source === triggerNode.id).map((e) => e.target));
  const actionNodes = nodes.filter(
    (n) => (n.type === WEBHOOK_NODE_TYPE || n.type === SLACK_NODE_TYPE) && targetIds.has(n.id),
  );
  if (actionNodes.length === 0) return null;
  const actions: FlowActionPayload[] = [];
  for (const n of actionNodes) {
    if (n.type === WEBHOOK_NODE_TYPE) {
      const d = n.data as WebhookActionNodeData;
      if (!d.url?.trim()) continue;
      actions.push({ type: "webhook", url: d.url.trim(), label: d.label || undefined });
    } else if (n.type === SLACK_NODE_TYPE) {
      const d = n.data as SlackActionNodeData;
      if (!d.url?.trim()) continue;
      actions.push({ type: "slack", url: d.url.trim(), label: d.label || undefined });
    }
  }
  if (actions.length === 0) return null;
  return {
    name: name.trim() || "Untitled flow",
    trigger: { eventType },
    competitorId: flowAction === FLOW_ACTION.COMPETITOR ? competitorId : null,
    complianceSourceId: flowAction === FLOW_ACTION.COMPLIANCE ? complianceSourceId : null,
    matchupId: flowAction === FLOW_ACTION.PRODUCT_MATCHUP ? matchupId : null,
    actions,
  };
}

function FlowsPageContent() {
  const [flows, setFlows] = useState<FlowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<Error | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [flowName, setFlowName] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [competitors, setCompetitors] = useState<CompetitorOption[]>([]);
  const [complianceSources, setComplianceSources] = useState<ComplianceSourceOption[]>([]);
  const [matchups, setMatchups] = useState<MatchupOption[]>([]);
  const [flowAction, setFlowAction] = useState<string>(FLOW_ACTION.COMPETITOR);
  const [flowCompetitorId, setFlowCompetitorId] = useState<string | null>(null);
  const [flowComplianceSourceId, setFlowComplianceSourceId] = useState<string | null>(null);
  const [flowMatchupId, setFlowMatchupId] = useState<string | null>(null);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const initialNodes: Node[] = [
    {
      id: "trigger-1",
      type: TRIGGER_NODE_TYPE,
      position: { x: 80, y: 120 },
      data: { label: "New change", eventType: FLOW_TRIGGER_EVENT_TYPE.CHANGE_CREATED } as TriggerNodeData,
      deletable: false,
    },
    {
      id: "webhook-1",
      type: WEBHOOK_NODE_TYPE,
      position: { x: 380, y: 100 },
      data: { label: "Webhook", url: "" } as WebhookActionNodeData,
    },
  ];
  const initialEdges: Edge[] = [{ id: "e-t1-w1", source: "trigger-1", target: "webhook-1" }];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId), [nodes, selectedNodeId]);

  const loadFlows = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [flowsRes, compRes, compSourceRes, matchupsRes] = await Promise.all([
        fetch("/api/v1/flows", { credentials: "include" }),
        fetch("/api/v1/competitors?limit=100", { credentials: "include" }),
        fetch("/api/v1/compliance/sources", { credentials: "include" }),
        fetch("/api/v1/product-matchups", { credentials: "include" }),
      ]);
      if (flowsRes.status === 401) {
        setAuthError(new Error("Unauthorized"));
        setLoading(false);
        return;
      }
      if (!flowsRes.ok) throw new Error(`Failed to load flows (HTTP ${flowsRes.status})`);
      const flowsJson = (await flowsRes.json()) as { success: boolean; data: FlowRecord[] };
      setFlows(Array.isArray(flowsJson.data) ? flowsJson.data : []);
      if (compRes.ok) {
        const json = (await compRes.json()) as { success?: boolean; data?: { competitors?: CompetitorOption[] } };
        setCompetitors(Array.isArray(json.data?.competitors) ? json.data.competitors : []);
      }
      if (compSourceRes.ok) {
        const json = (await compSourceRes.json()) as { success?: boolean; data?: ComplianceSourceOption[] };
        setComplianceSources(Array.isArray(json.data) ? json.data : []);
      }
      if (matchupsRes.ok) {
        const json = (await matchupsRes.json()) as { success?: boolean; data?: MatchupOption[] };
        setMatchups(Array.isArray(json.data) ? json.data : []);
      } else {
        setMatchups([]);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load flows.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFlows();
  }, [loadFlows]);

  const openCreate = useCallback(async () => {
    setEditingId(null);
    setFlowName("");
    setNodes(initialNodes);
    setEdges(initialEdges);
    setSelectedNodeId(null);
    setSaveError(null);
    setFlowAction(FLOW_ACTION.COMPETITOR);
    setFlowCompetitorId(null);
    setFlowComplianceSourceId(null);
    setFlowMatchupId(null);
    setEditorOpen(true);
    try {
      const [compRes, compSourceRes, matchupsRes] = await Promise.all([
        fetch("/api/v1/competitors?limit=100", { credentials: "include" }),
        fetch("/api/v1/compliance/sources", { credentials: "include" }),
        fetch("/api/v1/product-matchups", { credentials: "include" }),
      ]);
      if (compRes.ok) {
        const json = (await compRes.json()) as { success?: boolean; data?: { competitors?: CompetitorOption[] } };
        setCompetitors(Array.isArray(json.data?.competitors) ? json.data.competitors : []);
      } else {
        setCompetitors([]);
      }
      if (compSourceRes.ok) {
        const json = (await compSourceRes.json()) as { success?: boolean; data?: ComplianceSourceOption[] };
        setComplianceSources(Array.isArray(json.data) ? json.data : []);
      } else {
        setComplianceSources([]);
      }
      if (matchupsRes.ok) {
        const json = (await matchupsRes.json()) as { success?: boolean; data?: MatchupOption[] };
        setMatchups(Array.isArray(json.data) ? json.data : []);
      } else {
        setMatchups([]);
      }
    } catch {
      setCompetitors([]);
      setComplianceSources([]);
      setMatchups([]);
    }
  }, [setNodes, setEdges]);

  const openEdit = useCallback(
    async (flow: FlowRecord) => {
      const { nodes: n, edges: e, competitorId: cid, complianceSourceId: srcId, matchupId: mid } = flowToNodesAndEdges(flow);
      const action =
        flow.matchupId != null && flow.matchupId !== ""
          ? FLOW_ACTION.PRODUCT_MATCHUP
          : flow.trigger.eventType === FLOW_TRIGGER_EVENT_TYPE.COMPLIANCE_SCAN_COMPLETED
            ? FLOW_ACTION.COMPLIANCE
            : FLOW_ACTION.COMPETITOR;
      setEditingId(flow.id);
      setFlowName(flow.name);
      setNodes(n);
      setEdges(e);
      setSelectedNodeId(null);
      setSaveError(null);
      setFlowAction(action);
      setFlowCompetitorId(cid);
      setFlowComplianceSourceId(srcId);
      setFlowMatchupId(mid);
      setEditorOpen(true);
      try {
        const [compRes, compSourceRes, matchupsRes] = await Promise.all([
          fetch("/api/v1/competitors?limit=100", { credentials: "include" }),
          fetch("/api/v1/compliance/sources", { credentials: "include" }),
          fetch("/api/v1/product-matchups", { credentials: "include" }),
        ]);
        if (compRes.ok) {
          const json = (await compRes.json()) as { success?: boolean; data?: { competitors?: CompetitorOption[] } };
          setCompetitors(Array.isArray(json.data?.competitors) ? json.data.competitors : []);
        } else {
          setCompetitors([]);
        }
        if (compSourceRes.ok) {
          const json = (await compSourceRes.json()) as { success?: boolean; data?: ComplianceSourceOption[] };
          setComplianceSources(Array.isArray(json.data) ? json.data : []);
        } else {
          setComplianceSources([]);
        }
        if (matchupsRes.ok) {
          const json = (await matchupsRes.json()) as { success?: boolean; data?: MatchupOption[] };
          setMatchups(Array.isArray(json.data) ? json.data : []);
        } else {
          setMatchups([]);
        }
      } catch {
        setCompetitors([]);
        setComplianceSources([]);
        setMatchups([]);
      }
    },
    [setNodes, setEdges],
  );

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingId(null);
    setSaveError(null);
    setSelectedNodeId(null);
  }, []);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const updateNodeData = useCallback(
    (nodeId: string, data: Partial<TriggerNodeData | WebhookActionNodeData | SlackActionNodeData>) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n)),
      );
    },
    [setNodes],
  );

  const isValidConnection = useCallback((connection: Connection) => {
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);
    return (
      sourceNode?.type === TRIGGER_NODE_TYPE &&
      (targetNode?.type === WEBHOOK_NODE_TYPE || targetNode?.type === SLACK_NODE_TYPE)
    );
  }, [nodes]);

  const handleSave = useCallback(async () => {
    setSaveError(null);
    const payload = nodesEdgesToPayload(
      nodes,
      edges,
      flowName,
      flowAction,
      flowCompetitorId,
      flowComplianceSourceId,
      flowMatchupId,
    );
    if (!payload) {
      setSaveError("Add one trigger and at least one webhook or Slack action with a URL, and connect them.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/v1/flows/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        if (res.status === 401) {
          setAuthError(new Error("Unauthorized"));
          setSaving(false);
          return;
        }
        const json = (await res.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string }; data?: FlowRecord };
        if (!res.ok || !json.success) {
          throw new Error(json?.error?.message ?? `Update failed (HTTP ${res.status})`);
        }
        setFlows((prev) => prev.map((f) => (f.id === editingId ? (json.data as FlowRecord) : f)));
      } else {
        const res = await fetch("/api/v1/flows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        if (res.status === 401) {
          setAuthError(new Error("Unauthorized"));
          setSaving(false);
          return;
        }
        const json = (await res.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string }; data?: FlowRecord };
        if (!res.ok || !json.success) {
          throw new Error(json?.error?.message ?? `Create failed (HTTP ${res.status})`);
        }
        setFlows((prev) => [json.data as FlowRecord, ...prev]);
      }
      closeEditor();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }, [nodes, edges, flowName, flowAction, flowCompetitorId, flowComplianceSourceId, flowMatchupId, editingId, closeEditor]);

  const handleDelete = useCallback(async () => {
    if (!editingId) return;
    setSaveError(null);
    try {
      const res = await fetch(`/api/v1/flows/${editingId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.status === 401) {
        setAuthError(new Error("Unauthorized"));
        return;
      }
      if (!res.ok) throw new Error(`Delete failed (HTTP ${res.status})`);
      setFlows((prev) => prev.filter((f) => f.id !== editingId));
      closeEditor();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Delete failed.");
    }
  }, [editingId, closeEditor]);

  const addWebhookNode = useCallback(() => {
    const nextIndex = nodes.filter((n) => n.type === WEBHOOK_NODE_TYPE).length + 1;
    const id = `webhook-${nextIndex}`;
    const triggerNode = nodes.find((n) => n.type === TRIGGER_NODE_TYPE);
    const actionCount = nodes.filter((n) => n.type === WEBHOOK_NODE_TYPE || n.type === SLACK_NODE_TYPE).length;
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: WEBHOOK_NODE_TYPE,
        position: { x: 380 + actionCount * 200, y: 100 + actionCount * 60 },
        data: { label: "Webhook", url: "" } as WebhookActionNodeData,
      },
    ]);
    if (triggerNode) {
      setEdges((eds) => [...eds, { id: `e-${triggerNode.id}-${id}`, source: triggerNode.id, target: id }]);
    }
  }, [nodes, setNodes, setEdges]);

  const addSlackNode = useCallback(() => {
    const nextIndex = nodes.filter((n) => n.type === SLACK_NODE_TYPE).length + 1;
    const id = `slack-${nextIndex}`;
    const triggerNode = nodes.find((n) => n.type === TRIGGER_NODE_TYPE);
    const actionCount = nodes.filter((n) => n.type === WEBHOOK_NODE_TYPE || n.type === SLACK_NODE_TYPE).length;
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: SLACK_NODE_TYPE,
        position: { x: 380 + actionCount * 200, y: 100 + actionCount * 60 },
        data: { label: "Slack", url: "" } as SlackActionNodeData,
      },
    ]);
    if (triggerNode) {
      setEdges((eds) => [...eds, { id: `e-${triggerNode.id}-${id}`, source: triggerNode.id, target: id }]);
    }
  }, [nodes, setNodes, setEdges]);

  if (authError) {
    // Reuse the dashboard segment error boundary session-timeout UX.
    throw authError;
  }

  return (
    <div className="min-h-screen px-6 py-8 md:px-8 md:py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Integration</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          When a change or insight is created, MarketLens can POST to your n8n webhook or Slack so you can run Jira, Slack, and more.
        </p>
      </header>

      {loading && (
        <div className="mt-4">
          <DashboardShimmer />
        </div>
      )}
      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
          {loadError}
        </div>
      )}

      {!loading && !loadError && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {flows.length} integration{flows.length !== 1 ? "s" : ""}
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500"
            >
              <span aria-hidden>+</span>
              Create integration
            </button>
          </div>

          {flows.length === 0 && !editorOpen && (
            <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/50 p-12 text-center">
              <p className="text-zinc-600 dark:text-zinc-400">No integrations yet. Create one to send new changes or insights to Slack, n8n, and more.</p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
              >
                + Create integration
              </button>
            </div>
          )}

          {flows.length > 0 && !editorOpen && (() => {
            function getFlowAction(flow: FlowRecord): string {
              return eventTypeToActionEvent(flow.trigger.eventType, flow).action;
            }
            function getScopeName(
              flow: FlowRecord,
              competitors: CompetitorOption[],
              sources: ComplianceSourceOption[],
              matchupsList: MatchupOption[],
            ): string {
              const action = getFlowAction(flow);
              if (action === FLOW_ACTION.PRODUCT_MATCHUP) {
                if (flow.matchupId) {
                  const m = matchupsList.find((x) => x.id === flow.matchupId);
                  return m ? `${m.productName} vs ${m.competitorName}` : "";
                }
                return "All product matchups";
              }
              if (action === FLOW_ACTION.COMPETITOR) {
                if (flow.competitorId) {
                  return competitors.find((c) => c.id === flow.competitorId)?.name ?? "";
                }
                return "All competitors";
              }
              if (action === FLOW_ACTION.COMPLIANCE) {
                if (flow.complianceSourceId) {
                  return sources.find((s) => s.id === flow.complianceSourceId)?.name ?? "";
                }
                return "All compliance sources";
              }
              return "";
            }
            const productMatchupFlows = flows.filter((f) => getFlowAction(f) === FLOW_ACTION.PRODUCT_MATCHUP);
            const competitorFlows = flows.filter((f) => getFlowAction(f) === FLOW_ACTION.COMPETITOR);
            const complianceFlows = flows.filter((f) => getFlowAction(f) === FLOW_ACTION.COMPLIANCE);

            const sections: { title: string; flows: FlowRecord[] }[] = [];
            if (productMatchupFlows.length > 0) {
              sections.push({ title: "Product Matchup Integration", flows: productMatchupFlows });
            }
            if (competitorFlows.length > 0) {
              sections.push({ title: "Competitor Integration", flows: competitorFlows });
            }
            if (complianceFlows.length > 0) {
              sections.push({ title: "Compliance Integration", flows: complianceFlows });
            }

            return (
              <div className="space-y-8">
                {sections.map(({ title, flows: sectionFlows }) => (
                  <section key={title}>
                    <h2 className="mb-3 text-base font-semibold text-zinc-800 dark:text-zinc-200">
                      {title}
                    </h2>
                    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {sectionFlows.map((flow) => {
                        const scopeName = getScopeName(flow, competitors, complianceSources, matchups);
                        const eventLabel = EVENT_TYPE_LABELS[flow.trigger.eventType] ?? flow.trigger.eventType;
                        return (
                          <li
                            key={flow.id}
                            className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{flow.name}</h3>
                                {scopeName ? (
                                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                                    {scopeName}
                                  </p>
                                ) : null}
                                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                  {eventLabel}
                                  {" → "}
                                  {flow.actions.length} action(s)
                                </p>
                                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                                  {flow.isEnabled ? "Enabled" : "Disabled"}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => openEdit(flow)}
                                className="rounded-lg border border-neutral-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-neutral-50 dark:border-neutral-600 dark:text-zinc-300 dark:hover:bg-neutral-800"
                              >
                                Edit
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {editorOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-neutral-950">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                placeholder="Flow name"
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-900 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={addWebhookNode}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-medium dark:border-neutral-600 dark:text-zinc-300"
              >
                + Add webhook
              </button>
              <button
                type="button"
                onClick={addSlackNode}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-medium dark:border-neutral-600 dark:text-zinc-300"
              >
                + Add Slack
              </button>
            </div>
            <div className="flex items-center gap-2">
              {editingId && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-lg border border-red-300 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/50"
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-medium dark:border-neutral-600 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
          {saveError && (
            <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
              {saveError}
            </div>
          )}
          <div className="flex flex-1 min-h-0">
            <div className="flex-1">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                isValidConnection={isValidConnection}
                defaultViewport={{ x: 0, y: 0, zoom: 0.65 }}
                fitView
                fitViewOptions={{ maxZoom: 0.8, padding: 0.2 }}
                deleteKeyCode={["Backspace", "Delete"]}
                className="bg-neutral-50 dark:bg-neutral-900/50"
              >
                <Controls />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
              </ReactFlow>
            </div>
            {selectedNode && (
              <aside className="w-80 shrink-0 border-l border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Node settings</h3>
                {selectedNode.type === TRIGGER_NODE_TYPE && (() => {
                  const eventType = (selectedNode.data as TriggerNodeData).eventType;
                  const action = flowAction;
                  const event =
                    action === FLOW_ACTION.COMPLIANCE
                      ? FLOW_EVENT.SCANS
                      : eventTypeToActionEvent(eventType, {
                          matchupId: flowMatchupId,
                          complianceSourceId: flowComplianceSourceId,
                        }).event;
                  const competitorAndMatchupEvents = [
                    FLOW_EVENT.CHANGES,
                    FLOW_EVENT.INSIGHTS,
                    FLOW_EVENT.SCANS,
                  ];
                  const complianceEvents = [FLOW_EVENT.SCANS];
                  const eventsForAction =
                    action === FLOW_ACTION.COMPLIANCE ? complianceEvents : competitorAndMatchupEvents;
                  return (
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Actions</label>
                        <select
                          value={action}
                          onChange={(e) => {
                            const newAction = e.target.value as string;
                            setFlowAction(newAction);
                            const events =
                              newAction === FLOW_ACTION.COMPLIANCE
                                ? complianceEvents
                                : competitorAndMatchupEvents;
                            const newEvent = (events as readonly string[]).includes(event) ? event : events[0];
                            const newEventType =
                              ACTION_EVENT_TO_EVENT_TYPE[newAction]?.[newEvent] ??
                              FLOW_TRIGGER_EVENT_TYPE.CHANGE_CREATED;
                            updateNodeData(selectedNode.id, {
                              eventType: newEventType as TriggerNodeData["eventType"],
                              label: EVENT_TYPE_LABELS[newEventType] ?? newEventType,
                            });
                            if (newAction === FLOW_ACTION.COMPLIANCE) {
                              setFlowCompetitorId(null);
                              setFlowMatchupId(null);
                            } else if (newAction === FLOW_ACTION.PRODUCT_MATCHUP) {
                              setFlowCompetitorId(null);
                              setFlowComplianceSourceId(null);
                            } else {
                              setFlowComplianceSourceId(null);
                              setFlowMatchupId(null);
                            }
                          }}
                          className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-zinc-100"
                        >
                          <option value={FLOW_ACTION.COMPETITOR}>{ACTION_LABELS[FLOW_ACTION.COMPETITOR]}</option>
                          <option value={FLOW_ACTION.COMPLIANCE}>{ACTION_LABELS[FLOW_ACTION.COMPLIANCE]}</option>
                          <option value={FLOW_ACTION.PRODUCT_MATCHUP}>{ACTION_LABELS[FLOW_ACTION.PRODUCT_MATCHUP]}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Events</label>
                        <select
                          value={event}
                          onChange={(e) => {
                            const newEvent = e.target.value as string;
                            const newEventType =
                              ACTION_EVENT_TO_EVENT_TYPE[action]?.[newEvent] ??
                              FLOW_TRIGGER_EVENT_TYPE.CHANGE_CREATED;
                            updateNodeData(selectedNode.id, {
                              eventType: newEventType as TriggerNodeData["eventType"],
                              label: EVENT_TYPE_LABELS[newEventType] ?? newEventType,
                            });
                          }}
                          className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-zinc-100"
                        >
                          {eventsForAction.map((ev) => (
                            <option key={ev} value={ev}>
                              {EVENT_LABELS[ev]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Apply to</label>
                        {action === FLOW_ACTION.COMPLIANCE ? (
                          <select
                            value={flowComplianceSourceId ?? ""}
                            onChange={(e) => setFlowComplianceSourceId(e.target.value || null)}
                            className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-zinc-100"
                          >
                            <option value="">All compliance sources</option>
                            {complianceSources.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        ) : action === FLOW_ACTION.PRODUCT_MATCHUP ? (
                          <select
                            value={flowMatchupId ?? ""}
                            onChange={(e) => setFlowMatchupId(e.target.value || null)}
                            className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-zinc-100"
                          >
                            <option value="">All product matchups</option>
                            {matchups.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.productName} vs {m.competitorName}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <select
                            value={flowCompetitorId ?? ""}
                            onChange={(e) => setFlowCompetitorId(e.target.value || null)}
                            className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-zinc-100"
                          >
                            <option value="">All competitors</option>
                            {competitors.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        )}
                        <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                          Run for the selected scope only, or all.
                        </p>
                      </div>
                    </div>
                  );
                })()}
                {selectedNode.type === WEBHOOK_NODE_TYPE && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Webhook URL</label>
                      <input
                        type="url"
                        value={(selectedNode.data as WebhookActionNodeData).url}
                        onChange={(e) => updateNodeData(selectedNode.id, { url: e.target.value })}
                        placeholder="https://your-n8n.app/webhook/..."
                        className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-zinc-100"
                      />
                      <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                        Paste your n8n Webhook trigger URL here.
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Label (optional)</label>
                      <input
                        type="text"
                        value={(selectedNode.data as WebhookActionNodeData).label || ""}
                        onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                        placeholder="e.g. Jira"
                        className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                )}
                {selectedNode.type === SLACK_NODE_TYPE && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Slack webhook URL</label>
                      <input
                        type="url"
                        value={(selectedNode.data as SlackActionNodeData).url}
                        onChange={(e) => updateNodeData(selectedNode.id, { url: e.target.value })}
                        placeholder="https://hooks.slack.com/services/..."
                        className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-zinc-100"
                      />
                      <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                        Incoming webhook URL from Slack (Create app → Incoming Webhooks).
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Label (optional)</label>
                      <input
                        type="text"
                        value={(selectedNode.data as SlackActionNodeData).label || ""}
                        onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                        placeholder="e.g. #alerts"
                        className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                )}
              </aside>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FlowsPage() {
  return (
    <ReactFlowProvider>
      <FlowsPageContent />
    </ReactFlowProvider>
  );
}
