/** Dashboard layout: sidebar/nav and main content area with subtle background. */

import { DashboardNav } from "@/components/features/dashboard/DashboardNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-neutral-100 dark:bg-zinc-950">
      <DashboardNav />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
