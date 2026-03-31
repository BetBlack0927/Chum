-- ============================================================
-- Scrapbook entries — winning moments saved to user profiles
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.scrapbook_entries (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  round_id    UUID        NOT NULL REFERENCES public.rounds(id)   ON DELETE CASCADE,
  prompt_text TEXT        NOT NULL,
  group_name  TEXT,
  vote_count  INTEGER     NOT NULL DEFAULT 0,
  total_votes INTEGER     NOT NULL DEFAULT 0,
  round_date  DATE        NOT NULL,
  saved_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, round_id)
);

CREATE INDEX IF NOT EXISTS idx_scrapbook_user_saved
  ON public.scrapbook_entries(user_id, saved_at DESC);

ALTER TABLE public.scrapbook_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view scrapbook entries" ON public.scrapbook_entries;
DROP POLICY IF EXISTS "Users can insert own scrapbook entries"         ON public.scrapbook_entries;
DROP POLICY IF EXISTS "Users can delete own scrapbook entries"         ON public.scrapbook_entries;

CREATE POLICY "Authenticated users can view scrapbook entries"
  ON public.scrapbook_entries FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert own scrapbook entries"
  ON public.scrapbook_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scrapbook entries"
  ON public.scrapbook_entries FOR DELETE
  USING (auth.uid() = user_id);
