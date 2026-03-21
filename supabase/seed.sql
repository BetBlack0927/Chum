-- ============================================================
-- Daily Winner — Juicy/High-Engagement Seed Data (60+ "Most Likely To..." prompts)
-- Optimized for testing: spicy, funny, roast-heavy, shareable
-- Run AFTER schema.sql
-- ============================================================

TRUNCATE public.prompts RESTART IDENTITY CASCADE;

INSERT INTO public.prompts (text, category) VALUES

-- Juicy / Spicy (high blush factor — perfect for laughs & feedback)
('Most likely to send a risky pic to the wrong chat:', 'juicy'),
('Most likely to hook up with someone on vacation and ghost forever:', 'juicy'),
('Most likely to have a secret OnlyFans or spicy side account:', 'juicy'),
('Most likely to flirt shamelessly when tipsy and regret it sober:', 'juicy'),
('Most likely to slide into DMs at 2am then delete the evidence:', 'juicy'),
('Most likely to have the wildest one-night stand story they never tell:', 'juicy'),
('Most likely to get caught in the act by a roommate or family:', 'juicy'),
('Most likely to send nudes without being asked (and nail the angle):', 'juicy'),
('Most likely to have a hidden kink they''re lowkey embarrassed about:', 'juicy'),
('Most likely to hook up with an ex "just one last time":', 'juicy'),
('Most likely to text something flirty after one drink too many:', 'juicy'),
('Most likely to forget the name of someone they just hooked up with:', 'juicy'),
('Most likely to make out with a stranger at a party for the story:', 'juicy'),
('Most likely to have phone sex and get interrupted mid-sentence:', 'juicy'),
('Most likely to role-play in bed and go full commitment:', 'juicy'),

-- Chaos & Unhinged (2026 group chat / viral energy — big screenshot potential)
('Most likely to doomscroll until 4am and blame everyone else:', 'chaos'),
('Most likely to argue with an AI chatbot and lose badly:', 'chaos'),
('Most likely to go viral for the most embarrassing reason:', 'chaos'),
('Most likely to accidentally reply-all an unhinged group chat vent:', 'chaos'),
('Most likely to impulse buy something ridiculous at 3am shopping spree:', 'chaos'),
('Most likely to start a cult over a dumb inside joke:', 'chaos'),
('Most likely to get banned from a bar/restaurant for chaos:', 'chaos'),
('Most likely to have 100+ unread texts but still know all the drama:', 'chaos'),
('Most likely to send a voice note rant that''s 5 minutes long:', 'chaos'),
('Most likely to turn a chill hangout into absolute mayhem:', 'chaos'),

-- Social & Personality (relatable group roasts — easy votes & banter)
('Most likely to read every group message but never reply:', 'social'),
('Most likely to overshare on a first date and scare them off:', 'social'),
('Most likely to ghost after one awkward text exchange:', 'social'),
('Most likely to flirt their way out of a parking ticket or fine:', 'social'),
('Most likely to have the most chaotic finsta or close friends stories:', 'social'),
('Most likely to screenshot drama and send it in a secret chat:', 'social'),
('Most likely to post thirst traps then delete them in panic:', 'social'),
('Most likely to be the group''s unofficial therapist at 2am:', 'social'),
('Most likely to leave the party without saying goodbye:', 'social'),
('Most likely to know everyone''s tea before they do:', 'social'),

-- Petty & Relatable (everyday savage — great for daily dopamine)
('Most likely to hold a grudge over who ate the last slice:', 'petty'),
('Most likely to rewatch the same show 10x instead of anything new:', 'petty'),
('Most likely to mute notifications but check obsessively:', 'petty'),
('Most likely to take the armrest on every flight without asking:', 'petty'),
('Most likely to complain about something they could fix in 2 seconds:', 'petty'),
('Most likely to hoard takeout sauces like they''re gold:', 'petty'),
('Most likely to say "I''m 5 minutes away" when still in bed:', 'petty'),
('Most likely to win arguments by being annoyingly correct:', 'petty'),

-- Wildcard / Fun (high shareability — mix in for variety)
('Most likely to become an accidental influencer or meme:', 'wildcard'),
('Most likely to adopt way too many pets and regret nothing:', 'wildcard'),
('Most likely to turn any hangout into an impromptu photoshoot:', 'wildcard'),
('Most likely to have the weirdest dream and force everyone to hear it:', 'wildcard'),
('Most likely to befriend a random animal and make it famous:', 'wildcard'),
('Most likely to have a secret talent that shocks the group:', 'wildcard'),

-- Ambition / Future (light future roasts — balance the spice)
('Most likely to quit their job for a wild passion project:', 'ambition'),
('Most likely to have three side hustles and still broke:', 'ambition'),
('Most likely to end up on reality TV for chaotic reasons:', 'ambition'),
('Most likely to peak in their 30s and own it:', 'ambition'),
('Most likely to move to a van and live that nomad life:', 'ambition')

ON CONFLICT DO NOTHING;
