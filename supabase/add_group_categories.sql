-- Add support for groups to choose which prompt categories they want
-- Each group can enable specific categories (juicy, chaos, social, etc.)

CREATE TABLE IF NOT EXISTS public.group_categories (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID        NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  category   TEXT        NOT NULL CHECK (category IN ('juicy', 'chaos', 'social', 'petty', 'wildcard', 'ambition', 'random')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, category)
);

-- Index for fast lookups
CREATE INDEX idx_group_categories_group ON public.group_categories(group_id);

-- Add comment
COMMENT ON TABLE public.group_categories IS 
'Tracks which prompt categories are enabled for each group. If no rows exist for a group, all categories are available (backward compatibility).';

-- For existing groups, enable all categories by default (optional migration)
-- Uncomment if you want to explicitly set all categories for existing groups:
-- INSERT INTO public.group_categories (group_id, category)
-- SELECT g.id, c.category
-- FROM public.groups g
-- CROSS JOIN (
--   VALUES ('juicy'), ('chaos'), ('social'), ('petty'), ('wildcard'), ('ambition')
-- ) AS c(category)
-- ON CONFLICT (group_id, category) DO NOTHING;
