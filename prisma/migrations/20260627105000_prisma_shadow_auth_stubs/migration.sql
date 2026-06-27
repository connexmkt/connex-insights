-- Stubs para shadow database do Prisma (Supabase já fornece auth + authenticated em produção).
-- Deve rodar antes de migrations que referenciam auth.uid() ou o role authenticated.

CREATE SCHEMA IF NOT EXISTS auth;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc AS proc
    INNER JOIN pg_namespace AS namespace ON proc.pronamespace = namespace.oid
    WHERE namespace.nspname = 'auth' AND proc.proname = 'uid'
  ) THEN
    CREATE FUNCTION auth.uid()
    RETURNS uuid
    LANGUAGE sql
    STABLE
    AS $auth_uid$ SELECT NULL::uuid; $auth_uid$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated;
  END IF;
END $$;
