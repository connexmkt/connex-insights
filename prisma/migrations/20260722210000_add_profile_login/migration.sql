-- Adiciona o identificador de acesso "login" ao model Profile, distinto do
-- e-mail de contato (auth.users.email). Ver specs/001-user-auth/spec.md §
-- Nota de atualização e a dependência cross-repo documentada em
-- connex-crm/specs/002-provisionamento-usuarios-insights/spec.md.
--
-- A tabela já possui as 3 linhas de seed (Marina Velloso, Admin Beta, Novo
-- Usuário) neste ambiente, então a coluna é adicionada como nullable,
-- populada por retrocompatibilidade a partir do e-mail em auth.users, e só
-- então promovida a NOT NULL + UNIQUE.
ALTER TABLE "profiles" ADD COLUMN "login" TEXT;

UPDATE "profiles" p
SET "login" = split_part(u.email, '@', 1)
FROM auth.users u
WHERE u.id = p.id
  AND p."login" IS NULL;

ALTER TABLE "profiles" ALTER COLUMN "login" SET NOT NULL;

CREATE UNIQUE INDEX "profiles_login_key" ON "profiles"("login");
