import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Team = Tables<"teams">;

interface TeamStanding {
  team: Team;
  gp: number;
  w: number;
  l: number;
  pts: number;
}

const Classement = () => {
  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*");
      if (error) throw error;
      return data as Team[];
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

  const standings: TeamStanding[] = (teams || [])
    .map((team) => {
      const teamMatches = (matches || []).filter(
        (m) => m.home_team_id === team.id || m.away_team_id === team.id
      );
      let w = 0, l = 0;
      teamMatches.forEach((m) => {
        const isHome = m.home_team_id === team.id;
        const won = isHome ? m.home_score > m.away_score : m.away_score > m.home_score;
        if (won) w++;
        else l++;
      });
      return { team, gp: teamMatches.length, w, l, pts: w * 2 };
    })
    .sort((a, b) => b.pts - a.pts || b.w - a.w);

  return (
    <div className="min-h-screen bg-arena-gradient p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <h1 className="font-display text-4xl font-bold text-neon">Classement</h1>
        </div>

        {standings.length === 0 ? (
          <p className="text-muted-foreground text-center text-lg">Aucune donnée. Ajoutez des équipes et des matchs.</p>
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
                  <tr key={s.team.id} className="border-b border-border/50 hover:bg-arena-surface-light/50 transition-colors">
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
        )}
      </div>
    </div>
  );
};

export default Classement;
