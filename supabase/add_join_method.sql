-- Add join_method column to track how members joined groups
-- Allows for detailed invite link usage metrics and analytics

ALTER TABLE public.group_members 
ADD COLUMN join_method TEXT NOT NULL DEFAULT 'unknown' 
CHECK (join_method IN ('creator', 'code', 'link', 'unknown'));

-- Add comment explaining the column
COMMENT ON COLUMN public.group_members.join_method IS 
'Tracks how the member joined: creator (group creator), code (manual invite code), link (invite link), unknown (legacy/import)';

-- Create index for analytics queries
CREATE INDEX idx_group_members_join_method ON public.group_members(join_method);

-- Update existing records to mark them as unknown (pre-migration data)
UPDATE public.group_members SET join_method = 'unknown' WHERE join_method = 'unknown';
