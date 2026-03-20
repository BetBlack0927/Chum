-- ============================================================
-- Migration: Switch from text submissions to person nominations
--
-- The app now asks "Most likely to...?" and group members vote
-- FOR a person in the group rather than submitting text answers.
--
-- Run this in your Supabase SQL Editor.
-- ============================================================

-- Drop old tables (safe — no real data yet)
DROP TABLE IF EXISTS public.votes CASCADE;
-- submissions table may or may not exist depending on your setup
DO $$ BEGIN
  DROP TABLE IF EXISTS public.submissions CASCADE;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Drop old vote policies (table may not exist yet either)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Group members can view votes"              ON public.votes;
  DROP POLICY IF EXISTS "Group members can cast one vote per round" ON public.votes;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;


-- New votes table: each voter nominates one group member per round
CREATE TABLE public.votes (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id          UUID        NOT NULL REFERENCES public.rounds(id)   ON DELETE CASCADE,
  voter_id          UUID        NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  nominated_user_id UUID        NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(round_id, voter_id)   -- one nomination per person per round
);

CREATE INDEX IF NOT EXISTS idx_votes_round   ON public.votes(round_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter   ON public.votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_votes_nominee ON public.votes(nominated_user_id);

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- RLS: group members can see all votes in their rounds
CREATE POLICY "Group members can view votes"
  ON public.votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rounds r
      WHERE r.id = votes.round_id
        AND public.is_group_member(r.group_id)
    )
  );

-- RLS: group members can cast one vote per round (enforced by UNIQUE too)
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


-- Also refresh the prompts with the new "Most likely to..." style
-- (runs the seed file logic inline)
TRUNCATE public.prompts RESTART IDENTITY CASCADE;

INSERT INTO public.prompts (text, category) VALUES
('Most likely to marry for money:', 'classic'),
('Most likely to laugh at their own jokes:', 'classic'),
('Most likely to show up 30 minutes late to everything:', 'classic'),
('Most likely to eat the last slice without asking:', 'classic'),
('Most likely to cry at a movie they have seen 10 times:', 'classic'),
('Most likely to become famous one day:', 'classic'),
('Most likely to survive a zombie apocalypse:', 'classic'),
('Most likely to become a millionaire:', 'classic'),
('Most likely to move to another country:', 'classic'),
('Most likely to write a memoir:', 'classic'),
('Most likely to start a cult:', 'chaos'),
('Most likely to go viral for the wrong reasons:', 'chaos'),
('Most likely to accidentally reply all on an embarrassing email:', 'chaos'),
('Most likely to impulse buy something ridiculous at 2am:', 'chaos'),
('Most likely to get banned from a restaurant:', 'chaos'),
('Most likely to challenge a stranger to a competition and lose:', 'chaos'),
('Most likely to have a meltdown over something tiny:', 'chaos'),
('Most likely to accidentally set off the fire alarm:', 'chaos'),
('Most likely to send a risky text and immediately regret it:', 'chaos'),
('Most likely to get into an argument with a robot customer service bot:', 'chaos'),
('Most likely to overshare on a first date:', 'social'),
('Most likely to pretend they read the book for the meeting:', 'social'),
('Most likely to be the last one to understand a joke:', 'social'),
('Most likely to give unsolicited life advice:', 'social'),
('Most likely to ghost someone after one awkward interaction:', 'social'),
('Most likely to remember everyone''s birthdays without being reminded:', 'social'),
('Most likely to say "I''m five minutes away" when they haven''t left yet:', 'social'),
('Most likely to turn any hangout into a deep philosophical conversation:', 'social'),
('Most likely to know everyone at the party:', 'social'),
('Most likely to leave the party without saying goodbye:', 'social'),
('Most likely to quit their job to follow a random passion:', 'ambition'),
('Most likely to have three side hustles at once:', 'ambition'),
('Most likely to drop everything and go backpacking for a year:', 'ambition'),
('Most likely to be on a reality TV show:', 'ambition'),
('Most likely to end up with a completely unexpected career:', 'ambition'),
('Most likely to peak in their 30s:', 'ambition'),
('Most likely to still be figuring out what they want to do at 40:', 'ambition'),
('Most likely to make a terrible business decision with total confidence:', 'ambition'),
('Most likely to hold a grudge for years over something small:', 'petty'),
('Most likely to order food for the table and eat most of it:', 'petty'),
('Most likely to rewatch the same show five times instead of something new:', 'petty'),
('Most likely to win an argument by being annoyingly right:', 'petty'),
('Most likely to complain about something they could easily fix:', 'petty'),
('Most likely to bring up an old story that nobody else remembers:', 'petty'),
('Most likely to befriend a wild animal:', 'wildcard'),
('Most likely to become a meme:', 'wildcard'),
('Most likely to have a secret talent nobody knows about:', 'wildcard'),
('Most likely to accidentally become the main character of someone else''s story:', 'wildcard'),
('Most likely to have the most chaotic group chat energy:', 'wildcard');
