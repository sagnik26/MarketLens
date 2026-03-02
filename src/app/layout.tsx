/** Root layout: provides HTML shell, fonts, and global providers for the MarketSense app. */

import type { ReactNode } from "react";

import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
