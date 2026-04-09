-- Migration 014: Team member roles (admin, contributor, viewer)

ALTER TABLE account_members
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'contributor'
    CHECK (role IN ('admin', 'contributor', 'viewer'));

-- Back-fill any existing rows (no-op since DEFAULT applies, but be explicit)
UPDATE account_members SET role = 'contributor' WHERE role IS NULL;

-- Allow owners to update member roles
CREATE POLICY "Owner can update member role" ON account_members
  FOR UPDATE USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);
