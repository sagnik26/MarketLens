"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type TooltipItem,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface TopCompetitorsBarChartProps {
  labels: string[];
  values: number[];
  /** Optional max number of bars (default 8) */
  maxBars?: number;
  emptyMessage?: string;
  className?: string;
}

const BAR_COLOR = "rgba(99, 102, 241, 0.85)";
const BAR_BORDER = "rgb(99, 102, 241)";

export function TopCompetitorsBarChart({
  labels,
  values,
  maxBars = 8,
  emptyMessage = "No competitor data yet.",
  className,
}: TopCompetitorsBarChartProps) {
  const take = Math.min(labels.length, maxBars);
  const hasData = take > 0 && values.slice(0, take).some((v) => v > 0);

  if (!hasData) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50/70 py-8 dark:border-neutral-700 dark:bg-neutral-900/70 ${className ?? "min-h-[200px]"}`}
      >
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{emptyMessage}</p>
      </div>
    );
  }

  const data = {
    labels: labels.slice(0, take),
    datasets: [
      {
        label: "Signals",
        data: values.slice(0, take),
        backgroundColor: BAR_COLOR,
        borderColor: BAR_BORDER,
        borderWidth: 1,
        borderRadius: 6,
        maxBarThickness: 28,
      },
    ],
  };

  const options = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label(tooltipItem: TooltipItem<"bar">) {
            const value = Number(tooltipItem.parsed?.x ?? tooltipItem.raw ?? 0);
            return `${value} signal${value === 1 ? "" : "s"}`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: "rgba(148, 163, 184, 0.25)" },
        ticks: { precision: 0 },
      },
      y: {
        grid: { display: false },
        ticks: { autoSkip: false, font: { size: 11 } },
      },
    },
  };

  return (
    <div className={className ?? "h-[220px]"}>
      <Bar data={data} options={options} />
    </div>
  );
}
