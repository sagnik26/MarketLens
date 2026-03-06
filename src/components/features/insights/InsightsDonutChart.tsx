"use client";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type TooltipItem,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const DEFAULT_PALETTE = [
  "#6366f1", // indigo-500
  "#22c55e", // green-500
  "#f97316", // orange-500
  "#e11d48", // rose-600
  "#0ea5e9", // sky-500
  "#a855f7", // purple-500
  "#ec4899", // pink-500
  "#84cc16", // lime-500
];

interface InsightsDonutChartProps {
  title: string;
  labels: string[];
  values: number[];
  colors?: string[];
  emptyMessage?: string;
  /** Optional className for the wrapper (e.g. height) */
  className?: string;
}

export function InsightsDonutChart({
  title,
  labels,
  values,
  colors,
  emptyMessage = "No data yet.",
  className,
}: InsightsDonutChartProps) {
  const palette = colors ?? DEFAULT_PALETTE;
  const hasData = labels.length > 0 && values.length > 0 && values.some((v) => v > 0);

  if (!hasData) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50/70 py-8 dark:border-neutral-700 dark:bg-neutral-900/70 ${className ?? "min-h-[200px]"}`}
      >
        <p className="text-xs text-zinc-500 dark:text-zinc-400" aria-label={title}>
          {emptyMessage}
        </p>
      </div>
    );
  }

  const backgroundColors = labels.map((_, i) => palette[i % palette.length]);
  const borderColors = backgroundColors.map((c) => c);

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "58%",
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          padding: 12,
          font: { size: 11 },
        },
      },
      tooltip: {
        callbacks: {
          label(tooltipItem: TooltipItem<"doughnut">) {
            const value = Number(tooltipItem.parsed ?? tooltipItem.raw ?? 0);
            const total = values.reduce((a, b) => a + b, 0);
            const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
            return `${tooltipItem.label}: ${value} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className={className ?? "h-[240px]"}>
      <Doughnut data={data} options={options} aria-label={title} />
    </div>
  );
}
