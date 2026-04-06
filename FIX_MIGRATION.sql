-- Check if columns exist before adding
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'daily_site_report' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE public.daily_site_report ADD COLUMN project_id INTEGER NULL;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'manpower' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE public.manpower ADD COLUMN project_id INTEGER NULL;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'deliveries' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE public.deliveries ADD COLUMN project_id INTEGER NULL;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'actual_inspections' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE public.actual_inspections ADD COLUMN project_id INTEGER NULL;
  END IF;
END
$$;

-- Create delays table if it doesn't exist
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
);

-- Migrate data from projects[] to project_id for daily_site_report
UPDATE public.daily_site_report dsr
SET project_id = (
  SELECT p.id FROM public.projects p 
  WHERE p.name = (dsr.projects[1])::TEXT 
  LIMIT 1
)
WHERE dsr.projects IS NOT NULL 
  AND array_length(dsr.projects, 1) > 0 
  AND dsr.project_id IS NULL;

-- Migrate data for manpower
UPDATE public.manpower m
SET project_id = (
  SELECT p.id FROM public.projects p 
  WHERE p.name = (m.projects[1])::TEXT 
  LIMIT 1
)
WHERE m.projects IS NOT NULL 
  AND array_length(m.projects, 1) > 0 
  AND m.project_id IS NULL;

-- Migrate data for deliveries
UPDATE public.deliveries d
SET project_id = (
  SELECT p.id FROM public.projects p 
  WHERE p.name = (d.projects[1])::TEXT 
  LIMIT 1
)
WHERE d.projects IS NOT NULL 
  AND array_length(d.projects, 1) > 0 
  AND d.project_id IS NULL;

-- Migrate data for actual_inspections
UPDATE public.actual_inspections ai
SET project_id = (
  SELECT p.id FROM public.projects p 
  WHERE p.name = (ai.projects[1])::TEXT 
  LIMIT 1
)
WHERE ai.projects IS NOT NULL 
  AND array_length(ai.projects, 1) > 0 
  AND ai.project_id IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_daily_site_report_project_id 
  ON public.daily_site_report(project_id);

CREATE INDEX IF NOT EXISTS idx_manpower_project_id 
  ON public.manpower(project_id);

CREATE INDEX IF NOT EXISTS idx_deliveries_project_id 
  ON public.deliveries(project_id);

CREATE INDEX IF NOT EXISTS idx_delays_project_id 
  ON public.delays(project_id);

CREATE INDEX IF NOT EXISTS idx_actual_inspections_project_id 
  ON public.actual_inspections(project_id);

-- Verify migration
SELECT 
  'daily_site_report' as table_name,
  COUNT(*) as total,
  COUNT(project_id) as with_project_id,
  ROUND(100.0 * COUNT(project_id) / COUNT(*), 1) as percentage
FROM public.daily_site_report
UNION ALL
SELECT 
  'manpower',
  COUNT(*),
  COUNT(project_id),
  ROUND(100.0 * COUNT(project_id) / COUNT(*), 1)
FROM public.manpower
UNION ALL
SELECT 
  'deliveries',
  COUNT(*),
  COUNT(project_id),
  ROUND(100.0 * COUNT(project_id) / COUNT(*), 1)
FROM public.deliveries
UNION ALL
SELECT 
  'delays',
  COUNT(*),
  COUNT(project_id),
  ROUND(100.0 * COUNT(project_id) / COUNT(*), 1)
FROM public.delays
UNION ALL
SELECT 
  'actual_inspections',
  COUNT(*),
  COUNT(project_id),
  ROUND(100.0 * COUNT(project_id) / COUNT(*), 1)
FROM public.actual_inspections;
