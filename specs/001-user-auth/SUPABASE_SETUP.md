# Configuração Supabase — Connex Insights Auth

**Project ref**: `dynmchiutefdpucwqifu`  
**Project name**: Connex Insights  
**Region**: us-east-1

## Ações manuais no Dashboard (T008)

1. **Auth → Providers → Email**: habilitado.
2. **Auth → Settings**: desabilitar **Enable email signup**.
3. **Auth → URL Configuration**:
   - Site URL: `http://localhost:3000` (dev) / URL de produção (prod)
   - Redirect URLs:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/redefinir-senha`
4. **Auth → Rate Limits**: revisar limites de login e password reset.

## Migration aplicada

Migration `init_auth_tenant` aplicada via Supabase MCP com:

- Tabelas: `tenants`, `profiles`
- RLS habilitado e forçado em ambas
- Funções: `current_tenant_id()`, `is_platform_admin()`

## Seed local

Após configurar `.env`:

```bash
pnpm db:seed
```

Credenciais de desenvolvimento (após seed):

| Tenant | E-mail | Senha |
|--------|--------|-------|
| Aurora Cosméticos | marina@auroracosmeticos.com | connex2026 |
| Beta Industries | admin@betaindustries.com | connex2026 |
