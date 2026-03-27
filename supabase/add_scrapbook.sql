-- ─────────────────────────────────────────────────────────────────────────────
-- Scrapbook feature
-- Run this in the Supabase SQL editor
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.scrapbook_entries (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  round_id    UUID        NOT NULL REFERENCES public.rounds(id)     ON DELETE CASCADE,
  prompt_text TEXT        NOT NULL,
  group_name  TEXT,
  vote_count  INTEGER,
  total_votes INTEGER,
  round_date  DATE        NOT NULL,
  saved_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent saving the same round twice
  UNIQUE (user_id, round_id)
);

CREATE INDEX IF NOT EXISTS scrapbook_entries_user_id_idx ON public.scrapbook_entries (user_id);
CREATE INDEX IF NOT EXISTS scrapbook_entries_round_id_idx ON public.scrapbook_entries (round_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.scrapbook_entries ENABLE ROW LEVEL SECURITY;

-- Anyone can read scrapbook entries (public profile viewing)
CREATE POLICY "Scrapbook entries are publicly readable"
  ON public.scrapbook_entries FOR SELECT
  USING (true);

-- Only the owner can insert their own entries
CREATE POLICY "Users can insert own scrapbook entries"
  ON public.scrapbook_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only the owner can delete their own entries
CREATE POLICY "Users can delete own scrapbook entries"
  ON public.scrapbook_entries FOR DELETE
  USING (auth.uid() = user_id);
