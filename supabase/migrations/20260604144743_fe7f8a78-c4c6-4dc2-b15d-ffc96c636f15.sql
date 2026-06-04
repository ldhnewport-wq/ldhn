
CREATE TABLE public.arena_config (
  id text PRIMARY KEY DEFAULT 'default',
  rotation_interval_ms integer NOT NULL DEFAULT 12000,
  enabled_sections jsonb NOT NULL DEFAULT '["scores","standings","top_players","highlights","reportage","media"]'::jsonb,
  live_mode text NOT NULL DEFAULT 'off',
  live_frequency integer NOT NULL DEFAULT 3,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.arena_config TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arena_config TO authenticated;
GRANT ALL ON public.arena_config TO service_role;
ALTER TABLE public.arena_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Arena config viewable by everyone" ON public.arena_config FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert arena_config" ON public.arena_config FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update arena_config" ON public.arena_config FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete arena_config" ON public.arena_config FOR DELETE TO authenticated USING (true);

INSERT INTO public.arena_config (id) VALUES ('default') ON CONFLICT DO NOTHING;

CREATE TABLE public.arena_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_type text NOT NULL DEFAULT 'photo',
  url text NOT NULL,
  caption text,
  position integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.arena_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arena_media TO authenticated;
GRANT ALL ON public.arena_media TO service_role;
ALTER TABLE public.arena_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Arena media viewable by everyone" ON public.arena_media FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert arena_media" ON public.arena_media FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update arena_media" ON public.arena_media FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete arena_media" ON public.arena_media FOR DELETE TO authenticated USING (true);
