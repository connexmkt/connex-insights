-- CreateEnum
DO $$
BEGIN
  CREATE TYPE "InstagramReportType" AS ENUM ('WEEKLY', 'MONTHLY');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$
BEGIN
  CREATE TYPE "InstagramPendingReportStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "instagram_pending_reports" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "report_type" "InstagramReportType" NOT NULL,
    "source_report_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "week" INTEGER,
    "period_start" TIMESTAMPTZ(6) NOT NULL,
    "period_end" TIMESTAMPTZ(6) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "InstagramPendingReportStatus" NOT NULL DEFAULT 'PENDING',
    "generated_at" TIMESTAMPTZ(6) NOT NULL,
    "sent_at" TIMESTAMPTZ(6),
    "failure_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "instagram_pending_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "instagram_pending_reports_source_report_id_key"
  ON "instagram_pending_reports"("source_report_id");

CREATE INDEX IF NOT EXISTS "instagram_pending_reports_tenant_id_report_type_status_idx"
  ON "instagram_pending_reports"("tenant_id", "report_type", "status");

-- RLS: instagram_pending_reports
ALTER TABLE public.instagram_pending_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_pending_reports FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "instagram_pending_reports_tenant_select"
  ON public.instagram_pending_reports;
DROP POLICY IF EXISTS "instagram_pending_reports_tenant_insert"
  ON public.instagram_pending_reports;
DROP POLICY IF EXISTS "instagram_pending_reports_tenant_update"
  ON public.instagram_pending_reports;
DROP POLICY IF EXISTS "instagram_pending_reports_tenant_delete"
  ON public.instagram_pending_reports;

CREATE POLICY "instagram_pending_reports_tenant_select"
  ON public.instagram_pending_reports
  FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "instagram_pending_reports_tenant_insert"
  ON public.instagram_pending_reports
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "instagram_pending_reports_tenant_update"
  ON public.instagram_pending_reports
  FOR UPDATE TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "instagram_pending_reports_tenant_delete"
  ON public.instagram_pending_reports
  FOR DELETE TO authenticated
  USING (tenant_id = public.current_tenant_id());
