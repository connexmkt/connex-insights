# Research: Autenticação Multi-Tenant com Supabase + Prisma

**Feature**: 001-user-auth  
**Data**: 2026-06-27

## R1 — Provedor de autenticação

**Decision**: Supabase Auth como provedor exclusivo para login, sessões e recuperação de senha.

**Rationale**:
- Requisito explícito do usuário e alinhamento com Supabase PostgreSQL já adotado.
- Supabase Auth gerencia hash de senhas, tokens de reset, expiração configurável e e-mail transacional.
- Integração nativa com `@supabase/ssr` para App Router (cookies HTTP-only, refresh automático).
- Cadastro público pode ser desabilitado no dashboard Supabase (`Enable email signup = off`).

**Alternatives considered**:
- **NextAuth.js**: exigiria adapter customizado para multi-tenancy e duplicaria responsabilidades já cobertas pelo Supabase.
- **Auth própria com Prisma**: violaria requisito de usar Supabase Auth e aumentaria superfície de segurança (hash, tokens, rate limiting).

---

## R2 — Modelo de associação usuário ↔ tenant

**Decision**: Tabela `profiles` em `public` com `id` igual a `auth.users.id` e FK obrigatória para `tenants.id`. `tenant_id` também espelhado em `app_metadata` do Supabase Auth (escrita exclusiva server-side via service role).

**Rationale**:
- `auth.users` é gerenciado pelo Supabase; dados de negócio ficam em `public.profiles`.
- RLS pode resolver tenant via função `current_tenant_id()` consultando `profiles`.
- `app_metadata` permite acesso rápido ao tenant no JWT sem depender de `user_metadata` (editável pelo usuário — proibido para autorização).
- Um usuário pertence a exatamente um tenant (requisito de negócio).

**Alternatives considered**:
- **tenant_id apenas no JWT**: claims JWT não são frescos imediatamente após mudança; `profiles` permanece fonte autoritativa.
- **Tabela de membership N:N**: rejeitado — requisito exige exatamente um tenant por usuário.

---

## R3 — Prisma + RLS: estratégia de integração

**Decision**: Prisma exclusivo para DDL e migrations; políticas RLS em SQL versionado dentro das migrations Prisma; camada de aplicação injeta `tenantId` em toda query Prisma; RLS como defesa em profundidade para acesso via Supabase Data API e client autenticado.

**Rationale**:
- Prisma conecta via `DATABASE_URL` (pooler/direct) e **não** propaga JWT automaticamente — filtragem explícita por `tenantId` na aplicação é obrigatória.
- RLS garante isolamento mesmo se alguém acessar via PostgREST/Supabase client com JWT de usuário.
- Migrations Prisma com blocos `-- prisma migrate` + SQL customizado mantêm schema e políticas sincronizados.

**Alternatives considered**:
- **Apenas RLS sem filtro na app**: insuficiente para conexões Prisma diretas (bypass RLS com role postgres).
- **Apenas filtro na app sem RLS**: viola requisito mandatório de RLS em todas as tabelas tenant-owned.

---

## R4 — Resolução de tenant nas políticas RLS

**Decision**: Função SQL `public.current_tenant_id()` com `SECURITY INVOKER` que retorna `tenant_id` de `profiles` onde `id = auth.uid()`. Políticas usam `tenant_id = public.current_tenant_id()`.

**Rationale**:
- Centraliza lógica de resolução; evita duplicação em cada policy.
- `SECURITY INVOKER` respeita RLS da tabela `profiles` (não bypass).
- Performance: índice em `profiles(id)` e `profiles(tenant_id)`.

**Alternatives considered**:
- **`auth.jwt() -> 'app_metadata' ->> 'tenant_id'`**: aceitável como otimização futura, mas `profiles` é fonte autoritativa e mais segura para RLS.
- **`current_setting('app.tenant_id')`**: requer set manual por request; não integra nativamente com Supabase Auth JWT.

---

## R5 — Fluxo de password recovery

**Decision**: Usar `supabase.auth.resetPasswordForEmail()` no Route Handler; callback em `/auth/callback` troca code por sessão; página `/redefinir-senha` chama `supabase.auth.updateUser({ password })`.

**Rationale**:
- Fluxo nativo Supabase com link seguro, expiração configurável no dashboard (padrão 24h).
- Anti-enumeração: sempre retornar mensagem genérica de sucesso no endpoint.
- Redirect URL configurada no Supabase: `{APP_URL}/auth/callback?next=/redefinir-senha`.

**Alternatives considered**:
- **Token customizado em tabela Prisma**: duplicaria funcionalidade do Supabase Auth.

---

## R6 — Proteção de rotas Next.js

**Decision**: `middleware.ts` na raiz usando `@supabase/ssr` para refresh de sessão; matcher em `/dashboard/:path*`; redirect para `/` com query `?redirectTo=`; usuários autenticados em `/` redirecionados para `/dashboard`.

**Rationale**:
- Padrão oficial Supabase para Next.js App Router.
- Refresh proativo evita sessões expiradas silenciosamente.
- Preserva intenção de navegação pós-login.

**Alternatives considered**:
- **Proteção apenas no layout**: insuficiente — não cobre API routes nem impede flash de conteúdo.

---

## R7 — Stack de testes

**Decision**: Vitest + Testing Library (unit/integration); Playwright (e2e fluxos críticos de auth); testes de isolamento multi-tenant com dois tenants seedados e sessões distintas.

**Rationale**:
- Alinhado à Constituição de Engenharia (Princípio 3).
- Projeto ainda não possui testes — esta feature estabelece a fundação.

**Alternatives considered**:
- **Jest**: não adotado; constituição especifica Vitest.

---

## R8 — Criação de usuários (admin-only)

**Decision**: Fora do escopo desta feature; documentado como processo server-side com service role (`supabase.auth.admin.createUser`) + insert em `profiles`/`tenants` na feature futura de backoffice. Sign-up público desabilitado.

**Rationale**:
- Spec e requisitos proíbem auto-cadastro.
- Seeds de desenvolvimento via script `prisma/seed.ts` para testes locais.

---

## R9 — Acesso administrativo cross-tenant

**Decision**: Role `PLATFORM_ADMIN` em `profiles.role`; políticas RLS separadas com `USING (public.is_platform_admin())` apenas para tabelas que exigirem visão cross-tenant; nunca concedido a usuários regulares.

**Rationale**:
- Requisito explícito de acesso admin dedicado.
- Usuários regulares continuam restritos a `current_tenant_id()`.

**Alternatives considered**:
- **Bypass RLS via service role no client**: proibido — service role nunca no browser.
