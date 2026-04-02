
-- Drop all open write policies on tables
DROP POLICY IF EXISTS "Anyone can create matches" ON public.matches;
DROP POLICY IF EXISTS "Anyone can delete matches" ON public.matches;
DROP POLICY IF EXISTS "Anyone can update matches" ON public.matches;

DROP POLICY IF EXISTS "Anyone can create teams" ON public.teams;
DROP POLICY IF EXISTS "Anyone can delete teams" ON public.teams;
DROP POLICY IF EXISTS "Anyone can update teams" ON public.teams;

DROP POLICY IF EXISTS "Anyone can create players" ON public.players;
DROP POLICY IF EXISTS "Anyone can delete players" ON public.players;
DROP POLICY IF EXISTS "Anyone can update players" ON public.players;

DROP POLICY IF EXISTS "Anyone can create match events" ON public.match_events;
DROP POLICY IF EXISTS "Anyone can delete match events" ON public.match_events;
DROP POLICY IF EXISTS "Anyone can update match events" ON public.match_events;

DROP POLICY IF EXISTS "Anyone can create articles" ON public.articles;
DROP POLICY IF EXISTS "Anyone can delete articles" ON public.articles;
DROP POLICY IF EXISTS "Anyone can update articles" ON public.articles;

-- Replace with authenticated-only write policies
CREATE POLICY "Authenticated users can create matches" ON public.matches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update matches" ON public.matches FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete matches" ON public.matches FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can create teams" ON public.teams FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update teams" ON public.teams FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete teams" ON public.teams FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can create players" ON public.players FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update players" ON public.players FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete players" ON public.players FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can create match_events" ON public.match_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update match_events" ON public.match_events FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete match_events" ON public.match_events FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can create articles" ON public.articles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update articles" ON public.articles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete articles" ON public.articles FOR DELETE TO authenticated USING (true);

-- Fix storage policies: drop open INSERT/DELETE, replace with authenticated-only
DROP POLICY IF EXISTS "Anyone can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete media" ON storage.objects;

CREATE POLICY "Authenticated users can upload media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');
CREATE POLICY "Authenticated users can delete media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media');
