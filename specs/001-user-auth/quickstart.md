# Quickstart: Autenticação Multi-Tenant

**Feature**: 001-user-auth

## Pré-requisitos

- Node.js 20+
- pnpm
- Projeto Supabase configurado (PostgreSQL + Auth)
- Variáveis de ambiente (`.env.local`):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>  # Apenas server-side, nunca NEXT_PUBLIC_

# Database (Prisma)
DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Configuração Supabase (Dashboard)

1. **Auth → Providers → Email**: habilitado.
2. **Auth → Settings**: desabilitar "Enable email signup" (proibir auto-cadastro).
3. **Auth → URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`, `http://localhost:3000/redefinir-senha`
4. **Auth → Email Templates**: personalizar template de reset (pt-BR).
5. **Auth → Rate Limits**: configurar limites para login e reset.

## Setup Local

```bash
# Instalar dependências (após implementação)
pnpm install

# Aplicar migrations Prisma (schema + RLS)
pnpm prisma migrate dev

# Seed de desenvolvimento (tenants + usuários de teste)
pnpm db:seed
# ou: pnpm exec tsx prisma/seed.ts

# Validar schema via Supabase MCP
# → list_tables, get_advisors (security + performance)

# Iniciar dev server
pnpm dev
```

## Fluxos de Teste Manual

### Login

1. Acesse `http://localhost:3000`
2. Informe credenciais do seed (tenant Aurora)
3. Verifique redirect para `/dashboard`
4. Confirme dados do tenant no header/sidebar

### Recuperação de senha

1. Clique "Esqueci minha senha"
2. Informe e-mail cadastrado
3. Verifique mensagem genérica de confirmação
4. Abra e-mail de reset (Inbucket local ou e-mail real)
5. Clique no link → redirect para `/redefinir-senha`
6. Defina nova senha → redirect para login
7. Autentique com nova senha

### Isolamento multi-tenant

1. Login como usuário do Tenant A
2. Tentar acessar recurso do Tenant B via API → expect 403/404
3. Login como usuário do Tenant B → confirmar dados diferentes

### Logout

1. Autenticado, clique "Sair" na sidebar
2. Verifique redirect para `/`
3. Tente acessar `/dashboard` → redirect para login

## Comandos de Teste

```bash
# Unit + integration
pnpm test

# E2E (Playwright)
pnpm test:e2e

# Type check (deve passar sem ignoreBuildErrors após implementação)
pnpm tsc --noEmit
```

## Validação Supabase MCP

Após migrations, executar via MCP:

| Tool | Propósito |
|------|-----------|
| `list_tables` | Confirmar `tenants`, `profiles` criadas |
| `execute_sql` | Verificar RLS habilitado: `SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('tenants','profiles')` |
| `get_advisors` | Detectar tabelas sem RLS ou policies ausentes |
| `list_migrations` | Confirmar migrations aplicadas |

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Redirect loop no login | Verificar `middleware.ts` matcher e cookies Supabase |
| RLS bloqueia queries Prisma | Esperado para conexão direct — usar filtro `tenantId` na app |
| Reset email não chega | Verificar SMTP/Inbucket; checar spam; validar redirect URL |
| `profiles` não encontrado pós-login | Usuário Auth criado sem profile — executar `pnpm db:seed` |
| Seed não executa | Configurar `migrations.seed` em `prisma.config.ts` (Prisma 7) |
| Cross-tenant leak | Executar testes de isolamento; revisar policies com `get_advisors` |
