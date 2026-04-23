import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SectionTitle from "./SectionTitle";
import TeamLogo from "@/components/TeamLogo";

interface TeamData {
  id: string;
  name: string;
  abbr: string;
  color: string;
  logo_url?: string | null;
}

interface MatchData {
  home_team_id: string;
  away_team_id: string;
  home_score: number;
  away_score: number;
  status: string;
}

const StandingsSection = () => {
  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*").order("name");
      if (error) throw error;
      return data as TeamData[];
    },
  });

  const { data: matches } = useQuery({
    queryKey: ["matches"],
    queryFn: async () => {
      const { data, error } = await supabase.from("matches").select("*").eq("status", "final");
      if (error) throw error;
      return data as MatchData[];
    },
  });

  const standings = (teams || []).map((team) => {
    const teamMatches = (matches || []).filter(
      (m) => m.home_team_id === team.id || m.away_team_id === team.id
    );
    let w = 0, l = 0;
    teamMatches.forEach((m) => {
      const isHome = m.home_team_id === team.id;
      const won = isHome ? m.home_score > m.away_score : m.away_score > m.home_score;
      if (won) w++; else l++;
    });
    return { team, gp: teamMatches.length, w, l, otl: 0, pts: w * 2 };
  }).sort((a, b) => b.pts - a.pts || b.w - a.w);

  return (
    <div className="h-full flex flex-col justify-center px-12">
      <SectionTitle title="Classement" subtitle="Saison régulière" />
      <div className="max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-[auto_1fr_repeat(5,60px)] gap-y-1 text-center font-display">
          <div className="col-span-7 grid grid-cols-[auto_1fr_repeat(5,60px)] text-muted-foreground text-sm tracking-wider border-b border-border pb-3 mb-2">
            <span className="w-10">#</span>
            <span className="text-left pl-4">ÉQUIPE</span>
            <span>PJ</span>
            <span>V</span>
            <span>D</span>
            <span>DP</span>
            <span className="text-neon">PTS</span>
          </div>
          {standings.map((s, i) => (
            <motion.div
              key={s.team.id}
              className="col-span-7 grid grid-cols-[auto_1fr_repeat(5,60px)] items-center py-3 rounded-xl hover:bg-arena-surface-light transition-colors"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <span className="w-10 font-bold text-xl text-muted-foreground">{i + 1}</span>
              <div className="flex items-center gap-3 text-left pl-4">
                <TeamLogo
                  logoUrl={s.team.logo_url}
                  abbr={s.team.abbr}
                  color={s.team.color}
                  name={s.team.name}
                  className="w-10 h-10 rounded-full"
                  textClassName="text-xs"
                />
                <span className="text-lg font-semibold text-foreground">{s.team.name}</span>
              </div>
              <span className="text-lg text-secondary-foreground">{s.gp}</span>
              <span className="text-lg text-secondary-foreground">{s.w}</span>
              <span className="text-lg text-secondary-foreground">{s.l}</span>
              <span className="text-lg text-secondary-foreground">{s.otl}</span>
              <span className="text-2xl font-bold text-neon">{s.pts}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StandingsSection;
