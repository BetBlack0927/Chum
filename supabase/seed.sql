-- ============================================================
-- Daily Winner — Seed Data (50 "Most Likely To..." prompts)
-- Run AFTER schema.sql in your Supabase SQL editor
-- ============================================================

TRUNCATE public.prompts RESTART IDENTITY CASCADE;

INSERT INTO public.prompts (text, category) VALUES

-- Classic social judgments
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

-- Chaos & unhinged
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

-- Social & personality
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

-- Ambition & life choices
('Most likely to quit their job to follow a random passion:', 'ambition'),
('Most likely to have three side hustles at once:', 'ambition'),
('Most likely to drop everything and go backpacking for a year:', 'ambition'),
('Most likely to be on a reality TV show:', 'ambition'),
('Most likely to end up with a completely unexpected career:', 'ambition'),
('Most likely to peak in their 30s:', 'ambition'),
('Most likely to still be figuring out what they want to do at 40:', 'ambition'),
('Most likely to make a terrible business decision with total confidence:', 'ambition'),

-- Petty & relatable
('Most likely to hold a grudge for years over something small:', 'petty'),
('Most likely to order food for the table and eat most of it:', 'petty'),
('Most likely to rewatch the same show five times instead of something new:', 'petty'),
('Most likely to win an argument by being annoyingly right:', 'petty'),
('Most likely to complain about something they could easily fix:', 'petty'),
('Most likely to bring up an old story that nobody else remembers:', 'petty'),

-- Wildcard & fun
('Most likely to befriend a wild animal:', 'wildcard'),
('Most likely to become a meme:', 'wildcard'),
('Most likely to have a secret talent nobody knows about:', 'wildcard'),
('Most likely to accidentally become the main character of someone else''s story:', 'wildcard'),
('Most likely to have the most chaotic group chat energy:', 'wildcard')

ON CONFLICT DO NOTHING;
