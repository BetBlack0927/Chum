-- ============================================================
-- Fix: infinite recursion in group_members RLS policy
-- 
-- Root cause: the group_members SELECT policy used EXISTS(SELECT
-- FROM group_members ...) which re-triggers itself recursively.
--
-- Fix: replace all self-referencing policies with a SECURITY
-- DEFINER helper function that runs outside RLS context.
-- ============================================================


-- ── 1. Helper function (runs with elevated perms, bypasses RLS) ──

CREATE OR REPLACE FUNCTION public.is_group_member(gid UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = gid AND user_id = auth.uid()
  );
$$;


-- ── 2. Drop the recursive policies ──

DROP POLICY IF EXISTS "Members can view memberships of their groups"  ON public.group_members;
DROP POLICY IF EXISTS "Members can view their groups"                  ON public.groups;
DROP POLICY IF EXISTS "Group admins can update groups"                 ON public.groups;
DROP POLICY IF EXISTS "Group members can view rounds"                  ON public.rounds;
DROP POLICY IF EXISTS "Group members can create rounds"                ON public.rounds;
DROP POLICY IF EXISTS "Group members can view submissions"             ON public.submissions;
DROP POLICY IF EXISTS "Group members can insert one submission per round" ON public.submissions;
DROP POLICY IF EXISTS "Group members can view votes"                   ON public.votes;
DROP POLICY IF EXISTS "Group members can cast one vote per round"      ON public.votes;


-- ── 3. Recreate all policies using the safe helper ──

-- group_members: users can see all members of any group they belong to
CREATE POLICY "Members can view memberships of their groups"
  ON public.group_members FOR SELECT
  USING (public.is_group_member(group_id));

-- groups: members can see their own groups
CREATE POLICY "Members can view their groups"
  ON public.groups FOR SELECT
  USING (public.is_group_member(id));

CREATE POLICY "Group admins can update groups"
  ON public.groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = groups.id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- rounds
CREATE POLICY "Group members can view rounds"
  ON public.rounds FOR SELECT
  USING (public.is_group_member(group_id));

CREATE POLICY "Group members can create rounds"
  ON public.rounds FOR INSERT
  WITH CHECK (public.is_group_member(group_id));

-- submissions
CREATE POLICY "Group members can view submissions"
  ON public.submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rounds r
      WHERE r.id = submissions.round_id
        AND public.is_group_member(r.group_id)
    )
  );

CREATE POLICY "Group members can insert one submission per round"
  ON public.submissions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.rounds r
      WHERE r.id = round_id
        AND public.is_group_member(r.group_id)
    )
  );

-- votes
CREATE POLICY "Group members can view votes"
  ON public.votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rounds r
      WHERE r.id = votes.round_id
        AND public.is_group_member(r.group_id)
    )
  );

CREATE POLICY "Group members can cast one vote per round"
  ON public.votes FOR INSERT
  WITH CHECK (
    auth.uid() = voter_id
    AND EXISTS (
      SELECT 1 FROM public.rounds r
      WHERE r.id = round_id
        AND public.is_group_member(r.group_id)
    )
  );
