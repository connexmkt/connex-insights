"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/components/auth/session-provider";
import { InstagramConnectCard } from "@/components/instagram/instagram-connect-card";
import { formatUserRole } from "@/lib/auth/format-user-role";

function InstagramSection(): React.JSX.Element {
  const session = useSession();
  const searchParams = useSearchParams();
  const callbackStatus = searchParams.get("instagram");
  const callbackDetail = searchParams.get("instagram_detail");

  return (
    <InstagramConnectCard
      key={session.tenantId}
      callbackStatus={callbackStatus}
      callbackDetail={callbackDetail}
    />
  );
}

export default function ConfiguracoesPage(): React.JSX.Element {
  const session = useSession();
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifWeekly, setNotifWeekly] = useState(true);
  const [notifAlerts, setNotifAlerts] = useState(false);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Configurações
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie sua conta, redes conectadas e preferências de notificação.
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-base font-semibold text-foreground">Perfil</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Informações da sua conta na {session.tenant.name}.
        </p>
        <Separator className="my-5" />
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" defaultValue={session.displayName} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              defaultValue={session.email}
              readOnly
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Cargo</Label>
            <Input
              id="role"
              defaultValue={formatUserRole(session.role)}
              readOnly
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workspace">Workspace</Label>
            <Input id="workspace" defaultValue={session.tenant.name} readOnly />
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <Button disabled>Salvar alterações</Button>
        </div>
      </Card>

      <Suspense
        fallback={
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">
              Carregando integração Instagram…
            </p>
          </Card>
        }
      >
        <InstagramSection />
      </Suspense>

      <Card className="p-6">
        <h2 className="text-base font-semibold text-foreground">
          Notificações
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha como deseja ser avisado.
        </p>
        <Separator className="my-5" />
        <div className="space-y-5">
          {[
            {
              title: "Resumo por e-mail",
              desc: "Receba um e-mail diário com os principais números.",
              state: notifEmail,
              set: setNotifEmail,
            },
            {
              title: "Relatório semanal",
              desc: "Um panorama completo toda segunda-feira.",
              state: notifWeekly,
              set: setNotifWeekly,
            },
            {
              title: "Alertas em tempo real",
              desc: "Avisos quando uma métrica varia bruscamente.",
              state: notifAlerts,
              set: setNotifAlerts,
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-center justify-between gap-4"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={item.state}
                onCheckedChange={item.set}
                aria-label={item.title}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
