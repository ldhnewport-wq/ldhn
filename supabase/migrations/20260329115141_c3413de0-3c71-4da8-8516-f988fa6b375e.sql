
CREATE TABLE public.match_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  assist_player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  event_type text NOT NULL DEFAULT 'goal',
  period text,
  event_time text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Match events are viewable by everyone" ON public.match_events FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can create match events" ON public.match_events FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update match events" ON public.match_events FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete match events" ON public.match_events FOR DELETE TO public USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_events;
