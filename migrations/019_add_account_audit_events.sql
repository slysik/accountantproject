CREATE TABLE IF NOT EXISTS account_audit_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text NOT NULL,
  company_name text,
  event_type text NOT NULL CHECK (event_type IN ('login', 'import')),
  event_title text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE account_audit_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_account_audit_events_owner_created
  ON account_audit_events(owner_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_account_audit_events_owner_company
  ON account_audit_events(owner_user_id, company_name);

DROP POLICY IF EXISTS "Owners and team admins can view audit events" ON account_audit_events;
DROP POLICY IF EXISTS "Owners and enrolled members can insert audit events" ON account_audit_events;

CREATE POLICY "Owners and team admins can view audit events" ON account_audit_events
  FOR SELECT USING (
    auth.uid() = owner_user_id
    OR EXISTS (
      SELECT 1
      FROM account_members am
      WHERE am.owner_user_id = account_audit_events.owner_user_id
        AND am.member_user_id = auth.uid()
        AND am.role = 'admin'
    )
  );

CREATE POLICY "Owners and enrolled members can insert audit events" ON account_audit_events
  FOR INSERT WITH CHECK (
    (
      auth.uid() = owner_user_id
      AND actor_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM account_members am
      WHERE am.owner_user_id = account_audit_events.owner_user_id
        AND am.member_user_id = auth.uid()
        AND actor_user_id = auth.uid()
    )
  );
