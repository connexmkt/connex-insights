# Data Model: Integração Instagram Multi-Tenant

**Feature**: 003-instagram-account-connection  
**Data**: 2026-07-06

## Visão Geral

```text
tenants
    │
    │ 1:0..1 (uma integração Instagram por tenant)
    ▼
instagram_integrations ──1:1──► instagram_credentials (tokens criptografados)
    │
    ├──1:N──► instagram_media
    │
    └──1:N──► instagram_sync_jobs
```

Todas as tabelas (exceto credenciais para leitura client) possuem `tenant_id` com RLS.

---

## Enums

### `InstagramIntegrationStatus`

| Valor | Descrição |
|-------|-----------|
| `CONNECTED` | Integração ativa, token válido |
| `DISCONNECTED` | Usuário desconectou; sem sync futura |
| `REQUIRES_RECONNECTION` | Token expirado/revogado; reconexão necessária |

### `InstagramSyncStatus`

| Valor | Descrição |
|-------|-----------|
| `PENDING` | Aguardando primeira sincronização |
| `IN_PROGRESS` | Sincronização em andamento |
| `COMPLETED` | Última sync bem-sucedida |
| `FAILED` | Última sync falhou |

### `InstagramAccountType`

| Valor | API Meta | Descrição |
|-------|----------|-----------|
| `BUSINESS` | `Business` | Conta Business |
| `MEDIA_CREATOR` | `Media_Creator` | Conta Creator |

### `InstagramSyncJobType`

| Valor | Descrição |
|-------|-----------|
| `INITIAL` | Primeira sync pós-conexão |
| `INCREMENTAL` | Sync periódica (futuro) |
| `TOKEN_REFRESH` | Renovação de token |

### `InstagramSyncJobStatus`

| Valor | Descrição |
|-------|-----------|
| `PENDING` | Criado, não iniciado |
| `RUNNING` | Em execução |
| `SUCCEEDED` | Concluído com sucesso |
| `FAILED` | Falhou |

---

## Tabelas

### `instagram_integrations`

Representa a conexão OAuth entre tenant e conta Instagram Professional.

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | `UUID` | PK | Identificador interno |
| `tenant_id` | `UUID` | NOT NULL, UNIQUE, FK → `tenants` | Um por tenant |
| `instagram_user_id` | `TEXT` | NOT NULL | App-scoped user ID do token exchange |
| `instagram_professional_id` | `TEXT` | NOT NULL, UNIQUE | IG professional account ID (`user_id` do `/me`) |
| `username` | `TEXT` | NOT NULL | @username |
| `display_name` | `TEXT` | NULL | Nome do perfil (`name`) |
| `account_type` | `ENUM` | NOT NULL | `BUSINESS` \| `MEDIA_CREATOR` |
| `profile_picture_url` | `TEXT` | NULL | URL da foto de perfil |
| `followers_count` | `INTEGER` | NULL | Seguidores |
| `follows_count` | `INTEGER` | NULL | Seguindo |
| `media_count` | `INTEGER` | NULL | Total de mídias |
| `status` | `ENUM` | NOT NULL | Status da conexão |
| `sync_status` | `ENUM` | NOT NULL, DEFAULT `PENDING` | Status da sincronização |
| `last_synced_at` | `TIMESTAMPTZ` | NULL | Última sync bem-sucedida |
| `connected_at` | `TIMESTAMPTZ` | NULL | Data da conexão |
| `disconnected_at` | `TIMESTAMPTZ` | NULL | Data da desconexão |
| `connected_by_user_id` | `UUID` | NOT NULL, FK lógica → `profiles` | Usuário que conectou |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Auditoria |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | Auditoria |

**Índices**:
- PK `id`
- UNIQUE `tenant_id`
- UNIQUE `instagram_professional_id`
- INDEX `status`
- INDEX `(tenant_id, status)`

---

### `instagram_credentials`

Tokens OAuth criptografados. **Acesso exclusivo server-side via Prisma.**

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | `UUID` | PK | Identificador |
| `integration_id` | `UUID` | NOT NULL, UNIQUE, FK → `instagram_integrations` ON DELETE CASCADE | 1:1 |
| `tenant_id` | `UUID` | NOT NULL, FK → `tenants` | Denormalizado para RLS/auditoria |
| `access_token_enc` | `TEXT` | NOT NULL | Token AES-256-GCM criptografado |
| `token_expires_at` | `TIMESTAMPTZ` | NOT NULL | Expiração do long-lived token |
| `scopes_granted` | `TEXT[]` | NOT NULL | Escopos concedidos |
| `last_refreshed_at` | `TIMESTAMPTZ` | NULL | Último refresh bem-sucedido |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Auditoria |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | Auditoria |

**Índices**:
- UNIQUE `integration_id`
- INDEX `token_expires_at` (job de refresh)

**RLS**: `ENABLE ROW LEVEL SECURITY` + **nenhuma policy para `authenticated`** — bloqueio total via client Supabase.

---

### `instagram_media`

Mídias sincronizadas para pipeline de Insights.

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | `UUID` | PK | Identificador interno |
| `tenant_id` | `UUID` | NOT NULL, FK → `tenants` | Isolamento tenant |
| `integration_id` | `UUID` | NOT NULL, FK → `instagram_integrations` ON DELETE CASCADE | Integração origem |
| `external_media_id` | `TEXT` | NOT NULL | ID da mídia na Meta |
| `media_type` | `TEXT` | NOT NULL | IMAGE, VIDEO, CAROUSEL_ALBUM, etc. |
| `caption` | `TEXT` | NULL | Legenda |
| `permalink` | `TEXT` | NULL | URL pública |
| `thumbnail_url` | `TEXT` | NULL | Miniatura |
| `published_at` | `TIMESTAMPTZ` | NULL | `timestamp` da API |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Auditoria |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | Auditoria |

**Índices**:
- UNIQUE `(integration_id, external_media_id)`
- INDEX `tenant_id`
- INDEX `(integration_id, published_at DESC)`

---

### `instagram_sync_jobs`

Registro de execuções de sincronização.

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | `UUID` | PK | Identificador |
| `tenant_id` | `UUID` | NOT NULL, FK → `tenants` | Isolamento tenant |
| `integration_id` | `UUID` | NOT NULL, FK → `instagram_integrations` | Integração alvo |
| `job_type` | `ENUM` | NOT NULL | Tipo do job |
| `status` | `ENUM` | NOT NULL | Status |
| `started_at` | `TIMESTAMPTZ` | NULL | Início |
| `completed_at` | `TIMESTAMPTZ` | NULL | Fim |
| `error_code` | `TEXT` | NULL | Código interno (não exposto ao cliente) |
| `error_message` | `TEXT` | NULL | Mensagem interna |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Auditoria |

**Índices**:
- INDEX `(integration_id, status)`
- INDEX `(tenant_id, created_at DESC)`

---

## Schema Prisma

```prisma
enum InstagramIntegrationStatus {
  CONNECTED
  DISCONNECTED
  REQUIRES_RECONNECTION
}

enum InstagramSyncStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  FAILED
}

enum InstagramAccountType {
  BUSINESS
  MEDIA_CREATOR
}

enum InstagramSyncJobType {
  INITIAL
  INCREMENTAL
  TOKEN_REFRESH
}

enum InstagramSyncJobStatus {
  PENDING
  RUNNING
  SUCCEEDED
  FAILED
}

model InstagramIntegration {
  id                      String                     @id @default(uuid()) @db.Uuid
  tenantId                String                     @unique @map("tenant_id") @db.Uuid
  instagramUserId         String                     @map("instagram_user_id")
  instagramProfessionalId String                     @unique @map("instagram_professional_id")
  username                String
  displayName             String?                    @map("display_name")
  accountType             InstagramAccountType       @map("account_type")
  profilePictureUrl       String?                    @map("profile_picture_url")
  followersCount          Int?                       @map("followers_count")
  followsCount            Int?                       @map("follows_count")
  mediaCount              Int?                       @map("media_count")
  status                  InstagramIntegrationStatus @default(CONNECTED)
  syncStatus              InstagramSyncStatus        @default(PENDING) @map("sync_status")
  lastSyncedAt            DateTime?                  @map("last_synced_at") @db.Timestamptz(6)
  connectedAt             DateTime?                  @map("connected_at") @db.Timestamptz(6)
  disconnectedAt          DateTime?                  @map("disconnected_at") @db.Timestamptz(6)
  connectedByUserId       String                     @map("connected_by_user_id") @db.Uuid
  createdAt               DateTime                   @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt               DateTime                   @updatedAt @map("updated_at") @db.Timestamptz(6)

  tenant      Tenant               @relation(fields: [tenantId], references: [id], onDelete: Restrict)
  credential  InstagramCredential?
  media       InstagramMedia[]
  syncJobs    InstagramSyncJob[]

  @@index([status])
  @@index([tenantId, status])
  @@map("instagram_integrations")
}

model InstagramCredential {
  id              String   @id @default(uuid()) @db.Uuid
  integrationId   String   @unique @map("integration_id") @db.Uuid
  tenantId        String   @map("tenant_id") @db.Uuid
  accessTokenEnc  String   @map("access_token_enc")
  tokenExpiresAt  DateTime @map("token_expires_at") @db.Timestamptz(6)
  scopesGranted   String[] @map("scopes_granted")
  lastRefreshedAt DateTime? @map("last_refreshed_at") @db.Timestamptz(6)
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  integration InstagramIntegration @relation(fields: [integrationId], references: [id], onDelete: Cascade)

  @@index([tokenExpiresAt])
  @@map("instagram_credentials")
}

model InstagramMedia {
  id              String   @id @default(uuid()) @db.Uuid
  tenantId        String   @map("tenant_id") @db.Uuid
  integrationId   String   @map("integration_id") @db.Uuid
  externalMediaId String   @map("external_media_id")
  mediaType       String   @map("media_type")
  caption         String?
  permalink       String?
  thumbnailUrl    String?  @map("thumbnail_url")
  publishedAt     DateTime? @map("published_at") @db.Timestamptz(6)
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  integration InstagramIntegration @relation(fields: [integrationId], references: [id], onDelete: Cascade)

  @@unique([integrationId, externalMediaId])
  @@index([tenantId])
  @@index([integrationId, publishedAt(sort: Desc)])
  @@map("instagram_media")
}

model InstagramSyncJob {
  id            String               @id @default(uuid()) @db.Uuid
  tenantId      String               @map("tenant_id") @db.Uuid
  integrationId String               @map("integration_id") @db.Uuid
  jobType       InstagramSyncJobType @map("job_type")
  status        InstagramSyncJobStatus
  startedAt     DateTime?            @map("started_at") @db.Timestamptz(6)
  completedAt   DateTime?            @map("completed_at") @db.Timestamptz(6)
  errorCode     String?              @map("error_code")
  errorMessage  String?              @map("error_message")
  createdAt     DateTime             @default(now()) @map("created_at") @db.Timestamptz(6)

  integration InstagramIntegration @relation(fields: [integrationId], references: [id], onDelete: Cascade)

  @@index([integrationId, status])
  @@index([tenantId, createdAt(sort: Desc)])
  @@map("instagram_sync_jobs")
}
```

Adicionar em `Tenant`:
```prisma
instagramIntegration InstagramIntegration?
```

---

## Políticas RLS

### `instagram_integrations`, `instagram_media`, `instagram_sync_jobs`

Template tenant-owned (mesmo de `data-model.md` da feature 001):

```sql
-- SELECT
CREATE POLICY "instagram_integrations_tenant_select" ON public.instagram_integrations
  FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

-- INSERT/UPDATE/DELETE: idem com WITH CHECK (tenant_id = current_tenant_id())
```

Repetir para `instagram_media` e `instagram_sync_jobs`.

### `instagram_credentials`

```sql
ALTER TABLE public.instagram_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_credentials FORCE ROW LEVEL SECURITY;
-- Sem policies para role authenticated → acesso negado por padrão
-- Prisma (role postgres/service) bypassa RLS — uso exclusivo server-side
```

---

## Estratégia de Migrations

| # | Nome | Conteúdo |
|---|------|----------|
| M3 | `instagram_integration_tables` | Enums, tabelas, FKs, indexes |
| M4 | `instagram_rls_policies` | RLS + policies (pode ser parte de M3) |

**Regras**:
- DDL exclusivamente via `prisma migrate`
- SQL RLS no mesmo arquivo de migration ou migration sequencial
- Validar com Supabase MCP `get_advisors` após apply

---

## Regras de Validação

- `tenant_id` em INSERT: sempre derivado de `getTenantContext()`, nunca do body.
- `integrationId` em operações: validar ownership via `assertTenantOwnership`.
- Tokens nunca retornados em responses JSON ao frontend.
- `instagram_professional_id` globalmente único — impede mesma conta em dois tenants.
