"use client";

import { memo, useCallback } from "react";
import { Handle, type NodeProps, Position, useReactFlow } from "reactflow";
import { cn } from "@/lib/utils";

export const SLACK_NODE_TYPE = "slack";

export type SlackActionNodeData = {
  label: string;
  url: string;
};

function SlackActionNodeComponent({ id, data, selected }: NodeProps<SlackActionNodeData>) {
  const { deleteElements } = useReactFlow();
  const displayLabel = data.label || (data.url ? "Slack" : "Add webhook URL");
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
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#4A154B] text-white">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.521 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.521-2.52 2.527 2.527 0 0 1 2.521-2.521h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Slack</p>
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{displayLabel}</p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{displayUrl}</p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 rounded p-1 text-zinc-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
          aria-label="Remove Slack node"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export const SlackActionNode = memo(SlackActionNodeComponent);
