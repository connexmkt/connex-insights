"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { useSession } from "@/components/auth/session-provider";
import { InstagramConnectCard } from "@/components/instagram/instagram-connect-card";

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
    </div>
  );
}
