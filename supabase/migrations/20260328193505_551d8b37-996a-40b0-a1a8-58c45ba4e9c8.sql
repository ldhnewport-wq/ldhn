
-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  abbr TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#666666',
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create players table
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  number INTEGER NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  position TEXT NOT NULL DEFAULT 'F',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create matches table
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  home_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  away_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  home_score INTEGER NOT NULL DEFAULT 0,
  away_score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'scheduled',
  period TEXT,
  match_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_live BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables
CREATE POLICY "Teams are viewable by everyone" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Players are viewable by everyone" ON public.players FOR SELECT USING (true);
CREATE POLICY "Matches are viewable by everyone" ON public.matches FOR SELECT USING (true);

-- Public write access (no auth for now - league admin)
CREATE POLICY "Anyone can create teams" ON public.teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update teams" ON public.teams FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete teams" ON public.teams FOR DELETE USING (true);

CREATE POLICY "Anyone can create players" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update players" ON public.players FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete players" ON public.players FOR DELETE USING (true);

CREATE POLICY "Anyone can create matches" ON public.matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update matches" ON public.matches FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete matches" ON public.matches FOR DELETE USING (true);
