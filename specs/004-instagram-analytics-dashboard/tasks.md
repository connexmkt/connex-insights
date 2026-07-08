# Tasks: Dashboard de Analytics Instagram

**Input**: Documentos de design em `/specs/004-instagram-analytics-dashboard/`  
**Prerequisites**: spec.md ✅, plan.md ✅, research.md ✅, data-model.md ✅, contracts/instagram-analytics-api.yaml ✅, quickstart.md ✅, features [001-user-auth](../001-user-auth/spec.md), [002-first-time-account-activation](../002-first-time-account-activation/spec.md) e [003-instagram-account-connection](../003-instagram-account-connection/spec.md) (OAuth + sync base) ✅

**Tests**: Incluídos — spec exige cobertura unitária, de integração e de autorização (RNF-002, SC-012).

**Organization**: Tarefas agrupadas por user story para implementação e teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode executar em paralelo (arquivos diferentes, sem dependências incompletas)
- **[Story]**: User story da spec (US1–US7)
- Caminhos absolutos relativos à raiz do repositório

---

## Phase 1: Prerequisites (Verificação)

**Purpose**: Confirmar base 003 estável e branch da feature antes de alterações

- [ ] T001 Criar branch `004-instagram-analytics-dashboard` a partir de `main` (ou branch base atual)
- [ ] T002 Validar que OAuth 003 está operacional: env vars Meta em `.env`, migration `instagram_integration_tables` aplicada no Supabase
- [x] T003 Validar que `pnpm test` e `pnpm tsc --noEmit` passam na base atual antes de iniciar
- [ ] T004 Confirmar escopo `instagram_business_manage_insights` concedido no App Meta (pré-requisito para coleta de Insights)

**Checkpoint**: Base 003 estável — implementação analytics pode iniciar

---

## Phase 2: Foundational (Pré-requisitos Bloqueantes)

**Purpose**: Schema de snapshots, Graph API Insights, pipeline de sync completo e crons — **BLOQUEIA todas as user stories com dados reais**

**⚠️ CRITICAL**: Nenhuma user story com métricas reais pode iniciar antes desta fase

### Database e tipos

- [x] T005 Adicionar variáveis opcionais em `.env.example`: `INSTAGRAM_SYNC_BATCH_SIZE`, `INSTAGRAM_SYNC_MAX_RETRIES`, `INSTAGRAM_METRIC_RETENTION_DAYS`
- [x] T006 Expandir `prisma/schema.prisma` com enum `InstagramMetricScope`, model `InstagramMetricSnapshot` e campos estendidos em `InstagramIntegration`, `InstagramMedia`, `InstagramSyncJob` conforme `specs/004-instagram-analytics-dashboard/data-model.md`
- [x] T007 Adicionar valor `PARTIAL` ao enum `InstagramSyncJobStatus` em `prisma/schema.prisma`
- [x] T008 Gerar migration `instagram_analytics_snapshots` em `prisma/migrations/`
- [x] T009 Adicionar SQL RLS na migration: policies tenant-owned para `instagram_metric_snapshots` (SELECT authenticated; INSERT/UPDATE server-only via Prisma)
- [x] T010 Aplicar migration com `pnpm prisma migrate dev` e regenerar client em `lib/generated/prisma/`
- [x] T011 Validar schema via Supabase MCP: `list_tables`, `get_advisors` (security)
- [x] T012 [P] Criar `types/analytics.ts` com `AnalyticsPeriod`, `MetricValue`, `TrendDirection`, `TimeseriesPoint`, `OverviewResponse`
- [x] T013 [P] Estender `types/instagram.ts` com tipos de resposta Insights Graph API (`InstagramGraphInsightsResponse`, breakdowns, media insights)

### Graph client e métricas

- [x] T014 Estender `lib/instagram/graph-client.ts`: `getInstagramMediaPage` (paginação cursor), `getAccountInsights`, `getMediaInsights`, `getAudienceInsights` + retry/backoff 429
- [x] T015 [P] Implementar `lib/instagram/insights/metrics/registry.ts` — métricas elegíveis por `scope` e `media_type` (extensível, sem lista hardcoded fixa)
- [x] T016 Implementar `lib/instagram/insights/metrics/parser.ts` — normalizar resposta Meta → rows de `InstagramMetricSnapshot`
- [x] T017 [P] Criar testes unitários em `tests/unit/instagram/metrics-registry.test.ts` e `tests/unit/instagram/metrics-parser.test.ts`

### Serviços de sincronização (fluxo Meta oficial)

- [x] T018 [P] Implementar `lib/instagram/account/account-service.ts` — `syncAccountProfile` via `GET /me` (extrair lógica de `sync-service.ts`)
- [x] T019 Implementar `lib/instagram/media/media-service.ts` — sync paginado, `media_url`, cursor em `media_sync_cursor`, soft delete (`is_removed`)
- [x] T020 [P] Implementar `lib/instagram/insights/account-insights.ts` — coleta account insights com `since`/`until` (90 dias initial, 2 dias daily)
- [x] T021 Implementar `lib/instagram/insights/media-insights.ts` — batch por mídia, rate-limit aware, contadores de falha
- [x] T022 [P] Implementar `lib/instagram/insights/audience-insights.ts` — `follower_demographics` + `online_followers`
- [x] T023 Implementar `lib/instagram/sync/synchronization-service.ts` — orquestrador 6 fases (account → media → account insights → media insights → audience → finalize)
- [x] T024 Refatorar `lib/instagram/sync-service.ts` para delegar a `synchronization-service.ts`; manter API pública `runInitialSync`, `runSync`, `runSyncForTenant`
- [x] T025 Garantir idempotência de snapshots: `UNIQUE (sync_job_id, scope, entity_id, metric_name, period, metric_date, breakdown_*)` — retry do mesmo job não duplica
- [ ] T026 [P] Criar testes de integração em `tests/integration/instagram/account-insights-sync.test.ts` (initial sync persiste snapshots ACCOUNT, MEDIA, AUDIENCE)
- [ ] T027 [P] Criar testes em `tests/integration/instagram/metric-snapshots-idempotency.test.ts` (re-run mesmo job não duplica; daily append novos snapshots)

### Cron jobs

- [x] T028 Implementar `lib/instagram/cron/cron-service.ts`: `runDailySyncForAllTenants`, `runMetricsPurge`, observabilidade estruturada
- [x] T029 Implementar `POST` handler em `app/api/cron/instagram/daily-sync/route.ts` protegido por `CRON_SECRET`
- [x] T030 [P] Implementar `POST` handler em `app/api/cron/instagram/purge-metrics/route.ts` — remove snapshots > `INSTAGRAM_METRIC_RETENTION_DAYS` (default 90)
- [x] T031 Atualizar `vercel.json`: cron `0 4 * * *` → daily-sync; `0 5 * * *` → purge-metrics
- [ ] T032 [P] Criar testes em `tests/integration/instagram/daily-sync-cron.test.ts` (falha tenant A não interrompe tenant B; status PARTIAL)
- [ ] T033 [P] Criar testes em `tests/integration/instagram/failure-recovery.test.ts` (sync FAILED preserva histórico; partial sync preserva fases anteriores)

**Checkpoint**: Foundation ready — pipeline completo persiste snapshots; analytics e dashboard podem consumir dados reais

---

## Phase 3: User Story 1 — Acessar o Dashboard de Analytics Instagram (Priority: P1) 🎯 MVP

**Goal**: Usuário `ACTIVE` com integração vê dashboard analítico; sem integração vê empty state com CTA; cross-tenant bloqueado

**Independent Test**: Login → `/dashboard` → com integração sync concluída renderiza visão Instagram; sem integração exibe CTA para Configurações; usuário não autenticado redirecionado

### Tests for User Story 1

> **NOTE: Escrever estes testes PRIMEIRO — devem FALHAR antes da implementação**

- [x] T034 [P] [US1] Criar testes de componente em `components/dashboard/instagram-empty-state.test.tsx` (renderiza CTA; link para `/dashboard/configuracoes`)
- [x] T035 [P] [US1] Criar testes de integração em `tests/integration/instagram/analytics-tenant-isolation.test.ts` (User Tenant A não acessa analytics Tenant B — base para todas APIs)

### Implementation for User Story 1

- [x] T036 [P] [US1] Criar `components/dashboard/instagram-empty-state.tsx` — empty state pt-BR com CTA "Conectar Instagram" → `/dashboard/configuracoes`
- [x] T037 [US1] Evoluir `app/dashboard/page.tsx` — resolver integração server-side (`getPublicIntegration`); renderizar `InstagramEmptyState` quando `connected=false`
- [x] T038 [US1] Garantir que `app/dashboard/layout.tsx` + middleware existente bloqueiam usuários não `ACTIVE` (reutilizar 001/002 — sem bypass)
- [x] T039 [US1] Exibir dados históricos + banner de status quando integração `DISCONNECTED` ou `REQUIRES_RECONNECTION` (sem expor detalhes técnicos)

**Checkpoint**: US1 funcional — acesso controlado e empty state; dashboard pronto para receber dados reais

---

## Phase 4: User Story 2 — Visualizar KPIs e visão geral da conta (Priority: P1)

**Goal**: Cards de KPI com valores sincronizados, trends e skeletons; métricas indisponíveis claramente marcadas

**Independent Test**: Com snapshots no DB, dashboard exibe KPIs (seguidores, alcance, engajamento, etc.) com trend up/down/neutral; métrica ausente mostra "Indisponível"

### Tests for User Story 2

- [x] T040 [P] [US2] Criar testes unitários em `tests/unit/instagram/period.test.ts` e `tests/unit/instagram/trend.test.ts` (parse 7d/30d/90d/6m/12m; `changePercent`, trend direction)
- [ ] T041 [P] [US2] Criar testes de integração em `tests/integration/instagram/analytics-overview.test.ts` (KPIs retornam valores do tenant; sem token leak; métrica ausente → `status: unavailable`)

### Implementation for User Story 2

- [x] T042 [P] [US2] Implementar `lib/instagram/analytics/period.ts` — presets `7d`, `30d`, `90d`, `6m`, `12m` → `{ since, until }`
- [x] T043 [P] [US2] Implementar `lib/instagram/analytics/trend.ts` — `computeTrend(current, previous)` → `{ changePercent, trend: up|down|neutral }`
- [x] T044 [US2] Implementar `lib/instagram/analytics/overview-query.ts` — agrega snapshots ACCOUNT para KPIs + perfil integração
- [x] T045 [US2] Implementar `GET` handler em `app/api/instagram/analytics/overview/route.ts`: `requireAuth`, Zod `period`, `getOverviewAnalytics(ctx.tenantId, period)`
- [x] T046 [US2] Evoluir `components/dashboard/metric-cards.tsx` — consumir KPIs reais; skeleton loading; badge trend; estado `indisponível` sem valor fictício *(via `instagram-analytics-dashboard.tsx`)*
- [x] T047 [US2] Exibir foto de perfil, @username e status da integração no cabeçalho do dashboard Instagram (FR-010)

**Checkpoint**: US1 + US2 — KPIs reais visíveis no dashboard

---

## Phase 5: User Story 3 — Analisar tendências históricas com filtros de período (Priority: P1)

**Goal**: Gráficos interativos recharts; seletor de período atualiza KPIs, gráficos e conteúdo; dados de múltiplas syncs

**Independent Test**: Alternar 7d/30d/90d/6m/12m atualiza gráficos em ≤3s; série reflete snapshots históricos; período sem dados exibe empty state

### Tests for User Story 3

- [ ] T048 [P] [US3] Criar testes de integração em `tests/integration/instagram/analytics-timeseries.test.ts` (série reach por dia; período vazio → points vazios sem erro 500)

### Implementation for User Story 3

- [x] T049 [US3] Implementar `lib/instagram/analytics/timeseries-query.ts` — agrega snapshots por `metric_date`; suporta agregação para 6m/12m
- [x] T050 [US3] Implementar `GET` handler em `app/api/instagram/analytics/timeseries/route.ts`: query `period` + `metric`
- [x] T051 [P] [US3] Criar `components/dashboard/date-range-picker.tsx` — presets 7d, 30d, 90d, 6m, 12m; debounce 300ms; acessível via teclado
- [x] T052 [US3] Evoluir `components/dashboard/charts-section.tsx` — recharts `LineChart` com dados de timeseries; skeleton durante load; empty state dados insuficientes *(via `instagram-analytics-dashboard.tsx`)*
- [x] T053 [US3] Integrar `DateRangePicker` em `app/dashboard/page.tsx` — estado `period` compartilhado com KPIs e gráficos (context ou URL searchParams) *(via `instagram-analytics-dashboard.tsx`)*

**Checkpoint**: US1 + US2 + US3 — gráficos históricos com filtros de período

---

## Phase 6: User Story 4 — Explorar desempenho de conteúdo publicado (Priority: P1)

**Goal**: Lista paginada de publicações com métricas, thumbnail, legenda; ordenação por reach, engagement, likes, etc.

**Independent Test**: Seção de posts exibe métricas por mídia; sort por alcance reordena; paginação funciona; métrica ausente = indisponível

### Tests for User Story 4

- [ ] T054 [P] [US4] Criar testes de integração em `tests/integration/instagram/analytics-media.test.ts` (sort por reach desc; paginação; filtro por period)

### Implementation for User Story 4

- [x] T055 [US4] Implementar `lib/instagram/analytics/media-query.ts` — join `instagram_media` + latest MEDIA snapshots; sort server-side; paginação
- [x] T056 [US4] Implementar `GET` handler em `app/api/instagram/analytics/media/route.ts`: query `period`, `sort`, `order`, `page`, `pageSize`
- [x] T057 [US4] Evoluir `components/dashboard/top-posts.tsx` — dados reais; controles de ordenação; paginação; thumbnail + caption + tipo + data *(via `instagram-analytics-dashboard.tsx`)*
- [x] T058 [US4] Respeitar filtro de período global na listagem de conteúdo (publicações fora do período excluídas ou contextualizadas)

**Checkpoint**: US1–US4 — desempenho de conteúdo funcional

---

## Phase 7: User Story 5 — Visualizar insights de audiência (Priority: P2)

**Goal**: Demografia (idade, gênero, país, cidade) e horários ativos quando API disponibiliza; empty state quando indisponível

**Independent Test**: Conta com demographics → gráficos de audiência; conta sem → mensagem de indisponibilidade sem estimativas

### Tests for User Story 5

- [ ] T059 [P] [US5] Criar testes de integração em `tests/integration/instagram/analytics-audience.test.ts` (demographics disponíveis; conta sem dados → `available: false`)

### Implementation for User Story 5

- [x] T060 [US5] Implementar `lib/instagram/analytics/audience-query.ts` — agrega snapshots `scope=AUDIENCE` por breakdown
- [x] T061 [US5] Implementar `GET` handler em `app/api/instagram/analytics/audience/route.ts`
- [x] T062 [US5] Evoluir `components/dashboard/audience-section.tsx` — gráficos demográficos responsivos; empty state indisponível; respeitar período selecionado *(via `instagram-analytics-dashboard.tsx`)*

**Checkpoint**: US5 funcional — audiência quando disponível pela Meta

---

## Phase 8: User Story 6 — Comparar desempenho entre períodos (Priority: P2)

**Goal**: Toggle compara com período anterior de mesma duração; variação % em KPIs e overlay em gráficos

**Independent Test**: Ativar compare em 30d → KPIs mostram `changePercent` vs 30 dias anteriores; desativar remove overlay

### Tests for User Story 6

- [ ] T063 [P] [US6] Estender `tests/integration/instagram/analytics-overview.test.ts` com `compare=true` (changePercent correto; comparação indisponível quando sem dados)

### Implementation for User Story 6

- [x] T064 [US6] Estender `overview-query.ts` e `timeseries-query.ts` para aceitar `compare: boolean` — calcular período anterior equivalente
- [x] T065 [US6] Adicionar toggle "Comparar com período anterior" em `components/dashboard/date-range-picker.tsx` ou componente dedicado
- [x] T066 [US6] Evoluir `metric-cards.tsx` e `charts-section.tsx` — highlight visual crescimento/queda (WCAG AA); `comparePoints` no gráfico *(via `instagram-analytics-dashboard.tsx`)*

**Checkpoint**: US6 funcional — comparação temporal

---

## Phase 9: User Story 7 — Monitorar status de sincronização e frescor dos dados (Priority: P2)

**Goal**: Banner com última sync, status, frescor ("Atualizado há X min"); notificação não técnica em falha; dados históricos durante sync

**Independent Test**: Banner exibe `lastSyncedAt` e freshness; sync IN_PROGRESS mostra indicador; FAILED mostra alerta acionável sem stack trace

### Tests for User Story 7

- [ ] T067 [P] [US7] Criar testes de integração em `tests/integration/instagram/analytics-sync-status.test.ts` (freshnessLabel; sync FAILED → mensagem amigável)

### Implementation for User Story 7

- [x] T068 [US7] Implementar `GET` handler em `app/api/instagram/analytics/sync-status/route.ts` — `syncStatus`, `lastSyncedAt`, `freshnessLabel`, `integrationStatus`
- [x] T069 [P] [US7] Criar `components/dashboard/sync-status-banner.tsx` — estados PENDING, IN_PROGRESS, COMPLETED, FAILED; `aria-live` para updates
- [x] T070 [US7] Integrar `SyncStatusBanner` em `app/dashboard/page.tsx` — polling leve quando `syncStatus=IN_PROGRESS`; dados históricos permanecem visíveis *(via `instagram-analytics-dashboard.tsx`)*
- [x] T071 [US7] Invalidar cache `unstable_cache` tag `instagram-analytics-{tenantId}` ao finalizar sync em `synchronization-service.ts`

**Checkpoint**: US7 funcional — transparência de frescor e status de sync

---

## Phase 10: Cross-Cutting (Segurança, Multi-Tenant, RLS, Performance)

**Purpose**: Isolamento cross-tenant, ausência de vazamento de tokens, RLS snapshots e conformidade com contrato OpenAPI

- [ ] T072 [P] Criar testes RLS em `tests/integration/instagram/metric-snapshots-rls.test.ts` (2 sessões Supabase; SELECT cross-tenant em `instagram_metric_snapshots` retorna vazio)
- [ ] T073 [P] Estender `tests/integration/instagram/analytics-tenant-isolation.test.ts` para todos endpoints `/api/instagram/analytics/*`
- [ ] T074 [P] Criar testes de vazamento em `tests/integration/instagram/analytics-token-leak.test.ts` (responses analytics não contêm `access_token`)
- [x] T075 Garantir que todos handlers analytics usam `ctx.tenantId` — nunca `tenantId` do query/body (RT-004)
- [ ] T076 [P] Validar contrato OpenAPI em `specs/004-instagram-analytics-dashboard/contracts/instagram-analytics-api.yaml` contra handlers implementados
- [x] T077 Implementar `unstable_cache` em queries analytics com tag por tenant; documentar em `lib/instagram/analytics/overview-query.ts`

**Checkpoint**: Segurança e multi-tenancy verificados por testes automatizados

---

## Phase 11: Polish & Deploy

**Purpose**: E2E, backfill, deploy, remoção de mocks e suite completa

- [ ] T078 [P] Criar teste e2e em `tests/e2e/instagram-dashboard.spec.ts` (empty state; KPIs com API mockada; troca de período; sync banner)
- [ ] T079 Remover dependência de mocks Instagram em `lib/connex-data.ts` para seções evoluídas (MetricCards, Charts, TopPosts, Audience) — manter mocks de outras redes até features futuras
- [ ] T080 Executar backfill: disparar sync completa para tenants com integração existente pós-deploy (`POST /api/instagram/sync` ou cron manual)
- [ ] T081 Configurar crons daily-sync e purge-metrics no Vercel produção; validar `CRON_SECRET`
- [x] T082 Executar `pnpm tsc --noEmit` e corrigir erros de tipo introduzidos
- [x] T083 Executar suite completa `pnpm test` e corrigir falhas
- [ ] T084 Executar `pnpm test:e2e` para `instagram-dashboard.spec.ts`
- [ ] T085 Validar fluxo manual com conta Instagram Business real (initial sync → dashboard KPIs → gráficos → posts)
- [ ] T086 [P] Validar Supabase MCP `get_advisors` pós-deploy produção
- [ ] T087 [P] Atualizar `specs/004-instagram-analytics-dashboard/checklists/requirements.md` com status pós-implementação

---

## Dependencies & Execution Order

### Phase Dependencies

```text
Phase 1 (Prerequisites)
    ↓
Phase 2 (Foundational) ← BLOQUEIA DADOS REAIS
    ↓
Phase 3 (US1) ← acesso e empty state (pode iniciar após T010 parcial)
    ↓
Phase 4 (US2) ← KPIs
    ↓
Phase 5 (US3) ← gráficos + período
    ↓
Phase 6 (US4) ← conteúdo
    ↓
┌─────────┴─────────┐
Phase 7 (US5)    Phase 9 (US7) ← podem paralelizar após US2
Phase 8 (US6)         ↑
    └────────┬────────┘
             ↓
    Phase 10 (Cross-Cutting)
             ↓
    Phase 11 (Polish)
```

### User Story Dependencies

| Story | Depende de | Independente após |
|-------|-----------|-------------------|
| **US1 (P1)** | Phase 2 parcial (integração 003) | Acesso, empty state, gating |
| **US2 (P1)** | Phase 2 completa + US1 | KPIs com snapshots reais |
| **US3 (P1)** | US2 + analytics queries | Gráficos + date range |
| **US4 (P1)** | Phase 2 (media insights) + US3 period | Lista de posts com métricas |
| **US5 (P2)** | Phase 2 (audience sync) + US3 | Demografia quando disponível |
| **US6 (P2)** | US2 + US3 | Comparação entre períodos |
| **US7 (P2)** | Phase 2 (sync jobs) + US1 | Banner sync/frescor |

### Within Each User Story

1. Testes escritos primeiro (devem falhar)
2. `lib/instagram/analytics/` (queries)
3. Route Handlers (API)
4. Componentes (dashboard)
5. Checkpoint antes de próxima story

### Parallel Opportunities

**Phase 2** — T012, T013 em paralelo após T010; T015, T017 em paralelo; T018, T020, T022 em paralelo após T016; T026, T027, T032, T033 em paralelo após T023

**US1** — T034, T035 em paralelo; T036 paralelo com T037

**US2** — T040, T041 em paralelo; T042, T043 em paralelo

**US3** — T048 antes de T049–T053; T051 paralelo com T049

**US4** — T054 antes de T055–T058

**US5** — T059 antes de T060–T062

**US6** — T063 antes de T064–T066

**US7** — T067 antes de T068–T071; T069 paralelo com T068

**Phase 10** — T072, T073, T074, T076 em paralelo

**Phase 11** — T078, T086, T087 em paralelo

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Após T010 (migration aplicada):
T012: types/analytics.ts
T013: types/instagram.ts (insights types)
T015: lib/instagram/insights/metrics/registry.ts
T017: tests/unit/instagram/metrics-*.test.ts

# Sequencial core sync:
T014 → T016 → T018 → T019 → T020 → T021 → T022 → T023 → T024

# Cron após sync:
T028 → T029 → T030 → T031
```

---

## Parallel Example: User Story 2 + 3

```bash
# Queries em paralelo:
T042: lib/instagram/analytics/period.ts
T043: lib/instagram/analytics/trend.ts

# Sequencial:
T044 → T045 → T046 → T047
T049 → T050 → T051 → T052 → T053
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 + 3 + 4)

1. Completar Phase 1: Prerequisites
2. Completar Phase 2: Foundational (**crítico** — sync + snapshots)
3. Completar Phase 3: User Story 1 (acesso + empty state)
4. Completar Phase 4: User Story 2 (KPIs)
5. Completar Phase 5: User Story 3 (gráficos + período)
6. Completar Phase 6: User Story 4 (conteúdo)
7. **PARAR e VALIDAR**: dashboard com dados reais + `pnpm test`
8. Demo/deploy preview se aprovado

### Incremental Delivery

| Incremento | Entrega | Valor |
|-----------|---------|-------|
| MVP | US1 + US2 + US3 + US4 | Dashboard analytics core com KPIs, gráficos e posts |
| +US5 | Audiência | Demografia e horários ativos |
| +US6 | Comparação | Variação vs período anterior |
| +US7 | Sync status | Frescor e transparência de sync |
| +Phase 10 | Segurança | RLS snapshots, tenant isolation |
| +Phase 11 | Polish | E2E, backfill, deploy prod |

### Parallel Team Strategy

Com 2+ desenvolvedores após Phase 2:

- **Dev A**: Phase 2 sync pipeline → US2 (KPIs) → US3 (charts) → US6 (compare)
- **Dev B**: US1 (access) → US4 (media) → US5 (audience) → US7 (sync banner)
- **Ambos**: Phase 10 (segurança) → Phase 11 (polish)

---

## Summary

| Métrica | Valor |
|---------|-------|
| **Total de tasks** | 87 |
| **Phase 1 (Prerequisites)** | 4 |
| **Phase 2 (Foundational)** | 29 |
| **US1 — Acesso dashboard** | 6 |
| **US2 — KPIs** | 8 |
| **US3 — Gráficos + período** | 6 |
| **US4 — Conteúdo** | 5 |
| **US5 — Audiência** | 4 |
| **US6 — Comparação** | 4 |
| **US7 — Sync status** | 5 |
| **Cross-Cutting** | 6 |
| **Polish** | 10 |
| **Tasks paralelizáveis [P]** | 38 |
| **MVP scope** | Phase 1 + 2 + 3 + 4 + 5 + 6 (T001–T058) |

### Independent Test Criteria

| Story | Como validar |
|-------|-------------|
| US1 | Dashboard com/sem integração; empty state CTA; cross-tenant negado; INACTIVE bloqueado |
| US2 | KPIs reais dos snapshots; trend; indisponível sem valor fictício; skeletons |
| US3 | Gráficos atualizam por período; série histórica multi-sync; empty sem erro |
| US4 | Posts com métricas; sort; paginação; filtro período |
| US5 | Demografia quando API retorna; indisponível sem estimativa |
| US6 | Compare toggle; changePercent; overlay gráfico |
| US7 | Banner sync/frescor; FAILED amigável; histórico durante sync |

### Mapeamento Spec → Tasks

| Requisito | Tasks |
|-----------|-------|
| FR-001–FR-005 (acesso) | T034–T039 |
| FR-006–FR-010 (KPIs) | T040–T047 |
| FR-011–FR-013 (período) | T042, T051, T053 |
| FR-014–FR-017 (gráficos/compare) | T048–T053, T063–T066 |
| FR-018–FR-021 (conteúdo) | T054–T058 |
| FR-022–FR-023 (audiência) | T059–T062 |
| FR-024–FR-028 (sync/frescor) | T067–T071 |
| FR-029 (extensibilidade) | T015, T016 |
| RS-001–RS-006 (segurança) | T074–T075 |
| RT-001–RT-004 (multi-tenant) | T035, T072–T073, T075 |
| SC-001–SC-012 (critérios de sucesso) | T034–T087 |

### Mapeamento Plan → Tasks

| Plan Task | Tasks |
|-----------|-------|
| T001–T004 (prerequisites) | T001–T004 |
| T005–T009 (database) | T005–T011 |
| T010–T013 (graph + registry) | T014–T017 |
| T014–T021 (sync services) | T018–T027 |
| T022–T026 (cron) | T028–T033 |
| T027–T032 (analytics queries) | T042–T044, T049, T055, T060 |
| T033–T038 (analytics API) | T045, T050, T056, T061, T068 |
| T039–T048 (dashboard UI) | T036–T037, T046–T047, T051–T053, T057–T058, T062, T065–T066, T069–T070 |
| T049–T053 (E2E/hardening) | T072–T087 |

### Format Validation

✅ Todas as 87 tasks seguem o formato `- [ ] TXXX [P?] [Story?] Descrição com file path`

---

## Notes

- Dashboard **nunca** chama Meta diretamente — apenas snapshots em PostgreSQL (research R7)
- Pipeline de sync segue fluxo oficial Meta: account → media → account insights → media insights → audience (research R5)
- Snapshots são **append-only** — nunca UPDATE; purge apenas via cron retenção 90 dias
- `requireAuth()` exige `profile.status === ACTIVE`
- Prisma bypassa RLS — **sempre** filtrar `where: { tenantId: ctx.tenantId }`
- Falha de sync em um tenant no cron **não** interrompe outros tenants
- `AiInsights` (`lib/connex-data.ts`) permanece mock — out of scope spec 004
- `NetworkTabs` outras redes permanecem mock até features futuras
- Commit após cada task ou grupo lógico
- Parar em qualquer checkpoint para validar story independentemente
- Próximo passo: **`/speckit.implement`** ou execução manual fase por fase
