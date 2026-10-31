CREATE TABLE public.season_archives (
 season_key text PRIMARY KEY,
 label text NOT NULL,
 data jsonb NOT NULL DEFAULT '{}'::jsonb,
 archived_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.season_archives TO anon, authenticated;
GRANT ALL ON public.season_archives TO service_role;
ALTER TABLE public.season_archives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Season archives are publicly readable" ON public.season_archives FOR SELECT TO anon, authenticated USING (true);
COMMENT ON TABLE public.season_archives IS 'Frozen season snapshots; public read-only, no client writes. Original league and tournament data remain unchanged.';
INSERT INTO public.season_archives (season_key, label, data)
SELECT '2025-26', 'Saison 2025-26', jsonb_build_object(
 'teams', (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM public.teams t),
 'players', (SELECT coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb) FROM public.players p),
 'matches', (SELECT coalesce(jsonb_agg(to_jsonb(m) ORDER BY m.match_date), '[]'::jsonb) FROM public.matches m WHERE m.match_date >= '2025-07-01T00:00:00Z' AND m.match_date < '2026-07-01T00:00:00Z'),
 'events', (SELECT coalesce(jsonb_agg(to_jsonb(e)), '[]'::jsonb) FROM public.match_events e JOIN public.matches m ON m.id=e.match_id WHERE m.match_date >= '2025-07-01T00:00:00Z' AND m.match_date < '2026-07-01T00:00:00Z'),
 'tournament_teams', (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM public.tournament_teams t WHERE t.edition='2026'),
 'tournament_schedule', (SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.match_date), '[]'::jsonb) FROM public.tournament_schedule t WHERE t.edition='2026'),
 'tournament_bracket', (SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.position), '[]'::jsonb) FROM public.tournament_bracket t WHERE t.edition='2026')
);