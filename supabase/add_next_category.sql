-- ============================================================
-- Migration: Winner picks next round's category
--
-- Adds a `next_category` column to rounds.
-- The winner of a round can set this during the results phase.
-- The next day's round creation reads this when picking a prompt.
-- ============================================================

ALTER TABLE public.rounds
  ADD COLUMN IF NOT EXISTS next_category TEXT DEFAULT NULL;

-- Optional constraint: only allow known category values (or NULL for "not chosen yet")
-- We keep it as free text so adding new categories needs no migration.
-- The app code enforces valid values.

COMMENT ON COLUMN public.rounds.next_category IS
  'Category chosen by the winner for the NEXT round. NULL = not chosen yet (defaults to random).';
