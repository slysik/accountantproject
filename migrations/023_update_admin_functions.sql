-- Migration 023: Update admin + team functions for multi-tenant account model
-- Rewrites get_admin_account_states() to join via accounts + account_users
-- Updates mark_team_member_enrolled() to set account_id on account_members

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
    a.created_by_user_id AS user_id,
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
    a.created_at AS account_created_at,
    u.last_sign_in_at,
    COALESCE(company_counts.company_count, 0) AS company_count,
    COALESCE(member_counts.active_team_members, 0) AS active_team_members
  FROM accounts a
  JOIN auth.users u
    ON u.id = a.created_by_user_id
  LEFT JOIN subscriptions s
    ON s.account_id = a.id
  LEFT JOIN account_profiles ap
    ON ap.user_id = a.created_by_user_id
  LEFT JOIN (
    SELECT c.account_id, count(*) AS company_count
    FROM companies c
    WHERE c.account_id IS NOT NULL
    GROUP BY c.account_id
  ) company_counts
    ON company_counts.account_id = a.id
  LEFT JOIN (
    SELECT au.account_id, count(*) AS active_team_members
    FROM account_users au
    WHERE au.status = 'active'
      AND au.role != 'owner'
    GROUP BY au.account_id
  ) member_counts
    ON member_counts.account_id = a.id
  WHERE s.status = 'active' OR s.status IS NULL
  ORDER BY a.created_at DESC;
END;
$$;

-- Update mark_team_member_enrolled to also set account_id on account_members
CREATE OR REPLACE FUNCTION mark_team_member_enrolled()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_account_id uuid;
BEGIN
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = auth.uid();

  IF v_email IS NULL THEN
    RETURN;
  END IF;

  -- Set member_user_id on matching account_members rows
  UPDATE account_members
  SET member_user_id = auth.uid()
  WHERE lower(member_email) = lower(v_email)
    AND member_user_id IS NULL;

  -- Also set account_id on account_members rows by looking up
  -- the owner's account via account_users
  UPDATE account_members am
  SET account_id = (
    SELECT au.account_id
    FROM account_users au
    WHERE au.user_id = am.owner_user_id
      AND au.status = 'active'
    LIMIT 1
  )
  WHERE lower(am.member_email) = lower(v_email)
    AND am.account_id IS NULL
    AND am.owner_user_id IS NOT NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_account_states() TO authenticated;
GRANT EXECUTE ON FUNCTION mark_team_member_enrolled() TO authenticated;
