import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, Clock, Lock, ShieldCheck } from "lucide-react";
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
  lineup_confirmed: boolean;
  home_team: Team;
  away_team: Team;
}

const POSITIONS: Record<string, string> = { F: "Avant", D: "Défenseur", G: "Gardien" };

const LineupLock = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [homeInitials, setHomeInitials] = useState("");
  const [awayInitials, setAwayInitials] = useState("");

  const { data: match, isLoading: matchLoading } = useQuery({
    queryKey: ["match", matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
        .eq("id", matchId!)
        .single();
      if (error) throw error;
      return data as MatchWithTeams;
    },
    enabled: !!matchId,
  });

  const { data: approval, refetch: refetchApproval } = useQuery({
    queryKey: ["lineup_approval", matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lineup_approvals")
        .select("*")
        .eq("match_id", matchId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!matchId,
  });

  const { data: homePlayers } = useQuery({
    queryKey: ["players", match?.home_team_id],
    queryFn: async () => {
      const { data, error } = await supabase.from("players").select("*").eq("team_id", match!.home_team_id).order("number");
      if (error) throw error;
      return data as Player[];
    },
    enabled: !!match,
  });

  const { data: awayPlayers } = useQuery({
    queryKey: ["players", match?.away_team_id],
    queryFn: async () => {
      const { data, error } = await supabase.from("players").select("*").eq("team_id", match!.away_team_id).order("number");
      if (error) throw error;
      return data as Player[];
    },
    enabled: !!match,
  });

  // Realtime subscription for lineup_approvals
  useEffect(() => {
    if (!matchId) return;
    const channel = supabase
      .channel(`lineup-${matchId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "lineup_approvals", filter: `match_id=eq.${matchId}` }, () => {
        refetchApproval();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [matchId, refetchApproval]);

  const isLocked = approval?.locked === true;
  const homeSigned = !!approval?.home_signed_at;
  const awaySigned = !!approval?.away_signed_at;

  const signHome = useMutation({
    mutationFn: async () => {
      if (!homeInitials.trim()) throw new Error("Initiales requises");
      if (approval) {
        if (approval.home_signed_at) throw new Error("Déjà signé");
        const updates: { home_coach_initials: string; home_signed_at: string; updated_at: string; locked?: boolean; locked_at?: string } = {
          home_coach_initials: homeInitials.toUpperCase(),
          home_signed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        // Auto-lock if away already signed
        if (approval.away_signed_at) {
          updates.locked = true;
          updates.locked_at = new Date().toISOString();
        }
        const { error } = await supabase.from("lineup_approvals").update(updates).eq("id", approval.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("lineup_approvals").insert({
          match_id: matchId!,
          home_coach_initials: homeInitials.toUpperCase(),
          home_signed_at: new Date().toISOString(),
        });
        if (error) throw error;
      }
      // Also update matches table for backward compat
      await supabase.from("matches").update({ home_coach_initials: homeInitials.toUpperCase() }).eq("id", matchId!);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lineup_approval", matchId] });
      qc.invalidateQueries({ queryKey: ["matches"] });
      toast({ title: "✅ Signature coach local enregistrée" });
    },
    onError: (e) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const signAway = useMutation({
    mutationFn: async () => {
      if (!awayInitials.trim()) throw new Error("Initiales requises");
      if (approval) {
        if (approval.away_signed_at) throw new Error("Déjà signé");
        const updates: { away_coach_initials: string; away_signed_at: string; updated_at: string; locked?: boolean; locked_at?: string } = {
          away_coach_initials: awayInitials.toUpperCase(),
          away_signed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        if (approval.home_signed_at) {
          updates.locked = true;
          updates.locked_at = new Date().toISOString();
        }
        const { error } = await supabase.from("lineup_approvals").update(updates).eq("id", approval.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("lineup_approvals").insert({
          match_id: matchId!,
          away_coach_initials: awayInitials.toUpperCase(),
          away_signed_at: new Date().toISOString(),
        });
        if (error) throw error;
      }
      await supabase.from("matches").update({ away_coach_initials: awayInitials.toUpperCase() }).eq("id", matchId!);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lineup_approval", matchId] });
      qc.invalidateQueries({ queryKey: ["matches"] });
      toast({ title: "✅ Signature coach visiteur enregistrée" });
    },
    onError: (e) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  if (matchLoading) return <div className="min-h-screen bg-arena-gradient flex items-center justify-center"><span className="text-muted-foreground">Chargement…</span></div>;
  if (!match) return <div className="min-h-screen bg-arena-gradient flex items-center justify-center"><span className="text-destructive">Match introuvable</span></div>;

  const renderPlayers = (players: Player[] | undefined, teamColor: string) => (
    <div className="space-y-1">
      {players?.map((p) => (
        <div key={p.id} className="flex items-center gap-2 text-sm py-1 px-2 rounded bg-muted/30">
          <span className="font-bold w-8 text-right" style={{ color: teamColor }}>#{p.number}</span>
          <span className="flex-1">{p.first_name} {p.last_name}</span>
          <span className="text-xs text-muted-foreground">{POSITIONS[p.position] || p.position}</span>
        </div>
      ))}
      {(!players || players.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">Aucun joueur</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-arena-gradient p-4">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/matchs"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Validation Alignement</h1>
            <p className="text-xs text-muted-foreground">
              {match.home_team.name} vs {match.away_team.name} — {new Date(match.match_date).toLocaleDateString("fr-CA")}
            </p>
          </div>
        </div>

        {/* Lock status banner */}
        {isLocked && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-center gap-3">
            <Lock className="h-6 w-6 text-primary shrink-0" />
            <div>
              <p className="font-bold text-primary text-sm">ALIGNEMENT VERROUILLÉ</p>
              <p className="text-xs text-muted-foreground">
                Verrouillé le {approval?.locked_at ? new Date(approval.locked_at).toLocaleString("fr-CA") : "—"}
              </p>
            </div>
          </div>
        )}

        {/* Home team */}
        <Card className="border-l-4" style={{ borderLeftColor: match.home_team.color }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2" style={{ color: match.home_team.color }}>
              <ShieldCheck className="h-4 w-4" />
              {match.home_team.name} (Local)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {renderPlayers(homePlayers, match.home_team.color)}
            <div className="border-t border-border pt-3">
              {homeSigned ? (
                <div className="flex items-center gap-2 text-primary">
                  <CheckCircle className="h-5 w-5" />
                  <div>
                    <p className="font-bold text-sm">VALIDÉ — {approval?.home_coach_initials}</p>
                    <p className="text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {approval?.home_signed_at ? new Date(approval.home_signed_at).toLocaleString("fr-CA") : ""}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                    <Clock className="h-3 w-3" /> EN ATTENTE — Signature coach local
                  </p>
                  <Input
                    value={homeInitials}
                    onChange={(e) => setHomeInitials(e.target.value)}
                    placeholder="Initiales (ex: JD)"
                    maxLength={4}
                    className="text-center text-lg font-bold uppercase h-12"
                    disabled={isLocked}
                  />
                  <Button
                    className="w-full h-14 text-base font-bold gap-2"
                    onClick={() => signHome.mutate()}
                    disabled={isLocked || !homeInitials.trim() || signHome.isPending}
                  >
                    <CheckCircle className="h-5 w-5" />
                    {signHome.isPending ? "Signature…" : "Signer — Coach Local"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Away team */}
        <Card className="border-l-4" style={{ borderLeftColor: match.away_team.color }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2" style={{ color: match.away_team.color }}>
              <ShieldCheck className="h-4 w-4" />
              {match.away_team.name} (Visiteur)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {renderPlayers(awayPlayers, match.away_team.color)}
            <div className="border-t border-border pt-3">
              {awaySigned ? (
                <div className="flex items-center gap-2 text-primary">
                  <CheckCircle className="h-5 w-5" />
                  <div>
                    <p className="font-bold text-sm">VALIDÉ — {approval?.away_coach_initials}</p>
                    <p className="text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {approval?.away_signed_at ? new Date(approval.away_signed_at).toLocaleString("fr-CA") : ""}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                    <Clock className="h-3 w-3" /> EN ATTENTE — Signature coach visiteur
                  </p>
                  <Input
                    value={awayInitials}
                    onChange={(e) => setAwayInitials(e.target.value)}
                    placeholder="Initiales (ex: MB)"
                    maxLength={4}
                    className="text-center text-lg font-bold uppercase h-12"
                    disabled={isLocked}
                  />
                  <Button
                    className="w-full h-14 text-base font-bold gap-2"
                    onClick={() => signAway.mutate()}
                    disabled={isLocked || !awayInitials.trim() || signAway.isPending}
                  >
                    <CheckCircle className="h-5 w-5" />
                    {signAway.isPending ? "Signature…" : "Signer — Coach Visiteur"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <h3 className="font-bold text-sm text-muted-foreground mb-2">Statut des signatures</h3>
            <div className="flex items-center gap-3">
              <div className={`flex-1 text-center p-2 rounded ${homeSigned ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                <p className="text-xs font-bold">{match.home_team.abbr}</p>
                <p className="text-xs">{homeSigned ? "✅ VALIDÉ" : "⏳ EN ATTENTE"}</p>
              </div>
              <div className={`flex-1 text-center p-2 rounded ${awaySigned ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                <p className="text-xs font-bold">{match.away_team.abbr}</p>
                <p className="text-xs">{awaySigned ? "✅ VALIDÉ" : "⏳ EN ATTENTE"}</p>
              </div>
            </div>
            <div className="mt-3 text-center">
              {isLocked ? (
                <p className="text-primary font-bold text-sm flex items-center justify-center gap-1">
                  <Lock className="h-4 w-4" /> VERROUILLÉ — Match prêt pour le mode LIVE
                </p>
              ) : (
                <p className="text-muted-foreground text-xs">Les deux signatures sont requises pour verrouiller l'alignement</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LineupLock;
