# Quickstart: Ativação de Conta no Primeiro Acesso

**Feature**: 002-first-time-account-activation

## Pré-requisitos

- Feature [001-user-auth](../001-user-auth/quickstart.md) configurada (Supabase, Prisma, `.env`)
- Migration `change_profile_default_inactive` aplicada
- Seed executado com usuário inativo

## Setup

```bash
pnpm prisma migrate dev
pnpm db:seed
pnpm dev
```

## Credenciais de teste (seed)

| Usuário | E-mail | Senha | Status |
|---------|--------|-------|--------|
| Ativo (regressão) | `marina@auroracosmeticos.com` | `connex2026` | ACTIVE |
| Inativo (ativação) | `novo@gammastartup.com` | `temp2026!` | INACTIVE |

Nova senha sugerida para ativação: `novaSenha1`

## Fluxo manual

1. Acesse `http://localhost:3000/`
2. Faça login com `novo@gammastartup.com` / `temp2026!`
3. Verifique redirecionamento para `/ativar-conta`
4. Preencha:
   - Senha temporária: `temp2026!`
   - Nova senha: `novaSenha1`
   - Confirmar: `novaSenha1`
5. Clique em **Confirmar**
6. Verifique redirecionamento para `/dashboard` com tenant **Gamma Startup**
7. Tente login novamente com `temp2026!` — deve falhar
8. Faça login com `novaSenha1` — deve acessar o dashboard

## Bypass (deve falhar)

| Ação | Resultado esperado |
|------|-------------------|
| `/dashboard` após login inativo (sem ativar) | Redirect `/ativar-conta` |
| `/ativar-conta` sem sessão | Redirect `/` |
| `GET /api/auth/session` com conta INACTIVE | 401 |

## Testes

```bash
pnpm test
pnpm test:e2e tests/e2e/auth-activation.spec.ts
pnpm test:e2e tests/e2e/auth-activation-bypass.spec.ts
```

> **Nota**: Testes e2e de ativação alteram o usuário inativo para ACTIVE. Reexecute `pnpm db:seed` para resetar o estado.
