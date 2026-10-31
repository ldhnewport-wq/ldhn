import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Swords, Target, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TeamLogo from "@/components/TeamLogo";
import { archiveDivisions, buildArchiveStandings, buildArchiveScorers, type ArchiveData, type ArchiveTeam, type ArchiveMatch } from "@/lib/archiveStats";

const dateLabel = (date: string) => new Date(date).toLocaleString("fr-CA", { timeZone: "America/Toronto", dateStyle: "medium", timeStyle: "short" });
const diffLabel = (diff: number) => diff > 0 ? `+${diff}` : diff;

function Division({ label, children }: { label: string; children: ReactNode }) {
  return <section className="mb-10"><h2 className="font-display text-2xl font-bold text-primary border-l-4 border-primary pl-3 mb-5">{label}</h2>{children}</section>;
}
function TeamName({ team, label }: { team?: ArchiveTeam; label?: string | null }) {
  return <span className="flex items-center gap-3 min-w-0">{team && <TeamLogo logoUrl={team.logo_url} abbr={team.abbr} color={team.color} name={team.name} className="w-10 h-10 rounded-full shrink-0" />}<span>{team?.name ?? label ?? "À déterminer"}</span></span>;
}
function Standings({ teams, matches, tournament = false }: { teams: ArchiveTeam[]; matches: ArchiveMatch[]; tournament?: boolean }) {
  const standings = buildArchiveStandings(teams, matches, tournament);
  if (!standings.length) return <p className="text-muted-foreground">Aucune équipe enregistrée.</p>;
  return <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm">
    <thead><tr className="text-muted-foreground border-b border-border"><th className="p-3 text-left">#</th><th className="p-3 text-left">Équipe</th>{["PJ", "V", "D", tournament ? "DP" : "N", "BP", "BC", "+/-", "PTS"].map(h => <th key={h} className="p-3 text-center">{h}</th>)}</tr></thead>
    <tbody>{standings.map((s, i) => <tr key={s.team.id} className="border-b border-border/50"><td className="p-3 text-muted-foreground">{i + 1}</td><td className="p-3 font-semibold"><TeamName team={s.team} /></td>{[s.gp, s.w, s.l, tournament ? s.otl : s.ties, s.gf, s.ga, diffLabel(s.gf - s.ga)].map((value, j) => <td key={j} className="p-3 text-center">{value}</td>)}<td className="p-3 text-center text-primary font-bold text-lg">{s.pts}</td></tr>)}</tbody>
  </table></div>;
}
function Results({ matches, teams }: { matches: ArchiveMatch[]; teams: ArchiveTeam[] }) {
  if (!matches.length) return <p className="text-muted-foreground py-3">Aucun résultat enregistré.</p>;
  return <div className="divide-y divide-border">{[...matches].sort((a, b) => a.match_date.localeCompare(b.match_date)).map(m => <div key={m.id} className="py-4">
    <div className="text-xs text-muted-foreground mb-3">{dateLabel(m.match_date)}{m.round ? ` · ${m.round}` : ""}{m.venue ? ` · ${m.venue}` : ""}</div>
    <div className="grid grid-cols-[1fr_auto_1fr] gap-3 sm:gap-6 items-center">
      <div className="text-sm sm:text-base"><TeamName team={teams.find(t => t.id === m.home_team_id)} label={m.home_label} /></div>
      <div className="text-center"><div className="font-display font-bold text-xl sm:text-2xl text-primary whitespace-nowrap">{m.home_score ?? "—"} : {m.away_score ?? "—"}</div>{m.overtime && <span className="text-xs text-muted-foreground">Prolongation</span>}{(m.home_score === null || m.away_score === null) && <span className="text-xs text-muted-foreground">Non joué</span>}</div>
      <div className="text-sm sm:text-base"><TeamName team={teams.find(t => t.id === m.away_team_id)} label={m.away_label} /></div>
    </div>
  </div>)}</div>;
}

export default function ArchiveSeason() {
  const { seasonKey } = useParams();
  const { data: archive, isLoading, isError, refetch } = useQuery({
    queryKey: ["season-archive", seasonKey],
    enabled: Boolean(seasonKey),
    queryFn: async () => {
      const { data, error } = await supabase.from("season_archives").select("season_key, label, data").eq("season_key", seasonKey ?? "").maybeSingle();
      if (error) throw error;
      return data ? { ...data, data: data.data as unknown as ArchiveData } : null;
    },
  });
  const data = archive?.data;
  return <div className="min-h-screen bg-arena-gradient px-4 py-8 sm:p-8"><div className="max-w-5xl mx-auto">
    <header className="flex items-center gap-4 mb-8"><Button variant="ghost" size="icon" asChild><Link to="/archives" aria-label="Retour aux archives"><ArrowLeft className="h-5 w-5" /></Link></Button><div><Link className="text-sm text-muted-foreground" to="/archives">Archives</Link><h1 className="font-display text-3xl sm:text-4xl font-bold text-neon">{archive?.label ?? "Saison"}</h1></div></header>
    {isLoading ? <p className="text-muted-foreground">Chargement de la saison…</p> : isError ? <div role="alert"><p className="mb-3">Impossible de charger cette saison.</p><Button variant="outline" onClick={() => refetch()}>Réessayer</Button></div> : !data ? <p className="text-muted-foreground">Saison introuvable.</p> :
      <Tabs defaultValue="teams">
        <TabsList className="grid grid-cols-1 sm:grid-cols-3 w-full h-auto mb-8 gap-1 p-1">
          <TabsTrigger value="teams" className="gap-2 whitespace-normal py-3"><Trophy className="h-4 w-4 shrink-0" />Classements des équipes</TabsTrigger>
          <TabsTrigger value="scorers" className="gap-2 whitespace-normal py-3"><Target className="h-4 w-4 shrink-0" />Classements des marqueurs</TabsTrigger>
          <TabsTrigger value="tournament" className="gap-2 whitespace-normal py-3"><Swords className="h-4 w-4 shrink-0" />Résultats du tournoi</TabsTrigger>
        </TabsList>
        <TabsContent value="teams">{archiveDivisions.map(div => {
          const teams = data.teams.filter(t => t.division === div.key);
          const ids = new Set(teams.map(t => t.id));
          const matches = data.matches.filter(m => m.status === "final" && (ids.has(m.home_team_id ?? "") || ids.has(m.away_team_id ?? "")));
          return <Division key={div.key} label={div.label}><Standings teams={teams} matches={matches} /><h3 className="font-display text-xl mt-7 mb-2">Résultats des matchs</h3><Results matches={matches} teams={data.teams} /></Division>;
        })}</TabsContent>
        <TabsContent value="scorers">{archiveDivisions.map(div => {
          const scorers = buildArchiveScorers(data, div.key);
          return <Division key={div.key} label={div.label}>{!scorers.length ? <p className="text-muted-foreground">Aucun point enregistré.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-sm"><thead><tr className="border-b border-border text-muted-foreground">{["#", "Joueur", "Équipe", "B", "A", "PTS"].map(h => <th key={h} className={`p-3 ${h === "Joueur" || h === "Équipe" ? "text-left" : "text-center"}`}>{h}</th>)}</tr></thead><tbody>{scorers.map((s, i) => <tr key={s.player.id} className="border-b border-border/50"><td className="p-3 text-center text-muted-foreground">{i + 1}</td><td className="p-3 font-semibold">{s.player.first_name} {s.player.last_name}</td><td className="p-3"><TeamName team={data.teams.find(t => t.id === s.player.team_id)} /></td><td className="p-3 text-center">{s.goals}</td><td className="p-3 text-center">{s.assists}</td><td className="p-3 text-center text-primary text-lg font-bold">{s.pts}</td></tr>)}</tbody></table></div>}</Division>;
        })}</TabsContent>
        <TabsContent value="tournament"><h2 className="font-display text-2xl mb-6">Tournoi 3e édition 2026</h2>{archiveDivisions.map(div => {
          const registered = new Set(data.tournament_teams.filter(t => t.category === div.category).map(t => t.team_id));
          const teams = data.teams.filter(t => registered.has(t.id));
          const matches = data.tournament_schedule.filter(m => m.category === div.category);
          const bracket = data.tournament_bracket.filter(m => m.category === div.category);
          return <Division key={div.key} label={div.label}><Standings teams={teams} matches={matches} tournament /><h3 className="font-display text-xl mt-7 mb-2">Résultats des matchs</h3><Results matches={matches} teams={data.teams} />{bracket.length > 0 && <><h3 className="font-display text-xl mt-7 mb-2">Tableau du tournoi</h3><div className="grid gap-3 sm:grid-cols-2">{bracket.map(m => <div key={m.id} className="border border-border bg-card rounded-lg p-4"><div className="text-sm text-muted-foreground mb-3">{m.round}</div><div className="flex items-center justify-between gap-4 mb-3"><TeamName team={data.teams.find(t => t.id === m.home_team_id)} label={m.home_label} /><span className="font-display text-xl text-primary">{m.home_score ?? "—"}</span></div><div className="flex items-center justify-between gap-4"><TeamName team={data.teams.find(t => t.id === m.away_team_id)} label={m.away_label} /><span className="font-display text-xl text-primary">{m.away_score ?? "—"}</span></div>{m.winner_team_id && <p className="text-sm text-primary mt-4 flex items-center gap-2"><Trophy className="h-4 w-4" />{data.teams.find(t => t.id === m.winner_team_id)?.name}</p>}</div>)}</div></>}</Division>;
        })}</TabsContent>
      </Tabs>}
  </div></div>;
}