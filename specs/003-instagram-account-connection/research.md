# Research: Integração Instagram Business Login + Graph API

**Feature**: 003-instagram-account-connection  
**Data**: 2026-07-06

## R1 — Fluxo OAuth (Instagram Business Login)

**Decision**: Implementar o fluxo oficial **Business Login for Instagram** conforme documentação Meta, usando os endpoints canônicos:

| Etapa | Endpoint | Método |
|-------|----------|--------|
| Autorização | `https://www.instagram.com/oauth/authorize` | Redirect GET |
| Troca code → short-lived token | `https://api.instagram.com/oauth/access_token` | POST |
| Troca short-lived → long-lived (60 dias) | `https://graph.instagram.com/access_token` | GET (`grant_type=ig_exchange_token`) |
| Refresh long-lived | `https://graph.instagram.com/refresh_access_token` | GET (`grant_type=ig_refresh_token`) |

**Rationale**:
- Requisito explícito do usuário e da especificação (RN-002).
- Documentação Meta define sequência obrigatória: code (1h, uso único) → short-lived (~1h) → long-lived (60 dias).
- Troca para long-lived token **deve** ocorrer server-side (inclui `client_secret`).

**Parâmetros de autorização (produção)**:
- `client_id`: `INSTAGRAM_APP_ID` (App Dashboard → Instagram App ID)
- `redirect_uri`: `INSTAGRAM_REDIRECT_URI` = `https://insights.connexmkt.com.br/api/auth/instagram/callback`
- `response_type`: `code`
- `scope`: escopos configurados via env (ver R2)
- `force_reauth`: `true` (conforme URL configurada)
- `state`: token CSRF assinado server-side (ver R4)

**Resposta de sucesso do code exchange** (formato atual Meta):
```json
{
  "data": [{
    "access_token": "...",
    "user_id": "1020...",
    "permissions": "instagram_business_basic,..."
  }]
}
```

**Alternatives considered**:
- **Facebook Login for Business + Page-backed IG**: fluxo legado com mais passos (Page → IG account); rejeitado — requisito usa Instagram Login direto.
- **Windsor.ai connector**: rejeitado na spec (Out of Scope).

---

## R2 — Escopos OAuth solicitados

**Decision**: Escopos definidos pela URL de autorização configurada no App Dashboard e espelhados em `INSTAGRAM_OAUTH_SCOPES`:

```
instagram_business_basic,
instagram_business_manage_messages,
instagram_business_manage_comments,
instagram_business_content_publish,
instagram_business_manage_insights
```

**Rationale**:
- URL de produção fornecida pelo stakeholder; escopos novos (`instagram_business_*`) substituem valores deprecados desde jan/2025.
- `instagram_business_basic` é obrigatório para `/me` e refresh de token.
- `instagram_business_manage_insights` é obrigatório para coleta futura de Insights.
- Demais escopos habilitam capacidades futuras (mensagens, comentários, publicação) sem novo fluxo OAuth.

**Nota de compliance**: A política de privacidade atual (`app/privacy/page.tsx`) lista escopos legados (`instagram_basic`, `pages_*`). **Ação pós-implementação**: atualizar política de privacidade para refletir escopos `instagram_business_*` (task de documentação, fora do escopo de código desta feature).

**Alternatives considered**:
- **Escopos mínimos (apenas basic + manage_insights)**: mais restritivo para compliance; rejeitado — URL de produção já aprovada com escopos completos.

---

## R3 — Instagram Graph API para perfil e mídia

**Decision**: Usar host `graph.instagram.com` com Instagram User Access Token (long-lived) para:

1. **Perfil**: `GET /v25.0/me?fields=user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count`
2. **Mídia**: `GET /v25.0/{user_id}/media?fields=id,media_type,caption,permalink,thumbnail_url,timestamp`

**Rationale**:
- Documentação *Get Started* (Instagram API with Instagram Login) define `/me` como endpoint para obter `user_id` (IG professional account ID) e campos de perfil.
- `account_type` retorna `Business` ou `Media_Creator` — usado para validar RN-001.
- Lista de mídia prepara pipeline para Insights por mídia em feature futura.

**Validação de tipo de conta**:
- Aceitar `account_type IN ('Business', 'Media_Creator')`
- Rejeitar outros valores com erro `UNSUPPORTED_ACCOUNT_TYPE`

**Alternatives considered**:
- **Basic Display API**: não expõe `followers_count` nem Insights; rejeitado.

---

## R4 — Proteção CSRF no OAuth (`state`)

**Decision**: Gerar `state` como JWT assinado (HMAC-SHA256) ou payload JSON + HMAC, contendo `{ tenantId, userId, nonce, exp }`, armazenado também em cookie HttpOnly `instagram_oauth_state` para double-submit validation.

**Rationale**:
- Meta redireciona `state` de volta ao callback; validação impede CSRF e associação incorreta tenant/usuário.
- Cookie adicional mitiga ataques que injetam `code` sem ter iniciado o fluxo.
- Expiração curta (10 minutos) alinhada à validade do authorization code (1h, margem conservadora).

**Alternatives considered**:
- **State apenas em cookie**: insuficiente se callback for aberto em outro browser; state param é obrigatório pela Meta.
- **Redis session store**: adiciona dependência; rejeitado para MVP — state assinado é stateless.

---

## R5 — Armazenamento seguro de tokens

**Decision**: Criptografar access token com **AES-256-GCM** antes de persistir em `instagram_credentials.access_token_enc`. Chave derivada de `INSTAGRAM_TOKEN_ENCRYPTION_KEY` (32 bytes, base64).

**Rationale**:
- RS-002 da spec exige armazenamento criptografado.
- AES-GCM fornece autenticidade + confidencialidade; padrão Node.js `crypto`.
- Tabela de credenciais sem policies RLS para `authenticated` — acesso exclusivo via Prisma server-side.

**Formato armazenado**: `{iv}:{authTag}:{ciphertext}` (base64)

**Alternatives considered**:
- **Supabase Vault / pgsodium**: válido mas adiciona complexidade; AES app-layer é suficiente com chave em env.
- **Texto plano em coluna restrita**: viola RS-002.

---

## R6 — Estratégia de refresh de long-lived token

**Decision**: Job agendado (Vercel Cron) executa diariamente `POST /api/cron/instagram/refresh-tokens` (protegido por `CRON_SECRET`), renovando tokens que expiram em ≤14 dias e com idade ≥24h (requisito Meta).

**Rationale**:
- Meta: token deve ter ≥24h para refresh; válido por 60 dias; não renovado em 60 dias exige re-autenticação.
- Renovar com 14 dias de antecedência evita expiração em produção.
- Falha de refresh → status `REQUIRES_RECONNECTION` (FR-027).

**Endpoint Meta**: `GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token={token}`

**Alternatives considered**:
- **Refresh on-demand apenas**: risco de expiração se usuário inativo; rejeitado.
- **Refresh síncrono em cada API call**: latência e rate limit; rejeitado.

---

## R7 — Sincronização inicial pós-conexão

**Decision**: Callback OAuth persiste integração + credencial, dispara `runInitialSync(integrationId)` de forma **await** com timeout de 25s; se exceder, marca job como `IN_PROGRESS` e redireciona usuário para configurações com polling.

**Rationale**:
- Usuário vê feedback imediato quando sync é rápida.
- Timeout evita falha do Route Handler Vercel (limite 30s hobby/pro).
- Polling via `GET /api/instagram/integration` atualiza UI.

**Dados sincronizados na inicial** (conforme requisito):
- Instagram User ID, Username, Display Name, Account Type, Profile Picture, Followers/Following/Media counts
- Lista de mídia (paginação primeira página; cursor armazenado para sync incremental futura)

**Alternatives considered**:
- **Background queue (Inngest/Trigger.dev)**: melhor para escala; adiado — sync inicial inline + job record suficiente para MVP.

---

## R8 — Prevenção de conexões duplicadas

**Decision**:
- `UNIQUE (tenant_id)` em `instagram_integrations` — uma integração por tenant.
- `UNIQUE (instagram_professional_id)` — mesma conta IG não pode conectar a dois tenants.
- Transação Prisma no callback com verificação prévia; violação → redirect com erro `ALREADY_CONNECTED` ou `ACCOUNT_LINKED_ELSEWHERE`.

**Rationale**: RN-004 e FR-003 da spec.

---

## R9 — Isolamento multi-tenant

**Decision**: Reutilizar padrão da feature 001:
- `tenant_id` em todas as tabelas Instagram
- RLS com `current_tenant_id()` em tabelas legíveis pelo cliente
- `instagram_credentials` sem policy para `authenticated` (server-only)
- Prisma queries sempre com `where: { tenantId: ctx.tenantId }`
- `assertTenantOwnership()` em handlers que recebem `integrationId`

**Rationale**: RT-001 a RT-005; consistência arquitetural.

---

## R10 — Variáveis de ambiente

| Variável | Escopo | Descrição |
|----------|--------|-----------|
| `INSTAGRAM_APP_ID` | Server | Instagram App ID (1914393522817562 em prod) |
| `INSTAGRAM_APP_SECRET` | Server | Instagram App Secret |
| `INSTAGRAM_REDIRECT_URI` | Server | Callback OAuth (prod + dev) |
| `INSTAGRAM_OAUTH_SCOPES` | Server | Lista separada por vírgula |
| `INSTAGRAM_TOKEN_ENCRYPTION_KEY` | Server | 32 bytes base64 para AES-256-GCM |
| `INSTAGRAM_OAUTH_STATE_SECRET` | Server | Segredo HMAC para assinar `state` |
| `CRON_SECRET` | Server | Protege endpoint de refresh agendado |
| `NEXT_PUBLIC_APP_URL` | Public | Base URL para redirects pós-OAuth |

Nenhuma variável Meta com prefixo `NEXT_PUBLIC_`.
