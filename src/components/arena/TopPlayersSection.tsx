import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SectionTitle from "./SectionTitle";
import TeamLogo from "@/components/TeamLogo";

interface TeamRow {
  id: string;
  name: string;
  abbr: string;
  color: string;
  logo_url: string | null;
  division: string;
}

interface PlayerRow {
  id: string;
  first_name: string;
  last_name: string;
  number: number;
  team_id: string;
  position: string;
}

interface EventRow {
  event_type: string;
  player_id: string | null;
  assist_player_id: string | null;
}

interface RankedPlayer {
  id: string;
  fullName: string;
  number: number;
  team: TeamRow;
  value: number;
}

const PlayerRow = ({
  player,
  rank,
  label,
}: {
  player: RankedPlayer;
  rank: number;
  label: string;
}) => (
  <motion.div
    className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-arena-surface"
    initial={{ opacity: 0, x: 30 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: rank * 0.08 }}
  >
    <span className="font-display text-2xl font-bold text-muted-foreground w-6 text-center">
      {rank}
    </span>
    <TeamLogo
      logoUrl={player.team.logo_url}
      abbr={player.team.abbr}
      color={player.team.color}
      name={player.team.name}
      className="w-10 h-10 rounded-full shrink-0"
      textClassName="text-[10px]"
    />
    <div className="flex-1 min-w-0">
      <div className="font-display text-base font-semibold text-foreground truncate">
        #{player.number} {player.fullName}
      </div>
      <div className="text-xs text-muted-foreground truncate">{player.team.name}</div>
    </div>
    <div className="text-right shrink-0">
      <span className="font-display text-3xl font-bold text-neon">{player.value}</span>
      <span className="ml-1 text-xs text-muted-foreground uppercase">{label}</span>
    </div>
  </motion.div>
);

const Column = ({
  title,
  players,
  label,
}: {
  title: string;
  players: RankedPlayer[];
  label: string;
}) => (
  <div className="flex-1 min-w-0">
    <h3 className="font-display text-2xl font-bold text-arena-gold tracking-wider mb-4 text-center uppercase">
      {title}
    </h3>
    <div className="space-y-2">
      {players.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-6">
          Aucune statistique
        </p>
      ) : (
        players.map((p, i) => (
          <PlayerRow key={p.id + label} player={p} rank={i + 1} label={label} />
        ))
      )}
    </div>
  </div>
);

const TopPlayersSection = () => {
  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*");
      if (error) throw error;
      return data as TeamRow[];
    },
  });

  const { data: players } = useQuery({
    queryKey: ["players"],
    queryFn: async () => {
      const { data, error } = await supabase.from("players").select("*");
      if (error) throw error;
      return data as PlayerRow[];
    },
  });

  const { data: events } = useQuery({
    queryKey: ["match-events-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_events")
        .select("event_type, player_id, assist_player_id");
      if (error) throw error;
      return data as EventRow[];
    },
  });

  const teamMap = new Map((teams ?? []).map((t) => [t.id, t]));
  const goalEvents = (events ?? []).filter((e) => e.event_type === "goal");

  const ranked = (players ?? [])
    .filter((p) => p.position !== "G")
    .map((p) => {
      const team = teamMap.get(p.team_id);
      const goals = goalEvents.filter((e) => e.player_id === p.id).length;
      const assists = goalEvents.filter((e) => e.assist_player_id === p.id).length;
      return {
        id: p.id,
        fullName: `${p.first_name.trim()} ${p.last_name.trim()}`,
        number: p.number,
        team: team as TeamRow,
        goals,
        assists,
        pts: goals + assists * 2,
      };
    })
    .filter((p) => !!p.team);

  const topScorers = [...ranked]
    .map((p) => ({ ...p, value: p.goals }))
    .filter((p) => p.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const topAssists = [...ranked]
    .map((p) => ({ ...p, value: p.assists }))
    .filter((p) => p.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const topPoints = [...ranked]
    .map((p) => ({ ...p, value: p.pts }))
    .filter((p) => p.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="h-full flex flex-col justify-center px-12">
      <SectionTitle title="Meneurs" subtitle="Top 5 de la ligue" />
      <div className="flex gap-6 max-w-7xl mx-auto w-full">
        <Column title="🏒 Buts" players={topScorers} label="B" />
        <Column title="🎯 Passes" players={topAssists} label="A" />
        <Column title="⭐ Points" players={topPoints} label="PTS" />
      </div>
    </div>
  );
};

export default TopPlayersSection;
