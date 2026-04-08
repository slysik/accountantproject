-- Migration 009: Customer subfolders under company/year folders

CREATE TABLE IF NOT EXISTS customer_subfolders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name text NOT NULL,
  year text NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, company_name, year, name)
);

ALTER TABLE customer_subfolders ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_customer_subfolders_user_company_year
  ON customer_subfolders(user_id, company_name, year);

CREATE POLICY "Users can CRUD own customer subfolders" ON customer_subfolders
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
