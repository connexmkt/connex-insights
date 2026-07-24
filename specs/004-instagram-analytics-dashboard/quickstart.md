# Quickstart: Instagram Analytics Dashboard

**Feature**: 004-instagram-analytics-dashboard  
**Pré-requisito**: [003 quickstart](../003-instagram-account-connection/quickstart.md) — OAuth e integração base funcionando.

## 1. Variáveis de ambiente

Adicionar ao `.env` (além das vars 003):

```env
# Analytics / Sync (opcionais — defaults entre parênteses)
INSTAGRAM_SYNC_BATCH_SIZE=25
INSTAGRAM_SYNC_MAX_RETRIES=3
INSTAGRAM_METRIC_RETENTION_DAYS=90
```

Vars obrigatórias 003:
- `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `INSTAGRAM_REDIRECT_URI`
- `INSTAGRAM_TOKEN_ENCRYPTION_KEY`, `INSTAGRAM_OAUTH_STATE_SECRET`
- `CRON_SECRET`

## 2. Migrations

```bash
pnpm prisma migrate dev --name instagram_analytics_snapshots
pnpm prisma generate
```

Validar no Supabase MCP:
- `list_tables` — confirmar `instagram_metric_snapshots`
- `get_advisors` — sem alertas críticos de RLS

## 3. Fluxo local de validação

### 3.1 Conectar conta

1. `pnpm dev`
2. Login com usuário `ACTIVE`
3. `/dashboard/configuracoes` → Conectar Instagram
4. Autorizar conta **Business** ou **Creator**

### 3.2 Verificar sync inicial

Após callback, o pipeline completo deve executar:

```text
Account → Media (paginado) → Account Insights → Media Insights → Audience
```

Consultar status:

```bash
curl -b cookies.txt http://localhost:3000/api/instagram/integration
```

Verificar snapshots no banco:

```sql
SELECT scope, metric_name, COUNT(*)
FROM instagram_metric_snapshots
WHERE tenant_id = '<seu-tenant-id>'
GROUP BY scope, metric_name;
```

### 3.3 Dashboard analytics

1. Acessar `/dashboard`
2. Selecionar aba Instagram (se aplicável)
3. Alternar períodos: 7d, 30d, 90d, 6m, 12m
4. Verificar KPIs, gráficos e lista de posts

API direta (com sessão autenticada):

```bash
curl -b cookies.txt "http://localhost:3000/api/instagram/analytics/overview?period=30d"
curl -b cookies.txt "http://localhost:3000/api/instagram/analytics/timeseries?period=30d&metric=reach"
curl -b cookies.txt "http://localhost:3000/api/instagram/analytics/media?period=30d&sort=reach&page=1"
```

### 3.4 Cron local (opcional)

```bash
curl http://localhost:3000/api/cron/instagram/daily-sync \
  -H "Authorization: Bearer $CRON_SECRET"

curl http://localhost:3000/api/cron/instagram/purge-metrics \
  -H "Authorization: Bearer $CRON_SECRET"
```

## 4. Testes

```bash
pnpm test tests/unit/instagram/metrics-parser.test.ts
pnpm test tests/integration/instagram/analytics-overview.test.ts
pnpm test tests/integration/instagram/metric-snapshots-idempotency.test.ts
```

## 5. Checklist de entrega

- [ ] Snapshots criados após initial sync (ACCOUNT, MEDIA, AUDIENCE)
- [ ] Re-run sync não duplica snapshots do mesmo job
- [ ] Dashboard exibe KPIs reais (não mock `connex-data.ts`)
- [ ] Empty state quando sem integração
- [ ] Cross-tenant: usuário A não vê dados de B
- [ ] Nenhum token em responses de analytics
- [ ] Cron daily-sync processa todas integrações CONNECTED
- [ ] Purge remove snapshots > 90 dias

## 6. Troubleshooting

| Sintoma | Causa provável | Ação |
|---------|----------------|------|
| KPIs vazios | Sync incompleto ou sem escopo `manage_insights` | Verificar `instagram_sync_jobs`; reconectar |
| Métricas "Indisponível" | API não expõe para conta/período | Esperado — não estimar valores |
| `REQUIRES_RECONNECTION` | Token expirado/revogado | Reconectar em Configurações |
| Sync PARTIAL | Rate limit ou mídias com erro | Aguardar daily sync; verificar logs |
| Gráfico 6m/12m esparsos | Retenção < período | Indicar dados insuficientes na UI |

## 7. Referências Meta

- [Instagram API with Instagram Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login)
- [IG User Insights](https://developers.facebook.com/docs/instagram-platform/insights)
- [Access Tokens](https://developers.facebook.com/docs/instagram-platform/reference/refresh_access_token)
