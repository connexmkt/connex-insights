# Data Model: Autenticação Multi-Tenant

**Feature**: 001-user-auth  
**Data**: 2026-06-27

## Visão Geral

O Supabase Auth gerencia identidade (`auth.users`). Dados de negócio e isolamento multi-tenant residem no schema `public`, gerenciado por Prisma. Toda entidade tenant-owned possui coluna `tenant_id` com FK para `tenants`.

```text
auth.users (Supabase Auth — não gerenciado por Prisma)
    │
    │ 1:1 (id = auth.users.id)
    ▼
profiles ──N:1──► tenants
    │
    │ tenant_id propagado para entidades futuras
    ▼
[future tables: metrics, reports, ...] ──N:1──► tenants
```

---

## Entidades

### `tenants`

Representa uma organização/cliente da plataforma SaaS.

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | `UUID` | PK, `@default(uuid())` | Identificador único do tenant |
| `name` | `TEXT` | NOT NULL | Nome exibido (ex.: "Aurora Cosméticos") |
| `slug` | `TEXT` | NOT NULL, UNIQUE | Identificador URL-safe |
| `plan` | `TEXT` | NOT NULL | Plano contratado (ex.: "growth") |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | Data de criação |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | Data de atualização |

**Índices**:
- PK em `id`
- UNIQUE em `slug`

**RLS**: SELECT permitido a usuários autenticados cujo `current_tenant_id()` = `tenants.id`. INSERT/UPDATE/DELETE restritos a `PLATFORM_ADMIN`.

---

### `profiles`

Perfil de aplicação vinculado 1:1 ao usuário Supabase Auth.

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | `UUID` | PK, FK lógica → `auth.users.id` | Mesmo UUID do Supabase Auth |
| `tenant_id` | `UUID` | NOT NULL, FK → `tenants.id` | Tenant ao qual o usuário pertence |
| `display_name` | `TEXT` | NOT NULL | Nome exibido na UI |
| `role` | `ENUM` | NOT NULL, DEFAULT `MEMBER` | `MEMBER` \| `TENANT_ADMIN` \| `PLATFORM_ADMIN` |
| `status` | `ENUM` | NOT NULL, DEFAULT `ACTIVE` | `ACTIVE` \| `INACTIVE` \| `SUSPENDED` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | Data de criação |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | Data de atualização |

**Índices**:
- PK em `id`
- INDEX em `tenant_id` (queries tenant-scoped)
- INDEX composto `(tenant_id, status)` para listagens filtradas

**Constraints**:
- Um usuário pertence a exatamente um tenant (coluna `tenant_id` NOT NULL, sem tabela de membership).
- Usuários `INACTIVE` ou `SUSPENDED` não devem autenticar (validado na camada de auth).

**RLS**:
- SELECT: `id = auth.uid()` OR (`tenant_id = current_tenant_id()` AND role IN tenant-visible scope)
- UPDATE: `id = auth.uid()` (próprio perfil, campos limitados) OR `PLATFORM_ADMIN`
- INSERT/DELETE: `PLATFORM_ADMIN` only (criação via admin)

---

## Schema Prisma

```prisma
enum UserRole {
  MEMBER
  TENANT_ADMIN
  PLATFORM_ADMIN
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

model Tenant {
  id        String    @id @default(uuid()) @db.Uuid
  name      String
  slug      String    @unique
  plan      String
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  profiles  Profile[]

  @@map("tenants")
}

model Profile {
  id          String     @id @db.Uuid
  tenantId    String     @map("tenant_id") @db.Uuid
  displayName String     @map("display_name")
  role        UserRole   @default(MEMBER)
  status      UserStatus @default(ACTIVE)
  createdAt   DateTime   @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime   @updatedAt @map("updated_at") @db.Timestamptz
  tenant      Tenant     @relation(fields: [tenantId], references: [id])

  @@index([tenantId])
  @@index([tenantId, status])
  @@map("profiles")
}
```

> **Nota**: `profiles.id` referencia `auth.users.id` sem FK Prisma formal (schema `auth` gerenciado pelo Supabase). A integridade é garantida no processo de criação admin e por trigger SQL opcional.

---

## Funções SQL Auxiliares (RLS)

```sql
-- Retorna tenant_id do usuário autenticado
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Verifica se usuário é admin da plataforma
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'PLATFORM_ADMIN'
  )
$$;
```

---

## Políticas RLS

### `tenants`

| Operação | Policy | Expressão |
|----------|--------|-----------|
| SELECT | `tenants_select_own` | `to authenticated using (id = current_tenant_id())` |
| SELECT | `tenants_select_admin` | `to authenticated using (is_platform_admin())` |
| INSERT | `tenants_insert_admin` | `to authenticated with check (is_platform_admin())` |
| UPDATE | `tenants_update_admin` | `to authenticated using (is_platform_admin()) with check (is_platform_admin())` |
| DELETE | `tenants_delete_admin` | `to authenticated using (is_platform_admin())` |

### `profiles`

| Operação | Policy | Expressão |
|----------|--------|-----------|
| SELECT | `profiles_select_own` | `to authenticated using (id = auth.uid())` |
| SELECT | `profiles_select_tenant` | `to authenticated using (tenant_id = current_tenant_id())` |
| SELECT | `profiles_select_admin` | `to authenticated using (is_platform_admin())` |
| UPDATE | `profiles_update_own` | `to authenticated using (id = auth.uid()) with check (id = auth.uid() AND tenant_id = current_tenant_id())` |
| INSERT | `profiles_insert_admin` | `to authenticated with check (is_platform_admin())` |
| DELETE | `profiles_delete_admin` | `to authenticated using (is_platform_admin())` |

> **Importante**: Toda policy UPDATE inclui `WITH CHECK` para impedir reassignment de `tenant_id`.

---

## Padrão para Entidades Futuras (Tenant-Owned)

Toda nova tabela de negócio DEVE:

1. Incluir coluna `tenant_id UUID NOT NULL REFERENCES tenants(id)`.
2. Ter INDEX em `tenant_id` (e compostos conforme padrão de query).
3. Habilitar RLS: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
4. Criar policies SELECT/INSERT/UPDATE/DELETE:

```sql
-- Template SELECT
CREATE POLICY "{table}_tenant_select" ON public.{table}
  FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

-- Template INSERT
CREATE POLICY "{table}_tenant_insert" ON public.{table}
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.current_tenant_id());

-- Template UPDATE
CREATE POLICY "{table}_tenant_update" ON public.{table}
  FOR UPDATE TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- Template DELETE
CREATE POLICY "{table}_tenant_delete" ON public.{table}
  FOR DELETE TO authenticated
  USING (tenant_id = public.current_tenant_id());
```

---

## Estratégia de Indexação

| Tabela | Índice | Propósito |
|--------|--------|-----------|
| `tenants` | `slug` (UNIQUE) | Lookup por slug |
| `profiles` | `tenant_id` | Filtragem tenant-scoped |
| `profiles` | `(tenant_id, status)` | Listagem de membros ativos |
| `[future]` | `tenant_id` | Obrigatório em toda tabela tenant-owned |
| `[future]` | `(tenant_id, created_at DESC)` | Paginação cronológica por tenant |

---

## Mapeamento Supabase Auth ↔ Application

| Supabase Auth | Application |
|---------------|-------------|
| `auth.users.id` | `profiles.id` |
| `auth.users.email` | Login identifier (não duplicado em Prisma) |
| `auth.users.encrypted_password` | Gerenciado pelo Supabase |
| `auth.users.app_metadata.tenant_id` | Espelho server-side (opcional, para claims) |
| `auth.users.app_metadata.role` | Espelho server-side (opcional) |
| Session JWT | Cookie HTTP-only via `@supabase/ssr` |

---

## Regras de Validação

- E-mail: formato RFC 5322 simplificado (validação Zod no API + HTML5 `type="email"`).
- Senha (reset): mínimo 8 caracteres, pelo menos 1 letra e 1 número.
- `tenant_id` em INSERT via API: **sempre** derivado da sessão autenticada, nunca do body da request.
- Resource ID em UPDATE/DELETE: validar que registro pertence ao `tenantId` da sessão antes da operação.

---

## Seed de Desenvolvimento

Script `prisma/seed.ts` criará:

1. Tenant "Aurora Cosméticos" (dados do mock atual).
2. Usuário Supabase Auth via admin API.
3. Profile vinculado com role `MEMBER`.
4. Segundo tenant + usuário para testes de isolamento.
