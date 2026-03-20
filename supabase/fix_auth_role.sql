-- Fix: replace auth.role() = 'authenticated' with auth.uid() IS NOT NULL
-- auth.role() is unreliable in newer Supabase — auth.uid() IS NOT NULL is the correct check

DROP POLICY IF EXISTS "Authenticated users can create groups"    ON public.groups;
DROP POLICY IF EXISTS "All authenticated users can view prompts" ON public.prompts;
DROP POLICY IF EXISTS "Anyone authenticated can view profiles"   ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile"             ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"             ON public.profiles;

CREATE POLICY "Authenticated users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can view prompts"
  ON public.prompts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone authenticated can view profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
