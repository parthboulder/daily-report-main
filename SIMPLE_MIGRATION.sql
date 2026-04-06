-- STEP 1: Add project_id columns (one at a time)
ALTER TABLE public.daily_site_report ADD COLUMN IF NOT EXISTS project_id INTEGER NULL;
ALTER TABLE public.manpower ADD COLUMN IF NOT EXISTS project_id INTEGER NULL;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS project_id INTEGER NULL;
ALTER TABLE public.actual_inspections ADD COLUMN IF NOT EXISTS project_id INTEGER NULL;

-- STEP 2: Create delays table
CREATE TABLE IF NOT EXISTS public.delays (
  id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
  delay TEXT NULL,
  cause_category TEXT NULL,
  days_impacted INTEGER NULL,
  trade TEXT[] NULL,
  project_id INTEGER NULL,
  status TEXT NULL,
  daily_site_report TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- STEP 3: Populate project_id from projects[] array
-- For daily_site_report
UPDATE public.daily_site_report dsr
SET project_id = p.id
FROM public.projects p
WHERE dsr.projects IS NOT NULL
  AND dsr.projects[1] IS NOT NULL
  AND p.name = dsr.projects[1];

-- For manpower
UPDATE public.manpower m
SET project_id = p.id
FROM public.projects p
WHERE m.projects IS NOT NULL
  AND m.projects[1] IS NOT NULL
  AND p.name = m.projects[1];

-- For deliveries
UPDATE public.deliveries d
SET project_id = p.id
FROM public.projects p
WHERE d.projects IS NOT NULL
  AND d.projects[1] IS NOT NULL
  AND p.name = d.projects[1];

-- For actual_inspections
UPDATE public.actual_inspections ai
SET project_id = p.id
FROM public.projects p
WHERE ai.projects IS NOT NULL
  AND ai.projects[1] IS NOT NULL
  AND p.name = ai.projects[1];

-- STEP 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_dsr_project_id ON public.daily_site_report(project_id);
CREATE INDEX IF NOT EXISTS idx_manpower_project_id ON public.manpower(project_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_project_id ON public.deliveries(project_id);
CREATE INDEX IF NOT EXISTS idx_delays_project_id ON public.delays(project_id);
CREATE INDEX IF NOT EXISTS idx_inspections_project_id ON public.actual_inspections(project_id);
