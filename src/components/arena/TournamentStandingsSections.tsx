import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import SectionTitle from "./SectionTitle";
import TeamLogo from "@/components/TeamLogo";

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

interface StandingRow {
  team_id: string;
  name: string;
  abbr: string;
  color: string;
  logo_url?: string | null;
  gp: number;
  w: number;
  l: number;
  otl: number;
  gf: number;
  ga: number;
  pts: number;
}

interface TournamentTeam {
  team_id: string;
  category: string;
  teams?: {
    name: string;
    abbr: string;
    color: string;
    logo_url?: string | null;
  } | null;
}

interface ScheduleMatch {
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  category: string;
  overtime: boolean;
}

const buildStandings = (
  registered: TournamentTeam[] | undefined,
  schedule: ScheduleMatch[] | undefined,
  category: string
): StandingRow[] => {
  const rows: StandingRow[] = [];

  (registered ?? [])
    .filter((r) => r.category === category)
    .forEach((r) => {
      rows.push({
        team_id: r.team_id,
        name: r.teams?.name ?? "—",
        abbr: r.teams?.abbr ?? "?",
        color: r.teams?.color ?? "#888",
        logo_url: r.teams?.logo_url ?? null,
        gp: 0,
        w: 0,
        l: 0,
        otl: 0,
        gf: 0,
        ga: 0,
        pts: 0,
      });
    });

  (schedule ?? [])
    .filter((m) => m.category === category && m.home_score != null && m.away_score != null)
    .forEach((m) => {
      const home = rows.find((t) => t.team_id === m.home_team_id);
      const away = rows.find((t) => t.team_id === m.away_team_id);
      if (home) {
        home.gp++;
        home.gf += m.home_score!;
        home.ga += m.away_score!;
      }
      if (away) {
        away.gp++;
        away.gf += m.away_score!;
        away.ga += m.home_score!;
      }
      if (m.home_score! > m.away_score!) {
        if (home) {
          home.w++;
          home.pts += 2;
        }
        if (away) {
          if (m.overtime) {
            away.otl++;
            away.pts += 1;
          } else {
            away.l++;
          }
        }
      } else if (m.away_score! > m.home_score!) {
        if (away) {
          away.w++;
          away.pts += 2;
        }
        if (home) {
          if (m.overtime) {
            home.otl++;
            home.pts += 1;
          } else {
            home.l++;
          }
        }
      }
    });

  return rows.sort(
    (a, b) => b.pts - a.pts || b.gf - b.ga - (a.gf - a.ga) || b.gf - a.gf
  );
};

const TournamentCategoryStandings = ({ category }: { category: string }) => {
  const queryClient = useQueryClient();
  const label = CATEGORY_LABELS[category] ?? category;
  const color = CATEGORY_COLORS[category] ?? "hsl(var(--arena-neon))";

  const { data: registered } = useQuery({
    queryKey: ["arena-tournament-teams", EDITION],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_teams")
        .select("team_id, category, teams:team_id(name, abbr, color, logo_url)")
        .eq("edition", EDITION);
      if (error) throw error;
      return (data ?? []) as unknown as TournamentTeam[];
    },
  });

  const { data: schedule } = useQuery({
    queryKey: ["arena-tournament-schedule", EDITION],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_schedule")
        .select("home_team_id, away_team_id, home_score, away_score, category, overtime")
        .eq("edition", EDITION);
      if (error) throw error;
      return (data ?? []) as unknown as ScheduleMatch[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("realtime-tournament-standings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tournament_schedule" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["arena-tournament-schedule"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tournament_teams" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["arena-tournament-teams"] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const standings = buildStandings(registered, schedule, category);

  if (standings.length === 0) {
    return (
      <div className="h-full flex flex-col justify-center items-center px-12">
        <SectionTitle title={`Classement ${label}`} subtitle="Tournoi 2026" />
        <p className="text-muted-foreground text-lg">Aucune équipe inscrite</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col justify-center px-12">
      <SectionTitle
        title={`Classement ${label}`}
        subtitle="Tournoi 2026 · 2 pts victoire · 1 pt défaite prolongation"
      />
      <div className="max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="grid grid-cols-[auto_1fr_repeat(7,70px)] gap-y-1 text-center font-display mb-2">
          <div className="col-span-9 grid grid-cols-[auto_1fr_repeat(7,70px)] text-muted-foreground text-sm tracking-wider border-b border-border pb-3">
            <span className="w-10">#</span>
            <span className="text-left pl-4">ÉQUIPE</span>
            <span>PJ</span>
            <span>V</span>
            <span>D</span>
            <span>DP</span>
            <span>BP</span>
            <span>BC</span>
            <span>+/-</span>
            <span className="text-neon">PTS</span>
          </div>

          {standings.map((s, i) => (
            <motion.div
              key={s.team_id}
              className="col-span-9 grid grid-cols-[auto_1fr_repeat(7,70px)] items-center py-3 rounded-xl hover:bg-arena-surface-light transition-colors"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <span className="w-10 font-bold text-xl" style={{ color }}>
                {i + 1}
              </span>
              <div className="flex items-center gap-3 text-left pl-4 min-w-0">
                <TeamLogo
                  logoUrl={s.logo_url}
                  abbr={s.abbr}
                  color={s.color}
                  name={s.name}
                  className="w-10 h-10 rounded-full"
                  textClassName="text-xs"
                />
                <span className="text-lg font-semibold text-foreground truncate">{s.name}</span>
              </div>
              <span className="text-lg text-secondary-foreground">{s.gp}</span>
              <span className="text-lg text-secondary-foreground">{s.w}</span>
              <span className="text-lg text-secondary-foreground">{s.l}</span>
              <span className="text-lg text-secondary-foreground">{s.otl}</span>
              <span className="text-lg text-secondary-foreground">{s.gf}</span>
              <span className="text-lg text-secondary-foreground">{s.ga}</span>
              <span className="text-lg text-secondary-foreground">
                {s.gf - s.ga > 0 ? `+${s.gf - s.ga}` : s.gf - s.ga}
              </span>
              <span className="text-2xl font-bold text-neon">{s.pts}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const TournamentStandingsRookies = () => (
  <TournamentCategoryStandings category="rookies" />
);
export const TournamentStandingsYoungGuns = () => (
  <TournamentCategoryStandings category="intermediaire" />
);
export const TournamentStandingsVeterans = () => (
  <TournamentCategoryStandings category="elite" />
);

export default TournamentCategoryStandings;
