/** Dashboard layout: sidebar/nav and main content area with subtle background. */

import { DashboardNav } from "@/components/features/dashboard/DashboardNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100 dark:bg-zinc-950">
      <DashboardNav />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
