import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getTenantContext } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getTenantContext();

  if (!session) {
    redirect("/");
  }

  return <DashboardShell session={session}>{children}</DashboardShell>;
}
