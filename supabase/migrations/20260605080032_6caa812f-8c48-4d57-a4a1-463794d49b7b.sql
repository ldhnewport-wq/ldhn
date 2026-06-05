UPDATE public.arena_config
SET enabled_sections = (
  SELECT jsonb_agg(DISTINCT elem)
  FROM jsonb_array_elements(
    enabled_sections || '["tournament_standings_rookies","tournament_standings_young","tournament_standings_veterans"]'::jsonb
  ) AS elem
)
WHERE id = 'default';