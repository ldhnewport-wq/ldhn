export const archiveDivisions = [
  { key: "rookies", category: "rookies", label: "Les Rookies" },
  { key: "younguns", category: "intermediaire", label: "Les Young Guns" },
  { key: "veterans", category: "elite", label: "Les Vétérans" },
];

export interface ArchiveTeam {
  id: string; name: string; abbr: string; color: string; logo_url: string | null; division: string;
}
export interface ArchivePlayer {
  id: string; first_name: string; last_name: string; team_id: string;
}
export interface ArchiveMatch {
  id: string; home_team_id: string | null; away_team_id: string | null;
  home_score: number | null; away_score: number | null; status: string; match_date: string;
  category?: string; overtime?: boolean; home_label?: string | null; away_label?: string | null;
  round?: string | null; venue?: string | null;
}
export interface ArchiveEvent {
  match_id: string; player_id: string | null; assist_player_id: string | null; event_type: string;
}
export interface ArchiveData {
  teams: ArchiveTeam[]; players: ArchivePlayer[]; matches: ArchiveMatch[]; events: ArchiveEvent[];
  tournament_teams: { team_id: string; category: string }[];
  tournament_schedule: ArchiveMatch[];
  tournament_bracket: (Omit<ArchiveMatch, "match_date" | "status"> & { position: number; winner_team_id: string | null })[];
}

export function buildArchiveStandings(teams: ArchiveTeam[], matches: ArchiveMatch[], tournament = false) {
  return teams.map(team => {
    const row = { team, gp: 0, w: 0, l: 0, ties: 0, otl: 0, gf: 0, ga: 0, pts: 0 };
    matches.forEach(match => {
      if ((!tournament && match.status !== "final") || match.home_score === null || match.away_score === null) return;
      if (match.home_team_id !== team.id && match.away_team_id !== team.id) return;
      const home = match.home_team_id === team.id;
      const gf = home ? match.home_score : match.away_score;
      const ga = home ? match.away_score : match.home_score;
      row.gp++; row.gf += gf; row.ga += ga;
      if (gf > ga) { row.w++; row.pts += 2; }
      else if (gf === ga) { row.ties++; if (!tournament) row.pts++; }
      else if (tournament && match.overtime) { row.otl++; row.pts++; }
      else row.l++;
    });
    return row;
  }).sort((a, b) => b.pts - a.pts || (tournament ? (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf : b.w - a.w));
}

export function buildArchiveScorers(data: ArchiveData, division: string) {
  const teamIds = new Set(data.teams.filter(t => t.division === division).map(t => t.id));
  const finalIds = new Set(data.matches.filter(m => m.status === "final").map(m => m.id));
  const goals = data.events.filter(e => e.event_type === "goal" && finalIds.has(e.match_id));
  return data.players.filter(p => teamIds.has(p.team_id)).map(player => {
    const g = goals.filter(e => e.player_id === player.id).length;
    const a = goals.filter(e => e.assist_player_id === player.id).length;
    return { player, goals: g, assists: a, pts: g + a * 2 };
  }).filter(p => p.pts > 0).sort((a, b) => b.pts - a.pts || b.goals - a.goals);
}