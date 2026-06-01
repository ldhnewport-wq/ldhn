
-- Tournament teams (which existing teams participate, with category)
CREATE TABLE public.tournament_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  category text NOT NULL DEFAULT 'rookies',
  edition text NOT NULL DEFAULT '2026',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, edition)
);
GRANT SELECT ON public.tournament_teams TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournament_teams TO authenticated;
GRANT ALL ON public.tournament_teams TO service_role;
ALTER TABLE public.tournament_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tournament teams viewable by everyone" ON public.tournament_teams FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert tournament_teams" ON public.tournament_teams FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update tournament_teams" ON public.tournament_teams FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete tournament_teams" ON public.tournament_teams FOR DELETE TO authenticated USING (true);

-- Tournament schedule
CREATE TABLE public.tournament_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition text NOT NULL DEFAULT '2026',
  category text NOT NULL DEFAULT 'rookies',
  match_date timestamptz NOT NULL,
  home_team_id uuid,
  away_team_id uuid,
  home_label text,
  away_label text,
  venue text,
  round text,
  home_score integer,
  away_score integer,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tournament_schedule TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournament_schedule TO authenticated;
GRANT ALL ON public.tournament_schedule TO service_role;
ALTER TABLE public.tournament_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tournament schedule viewable by everyone" ON public.tournament_schedule FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert tournament_schedule" ON public.tournament_schedule FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update tournament_schedule" ON public.tournament_schedule FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete tournament_schedule" ON public.tournament_schedule FOR DELETE TO authenticated USING (true);

-- Tournament bracket (rounds: quarter, semi, final, etc.)
CREATE TABLE public.tournament_bracket (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition text NOT NULL DEFAULT '2026',
  category text NOT NULL DEFAULT 'rookies',
  round text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  home_team_id uuid,
  away_team_id uuid,
  home_label text,
  away_label text,
  home_score integer,
  away_score integer,
  winner_team_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tournament_bracket TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournament_bracket TO authenticated;
GRANT ALL ON public.tournament_bracket TO service_role;
ALTER TABLE public.tournament_bracket ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tournament bracket viewable by everyone" ON public.tournament_bracket FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert tournament_bracket" ON public.tournament_bracket FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update tournament_bracket" ON public.tournament_bracket FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete tournament_bracket" ON public.tournament_bracket FOR DELETE TO authenticated USING (true);

-- Tournament editable content (rules, thanks)
CREATE TABLE public.tournament_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition text NOT NULL DEFAULT '2026',
  section text NOT NULL,
  title text,
  body text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(edition, section)
);
GRANT SELECT ON public.tournament_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournament_content TO authenticated;
GRANT ALL ON public.tournament_content TO service_role;
ALTER TABLE public.tournament_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tournament content viewable by everyone" ON public.tournament_content FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert tournament_content" ON public.tournament_content FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update tournament_content" ON public.tournament_content FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete tournament_content" ON public.tournament_content FOR DELETE TO authenticated USING (true);

-- Seed default content
INSERT INTO public.tournament_content (edition, section, title, body) VALUES
  ('2026', 'reglements', 'Règlements du tournoi', 'Les règlements officiels du tournoi seront publiés ici.'),
  ('2026', 'remerciements', 'Remerciements', 'Merci à tous nos commanditaires, bénévoles et participants.');
