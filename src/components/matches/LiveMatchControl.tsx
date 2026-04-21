import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, Goal } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Team = Tables<"teams">;
type Player = Tables<"players">;

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

interface LiveMatchControlProps {
  match: MatchWithTeams;
}

const PERIODS = ["1re", "2e", "3e", "PROL"];

const LiveMatchControl = ({ match }: LiveMatchControlProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState(match.period || "1re");
  const [scorerTeam, setScorerTeam] = useState<"home" | "away">("home");
  const [scorerId, setScorerId] = useState("");
  const [assistId, setAssistId] = useState("");
  const [penaltyPlayerId, setPenaltyPlayerId] = useState("");

  const { data: homePlayers } = useQuery({
    queryKey: ["players", match.home_team_id],
    queryFn: async () => {
      const { data, error } = await supabase.from("players").select("*").eq("team_id", match.home_team_id).order("number");
      if (error) throw error;
      return data as Player[];
    },
  });

  const { data: awayPlayers } = useQuery({
    queryKey: ["players", match.away_team_id],
    queryFn: async () => {
      const { data, error } = await supabase.from("players").select("*").eq("team_id", match.away_team_id).order("number");
      if (error) throw error;
      return data as Player[];
    },
  });

  const { data: events } = useQuery({
    queryKey: ["match_events", match.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_events")
        .select("*, player:players!match_events_player_id_fkey(*), assist_player:players!match_events_assist_player_id_fkey(*), team:teams!match_events_team_id_fkey(*)")
        .eq("match_id", match.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateScore = useMutation({
    mutationFn: async ({ field, delta }: { field: "home_score" | "away_score"; delta: number }) => {
      const currentVal = field === "home_score" ? match.home_score : match.away_score;
      const newVal = Math.max(0, currentVal + delta);
      const updateData: { home_score?: number; away_score?: number; period: string } = 
        field === "home_score" ? { home_score: newVal, period: selectedPeriod } : { away_score: newVal, period: selectedPeriod };
      const { error } = await supabase.from("matches").update(updateData).eq("id", match.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["matches"] }),
  });

  const updatePeriod = useMutation({
    mutationFn: async (period: string) => {
      const { error } = await supabase.from("matches").update({ period }).eq("id", match.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["matches"] }),
  });

  const addEvent = useMutation({
    mutationFn: async ({ eventType, teamId, playerId, assistPlayerId }: { eventType: string; teamId: string; playerId?: string; assistPlayerId?: string }) => {
      const { error } = await supabase.from("match_events").insert({
        match_id: match.id,
        team_id: teamId,
        player_id: playerId || null,
        assist_player_id: assistPlayerId || null,
        event_type: eventType,
        period: selectedPeriod,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match_events", match.id] });
      toast({ title: "Événement ajouté !" });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.from("match_events").delete().eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match_events", match.id] });
    },
  });

  const handleGoal = (side: "home" | "away") => {
    const teamId = side === "home" ? match.home_team_id : match.away_team_id;
    const field = side === "home" ? "home_score" : "away_score";
    updateScore.mutate({ field, delta: 1 });
    addEvent.mutate({
      eventType: "goal",
      teamId,
      playerId: scorerId || undefined,
      assistPlayerId: assistId || undefined,
    });
    setScorerId("");
    setAssistId("");
  };

  const handlePenalty = () => {
    const teamId = scorerTeam === "home" ? match.home_team_id : match.away_team_id;
    addEvent.mutate({
      eventType: "penalty",
      teamId,
      playerId: penaltyPlayerId || undefined,
    });
    setPenaltyPlayerId("");
  };

  const currentPlayers = scorerTeam === "home" ? homePlayers : awayPlayers;

  if (!match.is_live) return null;

  return (
    <div className="mt-4 border-t border-border pt-4 space-y-4">
      {/* Period selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-muted-foreground">Période:</span>
        {PERIODS.map((p) => (
          <Button
            key={p}
            size="sm"
            variant={selectedPeriod === p ? "default" : "outline"}
            onClick={() => { setSelectedPeriod(p); updatePeriod.mutate(p); }}
            className="text-xs"
          >
            {p}
          </Button>
        ))}
      </div>

      {/* Score +/- buttons */}
      <div className="flex items-center justify-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: match.home_team.color }}>{match.home_team.abbr}</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => updateScore.mutate({ field: "home_score", delta: -1 })}>
              <Minus className="h-4 w-4" />
            </Button>
            <span className="font-display text-4xl font-bold w-12 text-center">{match.home_score}</span>
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleGoal("home")}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <span className="font-display text-2xl text-muted-foreground">-</span>
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: match.away_team.color }}>{match.away_team.abbr}</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => updateScore.mutate({ field: "away_score", delta: -1 })}>
              <Minus className="h-4 w-4" />
            </Button>
            <span className="font-display text-4xl font-bold w-12 text-center">{match.away_score}</span>
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleGoal("away")}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Goal details */}
      <div className="bg-muted/30 rounded-lg p-3 space-y-2">
        <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1"><Goal className="h-4 w-4" /> Détails but (optionnel)</span>
        <div className="flex gap-2 flex-wrap">
          <Select value={scorerTeam} onValueChange={(v) => { setScorerTeam(v as "home" | "away"); setScorerId(""); setAssistId(""); }}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="home">{match.home_team.abbr}</SelectItem>
              <SelectItem value="away">{match.away_team.abbr}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={scorerId} onValueChange={setScorerId}>
            <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Buteur" /></SelectTrigger>
            <SelectContent>
              {currentPlayers?.map((p) => (
                <SelectItem key={p.id} value={p.id}>#{p.number} {p.first_name} {p.last_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={assistId} onValueChange={setAssistId}>
            <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Passe" /></SelectTrigger>
            <SelectContent>
              {currentPlayers?.filter((p) => p.id !== scorerId).map((p) => (
                <SelectItem key={p.id} value={p.id}>#{p.number} {p.first_name} {p.last_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Penalty */}
      <div className="bg-muted/30 rounded-lg p-3 space-y-2">
        <span className="text-sm font-semibold text-muted-foreground">🟡 Pénalité</span>
        <div className="flex gap-2 items-center">
          <Select value={penaltyPlayerId} onValueChange={setPenaltyPlayerId}>
            <SelectTrigger className="w-48 h-8 text-xs"><SelectValue placeholder="Joueur pénalisé" /></SelectTrigger>
            <SelectContent>
              {[...(homePlayers || []), ...(awayPlayers || [])].map((p) => (
                <SelectItem key={p.id} value={p.id}>#{p.number} {p.first_name} {p.last_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="destructive" onClick={handlePenalty} disabled={!penaltyPlayerId}>
            Ajouter pénalité
          </Button>
        </div>
      </div>

      {/* Event log */}
      {events && events.length > 0 && (
        <div className="space-y-1">
          <span className="text-sm font-semibold text-muted-foreground">Événements</span>
          {events.map((e: any) => (
            <div key={e.id} className="flex items-center justify-between text-xs bg-muted/20 rounded px-2 py-1">
              <span>
                {e.event_type === "goal" ? "⚽" : "🟡"}{" "}
                {e.period && `${e.period} · `}
                {e.team?.abbr} — {e.player ? `#${e.player.number} ${e.player.first_name} ${e.player.last_name}` : "Inconnu"}
                {e.event_type === "goal" && e.assist_player && ` (P: #${e.assist_player.number} ${e.assist_player.last_name})`}
              </span>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => {
                if (e.event_type === "goal") {
                  const field = e.team_id === match.home_team_id ? "home_score" : "away_score";
                  updateScore.mutate({ field, delta: -1 });
                }
                deleteEvent.mutate(e.id);
              }}>×</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveMatchControl;
