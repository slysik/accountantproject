-- Migration 015: Single-use invite tokens

ALTER TABLE account_members
  ADD COLUMN IF NOT EXISTS invite_token uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS invite_token_used_at timestamptz;

-- Back-fill existing rows
UPDATE account_members SET invite_token = gen_random_uuid() WHERE invite_token IS NULL;

-- Unique index for fast token lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_account_members_invite_token
  ON account_members(invite_token) WHERE invite_token IS NOT NULL;

-- ── Public RPC to validate an invite token (no auth required) ──────────────
-- Returns: valid, member_email, already_used
CREATE OR REPLACE FUNCTION check_invite_token(p_token uuid)
RETURNS TABLE(valid boolean, member_email text, already_used boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row account_members%ROWTYPE;
BEGIN
  SELECT * INTO v_row
  FROM account_members
  WHERE invite_token = p_token;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false::boolean, NULL::text, false::boolean;
    RETURN;
  END IF;

  -- Already consumed
  IF v_row.invite_token_used_at IS NOT NULL THEN
    RETURN QUERY SELECT false::boolean, v_row.member_email, true::boolean;
    RETURN;
  END IF;

  -- Expired (older than 1 hour without being used)
  IF v_row.invited_at < now() - interval '1 hour' THEN
    RETURN QUERY SELECT false::boolean, v_row.member_email, false::boolean;
    RETURN;
  END IF;

  RETURN QUERY SELECT true::boolean, v_row.member_email, false::boolean;
END;
$$;

GRANT EXECUTE ON FUNCTION check_invite_token(uuid) TO anon, authenticated;

-- ── Updated mark_team_member_enrolled — also marks token as used ───────────
CREATE OR REPLACE FUNCTION mark_team_member_enrolled()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS NULL THEN RETURN; END IF;

  UPDATE account_members
  SET
    member_user_id = auth.uid(),
    invite_token_used_at = COALESCE(invite_token_used_at, now())
  WHERE lower(member_email) = lower(v_email)
    AND member_user_id IS NULL;
END;
$$;
