-- ─────────────────────────────────────────────────────────────────────────────
-- Popularity tracking for Prompt Shop
-- Run this in Supabase SQL editor after add_prompt_shop.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add add_count columns ────────────────────────────────────────────────────

ALTER TABLE public.prompts
  ADD COLUMN IF NOT EXISTS add_count INTEGER DEFAULT 0 NOT NULL;

ALTER TABLE public.prompt_packs
  ADD COLUMN IF NOT EXISTS add_count INTEGER DEFAULT 0 NOT NULL;

-- 2. Trigger: auto-maintain prompts.add_count via group_prompts ───────────────

CREATE OR REPLACE FUNCTION public.update_prompt_add_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.prompts
    SET    add_count = add_count + 1
    WHERE  id = NEW.prompt_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.prompts
    SET    add_count = GREATEST(add_count - 1, 0)
    WHERE  id = OLD.prompt_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS prompt_add_count_trigger ON public.group_prompts;

CREATE TRIGGER prompt_add_count_trigger
AFTER INSERT OR DELETE ON public.group_prompts
FOR EACH ROW EXECUTE FUNCTION public.update_prompt_add_count();

-- 3. RPC: atomically increment / decrement pack add_count ────────────────────
--    Called from addPackToGroups server action.

CREATE OR REPLACE FUNCTION public.increment_pack_add_count(
  p_pack_id UUID,
  p_delta   INTEGER
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.prompt_packs
  SET    add_count = GREATEST(add_count + p_delta, 0)
  WHERE  id = p_pack_id;
$$;

-- 4. Backfill existing data ───────────────────────────────────────────────────

-- Prompts: count how many group_prompts rows reference each prompt
UPDATE public.prompts p
SET    add_count = (
  SELECT COUNT(*)
  FROM   public.group_prompts gp
  WHERE  gp.prompt_id = p.id
);

-- Packs: count distinct groups that contain at least one prompt from the pack
UPDATE public.prompt_packs pp
SET    add_count = (
  SELECT COUNT(DISTINCT gp.group_id)
  FROM   public.pack_prompts ppp
  JOIN   public.group_prompts gp ON gp.prompt_id = ppp.prompt_id
  WHERE  ppp.pack_id = pp.id
);
