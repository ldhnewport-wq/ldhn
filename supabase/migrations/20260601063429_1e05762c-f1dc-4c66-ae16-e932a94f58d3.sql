-- Clean orphan references first
UPDATE public.tournament_bracket SET home_team_id = NULL WHERE home_team_id IS NOT NULL AND home_team_id NOT IN (SELECT id FROM public.teams);
UPDATE public.tournament_bracket SET away_team_id = NULL WHERE away_team_id IS NOT NULL AND away_team_id NOT IN (SELECT id FROM public.teams);
UPDATE public.tournament_bracket SET winner_team_id = NULL WHERE winner_team_id IS NOT NULL AND winner_team_id NOT IN (SELECT id FROM public.teams);
UPDATE public.tournament_schedule SET home_team_id = NULL WHERE home_team_id IS NOT NULL AND home_team_id NOT IN (SELECT id FROM public.teams);
UPDATE public.tournament_schedule SET away_team_id = NULL WHERE away_team_id IS NOT NULL AND away_team_id NOT IN (SELECT id FROM public.teams);
DELETE FROM public.tournament_teams WHERE team_id NOT IN (SELECT id FROM public.teams);

ALTER TABLE public.tournament_teams
  ADD CONSTRAINT tournament_teams_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;

ALTER TABLE public.tournament_schedule
  ADD CONSTRAINT tournament_schedule_home_team_id_fkey FOREIGN KEY (home_team_id) REFERENCES public.teams(id) ON DELETE SET NULL,
  ADD CONSTRAINT tournament_schedule_away_team_id_fkey FOREIGN KEY (away_team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

ALTER TABLE public.tournament_bracket
  ADD CONSTRAINT tournament_bracket_home_team_id_fkey FOREIGN KEY (home_team_id) REFERENCES public.teams(id) ON DELETE SET NULL,
  ADD CONSTRAINT tournament_bracket_away_team_id_fkey FOREIGN KEY (away_team_id) REFERENCES public.teams(id) ON DELETE SET NULL,
  ADD CONSTRAINT tournament_bracket_winner_team_id_fkey FOREIGN KEY (winner_team_id) REFERENCES public.teams(id) ON DELETE SET NULL;