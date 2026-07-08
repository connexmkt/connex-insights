# Data Model: Instagram Analytics e Métricas Históricas

**Feature**: 004-instagram-analytics-dashboard  
**Data**: 2026-07-07  
**Estende**: [003 data-model](../003-instagram-account-connection/data-model.md)

## Visão Geral

```text
tenants
    │
    ▼
instagram_integrations ──1:N──► instagram_media
    │                                │
    │                                └──1:N──► instagram_metric_snapshots (scope=MEDIA)
    │
    ├──1:N──► instagram_metric_snapshots (scope=ACCOUNT | AUDIENCE)
    │
    └──1:N──► instagram_sync_jobs (enriquecido)
```

Todas as tabelas possuem `tenant_id` com RLS. Snapshots são **append-only**.

---

## Enums Novos / Estendidos

### `InstagramMetricScope`

| Valor | Descrição |
|-------|-----------|
| `ACCOUNT` | Métrica de conta (user insights) |
| `MEDIA` | Métrica de publicação |
| `AUDIENCE` | Demografia / online_followers |

### `InstagramSyncJobStatus` (estender)

| Valor | Descrição |
|-------|-----------|
| `PARTIAL` | **Novo** — sync concluída com falhas parciais; dados importados preservados |

### `InstagramSyncJobType` (já existe)

| Valor | Uso nesta feature |
|-------|-------------------|
| `INITIAL` | Primeira sync completa pós-OAuth |
| `INCREMENTAL` | Cron diário |
| `TOKEN_REFRESH` | Existente — sem alteração |

---

## Alterações em Tabelas Existentes

### `instagram_integrations` — novos campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `media_sync_cursor` | `TEXT` NULL | Cursor `after` da última página sincronizada |
| `last_full_media_sync_at` | `TIMESTAMPTZ` NULL | Último reconcile completo de mídias |

### `instagram_media` — novos campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `media_url` | `TEXT` NULL | URL da mídia (`media_url` da API) |
| `is_removed` | `BOOLEAN` DEFAULT false | Soft delete quando ausente na API |
| `removed_at` | `TIMESTAMPTZ` NULL | Data de detecção de remoção |
| `last_insights_synced_at` | `TIMESTAMPTZ` NULL | Última coleta de insights da mídia |

**Índice novo**: `(integration_id, is_removed, published_at DESC)`

### `instagram_sync_jobs` — novos campos (observabilidade)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `media_imported_count` | `INTEGER` DEFAULT 0 | Mídias importadas/atualizadas |
| `metrics_imported_count` | `INTEGER` DEFAULT 0 | Snapshots de métricas criados |
| `failed_requests_count` | `INTEGER` DEFAULT 0 | Requests Graph API com falha |
| `retry_count` | `INTEGER` DEFAULT 0 | Total de retries |
| `duration_ms` | `INTEGER` NULL | Duração total |
| `remaining_api_quota` | `JSONB` NULL | Headers de quota quando disponíveis |

---

## Nova Tabela: `instagram_metric_snapshots`

Armazena **todas** as métricas de conta, mídia e audiência de forma extensível.

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | `UUID` | PK | Identificador |
| `tenant_id` | `UUID` | NOT NULL, FK → `tenants` | Isolamento tenant |
| `integration_id` | `UUID` | NOT NULL, FK → `instagram_integrations` | Integração origem |
| `sync_job_id` | `UUID` | NOT NULL, FK → `instagram_sync_jobs` | Job que coletou |
| `scope` | `ENUM` | NOT NULL | `ACCOUNT` \| `MEDIA` \| `AUDIENCE` |
| `entity_id` | `TEXT` NULL | — | `external_media_id` para MEDIA; NULL para ACCOUNT/AUDIENCE |
| `metric_name` | `TEXT` | NOT NULL | Nome canônico da API (`reach`, `likes`, etc.) |
| `period` | `TEXT` | NOT NULL | `day`, `week`, `days_28`, `lifetime` |
| `metric_date` | `DATE` NULL | — | Data de referência do ponto (para séries temporais) |
| `breakdown_dimension` | `TEXT` NULL | — | `age`, `gender`, `country`, `city`, `hour`, `day` |
| `breakdown_value` | `TEXT` NULL | — | Segmento (`F.25-34`, `BR`, `monday`, etc.) |
| `value` | `DECIMAL(20,4)` NULL | — | Valor numérico quando aplicável |
| `value_json` | `JSONB` NULL | — | Payload complexo quando API retorna estrutura aninhada |
| `collected_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | Timestamp da coleta |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Auditoria |

**Constraints**:
```sql
UNIQUE (sync_job_id, scope, entity_id, metric_name, period, metric_date, breakdown_dimension, breakdown_value)
```

**Índices**:
- `(tenant_id, integration_id, scope, metric_name, metric_date DESC)`
- `(tenant_id, integration_id, entity_id, metric_name, collected_at DESC)` — MEDIA
- `(integration_id, collected_at DESC)`
- `(collected_at)` — purge job

**Regras**:
- INSERT only — sem UPDATE/DELETE exceto purge de retenção.
- `value` e `value_json` mutuamente exclusivos quando possível; preferir `value` para escalares.

---

## Schema Prisma (delta)

```prisma
enum InstagramMetricScope {
  ACCOUNT
  MEDIA
  AUDIENCE
}

// Adicionar PARTIAL ao InstagramSyncJobStatus existente

model InstagramIntegration {
  // ... campos existentes ...
  mediaSyncCursor      String?   @map("media_sync_cursor")
  lastFullMediaSyncAt  DateTime? @map("last_full_media_sync_at") @db.Timestamptz(6)
  metricSnapshots      InstagramMetricSnapshot[]
}

model InstagramMedia {
  // ... campos existentes ...
  mediaUrl             String?   @map("media_url")
  isRemoved            Boolean   @default(false) @map("is_removed")
  removedAt            DateTime? @map("removed_at") @db.Timestamptz(6)
  lastInsightsSyncedAt DateTime? @map("last_insights_synced_at") @db.Timestamptz(6)
  metricSnapshots      InstagramMetricSnapshot[]
}

model InstagramSyncJob {
  // ... campos existentes ...
  mediaImportedCount    Int      @default(0) @map("media_imported_count")
  metricsImportedCount  Int      @default(0) @map("metrics_imported_count")
  failedRequestsCount   Int      @default(0) @map("failed_requests_count")
  retryCount            Int      @default(0) @map("retry_count")
  durationMs            Int?     @map("duration_ms")
  remainingApiQuota     Json?    @map("remaining_api_quota")
  metricSnapshots       InstagramMetricSnapshot[]
}

model InstagramMetricSnapshot {
  id                 String               @id @default(uuid()) @db.Uuid
  tenantId           String               @map("tenant_id") @db.Uuid
  integrationId      String               @map("integration_id") @db.Uuid
  syncJobId          String               @map("sync_job_id") @db.Uuid
  scope              InstagramMetricScope
  entityId           String?              @map("entity_id")
  metricName         String               @map("metric_name")
  period             String
  metricDate         DateTime?            @map("metric_date") @db.Date
  breakdownDimension String?              @map("breakdown_dimension")
  breakdownValue     String?              @map("breakdown_value")
  value              Decimal?             @db.Decimal(20, 4)
  valueJson          Json?                @map("value_json")
  collectedAt        DateTime             @default(now()) @map("collected_at") @db.Timestamptz(6)
  createdAt          DateTime             @default(now()) @map("created_at") @db.Timestamptz(6)

  integration InstagramIntegration @relation(fields: [integrationId], references: [id], onDelete: Cascade)
  syncJob     InstagramSyncJob     @relation(fields: [syncJobId], references: [id], onDelete: Cascade)
  media       InstagramMedia?      @relation(fields: [integrationId, entityId], references: [integrationId, externalMediaId])

  @@unique([syncJobId, scope, entityId, metricName, period, metricDate, breakdownDimension, breakdownValue])
  @@index([tenantId, integrationId, scope, metricName, metricDate(sort: Desc)])
  @@index([tenantId, integrationId, entityId, metricName, collectedAt(sort: Desc)])
  @@index([integrationId, collectedAt(sort: Desc)])
  @@index([collectedAt])
  @@map("instagram_metric_snapshots")
}
```

**Nota**: relação opcional `media` via composite FK requer `entity_id` = `external_media_id` quando `scope = MEDIA`.

---

## Políticas RLS

### `instagram_metric_snapshots`

Mesmo template tenant-owned das tabelas Instagram existentes:

```sql
ALTER TABLE public.instagram_metric_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_metric_snapshots FORCE ROW LEVEL SECURITY;

CREATE POLICY "instagram_metric_snapshots_tenant_select"
  ON public.instagram_metric_snapshots FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "instagram_metric_snapshots_tenant_insert"
  ON public.instagram_metric_snapshots FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.current_tenant_id());
-- INSERT via Prisma service role; policies defensivas para client Supabase
```

Repetir padrão SELECT para `authenticated`; INSERT/UPDATE/DELETE apenas server-side via Prisma.

---

## Estratégia de Migrations

| # | Nome | Conteúdo |
|---|------|----------|
| M5 | `instagram_analytics_snapshots` | Enum `InstagramMetricScope`, tabela snapshots, alterações em media/integration/sync_jobs |
| M6 | `instagram_analytics_rls` | RLS snapshots (pode ser parte de M5) |
| M7 | `instagram_sync_job_partial_status` | Adicionar `PARTIAL` ao enum job status |

**Regras**:
- DDL exclusivamente via `prisma migrate`
- Validar com Supabase MCP `get_advisors` após apply
- Backfill opcional: re-sync inicial para tenants existentes

---

## Queries de Agregação (referência para analytics layer)

### KPI — valor mais recente no período

```sql
SELECT DISTINCT ON (metric_name)
  metric_name, value, metric_date, collected_at
FROM instagram_metric_snapshots
WHERE tenant_id = $1 AND integration_id = $2
  AND scope = 'ACCOUNT'
  AND metric_date BETWEEN $since AND $until
ORDER BY metric_name, collected_at DESC;
```

### Série temporal — reach diário

```sql
SELECT metric_date, MAX(value) AS value
FROM instagram_metric_snapshots
WHERE tenant_id = $1 AND metric_name = 'reach'
  AND scope = 'ACCOUNT' AND period = 'day'
  AND metric_date BETWEEN $since AND $until
GROUP BY metric_date
ORDER BY metric_date;
```

### Top posts por alcance

```sql
SELECT m.*, s.value AS reach
FROM instagram_media m
JOIN LATERAL (
  SELECT value FROM instagram_metric_snapshots
  WHERE entity_id = m.external_media_id
    AND metric_name = 'reach' AND scope = 'MEDIA'
  ORDER BY collected_at DESC LIMIT 1
) s ON true
WHERE m.tenant_id = $1 AND m.is_removed = false
ORDER BY s.value DESC NULLS LAST
LIMIT $pageSize OFFSET $offset;
```

---

## Regras de Validação

- `tenant_id` em INSERT: sempre de `getTenantContext()`.
- `sync_job_id` deve pertencer à mesma `integration_id` e `tenant_id`.
- Purge: `DELETE FROM instagram_metric_snapshots WHERE collected_at < now() - interval '90 days'` via cron server-only.
- Snapshots nunca atualizados — correções exigem novo sync job.
