"use client";

import { SessionProvider } from "@/components/auth/session-provider";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import type { TenantContext } from "@/types/auth";

export function DashboardShell({
  session,
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
      </div>
    </SessionProvider>
  );
}
