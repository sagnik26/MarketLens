/** Root layout: provides HTML shell, fonts, and global providers for the MarketSense app. */

import type { ReactNode } from "react";

import { QueryProvider } from "@/components/providers/QueryProvider";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
