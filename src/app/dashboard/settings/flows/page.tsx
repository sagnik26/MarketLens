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

const FLOW_TRIGGER_EVENT_TYPE = {
  CHANGE_CREATED: "change_created",
  INSIGHT_CREATED: "insight_created",
  SCAN_COMPLETED: "scan_completed",
} as const;

const nodeTypes: NodeTypes = {
  [TRIGGER_NODE_TYPE]: TriggerNode,
  [WEBHOOK_NODE_TYPE]: WebhookActionNode,
  [SLACK_NODE_TYPE]: SlackActionNode,
};

const EVENT_LABELS: Record<string, string> = {
  [FLOW_TRIGGER_EVENT_TYPE.CHANGE_CREATED]: "New change",
  [FLOW_TRIGGER_EVENT_TYPE.INSIGHT_CREATED]: "New insight",
  [FLOW_TRIGGER_EVENT_TYPE.SCAN_COMPLETED]: "Scan completed",
};

interface FlowRecord {
  id: string;
  name: string;
  isEnabled: boolean;
  trigger: { eventType: string };
  actions: Array<{ type: string; url: string; method?: string; label?: string }>;
  createdAt: string;
  updatedAt: string;
}

function flowToNodesAndEdges(flow: FlowRecord): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const triggerId = "trigger-1";
  const eventType = flow.trigger.eventType as TriggerNodeData["eventType"];
  nodes.push({
    id: triggerId,
    type: TRIGGER_NODE_TYPE,
    position: { x: 80, y: 120 },
    data: {
      label: EVENT_LABELS[eventType] ?? eventType,
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
  return { nodes, edges };
}

type FlowActionPayload =
  | { type: "webhook"; url: string; method?: string; label?: string }
  | { type: "slack"; url: string; label?: string };

function nodesEdgesToPayload(
  nodes: Node[],
  edges: Edge[],
  name: string,
): { name: string; trigger: { eventType: string }; actions: FlowActionPayload[] } | null {
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
      const res = await fetch("/api/v1/flows", { credentials: "include" });
      if (res.status === 401) {
        setAuthError(new Error("Unauthorized"));
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error(`Failed to load flows (HTTP ${res.status})`);
      const json = (await res.json()) as { success: boolean; data: FlowRecord[] };
      setFlows(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load flows.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFlows();
  }, [loadFlows]);

  const openCreate = useCallback(() => {
    setEditingId(null);
    setFlowName("");
    setNodes(initialNodes);
    setEdges(initialEdges);
    setSelectedNodeId(null);
    setSaveError(null);
    setEditorOpen(true);
  }, [setNodes, setEdges]);

  const openEdit = useCallback(
    (flow: FlowRecord) => {
      const { nodes: n, edges: e } = flowToNodesAndEdges(flow);
      setEditingId(flow.id);
      setFlowName(flow.name);
      setNodes(n);
      setEdges(e);
      setSelectedNodeId(null);
      setSaveError(null);
      setEditorOpen(true);
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
    const payload = nodesEdgesToPayload(nodes, edges, flowName);
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
  }, [nodes, edges, flowName, editingId, closeEditor]);

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
        <div className="text-sm text-zinc-500 dark:text-zinc-400">Loading integrations…</div>
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

          {flows.length > 0 && !editorOpen && (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {flows.map((flow) => (
                <li
                  key={flow.id}
                  className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">{flow.name}</h2>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {EVENT_LABELS[flow.trigger.eventType] ?? flow.trigger.eventType} → {flow.actions.length} action(s)
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
              ))}
            </ul>
          )}
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
                {selectedNode.type === TRIGGER_NODE_TYPE && (
                  <div className="mt-3 space-y-2">
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Event</label>
                    <select
                      value={(selectedNode.data as TriggerNodeData).eventType}
                      onChange={(e) =>
                        updateNodeData(selectedNode.id, {
                          eventType: e.target.value as TriggerNodeData["eventType"],
                          label: EVENT_LABELS[e.target.value] ?? e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-zinc-100"
                    >
                      <option value={FLOW_TRIGGER_EVENT_TYPE.CHANGE_CREATED}>New change</option>
                      <option value={FLOW_TRIGGER_EVENT_TYPE.INSIGHT_CREATED}>New insight</option>
                      <option value={FLOW_TRIGGER_EVENT_TYPE.SCAN_COMPLETED}>Scan completed</option>
                    </select>
                  </div>
                )}
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
