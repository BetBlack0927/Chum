-- Track whether a group has used its one daily prompt reroll.
-- Once set to TRUE it cannot be reset until the next day's round.
ALTER TABLE public.rounds
  ADD COLUMN IF NOT EXISTS prompt_rerolled BOOLEAN NOT NULL DEFAULT FALSE;
