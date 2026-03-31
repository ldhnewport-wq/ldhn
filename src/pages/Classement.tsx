import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, Trophy, Target } from "lucide-react";

const divisions = [
  { key: "rookies", label: "Division Les Rookies" },
  { key: "youngguns", label: "Division Les Young Guns" },
  { key: "veterans", label: "Division Les Vétérans" },
];

type View = "main" | "scorers" | "teams" | "teams-division";

const Classement = () => {
  const [view, setView] = useState<View>("main");
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);

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
    queryKey: ["match-events-goals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_events")
        .select("*, players!match_events_player_id_fkey(first_name, last_name, team_id)")
        .in("event_type", ["goal", "assist"]);
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

  const getTeamStandings = (divKey: string) => {
    const divTeams = (teams ?? []).filter((t: any) => t.division === divKey);
    return divTeams
      .map((team) => {
        const teamMatches = (matches ?? []).filter(
          (m) => m.home_team_id === team.id || m.away_team_id === team.id
        );
        let w = 0, l = 0;
        teamMatches.forEach((m) => {
          const isHome = m.home_team_id === team.id;
          const won = isHome ? m.home_score > m.away_score : m.away_score > m.home_score;
          if (won) w++; else l++;
        });
        return { team, gp: teamMatches.length, w, l, pts: w * 2 };
      })
      .sort((a, b) => b.pts - a.pts || b.w - a.w);
  };

  const getScorersByDivision = (divKey: string) => {
    const divTeamIds = (teams ?? []).filter((t: any) => t.division === divKey).map((t) => t.id);
    const divPlayers = (players ?? []).filter((p) => divTeamIds.includes(p.team_id));

    return divPlayers
      .map((player) => {
        const goals = (events ?? []).filter((e) => e.event_type === "goal" && e.player_id === player.id).length;
        const assists = (events ?? []).filter((e) => e.event_type === "assist" && e.player_id === player.id).length;
        return { player, goals, assists, pts: goals + assists };
      })
      .filter((p) => p.pts > 0)
      .sort((a, b) => b.pts - a.pts || b.goals - a.goals);
  };

  const goBack = () => {
    if (view === "teams-division") setView("teams");
    else { setView("main"); setSelectedDivision(null); }
  };

  const getTitle = () => {
    if (view === "scorers") return "Classements des marqueurs";
    if (view === "teams" || view === "teams-division") {
      if (selectedDivision) return divisions.find((d) => d.key === selectedDivision)?.label ?? "Classement";
      return "Classement des équipes";
    }
    return "Classement";
  };

  return (
    <div className="min-h-screen bg-arena-gradient p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          {view === "main" ? (
            <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          ) : (
            <Button variant="ghost" size="icon" onClick={goBack}><ArrowLeft className="h-5 w-5" /></Button>
          )}
          <h1 className="font-display text-4xl font-bold text-neon">{getTitle()}</h1>
        </div>

        {view === "main" && (
          <div className="flex flex-col gap-4">
            <Button
              variant="outline"
              className="w-full justify-between text-lg py-8 border-primary/30 hover:border-primary hover:bg-primary/10"
              onClick={() => setView("scorers")}
            >
              <span className="flex items-center gap-3"><Target className="h-5 w-5" /> Classements des marqueurs</span>
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between text-lg py-8 border-primary/30 hover:border-primary hover:bg-primary/10"
              onClick={() => setView("teams")}
            >
              <span className="flex items-center gap-3"><Trophy className="h-5 w-5" /> Classement des équipes</span>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        {view === "scorers" && (
          <div className="space-y-8">
            {divisions.map((div) => {
              const scorers = getScorersByDivision(div.key);
              return (
                <div key={div.key}>
                  <h2 className="font-display text-2xl font-bold text-primary mb-4">{div.label}</h2>
                  {scorers.length === 0 ? (
                    <p className="text-muted-foreground text-sm mb-4">Aucun marqueur.</p>
                  ) : (
                    <div className="overflow-x-auto mb-4">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border text-muted-foreground text-sm uppercase tracking-wider font-display">
                            <th className="text-left py-2 px-3 w-10">#</th>
                            <th className="text-left py-2 px-3">Joueur</th>
                            <th className="text-center py-2 px-3">B</th>
                            <th className="text-center py-2 px-3">A</th>
                            <th className="text-center py-2 px-3 text-neon">PTS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scorers.map((s, i) => (
                            <tr key={s.player.id} className="border-b border-border/50 hover:bg-accent/10 transition-colors">
                              <td className="py-3 px-3 font-bold text-muted-foreground">{i + 1}</td>
                              <td className="py-3 px-3 font-semibold">{s.player.first_name} {s.player.last_name}</td>
                              <td className="py-3 px-3 text-center">{s.goals}</td>
                              <td className="py-3 px-3 text-center">{s.assists}</td>
                              <td className="py-3 px-3 text-center font-bold text-neon">{s.pts}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {view === "teams" && (
          <div className="flex flex-col gap-4">
            {divisions.map((div) => (
              <Button
                key={div.key}
                variant="outline"
                className="w-full justify-between text-lg py-8 border-primary/30 hover:border-primary hover:bg-primary/10"
                onClick={() => { setSelectedDivision(div.key); setView("teams-division"); }}
              >
                {div.label}
                <ChevronRight className="h-5 w-5" />
              </Button>
            ))}
          </div>
        )}

        {view === "teams-division" && selectedDivision && (() => {
          const standings = getTeamStandings(selectedDivision);
          return standings.length === 0 ? (
            <p className="text-muted-foreground text-center text-lg">Aucune équipe dans cette division.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-sm uppercase tracking-wider font-display">
                    <th className="text-left py-3 px-4 w-10">#</th>
                    <th className="text-left py-3 px-4">Équipe</th>
                    <th className="text-center py-3 px-4">PJ</th>
                    <th className="text-center py-3 px-4">V</th>
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
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2"
                            style={{ borderColor: s.team.color, color: s.team.color }}
                          >
                            {s.team.abbr}
                          </div>
                          <span className="font-semibold text-lg">{s.team.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center text-lg">{s.gp}</td>
                      <td className="py-4 px-4 text-center text-lg">{s.w}</td>
                      <td className="py-4 px-4 text-center text-lg">{s.l}</td>
                      <td className="py-4 px-4 text-center text-2xl font-bold text-neon">{s.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default Classement;
