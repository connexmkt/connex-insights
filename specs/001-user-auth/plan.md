# Implementation Plan: Autenticação de Usuários e Recuperação de Senha

**Branch**: `001-user-auth` | **Date**: 2026-06-27 | **Spec**: [spec.md](./spec.md)  
**Input**: Especificação aprovada + requisitos multi-tenant + constituição de engenharia

## Summary

Implementar autenticação segura para usuários criados manualmente pela equipe Connex, usando **Supabase Auth** para login/sessões/recuperação de senha, **Prisma** para schema e migrations, e **RLS** para isolamento multi-tenant em profundidade. A aplicação evolui do mock atual (`setTimeout` → `/dashboard`) para sessões reais com proteção de rotas, contexto de tenant derivado exclusivamente da sessão, e defesa em três camadas (RLS → API → lógica de negócio). Auto-cadastro permanece proibido.

---

## Technical Context

| Item | Valor |
|------|-------|
| **Language/Version** | TypeScript 5.7.x, `strict: true` |
| **Framework** | Next.js 16.x (App Router) |
| **Primary Dependencies** | `@supabase/supabase-js`, `@supabase/ssr`, `@prisma/client`, `zod` |
| **Storage** | Supabase PostgreSQL |
| **Auth** | Supabase Auth (email/password only) |
| **ORM / Migrations** | Prisma 7.x + SQL customizado para RLS |
| **Testing** | Vitest + Testing Library + Playwright |
| **Target Platform** | Vercel (web) |
| **Performance Goals** | Login completo em ≤10s (SC-001); redirect pós-auth em ≤500ms |
| **Constraints** | Sem Sign Up; tenant do session only; RLS obrigatório; Prisma-only DDL |
| **Scale/Scope** | SaaS multi-tenant; MVP com 2 tabelas (`tenants`, `profiles`) + auth flows |

---

## Constitution Check

_GATE: Avaliado antes e após design. Nenhuma violação não justificada._

| Princípio | Status | Como o plano atende |
|-----------|--------|---------------------|
| **1 — Qualidade de Código** | ✅ | Módulos por responsabilidade (`lib/auth/`, `lib/supabase/`, `components/auth/`); CQS nos handlers |
| **2 — Segurança de Tipos** | ✅ | Interfaces dedicadas em `types/auth.ts`; Zod para validação runtime; zero `any` |
| **3 — Padrões de Testes** | ✅ | Vitest (unit/integration) + Playwright (e2e login/recovery/isolation) |
| **4 — Consistência UX** | ✅ | Reutiliza `components/ui/` e `components/auth/login-form.tsx`; pt-BR; WCAG AA |
| **5 — Performance** | ✅ | Middleware refresh único; sem re-fetch desnecessário de sessão |
| **6 — Manutenibilidade** | ✅ | Arquitetura por domínio; tenant context centralizado; migrations versionadas |

**Itens pendentes de conformidade abordados por esta feature**:

| Item | Ação nesta feature |
|------|-------------------|
| Autenticação mock | Substituída por Supabase Auth real |
| Ausência de testes | Fundação Vitest + Playwright criada |
| `ignoreBuildErrors: true` | Remover após implementação tipada (task explícita) |
| `name: "my-project"` | Corrigir para `connex-insights` (task de setup) |

**Exceções documentadas**: Nenhuma.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-user-auth/
├── plan.md              ← este arquivo
├── research.md          ← decisões técnicas
├── data-model.md        ← schema + RLS
├── quickstart.md        ← setup local
├── contracts/
│   └── auth-api.yaml    ← contratos OpenAPI
├── checklists/
│   └── requirements.md
└── tasks.md             ← gerado por /speckit.tasks
```

### Source Code (repository root)

```text
app/
├── page.tsx                          # Login (evoluir existente)
├── esqueci-senha/page.tsx            # Forgot password
├── redefinir-senha/page.tsx          # Reset password
├── auth/callback/route.ts            # Supabase auth callback
├── dashboard/
│   └── layout.tsx                    # Adicionar guard server-side
└── api/
    └── auth/
        ├── login/route.ts
        ├── logout/route.ts
        ├── session/route.ts
        ├── forgot-password/route.ts
        └── reset-password/route.ts

components/
├── auth/
│   ├── login-form.tsx                # Evoluir (remover mock)
│   ├── forgot-password-form.tsx      # Novo
│   └── reset-password-form.tsx       # Novo
└── ui/                               # Existente (reutilizar)

lib/
├── supabase/
│   ├── client.ts                     # Browser client
│   ├── server.ts                     # Server client (cookies)
│   └── middleware.ts                 # Session refresh helper
├── auth/
│   ├── session.ts                    # getSession, getTenantContext
│   ├── require-auth.ts               # HOF para Route Handlers
│   ├── tenant-scope.ts               # assertTenantOwnership
│   └── schemas.ts                    # Zod schemas
├── db/
│   └── prisma.ts                     # Prisma singleton
└── connex-data.ts                    # Migrar para queries tenant-scoped (fase futura)

types/
└── auth.ts                           # AuthUser, TenantContext, SessionPayload

prisma/
├── schema.prisma                     # tenants, profiles
├── migrations/
│   └── YYYYMMDD_init_auth/
│       ├── migration.sql             # DDL Prisma
│       └── rls_policies.sql          # RLS (via prisma migrate ou post-migration)
└── seed.ts                           # Dev seed multi-tenant

middleware.ts                         # Route protection + session refresh

tests/
├── unit/
│   ├── auth/schemas.test.ts
│   └── auth/tenant-scope.test.ts
├── integration/
│   ├── auth/login.test.ts
│   ├── auth/forgot-password.test.ts
│   └── auth/tenant-isolation.test.ts
└── e2e/
    └── auth.spec.ts                  # Playwright
```

**Structure Decision**: Monolito Next.js App Router (padrão existente). Auth como domínio transversal em `lib/auth/` + `components/auth/`. Prisma para schema; Supabase client para operações auth-aware com RLS.

---

## 1. Database Migration Strategy

### Abordagem

1. **Prisma schema** define `tenants` e `profiles` (ver [data-model.md](./data-model.md)).
2. **`prisma migrate dev --name init_auth_tenant`** gera DDL.
3. **SQL customizado** na mesma migration (ou migration sequencial) adiciona:
   - Funções `current_tenant_id()` e `is_platform_admin()`
   - `ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY`
   - Policies SELECT/INSERT/UPDATE/DELETE
4. **`prisma migrate deploy`** em staging/produção.
5. **Validação Supabase MCP**: `list_tables`, `execute_sql` (verificar RLS), `get_advisors`.

### Regras

- **Nunca** alterar banco manualmente fora de migrations Prisma.
- Toda nova tabela tenant-owned segue template RLS documentado em `data-model.md`.
- Migrations são idempotentes e revisadas em PR.

### Sequência de migrations

| # | Nome | Conteúdo |
|---|------|----------|
| M1 | `init_auth_tenant` | CREATE `tenants`, `profiles`, enums, indexes, FKs |
| M2 | `auth_rls_policies` | Functions SQL + RLS policies (pode ser parte de M1) |

### Seed

- `prisma/seed.ts`: 2 tenants, 2 usuários (via Supabase Admin API), profiles vinculados.
- Usado por testes de isolamento e desenvolvimento local.

---

## 2. Multi-Tenant Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  Login / Forgot / Reset forms                               │
│  Tenant NUNCA selecionável — derivado da sessão             │
└──────────────────────────┬──────────────────────────────────┘
                           │ cookies (HTTP-only)
┌──────────────────────────▼──────────────────────────────────┐
│                   middleware.ts                              │
│  Refresh session │ Protect /dashboard/* │ Redirect rules    │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              Route Handlers (app/api/auth/*)                 │
│  requireAuth() → resolve TenantContext → business logic     │
└──────────┬─────────────────────────────┬────────────────────┘
           │                             │
┌──────────▼──────────┐       ┌──────────▼────────────────────┐
│   Supabase Auth     │       │   Prisma (server-side)         │
│   signIn/reset/     │       │   WHERE tenantId = ctx.tenantId│
│   session cookies   │       │   (app-layer filter)           │
└──────────┬──────────┘       └──────────┬────────────────────┘
           │                             │
┌──────────▼─────────────────────────────▼────────────────────┐
│                  Supabase PostgreSQL                         │
│  auth.users │ public.tenants │ public.profiles             │
│  RLS: tenant_id = current_tenant_id()                       │
└─────────────────────────────────────────────────────────────┘
```

### Tenant Context Lifecycle

1. Login bem-sucedido → Supabase cria sessão (JWT + cookies).
2. `getTenantContext()` consulta `profiles` WHERE `id = auth.uid()`.
3. Retorna `{ userId, tenantId, role, displayName, tenant }`.
4. Disponível em Route Handlers via `requireAuth()` e em Server Components via `getSession()`.
5. **Nunca** aceitar `tenantId` do body/query/header do cliente.

### Isolamento Cross-Tenant

| Camada | Mecanismo |
|--------|-----------|
| **Database (RLS)** | `tenant_id = current_tenant_id()` em todas policies |
| **API** | `requireAuth()` + `assertTenantOwnership(resourceTenantId)` |
| **Business Logic** | Prisma queries sempre incluem `where: { tenantId: ctx.tenantId }` |
| **Frontend** | Sem seletor de tenant; dados renderizados do `TenantContext` da sessão |

---

## 3. Authentication Architecture

### Componentes

| Componente | Responsabilidade |
|------------|------------------|
| `lib/supabase/client.ts` | `createBrowserClient` para forms client-side |
| `lib/supabase/server.ts` | `createServerClient` com cookies Next.js |
| `lib/supabase/middleware.ts` | Helper de refresh para middleware |
| `middleware.ts` | Matcher `/dashboard/:path*`, refresh, redirect |
| `lib/auth/session.ts` | `getSession()`, `getTenantContext()` |
| `lib/auth/require-auth.ts` | Wrapper HOF para Route Handlers autenticados |
| `app/auth/callback/route.ts` | Exchange PKCE code → session cookie |

### Fluxos

**Login**:
```text
LoginForm → POST /api/auth/login → supabase.auth.signInWithPassword
  → validate profile.status = ACTIVE
  → resolve tenant context
  → set cookies → 200 { redirectTo: /dashboard }
```

**Logout**:
```text
Sidebar "Sair" → POST /api/auth/logout → supabase.auth.signOut
  → clear cookies → redirect /
```

**Forgot Password**:
```text
ForgotForm → POST /api/auth/forgot-password
  → supabase.auth.resetPasswordForEmail (always return generic success)
```

**Reset Password**:
```text
Email link → /auth/callback?code=... → session (recovery mode)
  → /redefinir-senha → ResetForm → POST /api/auth/reset-password
  → supabase.auth.updateUser({ password }) → redirect /
```

**Session Validation**:
```text
Request → middleware refresh → getSession()
  → if !session && protected route → redirect /?redirectTo=...
  → if session && / → redirect /dashboard
```

### Configuração Supabase Auth

- Email provider: enabled
- Email signup: **disabled**
- Confirm email: enabled (contas admin-created podem ser pre-confirmed)
- JWT expiry: default (3600s) com refresh token
- Password reset expiry: 86400s (24h, configurável)

---

## 4. Backend Implementation Sequence

| Step | Task | Depends On |
|------|------|------------|
| B1 | Instalar deps: `@supabase/supabase-js`, `@supabase/ssr`, `@prisma/client`, `zod` | — |
| B2 | Configurar env vars e validar conexão Supabase MCP | B1 |
| B3 | Expandir `prisma/schema.prisma` (tenants, profiles, enums) | B1 |
| B4 | Gerar e aplicar migration + RLS SQL | B3 |
| B5 | Validar schema/policies via Supabase MCP `get_advisors` | B4 |
| B6 | Criar `lib/supabase/{client,server,middleware}.ts` | B2 |
| B7 | Criar `lib/db/prisma.ts` + `types/auth.ts` | B4 |
| B8 | Criar `lib/auth/{session,require-auth,tenant-scope,schemas}.ts` | B6, B7 |
| B9 | Implementar `middleware.ts` | B6 |
| B10 | Implementar `POST /api/auth/login` | B8 |
| B11 | Implementar `POST /api/auth/logout` | B8 |
| B12 | Implementar `GET /api/auth/session` | B8 |
| B13 | Implementar `POST /api/auth/forgot-password` | B8 |
| B14 | Implementar `POST /api/auth/reset-password` | B8 |
| B15 | Implementar `GET /auth/callback` | B6 |
| B16 | Criar `prisma/seed.ts` (2 tenants, 2 users) | B4, B2 |
| B17 | Desabilitar signup no Supabase dashboard | B2 |

---

## 5. Frontend Implementation Sequence

| Step | Task | Depends On |
|------|------|------------|
| F1 | Evoluir `login-form.tsx`: remover mock/defaults demo; chamar API; estados loading/error | B10 |
| F2 | Link "Esqueci minha senha" → `/esqueci-senha` | F1 |
| F3 | Criar `forgot-password-form.tsx` + page `/esqueci-senha` | B13 |
| F4 | Criar `reset-password-form.tsx` + page `/redefinir-senha` | B14, B15 |
| F5 | Wire logout em `sidebar-nav.tsx` → POST `/api/auth/logout` | B11 |
| F6 | Atualizar `dashboard/layout.tsx` com guard server-side | B8, B9 |
| F7 | Substituir dados mock de tenant/user em dashboard por `getTenantContext()` | B12 |
| F8 | Remover texto demo "Use as credenciais preenchidas..." | F1 |
| F9 | Validar responsividade e acessibilidade (teclado, labels, aria) | F1-F4 |

### Estados de UI

| Estado | Comportamento |
|--------|---------------|
| **Loading** | Botão disabled + spinner (`Loader2`); previne double-submit |
| **Error** | Mensagem genérica abaixo do form (login) ou inline (validation) |
| **Success (forgot)** | Tela de confirmação genérica, independente de e-mail existir |
| **Success (reset)** | Toast/mensagem + redirect automático para login em 3s |
| **Validation** | HTML5 `required` + Zod client-side antes de submit |

---

## 6. API Architecture

Ver contrato completo: [contracts/auth-api.yaml](./contracts/auth-api.yaml)

### Endpoints

| Method | Path | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/auth/login` | No | Login email/password |
| POST | `/api/auth/logout` | Yes | Encerrar sessão |
| GET | `/api/auth/session` | Yes | Sessão + tenant context |
| POST | `/api/auth/forgot-password` | No | Solicitar reset (anti-enum) |
| POST | `/api/auth/reset-password` | Recovery | Definir nova senha |
| GET | `/auth/callback` | No | PKCE code exchange |

### Middleware Stack (Route Handlers)

```typescript
// Padrão para endpoints protegidos
export const POST = requireAuth(async (request, ctx) => {
  // ctx: { userId, tenantId, role, email, displayName }
  // tenantId SEMPRE da sessão, nunca do body
});
```

### Request Validation

- Zod schemas em `lib/auth/schemas.ts`
- Parse body → validate → execute
- Erros 422 com `{ error, details: [{ field, message }] }`

### Error Handling

| Código | Quando | Mensagem (pt-BR) |
|--------|--------|------------------|
| 401 | Credenciais inválidas / sessão expirada | "E-mail ou senha incorretos." / "Sessão expirada." |
| 403 | Conta inativa / cross-tenant | "Acesso não autorizado." |
| 422 | Validação falhou | "Dados inválidos." + details |
| 429 | Rate limit | "Muitas tentativas. Tente novamente em alguns minutos." |
| 500 | Erro interno | "Ocorreu um erro. Tente novamente." (sem stack trace) |

### Tenant Validation Pattern

```typescript
function assertTenantOwnership(
  ctx: TenantContext,
  resourceTenantId: string
): void {
  if (ctx.role === 'PLATFORM_ADMIN') return;
  if (ctx.tenantId !== resourceTenantId) {
    throw new ForbiddenError();
  }
}
```

Todo endpoint que recebe resource ID deve:
1. Buscar recurso (ou falhar 404)
2. Chamar `assertTenantOwnership(ctx, resource.tenantId)`
3. Executar operação

---

## 7. Security and Authorization Strategy

### Defense in Depth

```text
Request
  → [1] middleware: session exists?
  → [2] requireAuth: valid user + active profile?
  → [3] tenant-scope: resource belongs to tenant?
  → [4] Prisma query: WHERE tenantId = ctx.tenantId
  → [5] RLS: tenant_id = current_tenant_id() (DB layer)
  → Response
```

### Security Checklist

- [ ] Sign-up desabilitado no Supabase Auth
- [ ] `SUPABASE_SERVICE_ROLE_KEY` apenas server-side (sem `NEXT_PUBLIC_`)
- [ ] `tenant_id` em `app_metadata`, **nunca** em `user_metadata`
- [ ] RLS habilitado + forced em `tenants` e `profiles`
- [ ] UPDATE policies com `WITH CHECK` (impede reassignment de tenant_id)
- [ ] Funções SQL com `SECURITY INVOKER` (nunca DEFINER em public)
- [ ] Mensagens de erro genéricas (anti-enumeração)
- [ ] Rate limiting Supabase Auth habilitado
- [ ] HTTPS enforced (Vercel default)
- [ ] Cookies: HttpOnly, Secure (prod), SameSite=Lax
- [ ] Validar `profile.status === ACTIVE` pós-login
- [ ] Nenhum endpoint aceita `tenantId` do cliente
- [ ] `get_advisors` sem alertas críticos de security pós-deploy

### Administrative Access

- Role `PLATFORM_ADMIN` em `profiles.role`
- Policies RLS dedicadas com `is_platform_admin()`
- Acesso cross-tenant **somente** via policies admin ou service role server-side
- Usuários regulares (`MEMBER`, `TENANT_ADMIN`) restritos a `current_tenant_id()`

### Proibição de Sign Up

- Supabase dashboard: signup disabled
- Nenhuma rota `/cadastro`, `/signup`, `/register`
- Route Handlers retornam 404/405 para tentativas de criação pública
- Teste automatizado confirma ausência de endpoints de registro

---

## 8. Testing Strategy

### Stack

| Tipo | Ferramenta | Escopo |
|------|-----------|--------|
| Unitário | Vitest | Schemas Zod, `tenant-scope`, helpers puros |
| Integração | Vitest + Testing Library + MSW/mocks Supabase | Route Handlers, forms |
| E2E | Playwright | Fluxos login, recovery, logout, redirect |
| RLS | Vitest + Supabase test client (2 sessions) | Isolamento cross-tenant |

### Cenários Obrigatórios

**Autenticação**:
- Login válido → dashboard
- Credenciais inválidas → erro genérico
- Campos vazios → validação bloqueada
- Conta INACTIVE → 403
- Sessão expirada → redirect login
- Logout → sessão invalidada

**Recuperação de senha**:
- E-mail existente → e-mail enviado + mensagem genérica
- E-mail inexistente → mesma mensagem genérica
- Link válido → senha atualizada
- Link expirado → erro + orientação

**Multi-tenant**:
- User A acessa dados do Tenant A ✅
- User A tenta acessar dados do Tenant B ❌ (403/empty)
- API rejeita request com resourceId de outro tenant
- RLS bloqueia SELECT cross-tenant via Supabase client autenticado
- PLATFORM_ADMIN acessa cross-tenant (quando policy aplicável)

**Proteção de rotas**:
- `/dashboard` sem sessão → redirect `/`
- `/` com sessão → redirect `/dashboard`
- Nenhuma rota `/signup` existe (404)

### Configuração de Testes

```text
tests/
├── setup.ts              # Vitest global setup
├── helpers/
│   ├── supabase-mock.ts  # Mock Supabase client
│   └── seed-fixtures.ts  # Tenant A/B fixtures
├── unit/auth/
├── integration/auth/
└── e2e/auth.spec.ts
```

### Coverage mínima

- `lib/auth/*`: 90%+
- Route Handlers auth: 100% happy + error paths
- RLS isolation: 1 test por operação CRUD

---

## 9. Risks and Dependencies

### Dependencies

| Dependência | Status | Ação |
|-------------|--------|------|
| Projeto Supabase provisionado | Verificar via MCP `list_projects` | Criar se ausente |
| Env vars configuradas | `.env` existe, validar keys | Documentar em quickstart |
| Supabase MCP autenticado | Verificar | OAuth se necessário |
| Prisma configurado | Parcial (schema vazio) | Expandir schema |
| Vitest/Playwright | Ausente | Adicionar no setup |
| ESLint | Script existe, deps ausentes | Adicionar no setup |

### Risks

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Prisma bypassa RLS (conexão direct) | Alto — leak cross-tenant | Filtro obrigatório `tenantId` na app + RLS para Supabase client |
| JWT claims stale para tenant | Médio | `profiles` como fonte autoritativa; refresh após mudança |
| Sign-up acidental habilitado | Alto | Checklist deploy + teste automatizado |
| Service role exposta no client | Crítico | Lint rule / env review; nunca `NEXT_PUBLIC_` |
| Migration RLS out-of-sync | Alto | SQL versionado na migration; `get_advisors` no CI |
| Rate limiting insuficiente | Médio | Configurar Supabase Auth rate limits |
| `ignoreBuildErrors` mascara erros | Médio | Remover na task de setup desta feature |

---

## 10. Ordered Implementation Tasks

_Tarefas ordenadas para geração formal via `/speckit.tasks`. IDs provisórios._

### Phase 0 — Setup & Dependencies

| ID | Task | Priority |
|----|------|----------|
| T001 | Corrigir `package.json` name → `connex-insights` | P0 |
| T002 | Instalar `@supabase/supabase-js`, `@supabase/ssr`, `@prisma/client`, `zod` | P0 |
| T003 | Instalar devDeps: `vitest`, `@testing-library/react`, `@vitejs/plugin-react`, `jsdom`, `@playwright/test` | P0 |
| T004 | Configurar Vitest (`vitest.config.ts`) e script `test` | P0 |
| T005 | Configurar variáveis de ambiente Supabase + Prisma (ver quickstart) | P0 |
| T006 | Validar projeto Supabase via MCP (`list_projects`, `get_project_url`) | P0 |
| T007 | Desabilitar email signup no Supabase Auth dashboard | P0 |

### Phase 1 — Database & RLS

| ID | Task | Priority |
|----|------|----------|
| T010 | Definir schema Prisma: `Tenant`, `Profile`, enums | P0 |
| T011 | Gerar migration `init_auth_tenant` | P0 |
| T012 | Adicionar SQL: functions `current_tenant_id()`, `is_platform_admin()` | P0 |
| T013 | Adicionar SQL: RLS policies para `tenants` e `profiles` | P0 |
| T014 | Aplicar migration (`prisma migrate dev`) | P0 |
| T015 | Validar via Supabase MCP: `list_tables`, `get_advisors` | P0 |
| T016 | Criar `prisma/seed.ts` com 2 tenants + 2 users | P1 |

### Phase 2 — Auth Infrastructure

| ID | Task | Priority |
|----|------|----------|
| T020 | Criar `lib/supabase/client.ts` | P0 |
| T021 | Criar `lib/supabase/server.ts` | P0 |
| T022 | Criar `lib/supabase/middleware.ts` | P0 |
| T023 | Criar `lib/db/prisma.ts` | P0 |
| T024 | Criar `types/auth.ts` | P0 |
| T025 | Criar `lib/auth/schemas.ts` (Zod) | P0 |
| T026 | Criar `lib/auth/session.ts` | P0 |
| T027 | Criar `lib/auth/require-auth.ts` | P0 |
| T028 | Criar `lib/auth/tenant-scope.ts` | P0 |
| T029 | Implementar `middleware.ts` | P0 |

### Phase 3 — API Routes

| ID | Task | Priority |
|----|------|----------|
| T030 | `POST /api/auth/login` | P0 |
| T031 | `POST /api/auth/logout` | P0 |
| T032 | `GET /api/auth/session` | P0 |
| T033 | `POST /api/auth/forgot-password` | P1 |
| T034 | `POST /api/auth/reset-password` | P1 |
| T035 | `GET /auth/callback/route.ts` | P1 |

### Phase 4 — Frontend

| ID | Task | Priority |
|----|------|----------|
| T040 | Evoluir `login-form.tsx` (auth real, estados, remover mock) | P0 |
| T041 | Criar `forgot-password-form.tsx` + `/esqueci-senha` | P1 |
| T042 | Criar `reset-password-form.tsx` + `/redefinir-senha` | P1 |
| T043 | Wire logout em `sidebar-nav.tsx` | P1 |
| T044 | Guard server-side em `dashboard/layout.tsx` | P0 |
| T045 | Integrar tenant context no dashboard header | P1 |

### Phase 5 — Testing

| ID | Task | Priority |
|----|------|----------|
| T050 | Unit tests: Zod schemas | P0 |
| T051 | Unit tests: tenant-scope helpers | P0 |
| T052 | Integration tests: login API | P0 |
| T053 | Integration tests: forgot/reset password | P1 |
| T054 | Integration tests: tenant isolation | P0 |
| T055 | E2E Playwright: login → dashboard → logout | P1 |
| T056 | E2E Playwright: password recovery flow | P2 |
| T057 | Test: confirmar ausência de signup routes | P0 |

### Phase 6 — Cleanup & Compliance

| ID | Task | Priority |
|----|------|----------|
| T060 | Remover `typescript.ignoreBuildErrors: true` | P1 |
| T061 | Executar `tsc --noEmit` sem erros | P1 |
| T062 | Executar `get_advisors` final (security) | P0 |
| T063 | Atualizar quickstart com instruções validadas | P2 |

---

## Complexity Tracking

> Nenhuma violação da constituição requer justificativa adicional.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| — | — | — |

---

## Artifacts Generated

| Artifact | Path | Status |
|----------|------|--------|
| Implementation Plan | `specs/001-user-auth/plan.md` | ✅ |
| Research | `specs/001-user-auth/research.md` | ✅ |
| Data Model | `specs/001-user-auth/data-model.md` | ✅ |
| API Contracts | `specs/001-user-auth/contracts/auth-api.yaml` | ✅ |
| Quickstart | `specs/001-user-auth/quickstart.md` | ✅ |
| Tasks | `specs/001-user-auth/tasks.md` | ✅ |

---

## Next Steps

1. **`/speckit.tasks`** — gerar `tasks.md` formal a partir das tarefas ordenadas acima.
2. **`/speckit.implement`** — executar implementação fase por fase.
3. Revisar premissas com stakeholders (troca obrigatória de senha temporária no primeiro acesso).
