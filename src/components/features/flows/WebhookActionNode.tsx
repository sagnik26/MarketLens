"use client";

import { memo, useCallback } from "react";
import { Handle, type NodeProps, Position, useReactFlow } from "reactflow";
import { cn } from "@/lib/utils";

export const WEBHOOK_NODE_TYPE = "webhook";

export type WebhookActionNodeData = {
  label: string;
  url: string;
};

function WebhookActionNodeComponent({ id, data, selected }: NodeProps<WebhookActionNodeData>) {
  const { deleteElements } = useReactFlow();
  const displayLabel = data.label || (data.url ? "Webhook" : "Add URL");
  const displayUrl = data.url ? (data.url.length > 40 ? data.url.slice(0, 37) + "…" : data.url) : "No URL set";

  const onDelete = useCallback(() => {
    deleteElements({ nodes: [{ id }] });
  }, [deleteElements, id]);

  return (
    <div
      className={cn(
        "min-w-[200px] rounded-lg border-2 bg-white px-4 py-3 shadow-sm dark:bg-neutral-900",
        selected
          ? "border-violet-500 dark:border-violet-400"
          : "border-neutral-200 dark:border-neutral-700"
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-2 !bg-violet-500" />
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/50">
          <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Webhook</p>
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{displayLabel}</p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{displayUrl}</p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 rounded p-1 text-zinc-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
          aria-label="Remove webhook node"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export const WebhookActionNode = memo(WebhookActionNodeComponent);
