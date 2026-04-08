ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_companies_user_deleted_at
  ON companies(user_id, deleted_at);
