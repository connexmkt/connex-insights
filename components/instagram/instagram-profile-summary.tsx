import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { IntegrationPublic } from "@/types/instagram";

interface InstagramProfileSummaryProps {
  integration: IntegrationPublic;
}

function formatAccountType(accountType: IntegrationPublic["accountType"]): string {
  switch (accountType) {
    case "BUSINESS":
      return "Business";
    case "MEDIA_CREATOR":
      return "Creator";
    default: {
      const _exhaustive: never = accountType;
      return _exhaustive;
    }
  }
}

export function InstagramProfileSummary({
  integration,
}: InstagramProfileSummaryProps): React.JSX.Element {
  const initials = integration.username.slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-14">
        {integration.profilePictureUrl ? (
          <AvatarImage
            src={integration.profilePictureUrl}
            alt={`Foto de perfil de @${integration.username}`}
          />
        ) : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm font-semibold text-foreground">
          @{integration.username}
        </p>
        {integration.displayName ? (
          <p className="text-sm text-muted-foreground">
            {integration.displayName}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {formatAccountType(integration.accountType)}
          {integration.followersCount !== null
            ? ` · ${integration.followersCount.toLocaleString("pt-BR")} seguidores`
            : null}
        </p>
      </div>
    </div>
  );
}
