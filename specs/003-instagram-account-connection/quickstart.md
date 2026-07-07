# Quickstart: Integração Instagram Business Login

**Feature**: 003-instagram-account-connection

## Pré-requisitos

- Features 001 e 002 implementadas (auth + ativação)
- Node.js 20+, pnpm
- App Meta configurado com produto Instagram + Business Login
- Variáveis de ambiente:

```env
# Meta / Instagram (server-only — NUNCA NEXT_PUBLIC_)
INSTAGRAM_APP_ID=1039653678749415
INSTAGRAM_APP_SECRET=<instagram-app-secret>
INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/auth/instagram/callback
INSTAGRAM_OAUTH_SCOPES=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights
INSTAGRAM_TOKEN_ENCRYPTION_KEY=<32-bytes-base64>
INSTAGRAM_OAUTH_STATE_SECRET=<random-secret>

# Cron
CRON_SECRET=<random-secret>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Configuração Meta App Dashboard

1. **Instagram → API setup with Instagram login → Business login settings**:
   - OAuth redirect URIs:
     - `http://localhost:3000/api/auth/instagram/callback` (dev)
     - `https://insights.connexmkt.com.br/api/auth/instagram/callback` (prod)
2. Copiar **Instagram App ID** e **Instagram App Secret**.
3. Verificar escopos habilitados no embed URL.

## Setup Local

```bash
pnpm install
pnpm prisma migrate dev --name instagram_integration_tables
pnpm dev
```

### Gerar `INSTAGRAM_TOKEN_ENCRYPTION_KEY`

Chave AES-256-GCM com exatamente 32 bytes, codificada em base64:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copie o valor gerado para `INSTAGRAM_TOKEN_ENCRYPTION_KEY` no `.env`.

Para `INSTAGRAM_OAUTH_STATE_SECRET` e `CRON_SECRET`, use strings aleatórias longas (mínimo 32 caracteres).

## Validar via Supabase MCP

Após migration:

1. `list_tables` — confirmar `instagram_integrations`, `instagram_credentials`, `instagram_media`, `instagram_sync_jobs`
2. `get_advisors` — security (RLS habilitado, sem alertas críticos)
3. `execute_sql` — verificar policies em tabelas Instagram

## Fluxo de Teste Manual

### Conectar Instagram

1. Login com usuário `ACTIVE`.
2. Acesse `/dashboard/configuracoes`.
3. Clique **Conectar Instagram**.
4. Autorize com conta Business ou Creator na Meta.
5. Verifique redirect de volta com status de sucesso.
6. Confirme dados de perfil e estado de sincronização na UI.

### Desconectar

1. Com integração conectada, clique **Desconectar**.
2. Confirme status `Desconectado`.
3. Dados históricos permanecem visíveis (se sync anterior concluída).

### Reconectar

1. Com integração `REQUIRES_RECONNECTION`, clique **Reconectar**.
2. Complete OAuth novamente.
3. Verifique que não há registro duplicado no banco.

## Testes Automatizados

```bash
pnpm test                    # unit + integration
pnpm test:unit               # lib/instagram/*
pnpm test:integration        # route handlers
pnpm exec playwright test    # e2e (mock OAuth em CI)
```

## Produção (Vercel)

1. Configurar env vars no projeto Vercel (sem `NEXT_PUBLIC_` para secrets Meta).
2. `INSTAGRAM_REDIRECT_URI=https://insights.connexmkt.com.br/api/auth/instagram/callback`
3. Adicionar Vercel Cron em `vercel.json`:
   ```json
   { "crons": [{ "path": "/api/cron/instagram/refresh-tokens", "schedule": "0 3 * * *" }] }
   ```
4. `pnpm prisma migrate deploy` no pipeline de deploy.

## Troubleshooting

| Problema | Causa provável | Ação |
|----------|----------------|------|
| `OAuth state invalid` | Cookie expirado ou CSRF | Reiniciar fluxo de conexão |
| `Matching code was not found` | Code reutilizado ou expirado | Conectar novamente |
| `UNSUPPORTED_ACCOUNT_TYPE` | Conta pessoal | Usar conta Business/Creator |
| `ACCOUNT_LINKED_ELSEWHERE` | IG já em outro tenant | Desconectar do outro workspace |
| Sync `FAILED` | Token revogado ou API Meta | Verificar logs server-side; reconectar |
