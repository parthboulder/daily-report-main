-- Add superintendent and address columns to the projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS superintendent text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS address text;
