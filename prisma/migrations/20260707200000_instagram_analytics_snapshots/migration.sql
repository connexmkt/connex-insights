-- AlterEnum
ALTER TYPE "InstagramSyncJobStatus" ADD VALUE 'PARTIAL';

-- CreateEnum
CREATE TYPE "InstagramMetricScope" AS ENUM ('ACCOUNT', 'MEDIA', 'AUDIENCE');

-- AlterTable
ALTER TABLE "instagram_integrations" ADD COLUMN "media_sync_cursor" TEXT,
ADD COLUMN "last_full_media_sync_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "instagram_media" ADD COLUMN "media_url" TEXT,
ADD COLUMN "is_removed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "removed_at" TIMESTAMPTZ(6),
ADD COLUMN "last_insights_synced_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "instagram_sync_jobs" ADD COLUMN "media_imported_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "metrics_imported_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "failed_requests_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "retry_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "duration_ms" INTEGER,
ADD COLUMN "remaining_api_quota" JSONB;

-- CreateTable
CREATE TABLE "instagram_metric_snapshots" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "integration_id" UUID NOT NULL,
    "sync_job_id" UUID NOT NULL,
    "scope" "InstagramMetricScope" NOT NULL,
    "entity_id" TEXT NOT NULL DEFAULT '',
    "metric_name" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "metric_date" DATE,
    "breakdown_key" TEXT NOT NULL DEFAULT '',
    "value" DECIMAL(20,4),
    "value_json" JSONB,
    "collected_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instagram_metric_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instagram_metric_snapshots_sync_job_id_scope_entity_id_metri_key" ON "instagram_metric_snapshots"("sync_job_id", "scope", "entity_id", "metric_name", "period", "metric_date", "breakdown_key");

-- CreateIndex
CREATE INDEX "instagram_metric_snapshots_tenant_id_integration_id_scope_me_idx" ON "instagram_metric_snapshots"("tenant_id", "integration_id", "scope", "metric_name", "metric_date" DESC);

-- CreateIndex
CREATE INDEX "instagram_metric_snapshots_tenant_id_integration_id_entity_i_idx" ON "instagram_metric_snapshots"("tenant_id", "integration_id", "entity_id", "metric_name", "collected_at" DESC);

-- CreateIndex
CREATE INDEX "instagram_metric_snapshots_integration_id_collected_at_idx" ON "instagram_metric_snapshots"("integration_id", "collected_at" DESC);

-- CreateIndex
CREATE INDEX "instagram_metric_snapshots_collected_at_idx" ON "instagram_metric_snapshots"("collected_at");

-- CreateIndex
CREATE INDEX "instagram_media_integration_id_is_removed_published_at_idx" ON "instagram_media"("integration_id", "is_removed", "published_at" DESC);

-- AddForeignKey
ALTER TABLE "instagram_metric_snapshots" ADD CONSTRAINT "instagram_metric_snapshots_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "instagram_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instagram_metric_snapshots" ADD CONSTRAINT "instagram_metric_snapshots_sync_job_id_fkey" FOREIGN KEY ("sync_job_id") REFERENCES "instagram_sync_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: instagram_metric_snapshots
ALTER TABLE public.instagram_metric_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_metric_snapshots FORCE ROW LEVEL SECURITY;

CREATE POLICY "instagram_metric_snapshots_tenant_select" ON public.instagram_metric_snapshots
  FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "instagram_metric_snapshots_tenant_insert" ON public.instagram_metric_snapshots
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "instagram_metric_snapshots_tenant_update" ON public.instagram_metric_snapshots
  FOR UPDATE TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "instagram_metric_snapshots_tenant_delete" ON public.instagram_metric_snapshots
  FOR DELETE TO authenticated
  USING (tenant_id = public.current_tenant_id());
