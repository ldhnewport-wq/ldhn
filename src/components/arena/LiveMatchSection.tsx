import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeMatches } from "@/hooks/useRealtimeMatches";
import LiveIndicator from "./LiveIndicator";
import SectionTitle from "./SectionTitle";

interface TeamData {
  id: string;
  name: string;
  abbr: string;
  color: string;
  logo_url?: string | null;
}

interface MatchData {
  id: string;
  home_score: number;
  away_score: number;
  status: string;
  period: string | null;
  match_date: string;
  is_live: boolean;
  home_team: TeamData;
  away_team: TeamData;
}

const LiveMatchSection = () => {
  useRealtimeMatches();

  const { data: matches } = useQuery({
    queryKey: ["matches-live-only"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
        .eq("is_live", true);
      if (error) throw error;
      return data as MatchData[];
    },
    refetchInterval: 5000,
  });

  const live = (matches ?? []).filter((m) => m.home_team && m.away_team);

  if (live.length === 0) {
    return (
      <div className="h-full flex flex-col justify-center items-center px-12">
        <SectionTitle title="En direct" subtitle="Aucun match en cours" />
      </div>
    );
  }

  const m = live[0];

  return (
    <div className="h-full flex flex-col justify-center px-12">
      <SectionTitle title="En direct" subtitle="Suivez le match en temps réel" />
      <motion.div
        className="relative bg-arena-surface border border-border rounded-3xl p-12 mx-auto max-w-5xl w-full glow-neon"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="absolute top-6 right-6"><LiveIndicator /></div>
        {m.period && (
          <div className="absolute top-6 left-6 text-muted-foreground font-display text-lg tracking-wider">
            {m.period}
          </div>
        )}
        <div className="flex items-center justify-center gap-12 mt-10">
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center text-4xl font-display font-bold border-4 overflow-hidden"
              style={{ borderColor: m.home_team.color, color: m.home_team.color }}
            >
              {m.home_team.logo_url ? (
                <img src={m.home_team.logo_url} alt={m.home_team.name} className="w-full h-full object-contain p-2" />
              ) : (
                m.home_team.abbr
              )}
            </div>
            <span className="text-lg text-muted-foreground font-display">{m.home_team.name}</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="font-display text-9xl font-bold text-foreground">{m.home_score}</span>
            <span className="font-display text-5xl text-muted-foreground">-</span>
            <span className="font-display text-9xl font-bold text-foreground">{m.away_score}</span>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center text-4xl font-display font-bold border-4 overflow-hidden"
              style={{ borderColor: m.away_team.color, color: m.away_team.color }}
            >
              {m.away_team.logo_url ? (
                <img src={m.away_team.logo_url} alt={m.away_team.name} className="w-full h-full object-contain p-2" />
              ) : (
                m.away_team.abbr
              )}
            </div>
            <span className="text-lg text-muted-foreground font-display">{m.away_team.name}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LiveMatchSection;
