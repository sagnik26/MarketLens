/** Client-side multi-series line chart for Insights, using chart.js + react-chartjs-2. */

"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { InsightSeries } from "@/actions/insights.actions";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

interface InsightsTrendChartProps {
  weekLabels: string[];
  trendSeries: InsightSeries[];
}

const PALETTE = ["#6366f1", "#22c55e", "#f97316", "#e11d48", "#0ea5e9"];

export function InsightsTrendChart({ weekLabels, trendSeries }: InsightsTrendChartProps) {
  if (trendSeries.length === 0 || weekLabels.length === 0) {
    return (
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        No trend data yet. Run a few scans from Competitor Radar to populate this view.
      </p>
    );
  }

  const datasets = trendSeries.map((series, index) => {
    const color = PALETTE[index % PALETTE.length];

    // Align each series to the global weekLabels (missing weeks → 0).
    const data = weekLabels.map((weekLabel) => {
      const point = series.points.find((pt) => pt.weekLabel === weekLabel);
      return point?.totalSignals ?? 0;
    });

    const isAll = series.channel === "all";

    return {
      label: series.label,
      data,
      borderColor: color,
      backgroundColor: color,
      borderWidth: isAll ? 2.5 : 1.8,
      tension: 0.35,
      pointRadius: isAll ? 4 : 3,
      pointHoverRadius: isAll ? 6 : 5,
      pointBorderWidth: 1.5,
      pointBackgroundColor: "#ffffff",
      pointBorderColor: color,
    };
  });

  const data = {
    labels: weekLabels,
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "nearest" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          boxWidth: 10,
          boxHeight: 10,
        },
      },
      tooltip: {
        callbacks: {
          label(context: any) {
            const label = context.dataset.label ?? "";
            const value = context.parsed.y ?? 0;
            return `${label}: ${value} signal${value === 1 ? "" : "s"}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(148, 163, 184, 0.25)", // neutral-400/25
        },
        ticks: {
          precision: 0,
        },
      },
    },
  };

  return (
    <div className="h-full w-full">
      <Line data={data} options={options} />
    </div>
  );
}

