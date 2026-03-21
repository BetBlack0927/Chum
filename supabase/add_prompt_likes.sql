-- ============================================================
-- Add Prompt Likes Feature
-- Run this in your Supabase SQL Editor after schema.sql
-- ============================================================

-- Add likes column to prompts table (if it doesn't already exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'prompts' 
    AND column_name = 'likes'
  ) THEN
    ALTER TABLE public.prompts ADD COLUMN likes INT8 NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Create prompt_likes table to track individual user likes
CREATE TABLE IF NOT EXISTS public.prompt_likes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt_id  UUID        NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, prompt_id)
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_prompt_likes_user   ON public.prompt_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_likes_prompt ON public.prompt_likes(prompt_id);

-- ============================================================
-- Functions to maintain likes counter on prompts table
-- ============================================================

-- Increment likes counter
CREATE OR REPLACE FUNCTION public.increment_prompt_likes(prompt_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.prompts
  SET likes = likes + 1
  WHERE id = prompt_id;
END;
$$;

-- Decrement likes counter (prevent negative values)
CREATE OR REPLACE FUNCTION public.decrement_prompt_likes(prompt_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.prompts
  SET likes = GREATEST(0, likes - 1)
  WHERE id = prompt_id;
END;
$$;

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE public.prompt_likes ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view all likes
CREATE POLICY "Anyone can view prompt likes"
  ON public.prompt_likes FOR SELECT
  TO authenticated
  USING (true);

-- Users can like prompts (insert their own)
CREATE POLICY "Users can like prompts"
  ON public.prompt_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can unlike prompts (delete their own)
CREATE POLICY "Users can unlike prompts"
  ON public.prompt_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
