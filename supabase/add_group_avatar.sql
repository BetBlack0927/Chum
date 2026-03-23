-- Add avatar_url to groups table
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;

-- Create a public storage bucket for group avatars (5 MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'group-avatars',
  'group-avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read group avatars (bucket is public)
DROP POLICY IF EXISTS "Public group avatar read" ON storage.objects;
CREATE POLICY "Public group avatar read" ON storage.objects
  FOR SELECT USING (bucket_id = 'group-avatars');

-- Any authenticated user can upload (admin check is enforced in the server action)
DROP POLICY IF EXISTS "Auth users upload group avatar" ON storage.objects;
CREATE POLICY "Auth users upload group avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'group-avatars'
    AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Auth users update group avatar" ON storage.objects;
CREATE POLICY "Auth users update group avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'group-avatars'
    AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Auth users delete group avatar" ON storage.objects;
CREATE POLICY "Auth users delete group avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'group-avatars'
    AND auth.uid() IS NOT NULL
  );
