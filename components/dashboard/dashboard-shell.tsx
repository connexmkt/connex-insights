"use client";

import { SessionProvider } from "@/components/auth/session-provider";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import type { TenantContext } from "@/types/auth";

export function DashboardShell({
  session,
  children,
}: {
  session: TenantContext;
  children: React.ReactNode;
}) {

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-svh bg-background">
        <aside className="sticky top-0 hidden h-svh w-64 shrink-0 border-r border-sidebar-border lg:block">
          <SidebarNav />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader session={session} />
          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
