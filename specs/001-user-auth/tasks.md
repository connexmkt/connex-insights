# Tasks: Autenticação de Usuários e Recuperação de Senha

**Input**: Design documents from `/specs/001-user-auth/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/auth-api.yaml ✅, quickstart.md ✅

**Tests**: Incluídos — spec exige cobertura unitária e de integração (RNF-005, SC-007) e plano define Vitest + Playwright.

**Organization**: Tarefas agrupadas por user story para implementação e teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode executar em paralelo (arquivos diferentes, sem dependências incompletas)
- **[Story]**: User story da spec (US1, US2, US3)
- Caminhos absolutos relativos à raiz do repositório

---

## Phase 1: Setup (Infraestrutura Compartilhada)

**Purpose**: Inicializar dependências, tooling de testes e configuração Supabase

- [x] T001 Corrigir `"name"` para `"connex-insights"` em `package.json`
- [x] T002 Instalar deps de produção: `@supabase/supabase-js`, `@supabase/ssr`, `@prisma/client`, `zod` via pnpm
- [x] T003 [P] Instalar devDeps: `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@playwright/test` via pnpm
- [x] T004 [P] Criar `vitest.config.ts` e adicionar scripts `test`, `test:watch`, `test:coverage` em `package.json`
- [x] T005 [P] Criar `playwright.config.ts` e adicionar script `test:e2e` em `package.json`
- [x] T006 [P] Criar `.env.example` documentando `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_APP_URL`
- [x] T007 Validar projeto Supabase via MCP (`list_projects`, `get_project_url`) e registrar project ref
- [ ] T008 Desabilitar email signup no Supabase Auth dashboard e configurar redirect URLs (`/auth/callback`, `/redefinir-senha`) — ver `specs/001-user-auth/SUPABASE_SETUP.md`

---

## Phase 2: Foundational (Pré-requisitos Bloqueantes)

**Purpose**: Schema, RLS, infra de auth e helpers compartilhados — **BLOQUEIA todas as user stories**

**⚠️ CRITICAL**: Nenhuma user story pode iniciar antes desta fase

- [x] T009 Definir models `Tenant`, `Profile` e enums `UserRole`, `UserStatus` em `prisma/schema.prisma` conforme `specs/001-user-auth/data-model.md`
- [x] T010 Gerar migration Prisma `init_auth_tenant` em `prisma/migrations/`
- [x] T011 Adicionar SQL das funções `current_tenant_id()` e `is_platform_admin()` na migration em `prisma/migrations/*/migration.sql`
- [x] T012 Adicionar SQL de RLS (ENABLE + FORCE + policies SELECT/INSERT/UPDATE/DELETE) para `tenants` e `profiles` na migration
- [x] T013 Aplicar migration com `pnpm prisma migrate dev` e gerar client em `lib/generated/prisma/` (aplicada via Supabase MCP)
- [x] T014 Validar schema via Supabase MCP: `list_tables`, `execute_sql` (RLS habilitado), `get_advisors` (security)
- [x] T015 Criar `prisma/seed.ts` com 2 tenants e 2 usuários Supabase Auth + profiles; seed configurado em `prisma.config.ts`
- [x] T016 [P] Criar browser client Supabase em `lib/supabase/client.ts`
- [x] T017 [P] Criar server client Supabase em `lib/supabase/server.ts`
- [x] T018 [P] Criar helper de refresh de sessão em `lib/supabase/middleware.ts`
- [x] T019 [P] Criar singleton Prisma em `lib/db/prisma.ts`
- [x] T020 [P] Criar tipos `AuthUser`, `TenantContext`, `SessionPayload` em `types/auth.ts`
- [x] T021 [P] Criar schemas Zod (`loginSchema`, `forgotPasswordSchema`, `resetPasswordSchema`) em `lib/auth/schemas.ts`
- [x] T022 Implementar `getSession()` e `getTenantContext()` em `lib/auth/session.ts` (consulta `profiles` + `tenants` via Prisma)
- [x] T023 Implementar HOF `requireAuth()` para Route Handlers em `lib/auth/require-auth.ts`
- [x] T024 Implementar `assertTenantOwnership()` e `ForbiddenError` em `lib/auth/tenant-scope.ts`
- [x] T025 Implementar `middleware.ts` na raiz: refresh de sessão, proteção `/dashboard/:path*`, redirect com `?redirectTo=`
- [x] T026 [P] Criar setup global de testes em `tests/setup.ts` e fixtures em `tests/helpers/seed-fixtures.ts`

**Checkpoint**: Foundation ready — implementação de user stories pode iniciar

---

## Phase 3: User Story 1 — Login (Priority: P1) 🎯 MVP

**Goal**: Usuário cadastrado autentica com e-mail/senha e acessa o dashboard com contexto de tenant

**Independent Test**: Acessar `/`, informar credenciais válidas do seed, verificar redirect para `/dashboard` e dados do tenant no header

### Tests for User Story 1

> **NOTE: Escrever estes testes PRIMEIRO — devem FALHAR antes da implementação**

- [x] T027 [P] [US1] Criar testes unitários dos schemas Zod em `tests/unit/auth/schemas.test.ts`
- [x] T028 [P] [US1] Criar testes de integração do login em `tests/integration/auth/login.test.ts` (credenciais válidas, inválidas, campos vazios, conta inativa)

### Implementation for User Story 1

- [x] T029 [US1] Implementar `POST` handler em `app/api/auth/login/route.ts` (`signInWithPassword`, validar `profile.status`, retornar erro genérico 401)
- [x] T030 [US1] Implementar `GET` handler em `app/api/auth/session/route.ts` (sessão + tenant context)
- [x] T031 [US1] Evoluir `components/auth/login-form.tsx`: remover mock/defaults demo, chamar API, estados loading/error, validação HTML5
- [x] T032 [US1] Adicionar guard server-side em `app/dashboard/layout.tsx` via `getTenantContext()` com redirect para `/`
- [x] T033 [US1] Atualizar `app/page.tsx` para redirect autenticados para `/dashboard`
- [x] T034 [US1] Integrar tenant context no header em `components/dashboard/dashboard-header.tsx` (substituir mock de `lib/connex-data.ts`)
- [x] T035 [US1] Criar teste e2e login em `tests/e2e/auth-login.spec.ts` (login válido → dashboard; credenciais inválidas → erro genérico)

**Checkpoint**: US1 funcional e testável independentemente — **MVP entregue**

---

## Phase 4: User Story 2 — Recuperação de Senha (Priority: P2)

**Goal**: Usuário solicita reset por e-mail, redefine senha via link seguro e retorna ao login

**Independent Test**: Clicar "Esqueci minha senha", informar e-mail, receber confirmação genérica, completar reset via link e autenticar com nova senha

### Tests for User Story 2

- [x] T036 [P] [US2] Criar testes de integração forgot-password em `tests/integration/auth/forgot-password.test.ts` (e-mail existente/inexistente → mesma resposta genérica)
- [x] T037 [P] [US2] Criar testes de integração reset-password em `tests/integration/auth/reset-password.test.ts` (link válido, expirado, senha inválida)

### Implementation for User Story 2

- [x] T038 [US2] Implementar `POST` handler em `app/api/auth/forgot-password/route.ts` (`resetPasswordForEmail`, sempre retornar mensagem genérica)
- [x] T039 [US2] Implementar `POST` handler em `app/api/auth/reset-password/route.ts` (`updateUser` com validação Zod de senha)
- [x] T040 [US2] Implementar callback PKCE em `app/auth/callback/route.ts` (trocar code por sessão, redirect para `/redefinir-senha` ou `next`)
- [x] T041 [P] [US2] Criar `components/auth/forgot-password-form.tsx` com validação, loading e feedback de sucesso
- [x] T042 [P] [US2] Criar página `app/esqueci-senha/page.tsx` com layout consistente ao login
- [x] T043 [P] [US2] Criar `components/auth/reset-password-form.tsx` com critérios mínimos de senha
- [x] T044 [US2] Criar página `app/redefinir-senha/page.tsx` (requer sessão recovery)
- [x] T045 [US2] Atualizar link "Esqueci minha senha" em `components/auth/login-form.tsx` para navegar a `/esqueci-senha`
- [x] T046 [US2] Criar teste e2e recovery em `tests/e2e/auth-recovery.spec.ts` (fluxo completo forgot → reset → login)

**Checkpoint**: US1 + US2 funcionam independentemente

---

## Phase 5: User Story 3 — Gestão de Sessão e Logout (Priority: P3)

**Goal**: Usuário permanece autenticado entre páginas, encerra sessão explicitamente e sessões expiradas redirecionam ao login

**Independent Test**: Autenticar, navegar no dashboard, logout via sidebar, confirmar redirect; acessar `/dashboard` sem sessão → redirect login

### Tests for User Story 3

- [x] T047 [P] [US3] Criar testes de integração logout em `tests/integration/auth/logout.test.ts`
- [x] T048 [P] [US3] Criar testes de integração session-guard em `tests/integration/auth/session-guard.test.ts` (rota protegida sem sessão, sessão expirada, login duplicado)

### Implementation for User Story 3

- [x] T049 [US3] Implementar `POST` handler em `app/api/auth/logout/route.ts` (`signOut`, limpar cookies)
- [x] T050 [US3] Conectar ação "Sair" em `components/dashboard/sidebar-nav.tsx` ao `POST /api/auth/logout` com redirect para `/`
- [x] T051 [US3] Refinar `middleware.ts` para redirect de autenticados em `/` para `/dashboard` e preservar `redirectTo` pós-login
- [x] T052 [US3] Criar teste e2e logout em `tests/e2e/auth-logout.spec.ts` (login → navegar → logout → bloqueio dashboard)

**Checkpoint**: US1 + US2 + US3 completas e independentemente testáveis

---

## Phase 6: Isolamento Multi-Tenant (Cross-Cutting)

**Purpose**: Validar defesa em profundidade (RLS + API + app layer) conforme plano multi-tenant

- [x] T053 [P] Criar testes unitários de `assertTenantOwnership()` em `tests/unit/auth/tenant-scope.test.ts`
- [x] T054 Criar testes de integração cross-tenant em `tests/integration/auth/tenant-isolation.test.ts` (User A acessa Tenant A ✅, Tenant B ❌; API rejeita resourceId de outro tenant)
- [x] T055 Validar RLS via Supabase client autenticado em `tests/integration/auth/rls-policies.test.ts` (SELECT/INSERT/UPDATE/DELETE cross-tenant bloqueados)
- [x] T056 Garantir que nenhum endpoint aceita `tenantId` do body — auditoria em `app/api/auth/*.ts` e documentar em comentário em `lib/auth/tenant-scope.ts`

**Checkpoint**: Isolamento multi-tenant verificado em 3 camadas

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Conformidade com constituição, segurança final e documentação

- [x] T057 [P] Criar teste de ausência de signup em `tests/integration/auth/no-signup.test.ts` (rotas `/cadastro`, `/signup`, `/register` retornam 404)
- [x] T058 Remover `typescript.ignoreBuildErrors: true` de `next.config.mjs`
- [x] T059 Executar `pnpm tsc --noEmit` e corrigir erros de tipo em arquivos auth
- [x] T060 Executar Supabase MCP `get_advisors` (security) e resolver alertas críticos — apenas WARN pré-existentes (rls_auto_enable, leaked password protection)
- [x] T061 [P] Remover texto demo e credenciais hardcoded de `components/auth/login-form.tsx`
- [x] T062 [P] Atualizar `specs/001-user-auth/quickstart.md` com comandos e fluxos validados
- [x] T063 Executar suite completa: `pnpm test` (25/25 passando); e2e disponível via `pnpm test:e2e`

---

## Dependencies & Execution Order

### Phase Dependencies

```text
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← BLOQUEIA TUDO
    ↓
┌───────────┬───────────┬───────────┐
Phase 3     Phase 4     Phase 5
(US1 MVP)   (US2)       (US3)
    └───────────┴───────────┘
                ↓
        Phase 6 (Multi-Tenant)
                ↓
        Phase 7 (Polish)
```

### User Story Dependencies

| Story | Depende de | Independente após |
|-------|-----------|-------------------|
| **US1 (P1)** | Phase 2 | Login + dashboard + tenant context |
| **US2 (P2)** | Phase 2 (+ US1 para link no login) | Forgot + reset + callback |
| **US3 (P3)** | Phase 2 (+ US1 para sessão existente) | Logout + guards + redirect rules |

### Within Each User Story

1. Testes escritos primeiro (devem falhar)
2. Route Handlers (API)
3. Componentes e páginas (frontend)
4. Testes e2e
5. Checkpoint antes de próxima story

### Parallel Opportunities

**Phase 1** — T003, T004, T005, T006 em paralelo após T002

**Phase 2** — T016–T021, T026 em paralelo após T013; T022–T025 sequenciais

**US1** — T027, T028 em paralelo; T029, T030 em paralelo após testes

**US2** — T036, T037 em paralelo; T041, T042, T043 em paralelo após T038–T040

**US3** — T047, T048 em paralelo

**Phase 6** — T053 paralelo com preparação de T054

**Phase 7** — T057, T061, T062 em paralelo

---

## Parallel Example: User Story 1

```bash
# Testes US1 em paralelo:
T027: tests/unit/auth/schemas.test.ts
T028: tests/integration/auth/login.test.ts

# API US1 em paralelo (após testes falharem):
T029: app/api/auth/login/route.ts
T030: app/api/auth/session/route.ts
```

---

## Parallel Example: User Story 2

```bash
# Frontend US2 em paralelo (após API pronta):
T041: components/auth/forgot-password-form.tsx
T042: app/esqueci-senha/page.tsx
T043: components/auth/reset-password-form.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (**crítico**)
3. Completar Phase 3: User Story 1
4. **PARAR e VALIDAR**: `pnpm test` + login manual + e2e US1
5. Demo/deploy preview se aprovado

### Incremental Delivery

| Incremento | Entrega | Valor |
|-----------|---------|-------|
| MVP | US1 | Login real + dashboard protegido + tenant context |
| +US2 | Recuperação | Self-service de senha, menos suporte |
| +US3 | Sessão | Logout seguro, guards completos |
| +Phase 6 | Multi-tenant | Isolamento verificado em produção |
| +Phase 7 | Polish | Conformidade constituição, CI verde |

### Parallel Team Strategy

Com 2+ desenvolvedores após Phase 2:

- **Dev A**: US1 (MVP) → US3 (logout/guards)
- **Dev B**: US2 (recovery) → Phase 6 (RLS tests)
- **Ambos**: Phase 7 (polish)

---

## Summary

| Métrica | Valor |
|---------|-------|
| **Total de tasks** | 63 |
| **Phase 1 (Setup)** | 8 |
| **Phase 2 (Foundational)** | 18 |
| **US1 — Login** | 9 |
| **US2 — Recuperação** | 11 |
| **US3 — Sessão** | 6 |
| **Multi-tenant** | 4 |
| **Polish** | 7 |
| **Tasks paralelizáveis [P]** | 24 |
| **MVP scope** | Phase 1 + 2 + 3 (T001–T035) |

### Independent Test Criteria

| Story | Como validar |
|-------|-------------|
| US1 | Login válido → `/dashboard` com tenant correto; inválido → erro genérico |
| US2 | Forgot → confirmação genérica; reset → nova senha funciona |
| US3 | Logout → `/` bloqueado; sessão expirada → redirect login |

### Format Validation

✅ Todas as 63 tasks seguem o formato `- [ ] TXXX [P?] [Story?] Descrição com file path`

---

## Notes

- Nunca aceitar `tenantId` do cliente — sempre derivar de `getTenantContext()`
- `SUPABASE_SERVICE_ROLE_KEY` apenas em server-side (seed, admin futuro)
- RLS policies versionadas na migration Prisma — nunca alterar DB manualmente
- Commit após cada task ou grupo lógico
- Parar em qualquer checkpoint para validar story independentemente
