"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { networks, currentUser, tenant } from "@/lib/connex-data";
import { Check, Plus } from "lucide-react";

export default function ConfiguracoesPage() {
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
          Informações da sua conta na {tenant.name}.
        </p>
        <Separator className="my-5" />
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" defaultValue={currentUser.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" defaultValue={currentUser.email} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Cargo</Label>
            <Input id="role" defaultValue={currentUser.role} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workspace">Workspace</Label>
            <Input id="workspace" defaultValue={tenant.name} />
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <Button>Salvar alterações</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-semibold text-foreground">
          Redes conectadas
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Conecte as redes sociais que deseja monitorar no painel.
        </p>
        <Separator className="my-5" />
        <div className="space-y-3">
          {networks.map((network) => (
            <div
              key={network.id}
              className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex size-9 items-center justify-center rounded-md text-sm font-semibold text-primary-foreground"
                  style={{ backgroundColor: network.color }}
                  aria-hidden
                >
                  {network.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {network.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {network.connected ? network.handle : "Não conectado"}
                  </p>
                </div>
              </div>
              {network.connected ? (
                <Badge
                  variant="secondary"
                  className="gap-1 bg-chart-2/15 text-chart-2"
                >
                  <Check className="size-3" />
                  Conectado
                </Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 bg-transparent"
                >
                  <Plus className="size-3.5" />
                  Conectar
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

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
