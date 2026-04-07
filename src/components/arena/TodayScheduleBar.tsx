import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TeamData {
  name: string;
  abbr: string;
  color: string;
}

interface TodayMatch {
  id: string;
  match_date: string;
  home_team: TeamData;
  away_team: TeamData;
}

const TodayScheduleBar = () => {
  const { data: matches } = useQuery({
    queryKey: ["today-arena-matches"],
    queryFn: async () => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

      const { data, error } = await supabase
        .from("matches")
        .select("id, match_date, home_team:teams!matches_home_team_id_fkey(name, abbr, color), away_team:teams!matches_away_team_id_fkey(name, abbr, color)")
        .gte("match_date", startOfDay)
        .lt("match_date", endOfDay)
        .order("match_date", { ascending: true });

      if (error) throw error;
      return (data as unknown as TodayMatch[]) || [];
    },
    refetchInterval: 60000,
  });

  if (!matches || matches.length === 0) return null;

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("fr-CA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="bg-card/90 backdrop-blur border-t border-border px-4 py-3">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs font-bold uppercase tracking-widest text-neon">
          🏒 Matchs du jour
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {matches.map((match, idx) => (
          <div
            key={match.id}
            className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 border border-border"
          >
            <span className="text-xs font-mono text-muted-foreground min-w-[40px]">
              {formatTime(match.match_date)}
            </span>
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <span
                className="font-display text-sm font-bold truncate"
                style={{ color: match.home_team?.color }}
              >
                {match.home_team?.abbr}
              </span>
              <span className="text-xs text-muted-foreground">vs</span>
              <span
                className="font-display text-sm font-bold truncate"
                style={{ color: match.away_team?.color }}
              >
                {match.away_team?.abbr}
              </span>
            </div>
            <span className="text-xs font-bold text-muted-foreground bg-background rounded px-1.5 py-0.5">
              V{idx + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TodayScheduleBar;
