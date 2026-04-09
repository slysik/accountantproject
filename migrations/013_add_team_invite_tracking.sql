-- Migration 013: Team invite tracking — invited_at timestamp + enrollment detection

-- Add invited_at so we can enforce 24-hour invite expiry independently of created_at
ALTER TABLE account_members
  ADD COLUMN IF NOT EXISTS invited_at timestamptz DEFAULT now();

-- Back-fill existing rows
UPDATE account_members SET invited_at = created_at WHERE invited_at IS NULL;

-- RPC: a signed-in user marks themselves as enrolled in any pending invitation
-- SECURITY DEFINER so it can read auth.users to match on email
CREATE OR REPLACE FUNCTION mark_team_member_enrolled()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = auth.uid();

  IF v_email IS NULL THEN
    RETURN;
  END IF;

  UPDATE account_members
  SET member_user_id = auth.uid()
  WHERE lower(member_email) = lower(v_email)
    AND member_user_id IS NULL;
END;
$$;

-- Allow any authenticated user to call it (they can only update rows
-- matching their own email thanks to the WHERE clause above)
GRANT EXECUTE ON FUNCTION mark_team_member_enrolled() TO authenticated;
