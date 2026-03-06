"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface MatchupSignalsChartProps {
  labels: string[];
  totals: number[];
}

export function MatchupSignalsChart({ labels, totals }: MatchupSignalsChartProps) {
  if (!labels.length || !totals.length) {
    return (
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        No matchup signals yet. Run a few Product Matchups scans to see activity here.
      </p>
    );
  }

  const data = {
    labels,
    datasets: [
      {
        label: "Total matchup signals",
        data: totals,
        backgroundColor: "rgba(129, 140, 248, 0.85)", // indigo-400
        borderColor: "rgb(99, 102, 241)", // indigo-500
        borderWidth: 1,
        borderRadius: 6,
        maxBarThickness: 32,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label(context: any) {
            const value = context.parsed.y ?? 0;
            return `${value} signal${value === 1 ? "" : "s"}`;
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
          autoSkip: true,
          maxRotation: 0,
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
    <div className="h-64 w-full md:h-80">
      <Bar data={data} options={options} />
    </div>
  );
}

