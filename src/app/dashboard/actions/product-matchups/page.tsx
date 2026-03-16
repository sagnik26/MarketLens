/** Product Matchups: define your product + goal vs a specific competitor (backend-backed). */

"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SourceChannel, type SourceChannel as SourceChannelType } from "@/constants";
import { useScanProgressStore } from "@/stores/scan-progress.store";
import { DashboardShimmer } from "@/components/common";
import { productMatchupKeys } from "@/lib/queryKeys";

interface ProductMatchup {
  id: string;
  productName: string;
  productSegment: string | null;
  productPositioning: string | null;
  productPricingModel: string | null;
  productUrl: string | null;
  competitorId: string;
  competitorName: string;
  competitorUrl: string;
  goal: string;
  targetSegment: string | null;
  createdAt: string;
}

interface Competitor {
  id: string;
  name: string;
  website: string;
  channels: SourceChannelType[];
}

export default function ProductMatchupsPage() {
  const [showEditor, setShowEditor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [matchups, setMatchups] = useState<ProductMatchup[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);

  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [productName, setProductName] = useState("");
  const [productSegment, setProductSegment] = useState("");
  const [productPositioning, setProductPositioning] = useState("");
  const [productPricingModel, setProductPricingModel] = useState("");
  const [productUrl, setProductUrl] = useState("");

  const [competitorId, setCompetitorId] = useState<string>("");
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [goal, setGoal] = useState("");
  const [targetSegment, setTargetSegment] = useState("");

  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<Error | null>(null);
  const [runAllInProgress, setRunAllInProgress] = useState(false);

  const scans = useScanProgressStore((s) => s.scans);
  const addScan = useScanProgressStore((s) => s.addScan);
  const updateScanEvents = useScanProgressStore((s) => s.updateScanEvents);
  const updateScanStreamingUrl = useScanProgressStore((s) => s.updateScanStreamingUrl);
  const completeScan = useScanProgressStore((s) => s.completeScan);

  const hasMatchups = useMemo(() => matchups.length > 0, [matchups]);

  const queryClient = useQueryClient();

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [matchupsRes, competitorsRes] = await Promise.all([
        fetch("/api/v1/product-matchups", { credentials: "include" }),
        fetch("/api/v1/competitors?limit=100", { credentials: "include" }),
      ]);

      if (matchupsRes.status === 401 || competitorsRes.status === 401) {
        setAuthError(new Error("Unauthorized"));
        setLoading(false);
        throw new Error("Unauthorized");
      }

      if (!matchupsRes.ok) {
        const errJson = (await matchupsRes.json().catch(() => ({}))) as any;
        throw new Error(errJson?.error?.message ?? `Failed to load matchups (HTTP ${matchupsRes.status})`);
      }
      if (!competitorsRes.ok) {
        const errJson = (await competitorsRes.json().catch(() => ({}))) as any;
        throw new Error(errJson?.error?.message ?? `Failed to load competitors (HTTP ${competitorsRes.status})`);
      }

      const matchupsJson = (await matchupsRes.json()) as { success: boolean; data: ProductMatchup[] };
      const competitorsJson = (await competitorsRes.json()) as { success: boolean; data: { competitors: Competitor[] } };

      const loadedMatchups = Array.isArray(matchupsJson.data) ? matchupsJson.data : [];
      const loadedCompetitors = Array.isArray(competitorsJson.data?.competitors) ? competitorsJson.data.competitors : [];

      setMatchups(loadedMatchups);
      setCompetitors(loadedCompetitors);
      const firstCompetitor = loadedCompetitors[0];
      if (firstCompetitor && !competitorId) {
        setCompetitorId(firstCompetitor.id);
        setCompetitorUrl(firstCompetitor.website);
      }
      return { matchups: loadedMatchups, competitors: loadedCompetitors };
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load Product Matchups.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [competitorId]);

  const matchupsQuery = useQuery({
    queryKey: productMatchupKeys.list(),
    queryFn: load,
    staleTime: 2 * 60 * 1000,
    gcTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    setLoading(matchupsQuery.isPending && !matchupsQuery.data);
    if (matchupsQuery.error) {
      setLoadError(matchupsQuery.error instanceof Error ? matchupsQuery.error.message : "Failed to load");
      return;
    }
    const data = matchupsQuery.data;
    if (!data) return;
    setLoadError(null);
    setMatchups(data.matchups);
    setCompetitors(data.competitors);
    if (data.competitors[0]) {
      setCompetitorId((prev) => prev || data.competitors[0].id);
      setCompetitorUrl((prev) => prev || data.competitors[0].website);
    }
  }, [matchupsQuery.isPending, matchupsQuery.data, matchupsQuery.error]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);

    const payload = {
      productName: productName.trim(),
      productSegment: productSegment.trim() || null,
      productPositioning: productPositioning.trim() || null,
      productPricingModel: productPricingModel.trim() || null,
      productUrl: productUrl.trim() || null,
      competitorId,
      competitorUrl: competitorUrl.trim(),
      goal: goal.trim(),
      targetSegment: targetSegment.trim() || null,
    };

    if (!payload.productName) return setCreateError("Product name is required.");
    if (!payload.competitorId) return setCreateError("Competitor is required.");
    if (!payload.competitorUrl) return setCreateError("Competitor URL is required.");
    if (!payload.goal) return setCreateError("Goal is required.");

    setCreating(true);
    try {
      const res = await fetch("/api/v1/product-matchups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        setAuthError(new Error("Unauthorized"));
        setCreating(false);
        return;
      }
      const json = (await res.json().catch(() => ({}))) as any;
      if (!res.ok || json.success === false) {
        throw new Error(json?.error?.message ?? `Create failed (HTTP ${res.status})`);
      }

      setMatchups((prev) => [json.data as ProductMatchup, ...prev]);
      setShowEditor(false);
      queryClient.invalidateQueries({ queryKey: productMatchupKeys.all });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create matchup.");
    } finally {
      setCreating(false);
    }
  }

  async function handleScan(matchup: ProductMatchup) {
    setScanMessage(null);

    const selectedCompetitor = competitors.find((c) => c.id === matchup.competitorId);
    const channels = selectedCompetitor?.channels?.length ? selectedCompetitor.channels : [SourceChannel.PRODUCT];

    const scanId = addScan(matchup.competitorId, matchup.competitorName, "single", `matchup-${matchup.id}`);
    updateScanEvents(scanId, ["Calling matchup scan API…"]);

    try {
      const res = await fetch("/api/v1/product-matchups/scan/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ matchupId: matchup.id, channels }),
      });

      if (!res.ok || !res.body) {
        if (res.status === 401) setAuthError(new Error("Unauthorized"));
        const errJson = (await res.json().catch(() => ({}))) as any;
        updateScanEvents(scanId, [
          "Error: " + (errJson?.error?.message ?? `HTTP ${res.status}`),
        ]);
        completeScan(scanId, "failed");
        throw new Error(errJson?.error?.message ?? `Scan failed (HTTP ${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Parse SSE "data: ..." lines
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const chunk of parts) {
          const line = chunk
            .split("\n")
            .find((l) => l.startsWith("data: "));
          if (!line) continue;
          try {
            const evt = JSON.parse(line.replace("data: ", "")) as any;
            if (evt.type === "ERROR") {
              setScanMessage(evt.error ?? "Scan failed.");
              updateScanEvents(scanId, ["Error: " + (evt.error ?? "Scan failed.")]);
              completeScan(scanId, "failed");
            }
            if (evt.type === "COMPLETE") {
              setScanMessage("Scan completed. Matchup signals are now available in Information/Insights.");
              updateScanEvents(scanId, ["Scan completed."]);
              completeScan(scanId, "completed");
            }
            if (evt.streaming_url || evt.streamingUrl) {
              updateScanStreamingUrl(scanId, evt.streaming_url ?? evt.streamingUrl ?? null);
            }
            if (evt.message) {
              updateScanEvents(scanId, [String(evt.message)]);
            }
          } catch {
            // ignore malformed chunks
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: productMatchupKeys.all });
    } catch (err) {
      setScanMessage(err instanceof Error ? err.message : "Failed to run scan.");
      updateScanEvents(scanId, [
        "Error: " + (err instanceof Error ? err.message : "Failed to run scan."),
      ]);
      completeScan(scanId, "failed");
    }
  }

  async function handleRunAllScans() {
    if (matchups.length === 0) return;
    const list = [...matchups];
    setRunAllInProgress(true);
    setScanMessage(null);
    try {
      await Promise.allSettled(list.map((m) => handleScan(m)));
      setScanMessage("All matchup scans completed. Check Information and Insights for signals.");
    } finally {
      setRunAllInProgress(false);
    }
  }

  if (authError) throw authError;

  return (
    <div className="min-h-screen px-6 py-8 md:px-8 md:py-10">
      <header className="mb-10">
        <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 px-3 py-1 text-xs font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" aria-hidden />
          Product Matchups
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-4xl">
          Product Matchups
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Define one of your products, then compare it to a specific competitor with a clear goal.
          Create matchups, then run scans to generate matchup-tagged signals and insights.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Start from your product, pick a competitor, and define a goal.
        </p>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={matchups.length === 0 || runAllInProgress || scans.some((s) => s.groupId?.startsWith("matchup-") && s.status === "running")}
            onClick={() => void handleRunAllScans()}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:border-violet-200 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:text-zinc-300 dark:hover:border-violet-700"
          >
            Run All Scan
          </button>
          <button
            type="button"
            onClick={() => setShowEditor(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500"
          >
            <span aria-hidden>+</span>
            Add product matchup
          </button>
        </div>
      </div>

      {loadError && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {loadError}
        </p>
      )}

      {scanMessage && (
        <p className="mb-4 text-sm text-zinc-700 dark:text-zinc-200" role="status">
          {scanMessage}
        </p>
      )}

      {loading && !loadError ? (
        <div className="mt-4">
          <DashboardShimmer />
        </div>
      ) : (
        <>
          {showEditor && (
            <form
              onSubmit={handleCreate}
              className="mb-6 grid gap-6 rounded-2xl border border-neutral-200 bg-white p-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)] dark:border-neutral-800 dark:bg-neutral-900/60"
            >
              {/* Left: your product details */}
              <section>
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-500">
                Your product
              </p>
              <h2 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Enter product details
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                This information is used to generate goal-specific insights against the selected competitor.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Product name
                </label>
                <input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full cursor-default rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-zinc-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Segment
                </label>
                <input
                  value={productSegment}
                  onChange={(e) => setProductSegment(e.target.value)}
                  className="w-full cursor-default rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-zinc-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Positioning
                </label>
                <textarea
                  rows={3}
                  value={productPositioning}
                  onChange={(e) => setProductPositioning(e.target.value)}
                  className="w-full cursor-default rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-zinc-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Pricing model
                </label>
                <input
                  value={productPricingModel}
                  onChange={(e) => setProductPricingModel(e.target.value)}
                  className="w-full cursor-default rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-zinc-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Product URL (optional)
                </label>
                <input
                  type="url"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  placeholder="https://your-product-url.example"
                />
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                  Optional. In the real flow this helps generate matchup-specific insights using your public
                  product page.
                </p>
              </div>
            </div>
              </section>

              {/* Right: competitor details */}
              <section className="space-y-4">
            <div className="mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-500">
                Competitor & goal
              </p>
              <h2 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Describe the matchup
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Pick a competitor and write the goal in your own words. Later this will drive
                goal-specific insights.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Competitor
                </label>
                <select
                  value={competitorId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setCompetitorId(nextId);
                    const c = competitors.find((x) => x.id === nextId);
                    if (c) setCompetitorUrl(c.website);
                  }}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-zinc-100"
                >
                  <option value="" disabled>
                    {loading ? "Loading competitors…" : "Select a competitor"}
                  </option>
                  {competitors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Target segment (optional)
                </label>
                <input
                  type="text"
                  value={targetSegment}
                  onChange={(e) => setTargetSegment(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  placeholder="Mid-market product teams (20–200 PMs)"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Competitor URL
                </label>
                <input
                  type="url"
                  required
                  value={competitorUrl}
                  onChange={(e) => setCompetitorUrl(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  placeholder="https://competitor-site.example"
                />
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                  Required. In the real flow this will be the page MarketLens scans for matchup-specific
                  insights.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Goal
                </label>
                <textarea
                  rows={3}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  placeholder="Defend mid-market deals where this competitor leads with pricing transparency."
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditor(false)}
                  className="inline-flex items-center rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-zinc-200 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-500"
                >
                  {creating ? "Creating…" : "Create matchup"}
                </button>
              </div>

              {createError && (
                <p className="text-xs text-red-600 dark:text-red-400" role="alert">
                  {createError}
                </p>
              )}
            </div>
              </section>
            </form>
          )}
        </>
      )}

      {!loading && (
      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-zinc-700 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-zinc-200">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Matchups</h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Create a matchup, then run a scan. Matchup-tagged signals will be visible under Information → Product matchups and Insights → Product matchups.
        </p>

        {hasMatchups ? (
          <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="min-w-full table-fixed divide-y divide-neutral-200 text-left text-xs dark:divide-neutral-800">
              <thead className="bg-neutral-50 dark:bg-neutral-900">
                <tr>
                  <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-300">Product</th>
                  <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-300">Competitor</th>
                  <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-300">Goal</th>
                  <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-300">Segment</th>
                  <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-300">Scan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-950/40">
                {matchups.map((m) => (
                  <tr key={m.id}>
                    <td className="px-3 py-2 text-zinc-900 dark:text-zinc-100">
                      <div className="flex flex-col">
                        <span>{m.productName}</span>
                        {m.productUrl ? (
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                            {m.productUrl}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-zinc-900 dark:text-zinc-100">
                      <div className="flex flex-col">
                        <span>{m.competitorName}</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                          {m.competitorUrl}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top text-[11px] text-zinc-600 dark:text-zinc-300 max-w-xs whitespace-normal break-words">
                      {m.goal}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-zinc-600 dark:text-zinc-300">
                      {m.targetSegment ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      {/*
                        Persist "Scanning…" state across navigation by deriving it from the global scan store.
                        Each matchup scan is created with groupId = `matchup-${m.id}` in addScan.
                      */}
                      {(() => {
                        const isScanning = scans.some(
                          (s) => s.groupId === `matchup-${m.id}` && s.status === "running",
                        );
                        return (
                      <button
                        type="button"
                        onClick={() => handleScan(m)}
                        disabled={isScanning}
                        className="inline-flex items-center rounded-full border border-violet-500 px-3 py-1 text-[11px] font-medium text-violet-700 hover:bg-violet-50 dark:border-violet-400 dark:text-violet-300 dark:hover:bg-violet-900/30"
                      >
                          {isScanning ? "Scanning…" : "Scan"}
                      </button>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
            No matchups yet. Click &quot;Add product matchup&quot; to create your first comparison.
          </p>
        )}

        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          You can still jump back to{" "}
          <Link
            href="/dashboard/actions/competitor-radar"
            className="font-medium text-violet-600 underline-offset-2 hover:underline dark:text-violet-400"
          >
            Competitor Radar
          </Link>{" "}
          to run your existing scans.
        </p>
      </section>
      )}
    </div>
  );
}

