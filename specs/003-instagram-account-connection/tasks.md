# Tasks: Integração Instagram Business Login e Sincronização Inicial

**Input**: Documentos de design em `/specs/003-instagram-account-connection/`  
**Prerequisites**: spec.md ✅, plan.md ✅, research.md ✅, data-model.md ✅, contracts/instagram-api.yaml ✅, quickstart.md ✅, features [001-user-auth](../001-user-auth/spec.md) e [002-first-time-account-activation](../002-first-time-account-activation/spec.md) implementadas ✅

**Tests**: Incluídos — spec exige cobertura unitária, de integração e de autorização (RNF-004, SC-010).

**Organization**: Tarefas agrupadas por user story para implementação e teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode executar em paralelo (arquivos diferentes, sem dependências incompletas)
- **[Story]**: User story da spec (US1–US5)
- Caminhos absolutos relativos à raiz do repositório

---

## Phase 1: Prerequisites (Verificação)

**Purpose**: Confirmar base estável e branch da feature antes de alterações

- [ ] T001 Criar branch `003-instagram-account-connection` a partir de `main` (ou branch base atual)
- [ ] T002 Validar que `pnpm test` e `pnpm tsc --noEmit` passam na base atual antes de iniciar
- [ ] T003 Registrar App Meta no quickstart: redirect URIs dev (`http://localhost:3000/api/auth/instagram/callback`) e prod (`https://insights.connexmkt.com.br/api/auth/instagram/callback`)

**Checkpoint**: Base estável — implementação pode iniciar

---

## Phase 2: Foundational (Pré-requisitos Bloqueantes)

**Purpose**: Env vars, schema Prisma, migration RLS, tipos e núcleo `lib/instagram/` — **BLOQUEIA todas as user stories**

**⚠️ CRITICAL**: Nenhuma user story pode iniciar antes desta fase

### Setup e configuração

- [ ] T004 Adicionar variáveis Meta em `.env.example`: `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `INSTAGRAM_REDIRECT_URI`, `INSTAGRAM_OAUTH_SCOPES`, `INSTAGRAM_TOKEN_ENCRYPTION_KEY`, `INSTAGRAM_OAUTH_STATE_SECRET`, `CRON_SECRET`
- [ ] T005 Implementar `lib/instagram/config.ts` com validação Zod de todas as env vars Meta (falha rápida no boot server-side)
- [ ] T006 [P] Documentar geração de `INSTAGRAM_TOKEN_ENCRYPTION_KEY` (32 bytes base64) em `specs/003-instagram-account-connection/quickstart.md`

### Database

- [ ] T007 Expandir `prisma/schema.prisma` com enums e models `InstagramIntegration`, `InstagramCredential`, `InstagramMedia`, `InstagramSyncJob` conforme `specs/003-instagram-account-connection/data-model.md`
- [ ] T008 Adicionar relação `Tenant.instagramIntegration` em `prisma/schema.prisma`
- [ ] T009 Gerar migration `instagram_integration_tables` em `prisma/migrations/`
- [ ] T010 Adicionar SQL RLS na migration: policies tenant-owned para `instagram_integrations`, `instagram_media`, `instagram_sync_jobs`; RLS em `instagram_credentials` **sem policies** para `authenticated`
- [ ] T011 Aplicar migration com `pnpm prisma migrate dev` e regenerar client em `lib/generated/prisma/`
- [ ] T012 Validar schema via Supabase MCP: `list_tables`, `get_advisors` (security)

### Tipos e núcleo lib/instagram

- [ ] T013 [P] Criar `types/instagram.ts` com `IntegrationPublic`, `OAuthStatePayload`, tipos de resposta Graph API e mapeamento de erros
- [ ] T014 [P] Implementar `lib/instagram/token-crypto.ts` (AES-256-GCM encrypt/decrypt) + testes em `tests/unit/instagram/token-crypto.test.ts`
- [ ] T015 [P] Implementar `lib/instagram/oauth-state.ts` (sign/verify state HMAC + nonce) + testes em `tests/unit/instagram/oauth-state.test.ts`
- [ ] T016 Implementar `lib/instagram/oauth.ts`: `buildAuthorizationUrl`, `exchangeCodeForShortLivedToken`, `exchangeLongLivedToken`, `refreshLongLivedToken` + testes em `tests/unit/instagram/oauth.test.ts` (mock fetch)
- [ ] T017 Implementar `lib/instagram/graph-client.ts`: `getInstagramProfile`, `getInstagramMedia` (`GET /v25.0/me`, `GET /v25.0/{id}/media`) + testes em `tests/unit/instagram/graph-client.test.ts`
- [ ] T018 [P] Criar schemas Zod em `lib/instagram/schemas.ts` (query params callback, responses públicos)
- [ ] T019 Implementar `lib/instagram/integration-service.ts`: `getIntegrationByTenant`, `getPublicIntegration`, `persistConnection`, `markRequiresReconnection`, `disconnect`
- [ ] T020 Implementar `lib/instagram/sync-service.ts`: `runInitialSync`, `runSync` (perfil + mídia, jobs, timeout 25s)

**Checkpoint**: Foundation ready — implementação de user stories pode iniciar

---

## Phase 3: User Story 1 — Conectar conta Instagram Professional (Priority: P1) 🎯 MVP

**Goal**: Usuário `ACTIVE` inicia OAuth Meta, completa autorização e integração fica `CONNECTED` no tenant correto

**Independent Test**: Login → Configurações → Conectar Instagram → OAuth Meta → callback → integração `CONNECTED` no tenant; segunda conexão bloqueada; usuário não autenticado recebe 401

### Tests for User Story 1

> **NOTE: Escrever estes testes PRIMEIRO — devem FALHAR antes da implementação**

- [ ] T021 [P] [US1] Criar testes de integração em `tests/integration/instagram/connect.test.ts` (autenticado → 302 Meta URL; não autenticado → 401; tenant já conectado → 409)
- [ ] T022 [P] [US1] Criar testes de integração em `tests/integration/instagram/callback.test.ts` (state inválido → redirect erro; `access_denied` → redirect denied; sucesso mock → integração CONNECTED no tenant correto)

### Implementation for User Story 1

- [ ] T023 [US1] Implementar `GET` handler em `app/api/instagram/connect/route.ts`: `requireAuth`, verificar ausência de integração `CONNECTED`, gerar state + cookie `instagram_oauth_state`, redirect para `instagram.com/oauth/authorize`
- [ ] T024 [US1] Implementar `GET` handler em `app/api/auth/instagram/callback/route.ts`: validar state/cookie/sessão, trocar code → short-lived → long-lived, validar `account_type`, persistir via `integration-service`, redirect `/dashboard/configuracoes?instagram=connected` (ou erro via query param)
- [ ] T025 [US1] Garantir em `integration-service.persistConnection` que `tenantId` e `connectedByUserId` vêm exclusivamente de `TenantContext` — nunca do query/body (RT-001, RT-002)
- [ ] T026 [US1] Implementar proteção anti-duplicata: `UNIQUE tenant_id` + check pré-redirect + `UNIQUE instagram_professional_id` com erro `ACCOUNT_LINKED_ELSEWHERE`

**Checkpoint**: US1 funcional — OAuth completo server-side; tokens nunca expostos ao cliente

---

## Phase 4: User Story 2 — Sincronização inicial (Priority: P1)

**Goal**: Após conexão, perfil e mídia são sincronizados automaticamente; status de sync visível via API

**Independent Test**: Pós-callback, `GET /api/instagram/integration` retorna `syncStatus` evoluindo para `COMPLETED`; perfil (username, followers, etc.) e mídias persistidos no banco

### Tests for User Story 2

- [ ] T027 [P] [US2] Criar testes unitários de `sync-service` em `tests/unit/instagram/sync-service.test.ts` (perfil Business/Creator aceito; tipo inválido rejeitado; falha API → `FAILED` com dados parciais)
- [ ] T028 [P] [US2] Criar testes de integração em `tests/integration/instagram/sync.test.ts` (initial sync após callback mock; retry via POST; sync em andamento → 409)

### Implementation for User Story 2

- [ ] T029 [US2] Integrar `runInitialSync` no callback OAuth em `app/api/auth/instagram/callback/route.ts` (await com timeout 25s; se timeout, job `RUNNING` + redirect com polling)
- [ ] T030 [US2] Implementar `GET` handler em `app/api/instagram/integration/route.ts`: retornar `IntegrationPublic` sem campos de token (FR-020, FR-021, RS-001)
- [ ] T031 [US2] Implementar `POST` handler em `app/api/instagram/sync/route.ts`: retry manual quando `syncStatus = FAILED` (202 + jobId)
- [ ] T032 [US2] Garantir que `instagram_media` é upserted por `(integration_id, external_media_id)` de forma idempotente

**Checkpoint**: US1 + US2 completas — conexão + sync inicial end-to-end via API

---

## Phase 5: User Story 3 — Visualizar dados sincronizados em Configurações (Priority: P1)

**Goal**: Usuário vê perfil conectado, status de conexão/sync e última sincronização na página Configurações

**Independent Test**: Com integração sincronizada, `/dashboard/configuracoes` exibe @username, foto, seguidores, badge de status e timestamp de última sync

### Tests for User Story 3

- [ ] T033 [P] [US3] Criar testes de componente em `components/instagram/instagram-connect-card.test.tsx` (estados desconectado, conectado, sincronizando, falha)
- [ ] T034 [P] [US3] Criar testes de integração em `tests/integration/instagram/integration.test.ts` (response não contém `access_token`, `accessTokenEnc` ou campos de credencial)

### Implementation for User Story 3

- [ ] T035 [P] [US3] Criar `components/instagram/instagram-profile-summary.tsx` (foto, @username, seguidores, tipo de conta)
- [ ] T036 [P] [US3] Criar `components/instagram/instagram-sync-status.tsx` (badge sync, última sync formatada pt-BR, `aria-live` para updates)
- [ ] T037 [P] [US3] Criar `components/instagram/instagram-connect-button.tsx` (redirect para `/api/instagram/connect`, estado loading)
- [ ] T038 [US3] Criar `components/instagram/instagram-connect-card.tsx` orquestrando subcomponentes + polling `GET /api/instagram/integration` a cada 2s quando `syncStatus = IN_PROGRESS`
- [ ] T039 [US3] Integrar `InstagramConnectCard` em `app/dashboard/configuracoes/page.tsx` substituindo mock de `lib/connex-data.ts` para rede Instagram
- [ ] T040 [US3] Tratar query params pós-callback (`instagram=connected|denied|error|unsupported_account|already_connected`) com feedback visual (toast/alert)

**Checkpoint**: US1 + US2 + US3 — fluxo completo visível na UI de Configurações

---

## Phase 6: User Story 4 — Reconectar quando autorização expira (Priority: P2)

**Goal**: Token expirado/revogado marca `REQUIRES_RECONNECTION`; usuário reconecta sem duplicar integração; sync retoma

**Independent Test**: Simular falha 401 na Graph API → status `REQUIRES_RECONNECTION`; reconectar via OAuth → mesmo `integration.id`, status `CONNECTED`, sync reiniciada

### Tests for User Story 4

- [ ] T041 [P] [US4] Criar testes em `tests/integration/instagram/token-refresh.test.ts` (cron refresh sucesso atualiza `token_expires_at`; falha → `REQUIRES_RECONNECTION`)
- [ ] T042 [P] [US4] Estender `tests/integration/instagram/callback.test.ts` com cenário de reconexão (integração existente `REQUIRES_RECONNECTION` → UPDATE sem novo row)

### Implementation for User Story 4

- [ ] T043 [US4] Implementar `POST` handler em `app/api/cron/instagram/refresh-tokens/route.ts` protegido por `CRON_SECRET`; refresh tokens com expiração ≤14 dias e idade ≥24h
- [ ] T044 [US4] Adicionar entrada cron em `vercel.json`: `0 3 * * *` → `/api/cron/instagram/refresh-tokens`
- [ ] T045 [US4] Em `sync-service` e `graph-client`, mapear erros 401/403 Meta para `markRequiresReconnection(integrationId)`
- [ ] T046 [US4] Criar banner de reconexão em `components/instagram/instagram-connect-card.tsx` quando `status = REQUIRES_RECONNECTION` (botão "Reconectar" → `/api/instagram/connect`)

**Checkpoint**: US4 funcional — recuperação graceful de tokens expirados

---

## Phase 7: User Story 5 — Desconectar conta Instagram (Priority: P2)

**Goal**: Usuário desconecta Instagram; sync futura cessa; histórico permanece; reconexão sem duplicata

**Independent Test**: POST disconnect → status `DISCONNECTED`; sync não executa; reconectar reutiliza mesmo registro

### Tests for User Story 5

- [ ] T047 [P] [US5] Criar testes de integração em `tests/integration/instagram/disconnect.test.ts` (disconnect sucesso; sync após disconnect → 422; reconexão sem duplicata)

### Implementation for User Story 5

- [ ] T048 [US5] Implementar `POST` handler em `app/api/instagram/disconnect/route.ts`: `requireAuth`, `disconnect()` → status `DISCONNECTED`, `disconnected_at`, credencial não utilizada
- [ ] T049 [US5] Adicionar botão "Desconectar" com diálogo de confirmação em `components/instagram/instagram-connect-card.tsx`
- [ ] T050 [US5] Após desconexão, exibir estado desconectado com opção "Conectar Instagram" e dados históricos de perfil/mídia ainda visíveis (read-only)

**Checkpoint**: Todas as user stories (US1–US5) funcionais

---

## Phase 8: Cross-Cutting (Segurança, Multi-Tenant, RLS)

**Purpose**: Isolamento cross-tenant, ausência de vazamento de tokens e conformidade com contrato OpenAPI

- [ ] T051 [P] Criar testes de isolamento em `tests/integration/instagram/tenant-isolation.test.ts` (User Tenant A não acessa integração Tenant B; `instagram_professional_id` duplicado em outro tenant → erro)
- [ ] T052 [P] Criar testes de vazamento de token em `tests/integration/instagram/token-leak.test.ts` (responses JSON, HTML de configurações e logs mockados não contêm access token)
- [ ] T053 [P] Criar testes RLS em `tests/integration/instagram/rls-isolation.test.ts` (2 sessões Supabase; SELECT cross-tenant em `instagram_integrations` retorna vazio)
- [ ] T054 Garantir que nenhum endpoint Instagram aceita `tenantId` ou `integrationId` do body sem `assertTenantOwnership` em `lib/auth/tenant-scope.ts`
- [ ] T055 [P] Validar contrato OpenAPI em `specs/003-instagram-account-connection/contracts/instagram-api.yaml` contra handlers implementados

**Checkpoint**: Segurança e multi-tenancy verificados por testes automatizados

---

## Phase 9: Polish & Deploy

**Purpose**: E2E, deploy, documentação e suite completa

- [ ] T056 [P] Criar teste e2e em `tests/e2e/instagram-connect.spec.ts` (estados UI Configurações com API mockada; fluxos connect/disconnect)
- [ ] T057 Configurar env vars de produção no Vercel (`INSTAGRAM_*`, `CRON_SECRET`) e validar redirect URI prod na Meta
- [ ] T058 [P] Atualizar escopos `instagram_business_*` em `app/privacy/page.tsx` (compliance — task P2)
- [ ] T059 Executar `pnpm tsc --noEmit` e corrigir erros de tipo introduzidos
- [ ] T060 Executar suite completa `pnpm test` e corrigir falhas
- [ ] T061 Executar `pnpm test:e2e` para `instagram-connect.spec.ts`
- [ ] T062 [P] Atualizar `specs/003-instagram-account-connection/checklists/requirements.md` com status pós-implementação

---

## Dependencies & Execution Order

### Phase Dependencies

```text
Phase 1 (Prerequisites)
    ↓
Phase 2 (Foundational) ← BLOQUEIA TUDO
    ↓
┌───────────┬───────────┐
Phase 3     Phase 4
(US1)       (US2)       ← US2 depende parcialmente de US1 (callback dispara sync)
    └────┬────┘
         ↓
    Phase 5 (US3)
         ↓
    ┌────┴────┐
Phase 6     Phase 7
(US4)       (US5)
    └────┬────┘
         ↓
    Phase 8 (Cross-Cutting)
         ↓
    Phase 9 (Polish)
```

### User Story Dependencies

| Story | Depende de | Independente após |
|-------|-----------|-------------------|
| **US1 (P1)** | Phase 2 | OAuth connect + callback + persistência |
| **US2 (P1)** | Phase 2 + US1 (callback) | Sync inicial + API de status |
| **US3 (P1)** | US1 + US2 (dados para exibir) | UI Configurações com perfil e sync status |
| **US4 (P2)** | US1 + US2 | Reconexão + cron refresh |
| **US5 (P2)** | US1 | Disconnect + reconexão sem duplicata |

### Within Each User Story

1. Testes escritos primeiro (devem falhar)
2. `lib/instagram/` (serviços)
3. Route Handlers (API)
4. Componentes (frontend)
5. Checkpoint antes de próxima story

### Parallel Opportunities

**Phase 2** — T014, T015, T018 em paralelo após T005; T013 em paralelo com T014–T015; T007–T012 sequenciais

**US1** — T021, T022 em paralelo; T023–T026 sequenciais após testes

**US2** — T027, T028 em paralelo

**US3** — T035, T036, T037 em paralelo; T033, T034 em paralelo antes da implementação

**US4** — T041, T042 em paralelo

**US5** — T047 independente após US1

**Phase 8** — T051, T052, T053, T055 em paralelo

**Phase 9** — T056, T058, T062 em paralelo

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Após T005 (config.ts):
T014: tests/unit/instagram/token-crypto.test.ts + lib/instagram/token-crypto.ts
T015: tests/unit/instagram/oauth-state.test.ts + lib/instagram/oauth-state.ts
T013: types/instagram.ts
T018: lib/instagram/schemas.ts

# Sequencial após T011:
T016 → T017 → T019 → T020
```

---

## Parallel Example: User Story 3

```bash
# Testes US3 em paralelo (antes da UI):
T033: components/instagram/instagram-connect-card.test.tsx
T034: tests/integration/instagram/integration.test.ts

# Componentes US3 em paralelo:
T035: components/instagram/instagram-profile-summary.tsx
T036: components/instagram/instagram-sync-status.tsx
T037: components/instagram/instagram-connect-button.tsx

# Integração sequencial:
T038 → T039 → T040
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 + 3)

1. Completar Phase 1: Prerequisites
2. Completar Phase 2: Foundational (**crítico**)
3. Completar Phase 3: User Story 1 (OAuth connect)
4. Completar Phase 4: User Story 2 (sync inicial)
5. Completar Phase 5: User Story 3 (UI Configurações)
6. **PARAR e VALIDAR**: fluxo manual com conta Instagram Business real + `pnpm test`
7. Demo/deploy preview se aprovado

### Incremental Delivery

| Incremento | Entrega | Valor |
|-----------|---------|-------|
| MVP | US1 + US2 + US3 | Conectar, sincronizar e visualizar perfil na Configurações |
| +US4 | Reconexão + cron | Tokens renovados; recuperação de falhas |
| +US5 | Desconexão | Controle do usuário sobre integração |
| +Phase 8 | Segurança | Isolamento tenant e anti-leak verificados |
| +Phase 9 | Polish | E2E, deploy prod, compliance |

### Parallel Team Strategy

Com 2+ desenvolvedores após Phase 2:

- **Dev A**: US1 (OAuth API) → US4 (cron + reconexão)
- **Dev B**: US2 (sync-service) → US3 (UI Configurações) → US5 (disconnect)
- **Ambos**: Phase 8 (testes segurança) → Phase 9 (polish)

---

## Summary

| Métrica | Valor |
|---------|-------|
| **Total de tasks** | 62 |
| **Phase 1 (Prerequisites)** | 3 |
| **Phase 2 (Foundational)** | 17 |
| **US1 — Conectar OAuth** | 6 |
| **US2 — Sync inicial** | 6 |
| **US3 — UI Configurações** | 8 |
| **US4 — Reconexão** | 6 |
| **US5 — Desconexão** | 4 |
| **Cross-Cutting** | 5 |
| **Polish** | 7 |
| **Tasks paralelizáveis [P]** | 28 |
| **MVP scope** | Phase 1 + 2 + 3 + 4 + 5 (T001–T040) |

### Independent Test Criteria

| Story | Como validar |
|-------|-------------|
| US1 | OAuth Meta completo; integração `CONNECTED` no tenant; duplicata bloqueada; 401 sem sessão |
| US2 | Perfil + mídia no DB; `syncStatus=COMPLETED`; retry após falha |
| US3 | Configurações exibe @username, foto, seguidores, status sync e última sync |
| US4 | Token inválido → `REQUIRES_RECONNECTION`; reconectar atualiza mesmo registro |
| US5 | Disconnect → `DISCONNECTED`; histórico visível; reconexão sem duplicata |

### Mapeamento Spec → Tasks

| Requisito | Tasks |
|-----------|-------|
| FR-001–FR-016 (conexão OAuth) | T021–T026, T039–T040 |
| FR-017–FR-022 (sincronização) | T027–T032, T036, T038 |
| FR-023–FR-026 (dashboard/status) | T030, T035–T039 |
| FR-027–FR-030 (reconexão) | T041–T046 |
| FR-031–FR-034 (desconexão) | T047–T050 |
| RS-001–RS-006 (segurança) | T014–T015, T025, T052–T054 |
| RT-001–RT-005 (multi-tenant) | T025–T026, T051, T053–T054 |
| SC-001–SC-010 (critérios de sucesso) | T021–T061 |

### Mapeamento Plan → Tasks

| Plan Task | Tasks |
|-----------|-------|
| T001–T002 (setup env) | T004–T006 |
| T003–T006 (database) | T007–T012 |
| T007–T013 (lib/instagram) | T013–T020 |
| T014–T020 (API) | T023–T024, T030–T031, T048, T043 |
| T021–T025 (frontend) | T035–T040, T046, T049–T050 |
| T026–T031 (testes/deploy) | T051–T061 |

### Format Validation

✅ Todas as 62 tasks seguem o formato `- [ ] TXXX [P?] [Story?] Descrição com file path`

---

## Notes

- Tokens OAuth **nunca** em responses, HTML, logs ou Client Components — apenas `lib/instagram/` server-side
- `requireAuth()` exige `profile.status === ACTIVE`; usuários `INACTIVE`/`SUSPENDED` não acessam integração Instagram
- Callback OAuth valida `state` HMAC + cookie nonce + correspondência userId/tenantId da sessão (RS-004)
- Prisma bypassa RLS — **sempre** filtrar `where: { tenantId: ctx.tenantId }` (research R9)
- Sync inicial no callback tem timeout 25s; UI faz polling se job permanece `IN_PROGRESS`
- Reconexão faz UPDATE na integração existente — nunca INSERT duplicado para o mesmo tenant
- Commit após cada task ou grupo lógico
- Parar em qualquer checkpoint para validar story independentemente
- Próximo passo: **`/speckit.implement`** ou execução manual fase por fase
