
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS photo_url text;

ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS home_coach_initials text;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS away_coach_initials text;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS lineup_confirmed boolean NOT NULL DEFAULT false;
