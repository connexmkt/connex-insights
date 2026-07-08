# Research: Instagram Analytics — Insights Graph API e Estratégia Histórica

**Feature**: 004-instagram-analytics-dashboard  
**Data**: 2026-07-07

## R1 — Arquitetura oficial Meta (fluxo canônico)

**Decision**: Seguir o fluxo documentado pela Meta para **Instagram API with Instagram Login** (Business Login), sem estratégias customizadas que conflitem com a documentação oficial.

```text
OAuth (Business Login)
  → code exchange (short-lived)
  → long-lived token exchange (60 dias)
  → GET /v25.0/me (perfil + user_id)
  → GET /v25.0/{user_id}/media (mídias, paginação cursor)
  → GET /v25.0/{user_id}/insights (métricas de conta)
  → GET /v25.0/{media_id}/insights (métricas por mídia)
  → GET /v25.0/{user_id}/insights?metric=follower_demographics (audiência)
```

**Rationale**:
- Documentação Meta separa autenticação (OAuth) de coleta de dados (Graph API).
- O token Instagram User Access Token (long-lived) autentica todas as chamadas Insights.
- Requisito explícito do stakeholder: não inventar fluxos alternativos.

**Alternatives considered**:
- **Consultar Insights no dashboard em tempo real**: rejeitado — rate limits, latência, viola RN-002 da spec 004 (dashboard consome PostgreSQL).
- **Facebook Graph API via Page ID**: fluxo legado; rejeitado — projeto usa Instagram Login direto (feature 003).

---

## R2 — Endpoints Graph API por camada

### Camada de Autenticação (sem Insights)

| Operação | Endpoint | Documentação |
|----------|----------|--------------|
| Autorização | `GET instagram.com/oauth/authorize` | Business Login |
| Code → short-lived | `POST api.instagram.com/oauth/access_token` | OAuth |
| Short → long-lived | `GET graph.instagram.com/access_token?grant_type=ig_exchange_token` | Access Tokens |
| Refresh | `GET graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token` | Access Tokens |

**Implementação existente (003)**: `lib/instagram/oauth.ts`, `oauth-state.ts`, `token-crypto.ts`, cron refresh.

### Camada de Conta

| Operação | Endpoint | Campos |
|----------|----------|--------|
| Perfil | `GET graph.instagram.com/v25.0/me` | `user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count` |

**Implementação existente (003)**: `graph-client.getInstagramProfile`, `sync-service.executeSync` (parcial).

### Camada de Mídia

| Operação | Endpoint | Campos |
|----------|----------|--------|
| Lista | `GET graph.instagram.com/v25.0/{user_id}/media` | `id,media_type,caption,media_url,permalink,thumbnail_url,timestamp` |
| Paginação | `paging.next` / `paging.cursors.after` | Cursor oficial Meta |

**Gap atual**: sync importa apenas primeira página; falta `media_url`; sem cursor persistido.

### Camada de Insights de Conta

| Operação | Endpoint | Parâmetros |
|----------|----------|------------|
| Métricas de conta | `GET graph.instagram.com/v25.0/{user_id}/insights` | `metric`, `period`, `metric_type`, `since`, `until` |

**Métricas comuns** (variam por conta e versão API; coletar dinamicamente):
- `reach`, `accounts_engaged`, `profile_views`, `website_clicks`, `follower_count`, `online_followers`
- `impressions` (legado em alguns contextos; tratar indisponibilidade)

**Periods oficiais**: `day`, `week`, `days_28`, `lifetime`

**Decision**: Solicitar métricas em lotes respeitando documentação; descobrir métricas suportadas via resposta da API e registry interno extensível (`lib/instagram/metrics/registry.ts`), não lista hardcoded fixa em código de sync.

### Camada de Insights de Mídia

| Operação | Endpoint | Parâmetros |
|----------|----------|------------|
| Métricas de mídia | `GET graph.instagram.com/v25.0/{media_id}/insights` | `metric` |

**Métricas por tipo** (conforme documentação Meta):
- Imagem: `engagement`, `impressions`, `reach`, `saved`
- Vídeo/Reels: `plays`, `reach`, `saved`, `shares`, `total_interactions`, `views`, etc.

**Decision**: Resolver métricas elegíveis por `media_type` via registry; ignorar métricas não suportadas com log estruturado (não falhar sync inteira).

### Camada de Audiência

| Operação | Endpoint | Parâmetros |
|----------|----------|------------|
| Demografia | `GET /{user_id}/insights?metric=follower_demographics` | `period=lifetime`, `metric_type=total_value`, `breakdown=age,gender,country,city` |
| Horários ativos | `GET /{user_id}/insights?metric=online_followers` | `period=lifetime` |

**Rationale**: Demographics exigem mínimo de seguidores (documentação Meta); tratar resposta vazia como indisponível.

---

## R3 — Estratégia de snapshots históricos (append-only)

**Decision**: Modelo **append-only** com idempotência por job de sincronização.

1. Cada execução de sync cria um `InstagramSyncJob` único.
2. Métricas coletadas são inseridas em `instagram_metric_snapshots` com `sync_job_id`.
3. **Nunca** UPDATE em snapshots históricos — apenas INSERT.
4. Idempotência: `UNIQUE (sync_job_id, scope, entity_id, metric_name, period, metric_date, breakdown_key)` — retry do mesmo job não duplica.
5. Sync diária cria **novo** job e **novos** snapshots; snapshots anteriores permanecem para gráficos.

**Retenção**: 90 dias (RN-006 spec 004); job de purge diário remove snapshots com `collected_at < now() - 90 days`.

**Agregação para dashboard**:
- 7d/30d/90d: granularidade `day` dos snapshots
- 6m/12m: agregar snapshots diários em SQL (`DATE_TRUNC`) ou materializar em query layer

**Alternatives considered**:
- **UPDATE latest value per metric**: viola requisito de preservar histórico.
- **JSON blob por sync**: dificulta queries e índices; rejeitado.
- **TimescaleDB**: dependência extra; rejeitado — PostgreSQL + índices suficientes para escopo atual.

---

## R4 — Sincronização incremental de mídia

**Decision**: Persistir cursor de paginação em `instagram_integrations.media_sync_cursor` (campo novo).

1. Initial sync: percorrer todas as páginas até `paging.next` ausente.
2. Daily sync: buscar mídias mais recentes primeiro; parar quando encontrar `external_media_id` já existente (heurística incremental oficial via ordenação por timestamp desc da API).
3. UPSERT por `(integration_id, external_media_id)` — sem duplicatas.
4. Mídias ausentes na API após full reconcile semanal: `is_removed = true`, `removed_at = now()` (soft delete).

**Rationale**: Meta não oferece webhook de delete; reconcile periódico detecta remoções.

---

## R5 — Pipeline de sincronização (jobs independentes)

**Decision**: Orquestrador `InstagramSynchronizationService` executa fases sequenciais dentro de um job, com falha parcial tolerada.

```text
runSync(integrationId, jobType):
  1. AccountSync     — perfil (GET /me)
  2. MediaSync       — mídias (GET /media, paginado)
  3. AccountInsights — insights de conta (GET /insights)
  4. MediaInsights   — insights por mídia (batch, rate-limit aware)
  5. AudienceInsights— demographics + online_followers
  6. Finalize        — lastSyncedAt, syncStatus, job metrics
```

Cada fase registra contadores em `instagram_sync_jobs` (campos novos: `media_imported_count`, `metrics_imported_count`, `failed_requests_count`, `retry_count`).

Falha em uma fase **não reverte** fases anteriores; job pode terminar `PARTIAL` (novo status) ou `FAILED` conforme criticidade.

**Alternatives considered**:
- **Queue separada por fase (Inngest)**: melhor escala; adiado — Vercel Cron + job record suficiente para MVP, com interface preparada para worker futuro.

---

## R6 — Rate limiting e batching Meta

**Decision**:
- Respeitar HTTP 429 com exponential backoff (max 3 retries por request).
- Media insights: processar em lotes de 25 mídias por tick; pausa 200ms entre requests.
- Account insights: uma request por combinação metric+period suportada.
- Registrar `failed_requests_count` e `remaining_quota` quando header `x-app-usage` / `x-business-use-case-usage` presente.

**Rationale**: Evita falha total do cron diário por throttling.

---

## R7 — Dashboard data flow (sem Meta direto)

**Decision**: Server Components e Route Handlers consultam exclusivamente `lib/instagram/analytics/*` → Prisma → snapshots agregados.

- Cache: `unstable_cache` do Next.js com tag `instagram-analytics-{tenantId}` invalidada após sync bem-sucedida.
- Client Components (date range picker, sort): `GET /api/instagram/analytics/*` com `period` query param.

**Rationale**: RS-002 spec 004; performance SC-005.

---

## R8 — Extensibilidade multi-plataforma

**Decision**: Prefixar domínio `lib/instagram/` e tabelas `instagram_*`; analytics genérico em `lib/analytics/` apenas para utilitários compartilháveis (formatação de período, trend calculation).

Interfaces:
```typescript
interface SocialMetricSnapshot { ... }  // types/analytics.ts — contrato futuro
```

Novas redes (TikTok, etc.) terão módulos paralelos (`lib/tiktok/`) sem alterar schema Instagram.

---

## R9 — Variáveis de ambiente adicionais

| Variável | Escopo | Descrição |
|----------|--------|-----------|
| `INSTAGRAM_SYNC_BATCH_SIZE` | Server | Mídias por lote de insights (default 25) |
| `INSTAGRAM_SYNC_MAX_RETRIES` | Server | Retries por request Graph API (default 3) |
| `INSTAGRAM_METRIC_RETENTION_DAYS` | Server | Retenção snapshots (default 90) |
| `CRON_SECRET` | Server | Já existente — protege crons de sync e refresh |

---

## R10 — Referências Meta (anexos do stakeholder)

Documentação oficial consultada para este plano:

1. **Instagram API with Instagram Login — Get Started** — fluxo OAuth e `/me`
2. **Instagram User Insights** — `/{ig-user-id}/insights`, periods, metrics
3. **Instagram Media Insights** — `/{ig-media-id}/insights`, métricas por media_type
4. **Access Tokens** — long-lived exchange e refresh
5. **Instagram API — Pagination** — `paging.cursors.after` / `paging.next`

Qualquer métrica indisponível para conta/período específico é tratada conforme documentação Meta (resposta vazia ou erro de métrica inválida) — nunca estimada.
