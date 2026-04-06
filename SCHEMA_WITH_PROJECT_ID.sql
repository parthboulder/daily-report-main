-- ===== Complete Schema with project_id Support =====
-- This shows the final state of all tables after migration

-- ===== 1. daily_site_report table (UPDATED) =====
CREATE TABLE public.daily_site_report (
  id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
  date DATE NULL,
  submitted_by TEXT[] NULL,
  projects TEXT[] NULL,  -- LEGACY: kept for backward compatibility
  project_id INTEGER NULL,  -- NEW: direct project reference
  photos JSONB NULL DEFAULT '[]'::jsonb,
  manpower TEXT NULL,
  work_in_progress TEXT NULL,
  work_completed_today TEXT NULL,
  work_planned_tomorrow TEXT NULL,
  deliveries TEXT NULL,
  issues_delays TEXT NULL,
  inspection_today_upcoming_with_status TEXT NULL,
  weather TEXT NULL,
  notes TEXT NULL,
  rfis TEXT NULL,
  change_orders TEXT NULL,
  requests_notices TEXT NULL,
  receipts JSONB NULL DEFAULT '[]'::jsonb,
  receipts_context TEXT NULL,
  include_in_weekly_report BOOLEAN NOT NULL DEFAULT FALSE,
  generate_daily_report BOOLEAN NOT NULL DEFAULT FALSE,
  report_status TEXT NULL,
  report_sent_at TIMESTAMP WITH TIME ZONE NULL,
  airtable_record_id TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  equipment_attachments JSONB NULL DEFAULT '[]'::jsonb,
  CONSTRAINT daily_site_report_pkey PRIMARY KEY (id),
  CONSTRAINT daily_site_report_airtable_record_id_key UNIQUE (airtable_record_id)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_daily_site_report_project
  ON public.daily_site_report USING gin (projects) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_daily_site_report_project_id
  ON public.daily_site_report(project_id) TABLESPACE pg_default;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON daily_site_report
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== 2. manpower table (UPDATED) =====
CREATE TABLE public.manpower (
  id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
  date DATE NULL,
  name TEXT NULL,  -- trade name
  people INTEGER NULL,  -- headcount
  projects TEXT[] NULL,  -- LEGACY: kept for backward compatibility
  project_id INTEGER NULL,  -- NEW: direct project reference
  sufficient_amt_of_manpower TEXT NULL,
  notes TEXT NULL,
  daily_site_report TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT manpower_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_manpower_project
  ON public.manpower USING gin (projects) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_manpower_project_id
  ON public.manpower(project_id) TABLESPACE pg_default;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON manpower
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== 3. deliveries table (UPDATED) =====
CREATE TABLE public.deliveries (
  id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
  name TEXT NULL,
  projects TEXT[] NULL,  -- LEGACY: kept for backward compatibility
  project_id INTEGER NULL,  -- NEW: direct project reference
  delivery_date DATE NULL,
  on_site_receiver TEXT NULL,
  missing_items_damages_everything_received TEXT NULL,
  notes TEXT NULL,
  attachments JSONB NULL DEFAULT '[]'::jsonb,
  daily_site_report TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT deliveries_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_deliveries_project
  ON public.deliveries USING gin (projects) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_deliveries_project_id
  ON public.deliveries(project_id) TABLESPACE pg_default;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== 4. delays table (NEW - with all fields) =====
CREATE TABLE public.delays (
  id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
  delay TEXT NULL,  -- activity/description of delay
  cause_category TEXT NULL,  -- Weather, Permits, Labor, Supply Chain, Quality, Other
  days_impacted INTEGER NULL,  -- number of days
  trade TEXT[] NULL,  -- affected trades
  project_id INTEGER NULL,  -- NEW: direct project reference
  status TEXT NULL,  -- Active, Resolved, etc.
  daily_site_report TEXT NULL,  -- links to daily_site_report.id
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT delays_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_delays_project_id
  ON public.delays(project_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_delays_daily_site_report
  ON public.delays(daily_site_report) TABLESPACE pg_default;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON delays
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== 5. actual_inspections table (UPDATED) =====
CREATE TABLE public.actual_inspections (
  id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
  name TEXT NULL,  -- inspection type
  projects TEXT[] NULL,  -- LEGACY: kept for backward compatibility
  project_id INTEGER NULL,  -- NEW: direct project reference
  result TEXT NULL,  -- Pass, Fail, Partial Pass
  details TEXT NULL,
  actual_date DATE NULL,
  status TEXT NULL,  -- Passed, Failed, Partial
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT actual_inspections_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_actual_inspections_project
  ON public.actual_inspections USING gin (projects) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_actual_inspections_project_id
  ON public.actual_inspections(project_id) TABLESPACE pg_default;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON actual_inspections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== 6. projects table (Reference) =====
-- This should already exist, showing structure for reference
CREATE TABLE public.projects (
  id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
  name TEXT NOT NULL,  -- project code (e.g., 'TPSJ')
  project_name TEXT NULL,  -- full name (e.g., 'TownePlace Suites – Jackson')
  superintendent TEXT NULL,
  address TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_name_unique UNIQUE (name)
) TABLESPACE pg_default;

-- ===== Field Reference for delays table =====
-- The delays table contains all information about project delays:
--
-- delay (TEXT):
--   Description of the delay activity
--   Example: "Concrete delivery delayed"
--
-- cause_category (TEXT):
--   Category of the delay cause
--   Values: 'Weather', 'Permits', 'Labor', 'Supply Chain', 'Quality', 'Other'
--
-- days_impacted (INTEGER):
--   Number of days the schedule is impacted
--   Example: 3
--
-- trade (TEXT[]):
--   Array of trades affected by this delay
--   Example: ['Framing (Wood/Metal)', 'Structural Steel']
--
-- project_id (INTEGER):
--   Foreign key to projects table
--   Links delay to specific project
--
-- status (TEXT):
--   Current status of the delay
--   Values: 'Active', 'Resolved', 'Monitoring'
--
-- daily_site_report (TEXT):
--   Links to daily_site_report.id
--   Tracks which DSR reported this delay
--
-- created_at, updated_at:
--   Timestamps for audit trail
