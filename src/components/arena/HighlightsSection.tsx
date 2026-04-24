import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SectionTitle from "./SectionTitle";

interface TeamRow {
  id: string;
  name: string;
  abbr: string;
  color: string;
}

interface PlayerRow {
  id: string;
  first_name: string;
  last_name: string;
  number: number;
}

interface EventRow {
  id: string;
  event_type: string;
  event_time: string | null;
  period: string | null;
  team_id: string;
  player_id: string | null;
  match_id: string;
  created_at: string;
}

const eventLabel = (type: string) => {
  switch (type) {
    case "goal":
      return { icon: "⚡", label: "BUT" };
    case "penalty":
      return { icon: "🚨", label: "PÉNALITÉ" };
    case "fight":
      return { icon: "🥊", label: "BAGARRE" };
    case "save":
      return { icon: "🧤", label: "ARRÊT" };
    default:
      return { icon: "•", label: type.toUpperCase() };
  }
};

const HighlightsSection = () => {
  const { data: events } = useQuery({
    queryKey: ["arena-highlights"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data as EventRow[];
    },
  });

  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("id, name, abbr, color");
      if (error) throw error;
      return data as TeamRow[];
    },
  });

  const { data: players } = useQuery({
    queryKey: ["players-min"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, first_name, last_name, number");
      if (error) throw error;
      return data as PlayerRow[];
    },
  });

  const teamMap = new Map((teams ?? []).map((t) => [t.id, t]));
  const playerMap = new Map((players ?? []).map((p) => [p.id, p]));

  const items = (events ?? []).map((e) => {
    const team = teamMap.get(e.team_id);
    const player = e.player_id ? playerMap.get(e.player_id) : null;
    const { icon, label } = eventLabel(e.event_type);
    const time = [e.event_time, e.period].filter(Boolean).join(" - ") || "—";
    const playerName = player
      ? `#${player.number} ${player.first_name[0]}. ${player.last_name}`
      : "—";
    return {
      id: e.id,
      icon,
      label,
      time,
      team,
      playerName,
    };
  });

  return (
    <div className="h-full flex flex-col justify-center px-12">
      <SectionTitle title="Faits Saillants" subtitle="Derniers événements de la ligue" />
      <div className="max-w-3xl mx-auto w-full relative">
        {items.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            Aucun fait saillant pour le moment
          </p>
        ) : (
          <>
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-primary/30" />
            <div className="space-y-4">
              {items.map((h, i) => (
                <motion.div
                  key={h.id}
                  className="flex items-start gap-6 relative"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center z-10 shrink-0">
                    <span className="text-lg">{h.icon}</span>
                  </div>
                  <div className="bg-arena-surface rounded-xl px-6 py-4 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-xl font-bold text-foreground">
                        {h.label}
                      </span>
                      <span className="text-sm text-muted-foreground font-display tracking-wider">
                        {h.time}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      {h.team && (
                        <span
                          className="text-sm font-bold"
                          style={{ color: h.team.color }}
                        >
                          {h.team.abbr}
                        </span>
                      )}
                      <span className="text-secondary-foreground">{h.playerName}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HighlightsSection;
