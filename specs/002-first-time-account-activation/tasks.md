# Tasks: Ativação de Conta no Primeiro Acesso

**Input**: Documentos de design em `/specs/002-first-time-account-activation/`  
**Prerequisites**: spec.md ✅, checklists/requirements.md ✅, feature [001-user-auth](../001-user-auth/spec.md) implementada (Phase 1–7) ✅

**Tests**: Incluídos — spec exige cobertura unitária, de integração e de autenticação (RNF-004, SC-007).

**Organization**: Tarefas agrupadas por user story para implementação e teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode executar em paralelo (arquivos diferentes, sem dependências incompletas)
- **[Story]**: User story da spec (US1, US2, US3)
- Caminhos absolutos relativos à raiz do repositório

---

## Phase 1: Prerequisites (Verificação)

**Purpose**: Confirmar que a fundação da 001 está pronta antes de alterar comportamento de auth

- [x] T001 Criar branch `002-first-time-account-activation` a partir de `main` (ou branch base atual)
- [x] T002 Validar que `pnpm test` e `pnpm tsc --noEmit` passam na base atual antes de iniciar alterações de auth

**Checkpoint**: Base estável — implementação pode iniciar

---

## Phase 2: Foundational (Pré-requisitos Bloqueantes)

**Purpose**: Schema, tipos, schemas Zod, helpers de sessão de pré-ativação e seed — **BLOQUEIA todas as user stories**

**⚠️ CRITICAL**: Nenhuma user story pode iniciar antes desta fase

- [x] T003 Alterar default de `Profile.status` para `INACTIVE` em `prisma/schema.prisma` (manter enum `UserStatus` existente)
- [x] T004 Gerar migration `change_profile_default_inactive` em `prisma/migrations/` com `ALTER TABLE profiles ALTER COLUMN status SET DEFAULT 'INACTIVE'`
- [x] T005 Aplicar migration com `pnpm prisma migrate dev` e regenerar client em `lib/generated/prisma/`
- [x] T006 [P] Adicionar interface `PreActivationContext` em `types/auth.ts` (userId, email, status `INACTIVE`)
- [x] T007 [P] Extrair `passwordPolicySchema` compartilhado e criar `activateAccountSchema` (senha temporária, nova senha, confirmação, `.refine` para match e diferença da temporária) em `lib/auth/schemas.ts`
- [x] T008 [P] Adicionar mensagens de ativação em `lib/auth/messages.ts` (sucesso, senha temporária incorreta, conta já ativa, nova senha igual à temporária)
- [x] T009 Implementar `getProfileByUserId()` e `getPreActivationContext()` em `lib/auth/session.ts` (consulta `profiles` sem exigir `ACTIVE`)
- [x] T010 Implementar helper puro `resolveActivationRedirect()` em `lib/auth/activation-guard.ts` (mapeia status + pathname → destino de redirect)
- [x] T011 [P] Adicionar fixture `SEED_INACTIVE_USER` em `tests/helpers/seed-fixtures.ts` (e-mail, senha temporária, tenant dedicado)
- [x] T012 Atualizar `prisma/seed.ts`: manter usuários A/B como `ACTIVE` (regressão); criar usuário `SEED_INACTIVE_USER` com `status: INACTIVE` e senha temporária

**Checkpoint**: Foundation ready — implementação de user stories pode iniciar

---

## Phase 3: User Story 1 — Login inicial com credenciais temporárias (Priority: P1) 🎯 MVP

**Goal**: Usuário `INACTIVE` autentica com senha temporária e é redirecionado à ativação — sem acesso ao dashboard

**Independent Test**: Login com `SEED_INACTIVE_USER` → redirect `/ativar-conta`; tentativa de `/dashboard` bloqueada; login com usuário `ACTIVE` inalterado

### Tests for User Story 1

> **NOTE: Escrever estes testes PRIMEIRO — devem FALHAR antes da implementação**

- [x] T013 [P] [US1] Criar testes unitários de `resolveActivationRedirect()` em `tests/unit/auth/activation-guard.test.ts`
- [x] T014 [P] [US1] Criar testes de integração de login inativo em `tests/integration/auth/login-inactive.test.ts` (credenciais válidas + `INACTIVE` → `redirectTo: /ativar-conta`; `SUSPENDED` → 403; `ACTIVE` → `/dashboard`)

### Implementation for User Story 1

- [x] T015 [US1] Refatorar `app/api/auth/login/route.ts`: `INACTIVE` → 200 com `redirectTo: /ativar-conta` e `requiresActivation: true` (manter sessão Supabase); `SUSPENDED` → 403 + `signOut`; `ACTIVE` → comportamento atual
- [x] T016 [US1] Atualizar `components/auth/login-form.tsx` para usar `redirectTo` retornado pela API (incluindo `/ativar-conta` para contas inativas)
- [x] T017 [US1] Garantir que `app/api/auth/session/route.ts` retorna 401 quando usuário autenticado tem perfil `INACTIVE` (sem expor `TenantContext` completo)
- [x] T018 [US1] Atualizar `tests/integration/auth/login.test.ts` com contrato de resposta para conta `INACTIVE` (substituir expectativa de 403 `ACCOUNT_INACTIVE`)

**Checkpoint**: US1 funcional — login inativo redireciona à ativação; login ativo inalterado

---

## Phase 4: User Story 2 — Conclusão da ativação de conta (Priority: P1)

**Goal**: Usuário com sessão de pré-ativação valida senha temporária, define nova senha, conta torna-se `ACTIVE` e acessa dashboard

**Independent Test**: Pós-login inativo, preencher formulário em `/ativar-conta` → status `ACTIVE`, senha temporária inválida, redirect `/dashboard`

### Tests for User Story 2

- [x] T019 [P] [US2] Estender testes unitários de schemas em `tests/unit/auth/schemas.test.ts` para `activateAccountSchema` (campos vazios, senhas divergentes, política, nova = temporária)
- [x] T020 [P] [US2] Criar testes de integração em `tests/integration/auth/activate-account.test.ts` (ativação bem-sucedida, senha temporária incorreta, conta já ativa, validação server-side)

### Implementation for User Story 2

- [x] T021 [US2] Implementar HOF `requirePreActivation()` em `lib/auth/require-pre-activation.ts` (exige sessão Supabase + perfil `INACTIVE`)
- [x] T022 [US2] Implementar `POST` handler em `app/api/auth/activate/route.ts`: validar schema, verificar senha temporária via reautenticação, atualizar senha no Supabase, transação Prisma `status → ACTIVE`, retornar `redirectTo: /dashboard`
- [x] T023 [P] [US2] Criar `components/auth/activate-account-form.tsx` (campos temporária/nova/confirmação, loading, erros, critérios de senha reutilizando padrão de `reset-password-form.tsx`)
- [x] T024 [US2] Criar página `app/ativar-conta/page.tsx` com guard server-side via `getPreActivationContext()` e layout consistente ao login
- [x] T025 [US2] Criar teste e2e em `tests/e2e/auth-activation.spec.ts` (login inativo → ativação → dashboard; senha temporária rejeitada após ativação)

**Checkpoint**: US1 + US2 completas — fluxo feliz de ativação end-to-end funcional

---

## Phase 5: User Story 3 — Proteção de rotas e prevenção de bypass (Priority: P2)

**Goal**: Usuários `INACTIVE` nunca acessam dashboard; rotas de ativação protegidas; contas `ACTIVE` não repetem ativação

**Independent Test**: Sessão de pré-ativação + URL direta `/dashboard` → `/ativar-conta`; sem sessão + `/ativar-conta` → `/`; `ACTIVE` + `/ativar-conta` → `/dashboard`

### Tests for User Story 3

- [x] T026 [P] [US3] Criar testes de integração em `tests/integration/auth/activation-route-guard.test.ts` (bypass dashboard, acesso ativação sem auth, redirect login duplicado)
- [x] T027 [P] [US3] Estender `tests/integration/auth/session-guard.test.ts` com regras de redirect para contas `INACTIVE` e rota `/ativar-conta`

### Implementation for User Story 3

- [x] T028 [US3] Estender `lib/supabase/middleware.ts` para expor `userId` e criar `lib/auth/middleware-profile.ts` com `getProfileStatusForUser(userId)` (consulta leve ao Prisma)
- [x] T029 [US3] Atualizar `middleware.ts`: `INACTIVE` em `/dashboard/*` → `/ativar-conta`; `INACTIVE` em `/` → `/ativar-conta`; sem auth em `/ativar-conta` → `/`; `ACTIVE` em `/ativar-conta` → `/dashboard`; preservar `redirectTo` pós-ativação
- [x] T030 [US3] Adicionar `/ativar-conta` ao `matcher` em `middleware.ts`
- [x] T031 [US3] Validar que `app/dashboard/layout.tsx` permanece bloqueado via `getTenantContext()` retornando `null` para perfis `INACTIVE`
- [x] T032 [US3] Criar teste e2e em `tests/e2e/auth-activation-bypass.spec.ts` (tentativas de bypass por URL direta e API `/api/auth/session`)

**Checkpoint**: US1 + US2 + US3 completas — ativação obrigatória não contornável

---

## Phase 6: Cross-Cutting (Contratos, Regressão 001, Multi-Tenant)

**Purpose**: Atualizar artefatos da 001, garantir isolamento e regressão dos fluxos existentes

- [x] T033 [P] Atualizar contrato OpenAPI em `specs/001-user-auth/contracts/auth-api.yaml`: resposta login `INACTIVE` (200 + `requiresActivation`), novo endpoint `POST /auth/activate`
- [x] T034 [P] Atualizar nota de comportamento `INACTIVE` em `specs/001-user-auth/data-model.md` (autenticação permitida apenas para ativação)
- [x] T035 [P] Garantir em `tests/integration/auth/activate-account.test.ts` que ativação usa apenas `userId` da sessão — nunca aceita `userId`/`tenantId` do body (RT-003, RT-004)
- [x] T036 Executar regressão: `tests/e2e/auth-login.spec.ts`, `tests/e2e/auth-logout.spec.ts` e `tests/e2e/auth-recovery.spec.ts` ainda passam com usuários `ACTIVE` do seed

**Checkpoint**: Contratos e regressão da 001 alinhados ao novo comportamento

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentação, conformidade e suite completa

- [x] T037 [P] Criar `specs/002-first-time-account-activation/quickstart.md` com fluxo manual (seed inativo → login → ativar → dashboard)
- [x] T038 [P] Documentar impacto na 001 em `specs/002-first-time-account-activation/spec.md` (seção Impacto) — marcar itens como endereçados pelas tasks T015–T036
- [x] T039 Executar `pnpm tsc --noEmit` e corrigir erros de tipo introduzidos
- [x] T040 Executar suite completa `pnpm test` e corrigir falhas
- [x] T041 Executar `pnpm test:e2e` para `auth-activation.spec.ts` e `auth-activation-bypass.spec.ts`

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
(US1)       (US2)
    └────┬────┘
         ↓
    Phase 5 (US3)
         ↓
    Phase 6 (Cross-Cutting)
         ↓
    Phase 7 (Polish)
```

### User Story Dependencies

| Story | Depende de | Independente após |
|-------|-----------|-------------------|
| **US1 (P1)** | Phase 2 | Login inativo → `/ativar-conta`; login ativo inalterado |
| **US2 (P1)** | Phase 2 + US1 (sessão de pré-ativação via login) | Ativação completa → dashboard |
| **US3 (P2)** | Phase 2 + US1 + US2 | Guards de rota e bypass bloqueados |

### Within Each User Story

1. Testes escritos primeiro (devem falhar)
2. Helpers / Route Handlers (API)
3. Componentes e páginas (frontend)
4. Testes e2e
5. Checkpoint antes de próxima story

### Parallel Opportunities

**Phase 2** — T006, T007, T008, T011 em paralelo após T005; T009–T010 sequenciais

**US1** — T013, T014 em paralelo; T015–T017 sequenciais após testes

**US2** — T019, T020 em paralelo; T023 em paralelo com T022 após T021

**US3** — T026, T027 em paralelo

**Phase 6** — T033, T034, T035 em paralelo

**Phase 7** — T037, T038 em paralelo

---

## Parallel Example: User Story 2

```bash
# Testes US2 em paralelo:
T019: tests/unit/auth/schemas.test.ts
T020: tests/integration/auth/activate-account.test.ts

# Frontend + API US2 (após T021):
T022: app/api/auth/activate/route.ts
T023: components/auth/activate-account-form.tsx
T024: app/ativar-conta/page.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2)

1. Completar Phase 1: Prerequisites
2. Completar Phase 2: Foundational (**crítico**)
3. Completar Phase 3: User Story 1 (login inativo)
4. Completar Phase 4: User Story 2 (ativação)
5. **PARAR e VALIDAR**: fluxo manual + `pnpm test` + e2e `auth-activation.spec.ts`
6. Demo/deploy preview se aprovado

### Incremental Delivery

| Incremento | Entrega | Valor |
|-----------|---------|-------|
| MVP | US1 + US2 | Primeiro acesso obrigatório com troca de senha |
| +US3 | Proteção de rotas | Bypass impossível; guards completos |
| +Phase 6 | Contratos + regressão | 001 alinhada; multi-tenant verificado |
| +Phase 7 | Polish | Documentação e CI verde |

### Parallel Team Strategy

Com 2+ desenvolvedores após Phase 2:

- **Dev A**: US1 (login) → US3 (middleware/guards)
- **Dev B**: US2 (ativação API + UI) → Phase 6 (contratos + testes multi-tenant)
- **Ambos**: Phase 7 (polish)

---

## Summary

| Métrica | Valor |
|---------|-------|
| **Total de tasks** | 41 |
| **Phase 1 (Prerequisites)** | 2 |
| **Phase 2 (Foundational)** | 10 |
| **US1 — Login inativo** | 6 |
| **US2 — Ativação** | 7 |
| **US3 — Proteção de rotas** | 7 |
| **Cross-Cutting** | 4 |
| **Polish** | 5 |
| **Tasks paralelizáveis [P]** | 18 |
| **MVP scope** | Phase 1 + 2 + 3 + 4 (T001–T025) |

### Independent Test Criteria

| Story | Como validar |
|-------|-------------|
| US1 | Login `INACTIVE` → `/ativar-conta`; login `ACTIVE` → `/dashboard`; inválido → erro genérico |
| US2 | Ativação válida → `ACTIVE` + dashboard; temporária errada → permanece `INACTIVE` |
| US3 | URL `/dashboard` com pré-ativação → `/ativar-conta`; `/ativar-conta` sem auth → `/` |

### Mapeamento Spec → Tasks

| Requisito | Tasks |
|-----------|-------|
| FR-001–FR-005 (login) | T013–T018 |
| FR-006–FR-017 (ativação) | T019–T025 |
| FR-018–FR-022 (status/acesso) | T003–T005, T029–T031 |
| FR-023–FR-025 (sessão) | T009, T017, T021–T022 |
| RS-001–RS-005 (segurança) | T007, T020, T022, T035 |
| RT-001–RT-004 (multi-tenant) | T009, T022, T035 |
| SC-001–SC-007 (critérios de sucesso) | T012, T025, T032, T040–T041 |

### Format Validation

✅ Todas as 41 tasks seguem o formato `- [x] TXXX [P?] [Story?] Descrição com file path`

---

## Notes

- Nunca aceitar `tenantId` ou `userId` do cliente no endpoint de ativação — sempre derivar da sessão Supabase
- `getTenantContext()` e `requireAuth()` continuam exigindo `profile.status === ACTIVE`; pré-ativação usa `getPreActivationContext()` separado
- Usuários `SUSPENDED` permanecem bloqueados (403 + `signOut`) — fora do fluxo de ativação
- Senha temporária é invalidada automaticamente ao chamar `updateUser({ password })` no Supabase (FR-015, RS-005)
- Commit após cada task ou grupo lógico
- Parar em qualquer checkpoint para validar story independentemente
- Próximo passo após tasks: **`/speckit.implement`** ou execução manual fase por fase
