-- Add optional anonymous comment to votes
ALTER TABLE public.votes
  ADD COLUMN IF NOT EXISTS comment TEXT DEFAULT NULL;

-- Enforce max length at the database level
DO $$ BEGIN
  ALTER TABLE public.votes
    ADD CONSTRAINT votes_comment_length
    CHECK (comment IS NULL OR length(trim(comment)) <= 80);
EXCEPTION
  WHEN duplicate_object THEN NULL; -- constraint already exists, skip
END $$;
