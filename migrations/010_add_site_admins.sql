-- Migration 010: Site-wide admin access for master administrative dashboard

CREATE TABLE IF NOT EXISTS site_admins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id),
  UNIQUE(email)
);

ALTER TABLE site_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site admins can view own mapping" ON site_admins
  FOR SELECT USING (auth.uid() = user_id);

INSERT INTO site_admins (user_id, email)
SELECT id, lower(email)
FROM auth.users
WHERE lower(email) = 'vic@alpina.net'
ON CONFLICT (user_id) DO UPDATE
SET email = EXCLUDED.email;

CREATE OR REPLACE FUNCTION public.is_site_admin(p_user_id uuid, p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.site_admins sa
    WHERE sa.user_id = p_user_id
       OR lower(sa.email) = lower(coalesce(p_email, ''))
  );
$$;

CREATE OR REPLACE FUNCTION public.get_admin_account_states()
RETURNS TABLE (
  user_id uuid,
  email text,
  account_name text,
  first_name text,
  business_name text,
  contact_email text,
  phone text,
  plan text,
  status text,
  trial_ends_at timestamptz,
  plan_expires_at timestamptz,
  account_created_at timestamptz,
  last_sign_in_at timestamptz,
  company_count bigint,
  active_team_members bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_site_admin(auth.uid(), lower(coalesce(auth.jwt()->>'email', ''))) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    s.user_id,
    lower(u.email) AS email,
    ap.account_name,
    ap.first_name,
    ap.business_name,
    ap.contact_email,
    ap.phone,
    s.plan,
    s.status,
    s.trial_ends_at,
    s.plan_expires_at,
    s.created_at AS account_created_at,
    u.last_sign_in_at,
    COALESCE(company_counts.company_count, 0) AS company_count,
    COALESCE(member_counts.active_team_members, 0) AS active_team_members
  FROM subscriptions s
  JOIN auth.users u
    ON u.id = s.user_id
  LEFT JOIN account_profiles ap
    ON ap.user_id = s.user_id
  LEFT JOIN (
    SELECT c.user_id, count(*) AS company_count
    FROM companies c
    GROUP BY c.user_id
  ) company_counts
    ON company_counts.user_id = s.user_id
  LEFT JOIN (
    SELECT am.owner_user_id, count(*) AS active_team_members
    FROM account_members am
    GROUP BY am.owner_user_id
  ) member_counts
    ON member_counts.owner_user_id = s.user_id
  WHERE s.status = 'active'
  ORDER BY s.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_site_admin(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_account_states() TO authenticated;
