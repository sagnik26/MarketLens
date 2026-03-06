"use client";

import { memo } from "react";
import { Handle, type NodeProps, Position } from "reactflow";
import { cn } from "@/lib/utils";

export const TRIGGER_NODE_TYPE = "trigger";

export type TriggerNodeData = {
  label: string;
  eventType: "change_created" | "insight_created" | "scan_completed";
};

function TriggerNodeComponent({ data, selected }: NodeProps<TriggerNodeData>) {
  return (
    <div
      className={cn(
        "min-w-[180px] rounded-lg border-2 bg-white px-4 py-3 shadow-sm dark:bg-neutral-900",
        selected
          ? "border-violet-500 dark:border-violet-400"
          : "border-neutral-200 dark:border-neutral-700"
      )}
    >
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-2 !bg-violet-500" />
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-violet-100 dark:bg-violet-900/50">
          <svg className="h-4 w-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Trigger</p>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{data.label}</p>
        </div>
      </div>
    </div>
  );
}

export const TriggerNode = memo(TriggerNodeComponent);
