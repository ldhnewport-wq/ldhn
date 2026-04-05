import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar } from "lucide-react";
import { useState } from "react";
import type { Tables } from "@/integrations/supabase/types";

type Team = Tables<"teams">;

interface MatchWithTeams {
  id: string;
  home_score: number;
  away_score: number;
  status: string;
  period: string | null;
  match_date: string;
  is_live: boolean;
  home_team_id: string;
  away_team_id: string;
  home_team: Team;
  away_team: Team;
}

const DIVISIONS = [
  { key: "all", label: "Toutes" },
  { key: "rookies", label: "Les Rookies" },
  { key: "younguns", label: "Les Young Guns" },
  { key: "veterans", label: "Les Vétérans" },
];

const DAY_NAMES: Record<number, string> = {
  0: "Dimanche", 1: "Lundi", 2: "Mardi", 3: "Mercredi", 4: "Jeudi", 5: "Vendredi", 6: "Samedi",
};

const Horaire = () => {
  const [division, setDivision] = useState("all");

  const { data: matches, isLoading } = useQuery({
    queryKey: ["schedule-matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
        .order("match_date", { ascending: true });
      if (error) throw error;
      return data as MatchWithTeams[];
    },
  });

  const filtered = matches?.filter((m) => {
    if (division === "all") return true;
    return m.home_team.division === division || m.away_team.division === division;
  });

  // Group by week
  const weeks: { label: string; matches: MatchWithTeams[] }[] = [];
  if (filtered) {
    const sorted = [...filtered].sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
    let currentWeek: MatchWithTeams[] = [];
    let weekStart: Date | null = null;

    for (const m of sorted) {
      const d = new Date(m.match_date);
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      monday.setHours(0, 0, 0, 0);

      if (!weekStart || monday.getTime() !== weekStart.getTime()) {
        if (currentWeek.length > 0) {
          const end = new Date(weekStart!);
          end.setDate(end.getDate() + 6);
          weeks.push({
            label: `Semaine ${weeks.length + 1} — ${weekStart!.toLocaleDateString("fr-CA", { day: "numeric", month: "long" })} au ${end.toLocaleDateString("fr-CA", { day: "numeric", month: "long" })}`,
            matches: currentWeek,
          });
        }
        weekStart = monday;
        currentWeek = [];
      }
      currentWeek.push(m);
    }
    if (currentWeek.length > 0 && weekStart) {
      const end = new Date(weekStart);
      end.setDate(end.getDate() + 6);
      weeks.push({
        label: `Semaine ${weeks.length + 1} — ${weekStart.toLocaleDateString("fr-CA", { day: "numeric", month: "long" })} au ${end.toLocaleDateString("fr-CA", { day: "numeric", month: "long" })}`,
        matches: currentWeek,
      });
    }
  }

  return (
    <div className="min-h-screen bg-arena-gradient p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/matchs">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <Calendar className="h-6 w-6 text-neon" />
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-neon">Horaire de la saison</h1>
        </div>

        {/* Division filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {DIVISIONS.map((d) => (
            <Button
              key={d.key}
              variant={division === d.key ? "default" : "outline"}
              size="sm"
              onClick={() => setDivision(d.key)}
              className={division === d.key ? "bg-neon text-black hover:bg-neon/80" : ""}
            >
              {d.label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-center">Chargement...</p>
        ) : weeks.length === 0 ? (
          <p className="text-muted-foreground text-center text-lg">Aucun match programmé.</p>
        ) : (
          <div className="space-y-8">
            {weeks.map((week, wi) => (
              <div key={wi}>
                <h2 className="font-display text-xl font-bold text-primary mb-4 border-b border-border pb-2">
                  {week.label}
                </h2>
                <div className="space-y-2">
                  {week.matches.map((match) => {
                    const d = new Date(match.match_date);
                    const dayName = DAY_NAMES[d.getDay()];
                    const time = d.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit", hour12: false });
                    const dateStr = d.toLocaleDateString("fr-CA", { day: "numeric", month: "long" });

                    return (
                      <div key={match.id} className="bg-card rounded-lg border border-border p-3 flex items-center gap-3">
                        {/* Date/time column */}
                        <div className="text-xs text-muted-foreground w-28 shrink-0 text-center">
                          <div className="font-semibold">{dayName}</div>
                          <div>{dateStr}</div>
                          <div className="text-foreground font-bold text-sm">{time}</div>
                        </div>

                        {/* Teams */}
                        <div className="flex items-center flex-1 justify-center gap-3 min-w-0">
                          <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                            <span className="font-display text-sm font-semibold truncate">{match.home_team.name}</span>
                            <div
                              className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0"
                              style={{ borderColor: match.home_team.color, color: match.home_team.color }}
                            >
                              {match.home_team.abbr}
                            </div>
                          </div>
                          <span className="text-muted-foreground font-bold text-sm">VS</span>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div
                              className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0"
                              style={{ borderColor: match.away_team.color, color: match.away_team.color }}
                            >
                              {match.away_team.abbr}
                            </div>
                            <span className="font-display text-sm font-semibold truncate">{match.away_team.name}</span>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="w-20 shrink-0 text-center">
                          {match.status === "final" ? (
                            <span className="text-xs font-semibold text-muted-foreground">
                              {match.home_score} - {match.away_score}
                            </span>
                          ) : match.is_live ? (
                            <span className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded-full font-bold">🔴 LIVE</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Programmé</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>📋 Matchs de 2 périodes de 15 min · Réchauffement + pause de 2 min entre les périodes</p>
          <p className="mt-1">Lun-Mer: 17h à 18h30 (2 matchs) · Jeu: 17h à 20h (4 matchs)</p>
        </div>
      </div>
    </div>
  );
};

export default Horaire;
