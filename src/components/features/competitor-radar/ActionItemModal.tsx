/** Modal to create or approve an action item and send to Jira/Linear. */

"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ActionItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changeId: string | null;
  insightId: string | null;
  onSuccess: () => void;
}

export function ActionItemModal({
  open,
  onOpenChange,
  changeId,
  insightId,
  onSuccess,
}: ActionItemModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (open) titleRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const source = changeId ? "change" : insightId ? "insight" : null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="action-item-modal-title"
      onClick={(e) => e.target === overlayRef.current && onOpenChange(false)}
    >
      <div
        className={cn(
          "w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="action-item-modal-title"
          ref={titleRef}
          tabIndex={-1}
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
        >
          Create task
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {source === "change" && "Create a Jira or Linear task from this change."}
          {source === "insight" && "Create a task from this insight."}
          {!source && "Create a task."}
        </p>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSuccess();
          }}
        >
          <div>
            <label htmlFor="action-title" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Title
            </label>
            <input
              id="action-title"
              type="text"
              placeholder="e.g. Review Acme Pro tier positioning"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </div>
          <div>
            <label htmlFor="action-description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Description (optional)
            </label>
            <textarea
              id="action-description"
              rows={3}
              placeholder="Add context for the task..."
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Create task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
