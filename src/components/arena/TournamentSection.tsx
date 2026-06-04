import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import SectionTitle from "./SectionTitle";

const EDITION = "2026";

const CATEGORY_LABELS: Record<string, string> = {
  rookies: "Rookies",
  intermediaire: "Young Guns",
  elite: "Vétérans",
};

const CATEGORY_COLORS: Record<string, string> = {
  rookies: "#22d3ee",
  intermediaire: "#a78bfa",
  elite: "#f59e0b",
};

interface TeamMini {
  name: string;
  abbr: string;
  color: string;
  logo_url?: string | null;
}

interface ScheduleRow {
  id: string;
  category: string;
  match_date: string;
  round: string | null;
  venue: string | null;
  status: string;
  home_score: number | null;
  away_score: number | null;
  home_label: string | null;
  away_label: string | null;
  home: TeamMini | null;
  away: TeamMini | null;
}

const TeamCell = ({ team, label, color }: { team: TeamMini | null; label: string | null; color: string }) => (
  <div className="flex items-center gap-3 min-w-0">
    {team?.logo_url ? (
      <img src={team.logo_url} alt={team.name} className="w-10 h-10 object-contain shrink-0" />
    ) : (
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-display font-bold border-2 shrink-0"
        style={{ borderColor: team?.color ?? color, color: team?.color ?? color }}
      >
        {team?.abbr ?? "?"}
      </div>
    )}
    <span className="font-display text-base truncate" style={{ color: team?.color ?? "hsl(var(--foreground))" }}>
      {team?.name ?? label ?? "À déterminer"}
    </span>
  </div>
);

const TournamentSection = () => {
  const queryClient = useQueryClient();

  const { data: rows } = useQuery({
    queryKey: ["arena-tournament-schedule", EDITION],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_schedule")
        .select("*, home:home_team_id(name, abbr, color, logo_url), away:away_team_id(name, abbr, color, logo_url)")
        .eq("edition", EDITION)
        .order("match_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ScheduleRow[];
    },
    refetchInterval: 10000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("realtime-tournament-schedule")
      .on("postgres_changes", { event: "*", schema: "public", table: "tournament_schedule" }, () => {
        queryClient.invalidateQueries({ queryKey: ["arena-tournament-schedule"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const all = rows ?? [];
  const now = Date.now();

  // Show: live (in progress = has at least one score & not completed) + upcoming + recent finished
  const live = all.filter((m) => m.status !== "completed" && (m.home_score !== null || m.away_score !== null));
  const upcoming = all
    .filter((m) => m.status !== "completed" && m.home_score === null && m.away_score === null && new Date(m.match_date).getTime() >= now - 30 * 60 * 1000)
    .slice(0, 6);
  const recent = all
    .filter((m) => m.status === "completed" || (m.home_score !== null && m.away_score !== null))
    .slice(-4)
    .reverse();

  const display = [...live, ...recent, ...upcoming].slice(0, 8);

  if (display.length === 0) {
    return (
      <div className="h-full flex flex-col justify-center items-center px-12">
        <SectionTitle title="Tournoi 2026" subtitle="Aucun match à afficher" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col px-12 py-6 overflow-hidden">
      <SectionTitle title="Tournoi 2026" subtitle="Horaire & scores en direct" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-w-7xl mx-auto w-full mt-4">
        {display.map((m, i) => {
          const catColor = CATEGORY_COLORS[m.category] ?? "#888";
          const isLive = live.some((l) => l.id === m.id);
          const isFinal = m.status === "completed";
          const dt = new Date(m.match_date);
          return (
            <motion.div
              key={m.id}
              className="bg-arena-surface border border-border rounded-xl p-4 flex flex-col gap-2"
              style={isLive ? { boxShadow: `0 0 20px ${catColor}55`, borderColor: catColor } : {}}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-wider">
                <span className="font-display font-bold" style={{ color: catColor }}>
                  {CATEGORY_LABELS[m.category] ?? m.category} · {m.round ?? "Match"}
                </span>
                <span className="text-muted-foreground">
                  {dt.toLocaleDateString("fr-CA", { weekday: "short", day: "numeric", month: "short" })} ·{" "}
                  {dt.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
                  {m.venue ? ` · ${m.venue}` : ""}
                </span>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <TeamCell team={m.home} label={m.home_label} color={catColor} />
                <div className="font-display text-3xl font-bold text-center min-w-[80px]">
                  {m.home_score ?? "-"}
                  <span className="text-muted-foreground mx-2">:</span>
                  {m.away_score ?? "-"}
                </div>
                <div className="justify-self-end">
                  <TeamCell team={m.away} label={m.away_label} color={catColor} />
                </div>
              </div>
              {(isLive || isFinal) && (
                <div className="text-xs font-display tracking-wider self-end" style={{ color: isLive ? catColor : "hsl(var(--muted-foreground))" }}>
                  {isLive ? "● EN DIRECT" : "FINAL"}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default TournamentSection;
