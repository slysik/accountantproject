CREATE TABLE IF NOT EXISTS category_mappings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_label text NOT NULL,
  category_id text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, source_label)
);

ALTER TABLE category_mappings ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_category_mappings_user_id
  ON category_mappings(user_id);

CREATE OR REPLACE FUNCTION set_category_mappings_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_category_mappings_updated_at ON category_mappings;

CREATE TRIGGER trg_category_mappings_updated_at
  BEFORE UPDATE ON category_mappings
  FOR EACH ROW
  EXECUTE FUNCTION set_category_mappings_updated_at();

CREATE POLICY "Users can view own category mappings" ON category_mappings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own category mappings" ON category_mappings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own category mappings" ON category_mappings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own category mappings" ON category_mappings
  FOR DELETE USING (auth.uid() = user_id);
