-- ============================================================
-- Daily Winner — Database Schema
-- Run this in your Supabase SQL editor (Project → SQL Editor)
-- ============================================================

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- TABLES
-- ============================================================

-- User profiles (mirrors auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     TEXT        NOT NULL UNIQUE,
  avatar_color TEXT        NOT NULL DEFAULT '#8b5cf6',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Groups
CREATE TABLE IF NOT EXISTS public.groups (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT,
  invite_code TEXT        NOT NULL UNIQUE,
  created_by  UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Group memberships
CREATE TABLE IF NOT EXISTS public.group_members (
  id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID        NOT NULL REFERENCES public.groups(id)  ON DELETE CASCADE,
  user_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role     TEXT        NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Prompt bank
CREATE TABLE IF NOT EXISTS public.prompts (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  text       TEXT        NOT NULL,
  category   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily rounds (one per group per calendar day)
CREATE TABLE IF NOT EXISTS public.rounds (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID        NOT NULL REFERENCES public.groups(id)  ON DELETE CASCADE,
  prompt_id  UUID        NOT NULL REFERENCES public.prompts(id),
  date       DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, date)
);

-- User submissions per round
CREATE TABLE IF NOT EXISTS public.submissions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id   UUID        NOT NULL REFERENCES public.rounds(id)   ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(round_id, user_id)
);

-- Votes (one per voter per round)
CREATE TABLE IF NOT EXISTS public.votes (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id      UUID        NOT NULL REFERENCES public.rounds(id)      ON DELETE CASCADE,
  voter_id      UUID        NOT NULL REFERENCES public.profiles(id)     ON DELETE CASCADE,
  submission_id UUID        NOT NULL REFERENCES public.submissions(id)  ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(round_id, voter_id)
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_group_members_user   ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group  ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_rounds_group_date    ON public.rounds(group_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_round    ON public.submissions(round_id);
CREATE INDEX IF NOT EXISTS idx_votes_round          ON public.votes(round_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter          ON public.votes(voter_id);


-- ============================================================
-- AUTO-CREATE PROFILE ON SIGN UP (trigger)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  colors TEXT[] := ARRAY['#8b5cf6','#db2777','#059669','#d97706','#2563eb','#0891b2'];
  chosen_color TEXT;
BEGIN
  chosen_color := colors[floor(random() * 6 + 1)::int];

  INSERT INTO public.profiles (id, username, avatar_color)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1)
    ),
    chosen_color
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Drop the trigger if it already exists, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes         ENABLE ROW LEVEL SECURITY;


-- Helper: check membership without triggering RLS recursion
-- SECURITY DEFINER runs outside RLS context so it can safely
-- query group_members without re-entering its own policy.
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


-- Drop all policies before recreating (makes this script re-runnable)
DROP POLICY IF EXISTS "Anyone authenticated can view profiles"          ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile"                    ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"                    ON public.profiles;
DROP POLICY IF EXISTS "Members can view their groups"                   ON public.groups;
DROP POLICY IF EXISTS "Authenticated users can create groups"           ON public.groups;
DROP POLICY IF EXISTS "Group admins can update groups"                  ON public.groups;
DROP POLICY IF EXISTS "Members can view memberships of their groups"    ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups (insert own membership)"   ON public.group_members;
DROP POLICY IF EXISTS "All authenticated users can view prompts"        ON public.prompts;
DROP POLICY IF EXISTS "Group members can view rounds"                   ON public.rounds;
DROP POLICY IF EXISTS "Group members can create rounds"                 ON public.rounds;
DROP POLICY IF EXISTS "Group members can view submissions"              ON public.submissions;
DROP POLICY IF EXISTS "Group members can insert one submission per round" ON public.submissions;
DROP POLICY IF EXISTS "Group members can view votes"                    ON public.votes;
DROP POLICY IF EXISTS "Group members can cast one vote per round"       ON public.votes;


-- Profiles
CREATE POLICY "Anyone authenticated can view profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);


-- Groups
CREATE POLICY "Members can view their groups"
  ON public.groups FOR SELECT
  USING (public.is_group_member(id));

CREATE POLICY "Authenticated users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Group admins can update groups"
  ON public.groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = groups.id AND user_id = auth.uid() AND role = 'admin'
    )
  );


-- Group members
CREATE POLICY "Members can view memberships of their groups"
  ON public.group_members FOR SELECT
  USING (public.is_group_member(group_id));

CREATE POLICY "Users can join groups (insert own membership)"
  ON public.group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- Prompts (read-only for users)
CREATE POLICY "All authenticated users can view prompts"
  ON public.prompts FOR SELECT
  USING (auth.uid() IS NOT NULL);


-- Rounds
CREATE POLICY "Group members can view rounds"
  ON public.rounds FOR SELECT
  USING (public.is_group_member(group_id));

CREATE POLICY "Group members can create rounds"
  ON public.rounds FOR INSERT
  WITH CHECK (public.is_group_member(group_id));


-- Submissions
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


-- Votes
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
