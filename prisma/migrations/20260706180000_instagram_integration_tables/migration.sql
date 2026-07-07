-- CreateEnum
CREATE TYPE "InstagramIntegrationStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'REQUIRES_RECONNECTION');

-- CreateEnum
CREATE TYPE "InstagramSyncStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "InstagramAccountType" AS ENUM ('BUSINESS', 'MEDIA_CREATOR');

-- CreateEnum
CREATE TYPE "InstagramSyncJobType" AS ENUM ('INITIAL', 'INCREMENTAL', 'TOKEN_REFRESH');

-- CreateEnum
CREATE TYPE "InstagramSyncJobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "instagram_integrations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "instagram_user_id" TEXT NOT NULL,
    "instagram_professional_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "display_name" TEXT,
    "account_type" "InstagramAccountType" NOT NULL,
    "profile_picture_url" TEXT,
    "followers_count" INTEGER,
    "follows_count" INTEGER,
    "media_count" INTEGER,
    "status" "InstagramIntegrationStatus" NOT NULL DEFAULT 'CONNECTED',
    "sync_status" "InstagramSyncStatus" NOT NULL DEFAULT 'PENDING',
    "last_synced_at" TIMESTAMPTZ(6),
    "connected_at" TIMESTAMPTZ(6),
    "disconnected_at" TIMESTAMPTZ(6),
    "connected_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "instagram_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instagram_credentials" (
    "id" UUID NOT NULL,
    "integration_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "access_token_enc" TEXT NOT NULL,
    "token_expires_at" TIMESTAMPTZ(6) NOT NULL,
    "scopes_granted" TEXT[] NOT NULL,
    "last_refreshed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "instagram_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instagram_media" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "integration_id" UUID NOT NULL,
    "external_media_id" TEXT NOT NULL,
    "media_type" TEXT NOT NULL,
    "caption" TEXT,
    "permalink" TEXT,
    "thumbnail_url" TEXT,
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "instagram_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instagram_sync_jobs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "integration_id" UUID NOT NULL,
    "job_type" "InstagramSyncJobType" NOT NULL,
    "status" "InstagramSyncJobStatus" NOT NULL,
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "error_code" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instagram_sync_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instagram_integrations_tenant_id_key" ON "instagram_integrations"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "instagram_integrations_instagram_professional_id_key" ON "instagram_integrations"("instagram_professional_id");

-- CreateIndex
CREATE INDEX "instagram_integrations_status_idx" ON "instagram_integrations"("status");

-- CreateIndex
CREATE INDEX "instagram_integrations_tenant_id_status_idx" ON "instagram_integrations"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "instagram_credentials_integration_id_key" ON "instagram_credentials"("integration_id");

-- CreateIndex
CREATE INDEX "instagram_credentials_token_expires_at_idx" ON "instagram_credentials"("token_expires_at");

-- CreateIndex
CREATE INDEX "instagram_media_tenant_id_idx" ON "instagram_media"("tenant_id");

-- CreateIndex
CREATE INDEX "instagram_media_integration_id_published_at_idx" ON "instagram_media"("integration_id", "published_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "instagram_media_integration_id_external_media_id_key" ON "instagram_media"("integration_id", "external_media_id");

-- CreateIndex
CREATE INDEX "instagram_sync_jobs_integration_id_status_idx" ON "instagram_sync_jobs"("integration_id", "status");

-- CreateIndex
CREATE INDEX "instagram_sync_jobs_tenant_id_created_at_idx" ON "instagram_sync_jobs"("tenant_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "instagram_integrations" ADD CONSTRAINT "instagram_integrations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instagram_credentials" ADD CONSTRAINT "instagram_credentials_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "instagram_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instagram_media" ADD CONSTRAINT "instagram_media_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "instagram_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instagram_sync_jobs" ADD CONSTRAINT "instagram_sync_jobs_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "instagram_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: instagram_integrations
ALTER TABLE public.instagram_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_integrations FORCE ROW LEVEL SECURITY;

CREATE POLICY "instagram_integrations_tenant_select" ON public.instagram_integrations
  FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "instagram_integrations_tenant_insert" ON public.instagram_integrations
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "instagram_integrations_tenant_update" ON public.instagram_integrations
  FOR UPDATE TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "instagram_integrations_tenant_delete" ON public.instagram_integrations
  FOR DELETE TO authenticated
  USING (tenant_id = public.current_tenant_id());

-- RLS: instagram_media
ALTER TABLE public.instagram_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_media FORCE ROW LEVEL SECURITY;

CREATE POLICY "instagram_media_tenant_select" ON public.instagram_media
  FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "instagram_media_tenant_insert" ON public.instagram_media
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "instagram_media_tenant_update" ON public.instagram_media
  FOR UPDATE TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "instagram_media_tenant_delete" ON public.instagram_media
  FOR DELETE TO authenticated
  USING (tenant_id = public.current_tenant_id());

-- RLS: instagram_sync_jobs
ALTER TABLE public.instagram_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_sync_jobs FORCE ROW LEVEL SECURITY;

CREATE POLICY "instagram_sync_jobs_tenant_select" ON public.instagram_sync_jobs
  FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "instagram_sync_jobs_tenant_insert" ON public.instagram_sync_jobs
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "instagram_sync_jobs_tenant_update" ON public.instagram_sync_jobs
  FOR UPDATE TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "instagram_sync_jobs_tenant_delete" ON public.instagram_sync_jobs
  FOR DELETE TO authenticated
  USING (tenant_id = public.current_tenant_id());

-- RLS: instagram_credentials (server-only via Prisma — no authenticated policies)
ALTER TABLE public.instagram_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_credentials FORCE ROW LEVEL SECURITY;
