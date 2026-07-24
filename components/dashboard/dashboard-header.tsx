"use client";

import { Bell, Calendar, Menu, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { useLogout } from "@/components/auth/logout-button";
import type { TenantContext } from "@/types/auth";

function getInitials(displayName: string): string {
  return displayName
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function DashboardHeader({
  session,
  period,
}: {
  session: TenantContext;
  period: string;
  onPeriodChange: (period: string) => void;
}) {
  const { logout, loggingOut } = useLogout();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-6">
      <Sheet>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" className="lg:hidden" />}
        >
          <Menu className="size-5" />
          <span className="sr-only">Abrir menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navegação</SheetTitle>
          <SidebarNav />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 items-center gap-2.5">
        <span className="hidden truncate text-sm font-semibold sm:inline">
          {session.tenant.name}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" size="sm" className="gap-2" />}
          >
            <Calendar className="size-4" />
            <span className="hidden sm:inline">{period}</span>
          </DropdownMenuTrigger>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-primary ring-2 ring-background" />
          <span className="sr-only">Notificações</span>
        </Button>

        <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
          <Settings className="size-5" />
          <span className="sr-only">Configurações</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex items-center gap-2 rounded-full pl-1 outline-none" />
            }
          >
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {getInitials(session.displayName)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {session.displayName}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {session.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configurações</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={loggingOut}
              onClick={() => void logout()}
            >
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
