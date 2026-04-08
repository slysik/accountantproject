-- Migration 008: Account profile details for settings/contact information

CREATE TABLE IF NOT EXISTS account_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_name text,
  first_name text,
  last_name text,
  business_name text,
  contact_email text,
  phone text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state_region text,
  postal_code text,
  country text,
  website text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE account_profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_account_profiles_user_id
  ON account_profiles(user_id);

CREATE OR REPLACE FUNCTION set_account_profiles_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_account_profiles_updated_at ON account_profiles;

CREATE TRIGGER trg_account_profiles_updated_at
  BEFORE UPDATE ON account_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_account_profiles_updated_at();

CREATE POLICY "Users can view own account profile" ON account_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own account profile" ON account_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own account profile" ON account_profiles
  FOR UPDATE USING (auth.uid() = user_id);
