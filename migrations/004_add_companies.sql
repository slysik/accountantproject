-- Migration 004: Add company-level folder organization

CREATE TABLE IF NOT EXISTS companies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, name)
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own companies" ON companies
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS company_name text;

UPDATE expenses
SET company_name = 'My Company'
WHERE company_name IS NULL;

ALTER TABLE expenses
  ALTER COLUMN company_name SET NOT NULL;

ALTER TABLE folders
  ADD COLUMN IF NOT EXISTS company_name text;

UPDATE folders
SET company_name = 'My Company'
WHERE company_name IS NULL;

ALTER TABLE folders
  ALTER COLUMN company_name SET NOT NULL;

ALTER TABLE folders
  DROP CONSTRAINT IF EXISTS folders_user_id_year_key;

ALTER TABLE folders
  ADD CONSTRAINT folders_user_id_company_name_year_key UNIQUE (user_id, company_name, year);

CREATE INDEX IF NOT EXISTS idx_expenses_user_company_year_month
  ON expenses(user_id, company_name, year, month);

CREATE INDEX IF NOT EXISTS idx_folders_user_company_year
  ON folders(user_id, company_name, year);

INSERT INTO companies (user_id, name)
SELECT DISTINCT user_id, company_name
FROM expenses
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO companies (user_id, name)
SELECT DISTINCT user_id, company_name
FROM folders
ON CONFLICT (user_id, name) DO NOTHING;
