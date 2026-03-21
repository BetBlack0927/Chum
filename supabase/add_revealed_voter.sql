-- Add a single randomly-revealed voter per round.
-- Stored on the round so the same person stays exposed after being picked.
ALTER TABLE public.rounds
  ADD COLUMN IF NOT EXISTS revealed_voter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
