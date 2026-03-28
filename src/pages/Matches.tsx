import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, ArrowLeft, Trash2 } from "lucide-react";
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
  home_team: Team;
  away_team: Team;
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Programmé",
  live: "En cours",
  final: "Final",
};

const Matches = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [matchDate, setMatchDate] = useState("");

  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*").order("name");
      if (error) throw error;
      return data as Team[];
    },
  });

  const { data: matches, isLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
        .order("match_date", { ascending: false });
      if (error) throw error;
      return data as MatchWithTeams[];
    },
  });

  const createMatch = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("matches").insert({
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        match_date: matchDate || new Date().toISOString(),
        status: "scheduled",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      setOpen(false);
      setHomeTeamId("");
      setAwayTeamId("");
      setMatchDate("");
      toast({ title: "Match créé !" });
    },
    onError: (e) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const updateScore = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: "home_score" | "away_score"; value: number }) => {
      const { error } = await supabase.from("matches").update({ [field]: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["matches"] }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const update: Record<string, unknown> = { status };
      if (status === "live") update.is_live = true;
      else update.is_live = false;
      const { error } = await supabase.from("matches").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["matches"] }),
  });

  const deleteMatch = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("matches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      toast({ title: "Match supprimé" });
    },
  });

  return (
    <div className="min-h-screen bg-arena-gradient p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <h1 className="font-display text-4xl font-bold text-neon">Matchs</h1>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Nouveau match</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un match</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createMatch.mutate(); }} className="space-y-4">
                <div>
                  <Label>Équipe locale</Label>
                  <Select value={homeTeamId} onValueChange={setHomeTeamId}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                    <SelectContent>
                      {teams?.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Équipe visiteuse</Label>
                  <Select value={awayTeamId} onValueChange={setAwayTeamId}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                    <SelectContent>
                      {teams?.filter((t) => t.id !== homeTeamId).map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date du match</Label>
                  <Input type="datetime-local" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={createMatch.isPending || !homeTeamId || !awayTeamId}>
                  {createMatch.isPending ? "Création..." : "Créer le match"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-center">Chargement...</p>
        ) : matches?.length === 0 ? (
          <p className="text-muted-foreground text-center text-lg">Aucun match. Créez-en un !</p>
        ) : (
          <div className="space-y-4">
            {matches?.map((match) => (
              <div key={match.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">
                    {new Date(match.match_date).toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                  <div className="flex items-center gap-2">
                    <Select value={match.status} onValueChange={(s) => updateStatus.mutate({ id: match.id, status: s })}>
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Programmé</SelectItem>
                        <SelectItem value="live">En cours</SelectItem>
                        <SelectItem value="final">Final</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => deleteMatch.mutate(match.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-6">
                  <div className="flex items-center gap-3 flex-1 justify-end">
                    <span className="font-display text-lg font-semibold">{match.home_team.name}</span>
                    <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold" style={{ borderColor: match.home_team.color, color: match.home_team.color }}>
                      {match.home_team.abbr}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={match.home_score}
                      onChange={(e) => updateScore.mutate({ id: match.id, field: "home_score", value: parseInt(e.target.value) || 0 })}
                      className="w-16 h-12 text-center font-display text-3xl font-bold"
                      min={0}
                    />
                    <span className="font-display text-2xl text-muted-foreground">-</span>
                    <Input
                      type="number"
                      value={match.away_score}
                      onChange={(e) => updateScore.mutate({ id: match.id, field: "away_score", value: parseInt(e.target.value) || 0 })}
                      className="w-16 h-12 text-center font-display text-3xl font-bold"
                      min={0}
                    />
                  </div>
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold" style={{ borderColor: match.away_team.color, color: match.away_team.color }}>
                      {match.away_team.abbr}
                    </div>
                    <span className="font-display text-lg font-semibold">{match.away_team.name}</span>
                  </div>
                </div>
                {match.is_live && (
                  <div className="text-center mt-2">
                    <span className="text-xs bg-arena-red/20 text-arena-red px-2 py-1 rounded-full font-bold uppercase tracking-wider">🔴 En direct</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Matches;
