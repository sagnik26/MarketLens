"use client";

import { cn } from "@/lib/utils";

export function BackgroundBeams({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-0 flex items-center justify-center bg-neutral-950 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]",
        className
      )}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f12_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f12_1px,transparent_1px)] bg-[size:14px_24px]" />
      <div className="absolute left-1/2 top-0 h-[37.5rem] w-[62.5rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_farthest-side_at_50%_0%,rgba(120,119,198,0.15),transparent)]" />
      <svg
        className="absolute left-1/2 top-0 -translate-x-1/2"
        fill="none"
        viewBox="0 0 1228 310"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M0 258.5L34.2 252.5C68.3 246.5 136.7 234.5 205 229.5C273.3 224.5 341.7 226.5 410 221.5C478.3 216.5 546.7 204.5 615 194.5C683.3 184.5 751.7 176.5 820 178.5C888.3 180.5 956.7 192.5 1025 202.5C1093.3 212.5 1161.7 220.5 1195.8 224.5L1230 228.5V310H1195.8C1161.7 310 1093.3 310 1025 310C956.7 310 888.3 310 820 310C751.7 310 683.3 310 615 310C546.7 310 478.3 310 410 310C341.7 310 273.3 310 205 310C136.7 310 68.3 310 34.2 310H0V258.5Z"
          fill="url(#beam-gradient)"
        />
        <path
          d="M0 261.5L34.2 257.5C68.3 253.5 136.7 245.5 205 242.5C273.3 239.5 341.7 241.5 410 238.5C478.3 235.5 546.7 227.5 615 221.5C683.3 215.5 751.7 211.5 820 214.5C888.3 217.5 956.7 227.5 1025 233.5C1093.3 239.5 1161.7 241.5 1195.8 242.5L1230 243.5V310H1195.8C1161.7 310 1093.3 310 1025 310C956.7 310 888.3 310 820 310C751.7 310 683.3 310 615 310C546.7 310 478.3 310 410 310C341.7 310 273.3 310 205 310C136.7 310 68.3 310 34.2 310H0V261.5Z"
          fill="url(#beam-gradient-2)"
        />
        <defs>
          <linearGradient id="beam-gradient" x1="0" y1="0" x2="0" y2="310" gradientUnits="userSpaceOnUse">
            <stop stopColor="#a78bfa" stopOpacity="0.25" />
            <stop offset="1" stopColor="#a78bfa" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="beam-gradient-2" x1="0" y1="0" x2="0" y2="310" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38bdf8" stopOpacity="0.2" />
            <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
