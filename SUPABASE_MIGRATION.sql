-- ===== Supabase Schema Migration: Add project_id Support =====
-- This migration adds project_id field while maintaining backward compatibility
-- with existing projects[] array data

-- ===== 1. Add project_id column to daily_site_report =====
ALTER TABLE public.daily_site_report
ADD COLUMN project_id INTEGER NULL;

-- ===== 2. Add project_id column to manpower table =====
ALTER TABLE public.manpower
ADD COLUMN project_id INTEGER NULL;

-- ===== 3. Add project_id column to deliveries table =====
ALTER TABLE public.deliveries
ADD COLUMN project_id INTEGER NULL;

-- ===== 4. Add project_id column to delays table =====
-- CREATE TABLE if it doesn't exist with proper structure
CREATE TABLE IF NOT EXISTS public.delays (
  id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
  delay TEXT NULL,
  cause_category TEXT NULL,
  days_impacted INTEGER NULL,
  trade TEXT[] NULL,
  project_id INTEGER NULL,
  status TEXT NULL,
  daily_site_report TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT delays_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- ===== 5. Add project_id column to actual_inspections table =====
ALTER TABLE public.actual_inspections
ADD COLUMN project_id INTEGER NULL;

-- ===== 6. Create foreign key constraints (if projects table exists) =====
-- Uncomment these after verifying projects table structure:
-- ALTER TABLE public.daily_site_report
-- ADD CONSTRAINT fk_daily_site_report_project_id
-- FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

-- ALTER TABLE public.manpower
-- ADD CONSTRAINT fk_manpower_project_id
-- FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

-- ALTER TABLE public.deliveries
-- ADD CONSTRAINT fk_deliveries_project_id
-- FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

-- ALTER TABLE public.delays
-- ADD CONSTRAINT fk_delays_project_id
-- FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

-- ALTER TABLE public.actual_inspections
-- ADD CONSTRAINT fk_actual_inspections_project_id
-- FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

-- ===== 7. Data Migration: Populate project_id from projects[] array =====
-- This queries the projects table to get IDs from project codes

-- For daily_site_report
UPDATE public.daily_site_report dsr
SET project_id = (
  SELECT p.id
  FROM public.projects p
  WHERE p.name = (dsr.projects[1])::TEXT
  LIMIT 1
)
WHERE dsr.projects IS NOT NULL
  AND array_length(dsr.projects, 1) > 0
  AND dsr.project_id IS NULL;

-- For manpower
UPDATE public.manpower m
SET project_id = (
  SELECT p.id
  FROM public.projects p
  WHERE p.name = (m.projects[1])::TEXT
  LIMIT 1
)
WHERE m.projects IS NOT NULL
  AND array_length(m.projects, 1) > 0
  AND m.project_id IS NULL;

-- For deliveries
UPDATE public.deliveries d
SET project_id = (
  SELECT p.id
  FROM public.projects p
  WHERE p.name = (d.projects[1])::TEXT
  LIMIT 1
)
WHERE d.projects IS NOT NULL
  AND array_length(d.projects, 1) > 0
  AND d.project_id IS NULL;

-- For actual_inspections
UPDATE public.actual_inspections ai
SET project_id = (
  SELECT p.id
  FROM public.projects p
  WHERE p.name = (ai.projects[1])::TEXT
  LIMIT 1
)
WHERE ai.projects IS NOT NULL
  AND array_length(ai.projects, 1) > 0
  AND ai.project_id IS NULL;

-- ===== 8. Create indexes for better query performance =====
CREATE INDEX IF NOT EXISTS idx_daily_site_report_project_id
  ON public.daily_site_report(project_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_manpower_project_id
  ON public.manpower(project_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_deliveries_project_id
  ON public.deliveries(project_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_delays_project_id
  ON public.delays(project_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_actual_inspections_project_id
  ON public.actual_inspections(project_id) TABLESPACE pg_default;

-- ===== 9. Keep old projects[] array for backward compatibility =====
-- Do NOT drop the projects column yet - keep it for fallback queries
-- After confirming the migration works, you can remove it in a future migration

-- ===== 10. Update Triggers =====
-- Ensure updated_at is set on all tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all relevant tables
DROP TRIGGER IF EXISTS set_updated_at ON public.manpower;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.manpower
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.deliveries;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.deliveries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.delays;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.delays
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.actual_inspections;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.actual_inspections
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== 11. Verification Queries =====
-- Run these to verify migration success:
-- SELECT COUNT(*) as total_reports, COUNT(project_id) as with_project_id FROM public.daily_site_report;
-- SELECT COUNT(*) as total_manpower, COUNT(project_id) as with_project_id FROM public.manpower;
-- SELECT COUNT(*) as total_deliveries, COUNT(project_id) as with_project_id FROM public.deliveries;
-- SELECT COUNT(*) as total_delays, COUNT(project_id) as with_project_id FROM public.delays;
-- SELECT COUNT(*) as total_inspections, COUNT(project_id) as with_project_id FROM public.actual_inspections;

-- ===== 12. Rollback Plan (if needed) =====
-- If you need to rollback, just remove the project_id columns:
-- ALTER TABLE public.daily_site_report DROP COLUMN project_id;
-- ALTER TABLE public.manpower DROP COLUMN project_id;
-- ALTER TABLE public.deliveries DROP COLUMN project_id;
-- ALTER TABLE public.delays DROP COLUMN project_id;
-- ALTER TABLE public.actual_inspections DROP COLUMN project_id;
-- DROP TABLE IF EXISTS public.delays; -- only if newly created
