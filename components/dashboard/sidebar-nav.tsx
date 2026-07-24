"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConnexLogo } from "@/components/connex-logo";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/auth/logout-button";

type NavItem = {
  label: string;
  href?: string;
  icon: typeof LayoutDashboard;
  soon?: boolean;
};

const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

const workNav: NavItem[] = [
  { label: "Configurações", href: "/dashboard/configuracoes", icon: Settings },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  const content = (
    <span
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        item.soon
          ? "cursor-not-allowed text-muted-foreground/60"
          : active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
      )}
    >
      <Icon className="size-[18px] shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {item.soon && (
        <Badge
          variant="secondary"
          className="h-5 px-1.5 text-[10px] font-medium"
        >
          Em breve
        </Badge>
      )}
    </span>
  );

  if (item.soon || !item.href) {
    return <div aria-disabled>{content}</div>;
  }
  return <Link href={item.href}>{content}</Link>;
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-16 items-center px-5">
        <ConnexLogo />
      </div>

      <nav
        className="flex-1 space-y-6 overflow-y-auto px-3 py-4"
        onClick={onNavigate}
      >
        <div className="space-y-1">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Visão geral
          </p>
          {mainNav.map((item) => (
            <NavLink
              key={item.label}
              item={item}
              active={
                !item.soon &&
                item.href === pathname &&
                item.label === "Dashboard"
              }
            />
          ))}
        </div>

        <div className="space-y-1">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Workspace
          </p>
          {workNav.map((item) => (
            <NavLink
              key={item.label}
              item={item}
              active={item.href === pathname}
            />
          ))}
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <LogoutButton className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground">
          <LogOut className="size-[18px]" />
          Sair
        </LogoutButton>
      </div>
    </div>
  );
}
