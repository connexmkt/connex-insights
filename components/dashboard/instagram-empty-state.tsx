import Link from "next/link";
import { Share2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function InstagramEmptyState(): React.JSX.Element {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Share2 className="size-7" aria-hidden="true" />
        </span>
        <div className="max-w-md space-y-2">
          <h2 className="font-heading text-xl font-semibold">
            Conecte sua conta Instagram
          </h2>
          <p className="text-sm text-muted-foreground">
            Para visualizar métricas, gráficos e desempenho de conteúdo, conecte
            uma conta Instagram Professional (Business ou Creator).
          </p>
        </div>
        <Link
          href="/dashboard/configuracoes"
          className={cn(buttonVariants())}
        >
          Conectar Instagram
        </Link>
      </CardContent>
    </Card>
  );
}
