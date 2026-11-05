CREATE TABLE public.bulldogs_games (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL DEFAULT auth.uid(),
 opponent text NOT NULL DEFAULT '',
 played_at date NOT NULL DEFAULT CURRENT_DATE,
 roster jsonb NOT NULL DEFAULT '[]'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bulldogs_games TO authenticated;
GRANT ALL ON public.bulldogs_games TO service_role;
ALTER TABLE public.bulldogs_games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage Bulldogs games" ON public.bulldogs_games FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TABLE public.bulldogs_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 game_id uuid NOT NULL REFERENCES public.bulldogs_games(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK (kind IN ('shot_for','shot_against','goal_for','goal_against','blocked','penalty','faceoff_won','faceoff_lost')),
 player_id text,
 player_name text,
 period text NOT NULL DEFAULT '1',
 x double precision CHECK (x >= 0 AND x <= 100),
 y double precision CHECK (y >= 0 AND y <= 100),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bulldogs_events TO authenticated;
GRANT ALL ON public.bulldogs_events TO service_role;
ALTER TABLE public.bulldogs_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage Bulldogs events" ON public.bulldogs_events FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.bulldogs_games g WHERE g.id = game_id AND g.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.bulldogs_games g WHERE g.id = game_id AND g.user_id = auth.uid()));
CREATE INDEX bulldogs_events_game_idx ON public.bulldogs_events(game_id, created_at);
ALTER PUBLICATION supabase_realtime ADD TABLE public.bulldogs_games, public.bulldogs_events;