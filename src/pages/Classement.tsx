import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Target, Shield, Trophy } from "lucide-react";
import TeamLogo from "@/components/TeamLogo";
import type { ReactNode } from "react";

const divisions = [
  { key: "rookies", label: "Division Les Rookies" },
  { key: "younguns", label: "Division Les Young Guns" },
  { key: "veterans", label: "Division Les Vétérans" },
];

const Classement = () => {
  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: matches } = useQuery({
    queryKey: ["matches-final"],
    queryFn: async () => {
      const { data, error } = await supabase.from("matches").select("*").eq("status", "final");
      if (error) throw error;
      return data;
    },
  });

  const { data: events } = useQuery({
    queryKey: ["match-events-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_events")
        .select("id, event_type, player_id, assist_player_id, match_id, team_id");
      if (error) throw error;
      return data;
    },
  });

  const { data: players } = useQuery({
    queryKey: ["players"],
    queryFn: async () => {
      const { data, error } = await supabase.from("players").select("*");
      if (error) throw error;
      return data;
    },
  });

  const getTeamForPlayer = (playerId: string) => {
    const player = (players ?? []).find((p) => p.id === playerId);
    if (!player) return null;
    return (teams ?? []).find((t) => t.id === player.team_id) ?? null;
  };

  const getTeamStandings = (divKey: string) => {
    const divTeams = (teams ?? []).filter((t: any) => t.division === divKey);
    return divTeams
      .map((team) => {
        const teamMatches = (matches ?? []).filter(
          (m) => m.home_team_id === team.id || m.away_team_id === team.id
        );
        let w = 0, l = 0, d = 0;
        teamMatches.forEach((m) => {
          const isHome = m.home_team_id === team.id;
          const homeWon = m.home_score > m.away_score;
          const tied = m.home_score === m.away_score;
          if (tied) d++;
          else if ((isHome && homeWon) || (!isHome && !homeWon)) w++;
          else l++;
        });
        return { team, gp: teamMatches.length, w, d, l, pts: w * 2 + d };
      })
      .sort((a, b) => b.pts - a.pts || b.w - a.w);
  };

  const getScorersByDivision = (divKey: string) => {
    const divTeamIds = (teams ?? []).filter((t: any) => t.division === divKey).map((t) => t.id);
    const divPlayers = (players ?? []).filter((p) => divTeamIds.includes(p.team_id));

    return divPlayers
      .map((player) => {
        const goals = (events ?? []).filter((e) => e.event_type === "goal" && e.player_id === player.id).length;
        const assists = (events ?? []).filter((e) => e.event_type === "goal" && e.assist_player_id === player.id).length;
        return { player, goals, assists, pts: goals + (assists * 2) };
      })
      .filter((p) => p.pts > 0)
      .sort((a, b) => b.pts - a.pts || b.goals - a.goals);
  };

  const getGoaliesByDivision = (divKey: string) => {
    const divTeamIds = (teams ?? []).filter((t: any) => t.division === divKey).map((t) => t.id);
    const goalies = (players ?? []).filter((p) => p.position === "G" && divTeamIds.includes(p.team_id));

    return goalies
      .map((goalie) => {
        const teamMatches = (matches ?? []).filter(
          (m) => m.home_team_id === goalie.team_id || m.away_team_id === goalie.team_id
        );
        let w = 0, l = 0, shutouts = 0, goalsAgainst = 0;
        teamMatches.forEach((m) => {
          const isHome = m.home_team_id === goalie.team_id;
          const homeWon = m.home_score > m.away_score;
          const tied = m.home_score === m.away_score;
          const ga = isHome ? m.away_score : m.home_score;
          goalsAgainst += ga;
          if (ga === 0) shutouts++;
          if (tied) { /* tie */ }
          else if ((isHome && homeWon) || (!isHome && !homeWon)) w++;
          else l++;
        });
        const gp = teamMatches.length;
        const gaa = gp > 0 ? goalsAgainst / gp : 0;
        const winPct = gp > 0 ? (w / gp) * 100 : 0;
        return { player: goalie, gp, w, l, shutouts, goalsAgainst, gaa, winPct };
      })
      .filter((g) => g.gp > 0)
      .sort((a, b) => b.w - a.w || a.gaa - b.gaa);
  };

  const formatDec = (n: number) => (n % 1 === 0 ? n.toFixed(0) : n.toFixed(2));

  const DivisionSection = ({ label, children }: { label: string; children: ReactNode }) => (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4 pl-3 border-l-4 border-primary">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-primary uppercase tracking-wide">
          {label}
        </h2>
      </div>
      <div className="rounded-lg border border-border bg-card/30 p-4">
        {children}
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-arena-gradient p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-display text-4xl font-bold text-neon">Classement</h1>
        </div>

        <Tabs defaultValue="scorers" className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-2xl mx-auto mb-8">
            <TabsTrigger value="scorers" className="gap-2">
              <Target className="h-4 w-4" /> Marqueurs
            </TabsTrigger>
            <TabsTrigger value="goalies" className="gap-2">
              <Shield className="h-4 w-4" /> Gardiens
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-2">
              <Trophy className="h-4 w-4" /> Équipes
            </TabsTrigger>
          </TabsList>

          {/* ====== MARQUEURS ====== */}
          <TabsContent value="scorers">
            {divisions.map((div) => {
              const scorers = getScorersByDivision(div.key);
              return (
                <DivisionSection key={div.key} label={div.label}>
                  {scorers.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-2">Aucun marqueur dans cette division.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border text-muted-foreground text-sm uppercase tracking-wider font-display">
                            <th className="text-left py-2 px-3 w-10">#</th>
                            <th className="text-left py-2 px-3">Joueur</th>
                            <th className="text-left py-2 px-3">Équipe</th>
                            <th className="text-center py-2 px-3">B</th>
                            <th className="text-center py-2 px-3">A</th>
                            <th className="text-center py-2 px-3 text-neon">PTS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scorers.map((s, i) => {
                            const team = getTeamForPlayer(s.player.id);
                            return (
                              <tr key={s.player.id} className="border-b border-border/50 hover:bg-accent/10 transition-colors">
                                <td className="py-3 px-3 font-bold text-muted-foreground">{i + 1}</td>
                                <td className="py-3 px-3 font-semibold">
                                  {s.player.first_name} {s.player.last_name}
                                </td>
                                <td className="py-3 px-3">
                                  {team && (
                                    <div className="flex items-center gap-2">
                                      <TeamLogo
                                        logoUrl={team.logo_url}
                                        abbr={team.abbr}
                                        color={team.color}
                                        name={team.name}
                                        className="w-7 h-7 rounded-full"
                                        textClassName="text-[10px]"
                                      />
                                      <span className="text-sm text-muted-foreground hidden sm:inline">
                                        {team.abbr}
                                      </span>
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-center">{s.goals}</td>
                                <td className="py-3 px-3 text-center">{s.assists}</td>
                                <td className="py-3 px-3 text-center font-bold text-neon">{s.pts}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </DivisionSection>
              );
            })}
          </TabsContent>

          {/* ====== GARDIENS ====== */}
          <TabsContent value="goalies">
            {divisions.map((div) => {
              const goalies = getGoaliesByDivision(div.key);
              return (
                <DivisionSection key={div.key} label={div.label}>
                  {goalies.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-2">Aucun gardien dans cette division.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border text-muted-foreground text-sm uppercase tracking-wider font-display">
                            <th className="text-left py-2 px-3 w-10">#</th>
                            <th className="text-left py-2 px-3">Gardien</th>
                            <th className="text-left py-2 px-3">Équipe</th>
                            <th className="text-center py-2 px-3">PJ</th>
                            <th className="text-center py-2 px-3">V</th>
                            <th className="text-center py-2 px-3">D</th>
                            <th className="text-center py-2 px-3">BL</th>
                            <th className="text-center py-2 px-3">BA</th>
                            <th className="text-center py-2 px-3">MOY</th>
                            <th className="text-center py-2 px-3 text-neon">%V</th>
                          </tr>
                        </thead>
                        <tbody>
                          {goalies.map((g, i) => {
                            const team = getTeamForPlayer(g.player.id);
                            return (
                              <tr key={g.player.id} className="border-b border-border/50 hover:bg-accent/10 transition-colors">
                                <td className="py-3 px-3 font-bold text-muted-foreground">{i + 1}</td>
                                <td className="py-3 px-3 font-semibold">
                                  {g.player.first_name} {g.player.last_name}
                                </td>
                                <td className="py-3 px-3">
                                  {team && (
                                    <div className="flex items-center gap-2">
                                      <TeamLogo
                                        logoUrl={team.logo_url}
                                        abbr={team.abbr}
                                        color={team.color}
                                        name={team.name}
                                        className="w-7 h-7 rounded-full"
                                        textClassName="text-[10px]"
                                      />
                                      <span className="text-sm text-muted-foreground hidden sm:inline">
                                        {team.abbr}
                                      </span>
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-center">{g.gp}</td>
                                <td className="py-3 px-3 text-center">{g.w}</td>
                                <td className="py-3 px-3 text-center">{g.l}</td>
                                <td className="py-3 px-3 text-center">{g.shutouts}</td>
                                <td className="py-3 px-3 text-center">{g.goalsAgainst}</td>
                                <td className="py-3 px-3 text-center">{formatDec(g.gaa)}</td>
                                <td className="py-3 px-3 text-center font-bold text-neon">{formatDec(g.winPct)}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </DivisionSection>
              );
            })}
          </TabsContent>

          {/* ====== ÉQUIPES ====== */}
          <TabsContent value="teams">
            {divisions.map((div) => {
              const standings = getTeamStandings(div.key);
              return (
                <DivisionSection key={div.key} label={div.label}>
                  {standings.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-2">Aucune équipe dans cette division.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border text-muted-foreground text-sm uppercase tracking-wider font-display">
                            <th className="text-left py-3 px-4 w-10">#</th>
                            <th className="text-left py-3 px-4">Équipe</th>
                            <th className="text-center py-3 px-4">PJ</th>
                            <th className="text-center py-3 px-4">V</th>
                            <th className="text-center py-3 px-4">N</th>
                            <th className="text-center py-3 px-4">D</th>
                            <th className="text-center py-3 px-4 text-neon">PTS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {standings.map((s, i) => (
                            <tr key={s.team.id} className="border-b border-border/50 hover:bg-accent/10 transition-colors">
                              <td className="py-4 px-4 font-bold text-xl text-muted-foreground">{i + 1}</td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <TeamLogo
                                    logoUrl={s.team.logo_url}
                                    abbr={s.team.abbr}
                                    color={s.team.color}
                                    name={s.team.name}
                                    className="w-9 h-9 rounded-full"
                                    textClassName="text-xs"
                                  />
                                  <span className="font-semibold text-lg">{s.team.name}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-center text-lg">{s.gp}</td>
                              <td className="py-4 px-4 text-center text-lg">{s.w}</td>
                              <td className="py-4 px-4 text-center text-lg">{s.d}</td>
                              <td className="py-4 px-4 text-center text-lg">{s.l}</td>
                              <td className="py-4 px-4 text-center text-2xl font-bold text-neon">{s.pts}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </DivisionSection>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Classement;
