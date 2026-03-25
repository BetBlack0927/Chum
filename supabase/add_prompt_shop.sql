-- ============================================================
-- Prompt Shop — Migration
-- Run this in your Supabase SQL Editor
-- Safe to re-run (all guards use IF NOT EXISTS / IF EXISTS)
-- ============================================================

-- ── 1. Extend existing tables ──────────────────────────────

-- Add bio to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add creator ownership, visibility, and description to prompts
-- Existing seeded prompts keep creator_id = NULL (system prompts)
ALTER TABLE public.prompts
  ADD COLUMN IF NOT EXISTS creator_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS visibility  TEXT NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Add visibility check constraint (safe to add if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'prompts_visibility_check' AND conrelid = 'public.prompts'::regclass
  ) THEN
    ALTER TABLE public.prompts
      ADD CONSTRAINT prompts_visibility_check CHECK (visibility IN ('public', 'private'));
  END IF;
END$$;


-- ── 2. New tables ──────────────────────────────────────────

-- Prompt packs (named collections of prompts)
CREATE TABLE IF NOT EXISTS public.prompt_packs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  description TEXT,
  visibility  TEXT        NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Junction: prompts inside a pack
CREATE TABLE IF NOT EXISTS public.pack_prompts (
  pack_id   UUID NOT NULL REFERENCES public.prompt_packs(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES public.prompts(id)      ON DELETE CASCADE,
  position  INT  NOT NULL DEFAULT 0,
  PRIMARY KEY (pack_id, prompt_id)
);

-- Follow relationships between creators
CREATE TABLE IF NOT EXISTS public.creator_follows (
  follower_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Saved individual prompts per user
CREATE TABLE IF NOT EXISTS public.saved_prompts (
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt_id  UUID        NOT NULL REFERENCES public.prompts(id)  ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, prompt_id)
);

-- Saved packs per user
CREATE TABLE IF NOT EXISTS public.saved_packs (
  user_id    UUID        NOT NULL REFERENCES public.profiles(id)     ON DELETE CASCADE,
  pack_id    UUID        NOT NULL REFERENCES public.prompt_packs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, pack_id)
);

-- Prompts assigned to a group from the Shop (used in round selection)
CREATE TABLE IF NOT EXISTS public.group_prompts (
  group_id   UUID        NOT NULL REFERENCES public.groups(id)   ON DELETE CASCADE,
  prompt_id  UUID        NOT NULL REFERENCES public.prompts(id)  ON DELETE CASCADE,
  added_by   UUID                 REFERENCES public.profiles(id) ON DELETE SET NULL,
  added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, prompt_id)
);


-- ── 3. Indexes ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_prompts_creator       ON public.prompts(creator_id);
CREATE INDEX IF NOT EXISTS idx_prompt_packs_creator  ON public.prompt_packs(creator_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower      ON public.creator_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following     ON public.creator_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_saved_prompts_user    ON public.saved_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_packs_user      ON public.saved_packs(user_id);
CREATE INDEX IF NOT EXISTS idx_group_prompts_group   ON public.group_prompts(group_id);


-- ── 4. Row Level Security ──────────────────────────────────

-- Enable RLS on all new tables
ALTER TABLE public.prompt_packs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_prompts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_prompts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_packs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_prompts   ENABLE ROW LEVEL SECURITY;


-- ── prompts: replace the read-all policy with visibility-aware one ──

DROP POLICY IF EXISTS "All authenticated users can view prompts"           ON public.prompts;
DROP POLICY IF EXISTS "Users can view public prompts or own private prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can create their own prompts"                 ON public.prompts;
DROP POLICY IF EXISTS "Users can update their own prompts"                 ON public.prompts;
DROP POLICY IF EXISTS "Users can delete their own prompts"                 ON public.prompts;

CREATE POLICY "Users can view public prompts or own private prompts"
  ON public.prompts FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      creator_id IS NULL           -- system prompt
      OR visibility = 'public'     -- public user prompt
      OR creator_id = auth.uid()   -- own private prompt
    )
  );

CREATE POLICY "Users can create their own prompts"
  ON public.prompts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND creator_id = auth.uid());

CREATE POLICY "Users can update their own prompts"
  ON public.prompts FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "Users can delete their own prompts"
  ON public.prompts FOR DELETE
  USING (creator_id = auth.uid());


-- ── prompt_packs policies ──

DROP POLICY IF EXISTS "Users can view public packs or own private packs"  ON public.prompt_packs;
DROP POLICY IF EXISTS "Users can create their own packs"                  ON public.prompt_packs;
DROP POLICY IF EXISTS "Users can update their own packs"                  ON public.prompt_packs;
DROP POLICY IF EXISTS "Users can delete their own packs"                  ON public.prompt_packs;

CREATE POLICY "Users can view public packs or own private packs"
  ON public.prompt_packs FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (visibility = 'public' OR creator_id = auth.uid())
  );

CREATE POLICY "Users can create their own packs"
  ON public.prompt_packs FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own packs"
  ON public.prompt_packs FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own packs"
  ON public.prompt_packs FOR DELETE
  USING (auth.uid() = creator_id);


-- ── pack_prompts policies ──

DROP POLICY IF EXISTS "Users can view pack prompts for accessible packs"  ON public.pack_prompts;
DROP POLICY IF EXISTS "Pack owners can insert pack prompts"               ON public.pack_prompts;
DROP POLICY IF EXISTS "Pack owners can delete pack prompts"               ON public.pack_prompts;

CREATE POLICY "Users can view pack prompts for accessible packs"
  ON public.pack_prompts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.prompt_packs pp
      WHERE pp.id = pack_id
        AND (pp.visibility = 'public' OR pp.creator_id = auth.uid())
    )
  );

CREATE POLICY "Pack owners can insert pack prompts"
  ON public.pack_prompts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.prompt_packs pp
      WHERE pp.id = pack_id AND pp.creator_id = auth.uid()
    )
  );

CREATE POLICY "Pack owners can delete pack prompts"
  ON public.pack_prompts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.prompt_packs pp
      WHERE pp.id = pack_id AND pp.creator_id = auth.uid()
    )
  );


-- ── creator_follows policies ──

DROP POLICY IF EXISTS "Authenticated users can view follows"  ON public.creator_follows;
DROP POLICY IF EXISTS "Users can follow others"               ON public.creator_follows;
DROP POLICY IF EXISTS "Users can unfollow"                    ON public.creator_follows;

CREATE POLICY "Authenticated users can view follows"
  ON public.creator_follows FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can follow others"
  ON public.creator_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON public.creator_follows FOR DELETE
  USING (auth.uid() = follower_id);


-- ── saved_prompts policies ──

DROP POLICY IF EXISTS "Users can view their saved prompts"  ON public.saved_prompts;
DROP POLICY IF EXISTS "Users can save prompts"              ON public.saved_prompts;
DROP POLICY IF EXISTS "Users can unsave prompts"            ON public.saved_prompts;

CREATE POLICY "Users can view their saved prompts"
  ON public.saved_prompts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save prompts"
  ON public.saved_prompts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave prompts"
  ON public.saved_prompts FOR DELETE
  USING (auth.uid() = user_id);


-- ── saved_packs policies ──

DROP POLICY IF EXISTS "Users can view their saved packs"  ON public.saved_packs;
DROP POLICY IF EXISTS "Users can save packs"              ON public.saved_packs;
DROP POLICY IF EXISTS "Users can unsave packs"            ON public.saved_packs;

CREATE POLICY "Users can view their saved packs"
  ON public.saved_packs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save packs"
  ON public.saved_packs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave packs"
  ON public.saved_packs FOR DELETE
  USING (auth.uid() = user_id);


-- ── group_prompts policies ──

DROP POLICY IF EXISTS "Group members can view group prompts"         ON public.group_prompts;
DROP POLICY IF EXISTS "Group members can add prompts to their groups" ON public.group_prompts;
DROP POLICY IF EXISTS "Group members can remove group prompts"       ON public.group_prompts;

CREATE POLICY "Group members can view group prompts"
  ON public.group_prompts FOR SELECT
  USING (public.is_group_member(group_id));

CREATE POLICY "Group members can add prompts to their groups"
  ON public.group_prompts FOR INSERT
  WITH CHECK (public.is_group_member(group_id) AND auth.uid() = added_by);

CREATE POLICY "Group members can remove group prompts"
  ON public.group_prompts FOR DELETE
  USING (public.is_group_member(group_id));
