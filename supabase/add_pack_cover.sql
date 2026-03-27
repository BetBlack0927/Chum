-- Optional cover image URL for prompt packs (shown on cards & detail)
ALTER TABLE public.prompt_packs
  ADD COLUMN IF NOT EXISTS cover_url TEXT DEFAULT NULL;

-- Public bucket for pack cover images (5 MB, images only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pack-covers',
  'pack-covers',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public pack cover read" ON storage.objects;
CREATE POLICY "Public pack cover read" ON storage.objects
  FOR SELECT USING (bucket_id = 'pack-covers');

DROP POLICY IF EXISTS "Auth users upload pack cover" ON storage.objects;
CREATE POLICY "Auth users upload pack cover" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'pack-covers'
    AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Auth users update pack cover" ON storage.objects;
CREATE POLICY "Auth users update pack cover" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'pack-covers'
    AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Auth users delete pack cover" ON storage.objects;
CREATE POLICY "Auth users delete pack cover" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'pack-covers'
    AND auth.uid() IS NOT NULL
  );
