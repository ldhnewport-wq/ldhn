import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeMatches } from "@/hooks/useRealtimeMatches";
import { ArrowLeft, Plus, Trash2, Pencil, Users, Trophy, Gamepad2, Zap, CheckCircle, Newspaper, Upload } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import type { Tables } from "@/integrations/supabase/types";
import LiveMatchControl from "@/components/matches/LiveMatchControl";

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
  home_coach_initials: string | null;
  away_coach_initials: string | null;
  lineup_confirmed: boolean;
  home_team: Team;
  away_team: Team;
}

const POSITIONS = [
  { value: "F", label: "Avant" },
  { value: "D", label: "Défenseur" },
  { value: "G", label: "Gardien" },
];

// ─── Teams Tab ───────────────────────────────────────────────
const TeamsTab = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [abbr, setAbbr] = useState("");
  const [color, setColor] = useState("#00cc55");
  const [division, setDivision] = useState("rookies");

  const { data: teams, isLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*").order("name");
      if (error) throw error;
      return data as Team[];
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      if (editId) {
        const { error } = await supabase.from("teams").update({ name, abbr: abbr.toUpperCase(), color, division }).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("teams").insert({ name, abbr: abbr.toUpperCase(), color });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams"] });
      setOpen(false);
      resetForm();
      toast({ title: editId ? "Équipe modifiée" : "Équipe créée" });
    },
    onError: (e) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["teams"] }); toast({ title: "Supprimée" }); },
  });

  const resetForm = () => { setEditId(null); setName(""); setAbbr(""); setColor("#00cc55"); };

  const startEdit = (t: Team) => {
    setEditId(t.id); setName(t.name); setAbbr(t.abbr); setColor(t.color); setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-2xl font-bold text-foreground">Équipes</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Nouvelle équipe</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Modifier l'équipe" : "Nouvelle équipe"}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); upsert.mutate(); }} className="space-y-4">
              <div><Label>Nom</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
              <div><Label>Abréviation (3 lettres)</Label><Input value={abbr} onChange={(e) => setAbbr(e.target.value)} maxLength={4} required /></div>
              <div><Label>Couleur</Label><Input type="color" value={color} onChange={(e) => setColor(e.target.value)} /></div>
              <Button type="submit" className="w-full" disabled={upsert.isPending || !name || !abbr}>
                {upsert.isPending ? "..." : editId ? "Modifier" : "Créer"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p className="text-muted-foreground">Chargement...</p> : (
        <div className="grid gap-3 sm:grid-cols-2">
          {teams?.map((t) => (
            <Card key={t.id} className="border-l-4" style={{ borderLeftColor: t.color }}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2" style={{ borderColor: t.color, color: t.color }}>
                    {t.abbr}
                  </div>
                  <span className="font-semibold">{t.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(t)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => remove.mutate(t.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Players Tab ─────────────────────────────────────────────
const PlayersTab = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [number, setNumber] = useState("");
  const [position, setPosition] = useState("F");
  const [teamId, setTeamId] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [filterTeam, setFilterTeam] = useState<string>("all");

  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*").order("name");
      if (error) throw error;
      return data as Team[];
    },
  });

  const { data: players, isLoading } = useQuery({
    queryKey: ["players-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("players").select("*, team:teams(*)").order("last_name");
      if (error) throw error;
      return data as (Player & { team: Team })[];
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        first_name: firstName,
        last_name: lastName,
        number: parseInt(number),
        position,
        team_id: teamId,
        photo_url: photoUrl || null,
      };
      if (editId) {
        const { error } = await supabase.from("players").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("players").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["players-all"] });
      setOpen(false);
      resetForm();
      toast({ title: editId ? "Joueur modifié" : "Joueur créé" });
    },
    onError: (e) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("players").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["players-all"] }); toast({ title: "Supprimé" }); },
  });

  const resetForm = () => { setEditId(null); setFirstName(""); setLastName(""); setNumber(""); setPosition("F"); setTeamId(""); setPhotoUrl(""); };

  const startEdit = (p: Player & { team: Team }) => {
    setEditId(p.id); setFirstName(p.first_name); setLastName(p.last_name); setNumber(String(p.number)); setPosition(p.position); setTeamId(p.team_id); setPhotoUrl((p as any).photo_url || ""); setOpen(true);
  };

  const filtered = filterTeam === "all" ? players : players?.filter((p) => p.team_id === filterTeam);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h2 className="font-display text-2xl font-bold text-foreground">Joueurs</h2>
        <div className="flex gap-2">
          <Select value={filterTeam} onValueChange={setFilterTeam}>
            <SelectTrigger className="w-40 h-9 text-xs"><SelectValue placeholder="Filtrer" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les équipes</SelectItem>
              {teams?.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Nouveau joueur</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? "Modifier le joueur" : "Nouveau joueur"}</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); upsert.mutate(); }} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Prénom</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required /></div>
                  <div><Label>Nom</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} required /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Numéro</Label><Input type="number" value={number} onChange={(e) => setNumber(e.target.value)} required /></div>
                  <div>
                    <Label>Position</Label>
                    <Select value={position} onValueChange={setPosition}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{POSITIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Équipe</Label>
                  <Select value={teamId} onValueChange={setTeamId}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                    <SelectContent>{teams?.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Photo URL (optionnel)</Label><Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." /></div>
                <Button type="submit" className="w-full" disabled={upsert.isPending || !firstName || !lastName || !number || !teamId}>
                  {upsert.isPending ? "..." : editId ? "Modifier" : "Créer"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? <p className="text-muted-foreground">Chargement...</p> : (
        <div className="space-y-2">
          {filtered?.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  {(p as any).photo_url ? (
                    <img src={(p as any).photo_url} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-border" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                      #{p.number}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-sm">{p.first_name} {p.last_name}</span>
                    <div className="text-xs text-muted-foreground">
                      #{p.number} · {POSITIONS.find((pos) => pos.value === p.position)?.label || p.position} · <span style={{ color: p.team.color }}>{p.team.name}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => remove.mutate(p.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered?.length === 0 && <p className="text-muted-foreground text-center py-8">Aucun joueur trouvé</p>}
        </div>
      )}
    </div>
  );
};

// ─── Matches Tab ─────────────────────────────────────────────
const MatchesTab = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  useRealtimeMatches();
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
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matches"] });
      setOpen(false); setHomeTeamId(""); setAwayTeamId(""); setMatchDate("");
      toast({ title: "Match créé" });
    },
    onError: (e) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const update: Record<string, unknown> = { status, is_live: status === "live" };
      const { error } = await supabase.from("matches").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["matches"] }),
  });

  const deleteMatch = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("matches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["matches"] }); toast({ title: "Match supprimé" }); },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-2xl font-bold text-foreground">Matchs</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Nouveau match</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Créer un match</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMatch.mutate(); }} className="space-y-4">
              <div>
                <Label>Équipe locale</Label>
                <Select value={homeTeamId} onValueChange={setHomeTeamId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>{teams?.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Équipe visiteuse</Label>
                <Select value={awayTeamId} onValueChange={setAwayTeamId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>{teams?.filter((t) => t.id !== homeTeamId).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Date du match</Label><Input type="datetime-local" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} /></div>
              <Button type="submit" className="w-full" disabled={createMatch.isPending || !homeTeamId || !awayTeamId}>
                {createMatch.isPending ? "..." : "Créer le match"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p className="text-muted-foreground">Chargement...</p> : (
        <div className="space-y-4">
          {matches?.map((match) => (
            <Card key={match.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground">
                    {new Date(match.match_date).toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                  <div className="flex items-center gap-2">
                    <Select value={match.status} onValueChange={(s) => updateStatus.mutate({ id: match.id, status: s })}>
                      <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Programmé</SelectItem>
                        <SelectItem value="live">En cours</SelectItem>
                        <SelectItem value="final">Final</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteMatch.mutate(match.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className="font-display text-base font-semibold">{match.home_team.name}</span>
                    <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold" style={{ borderColor: match.home_team.color, color: match.home_team.color }}>
                      {match.home_team.abbr}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-display text-3xl font-bold w-10 text-center">{match.home_score}</span>
                    <span className="text-muted-foreground">-</span>
                    <span className="font-display text-3xl font-bold w-10 text-center">{match.away_score}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold" style={{ borderColor: match.away_team.color, color: match.away_team.color }}>
                      {match.away_team.abbr}
                    </div>
                    <span className="font-display text-base font-semibold">{match.away_team.name}</span>
                  </div>
                </div>
                {match.is_live && (
                  <div className="text-center mt-2">
                    <span className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded-full font-bold uppercase tracking-wider">🔴 En direct</span>
                  </div>
                )}
                {match.lineup_confirmed && (
                  <div className="text-center mt-1">
                    <span className="text-[10px] text-primary flex items-center justify-center gap-1"><CheckCircle className="h-3 w-3" /> Alignement confirmé</span>
                  </div>
                )}
                <LiveMatchControl match={match} />
              </CardContent>
            </Card>
          ))}
          {matches?.length === 0 && <p className="text-muted-foreground text-center py-8">Aucun match</p>}
        </div>
      )}
    </div>
  );
};

// ─── Lineup Tab ──────────────────────────────────────────────
const LineupTab = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: matches } = useQuery({
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

  const upcoming = matches?.filter((m) => m.status !== "final") || [];

  const [selectedMatch, setSelectedMatch] = useState<string>("");
  const match = upcoming.find((m) => m.id === selectedMatch);

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

  const [homeInitials, setHomeInitials] = useState("");
  const [awayInitials, setAwayInitials] = useState("");

  const confirmLineup = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("matches").update({
        home_coach_initials: homeInitials.toUpperCase(),
        away_coach_initials: awayInitials.toUpperCase(),
        lineup_confirmed: true,
      }).eq("id", selectedMatch);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matches"] });
      toast({ title: "Alignement confirmé !" });
    },
    onError: (e) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold text-foreground">Validation alignement</h2>

      <div>
        <Label>Sélectionner un match</Label>
        <Select value={selectedMatch} onValueChange={(v) => {
          setSelectedMatch(v);
          const m = upcoming.find((x) => x.id === v);
          setHomeInitials(m?.home_coach_initials || "");
          setAwayInitials(m?.away_coach_initials || "");
        }}>
          <SelectTrigger><SelectValue placeholder="Choisir un match..." /></SelectTrigger>
          <SelectContent>
            {upcoming.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.home_team.abbr} vs {m.away_team.abbr} — {new Date(m.match_date).toLocaleDateString("fr-CA")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {match && (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Home */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base" style={{ color: match.home_team.color }}>
                {match.home_team.name} (Local)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {homePlayers?.map((p) => (
                <div key={p.id} className="text-sm flex gap-2 items-center">
                  <span className="font-bold text-muted-foreground w-8">#{p.number}</span>
                  <span>{p.first_name} {p.last_name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{POSITIONS.find((pos) => pos.value === p.position)?.label}</span>
                </div>
              ))}
              {(!homePlayers || homePlayers.length === 0) && <p className="text-sm text-muted-foreground">Aucun joueur enregistré</p>}
              <div className="pt-2 border-t border-border">
                <Label className="text-xs">Initiales coach</Label>
                <Input value={homeInitials} onChange={(e) => setHomeInitials(e.target.value)} placeholder="Ex: JD" maxLength={4} className="h-8 text-sm" />
              </div>
            </CardContent>
          </Card>

          {/* Away */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base" style={{ color: match.away_team.color }}>
                {match.away_team.name} (Visiteur)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {awayPlayers?.map((p) => (
                <div key={p.id} className="text-sm flex gap-2 items-center">
                  <span className="font-bold text-muted-foreground w-8">#{p.number}</span>
                  <span>{p.first_name} {p.last_name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{POSITIONS.find((pos) => pos.value === p.position)?.label}</span>
                </div>
              ))}
              {(!awayPlayers || awayPlayers.length === 0) && <p className="text-sm text-muted-foreground">Aucun joueur enregistré</p>}
              <div className="pt-2 border-t border-border">
                <Label className="text-xs">Initiales coach</Label>
                <Input value={awayInitials} onChange={(e) => setAwayInitials(e.target.value)} placeholder="Ex: MB" maxLength={4} className="h-8 text-sm" />
              </div>
            </CardContent>
          </Card>

          <div className="sm:col-span-2">
            <Button className="w-full gap-2" onClick={() => confirmLineup.mutate()} disabled={confirmLineup.isPending || !homeInitials || !awayInitials}>
              <CheckCircle className="h-4 w-4" />
              {match.lineup_confirmed ? "Mettre à jour la confirmation" : "Confirmer l'alignement"}
            </Button>
            {match.lineup_confirmed && (
              <p className="text-xs text-primary text-center mt-2">✓ Alignement déjà confirmé — {match.home_coach_initials} / {match.away_coach_initials}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Articles Tab ────────────────────────────────────────────
const CATEGORIES = [
  { value: "recap", label: "Résumé de match" },
  { value: "stars", label: "3 étoiles" },
  { value: "news", label: "Nouvelles" },
  { value: "project", label: "Projets à venir" },
];

const ArticlesTab = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("news");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [published, setPublished] = useState(true);
  const [uploading, setUploading] = useState(false);

  const { data: articles = [] } = useQuery({
    queryKey: ["admin-articles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("articles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => {
    setEditId(null); setTitle(""); setContent(""); setCategory("news");
    setImageUrl(""); setVideoUrl(""); setPublished(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `articles/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (error) { toast({ title: "Erreur upload", variant: "destructive" }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
    setImageUrl(urlData.publicUrl);
    setUploading(false);
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = { title, content, category, image_url: imageUrl || null, video_url: videoUrl || null, published };
      if (editId) {
        const { error } = await supabase.from("articles").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("articles").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
      toast({ title: editId ? "Article modifié" : "Article créé" });
      resetForm(); setOpen(false);
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-articles"] }); },
  });

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogTrigger asChild>
          <Button className="gap-2"><Plus className="h-4 w-4" /> Ajouter un article</Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Modifier" : "Nouvel"} article</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Titre</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div>
              <Label>Catégorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Contenu</Label><Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} /></div>
            <div>
              <Label>Image</Label>
              <div className="flex gap-2 items-center">
                <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="URL ou upload" className="flex-1" />
                <Label htmlFor="img-upload" className="cursor-pointer">
                  <div className="inline-flex items-center gap-1 px-3 py-2 rounded-md bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80">
                    <Upload className="h-4 w-4" /> {uploading ? "..." : "Upload"}
                  </div>
                </Label>
                <input id="img-upload" type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </div>
              {imageUrl && <img src={imageUrl} alt="preview" className="mt-2 h-32 object-cover rounded-lg" />}
            </div>
            <div><Label>URL vidéo (YouTube embed)</Label><Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/embed/..." /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} id="pub" />
              <Label htmlFor="pub">Publié</Label>
            </div>
            <Button onClick={() => save.mutate()} disabled={!title} className="w-full">
              {editId ? "Modifier" : "Créer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {articles.map((a) => (
          <Card key={a.id} className="border-border">
            <CardContent className="p-4 flex items-center gap-4">
              {a.image_url && <img src={a.image_url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-foreground truncate">{a.title}</span>
                  {!a.published && <span className="text-xs text-muted-foreground">(brouillon)</span>}
                </div>
                <span className="text-xs text-muted-foreground">
                  {CATEGORIES.find((c) => c.value === a.category)?.label} · {new Date(a.created_at).toLocaleDateString("fr-CA")}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => {
                setEditId(a.id); setTitle(a.title); setContent(a.content || "");
                setCategory(a.category); setImageUrl(a.image_url || "");
                setVideoUrl(a.video_url || ""); setPublished(a.published); setOpen(true);
              }}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => del.mutate(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ─── Main Admin Page ─────────────────────────────────────────
const Admin = () => {
  return (
    <div className="min-h-screen bg-arena-gradient p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-neon">Admin</h1>
        </div>

        <Tabs defaultValue="teams" className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full bg-secondary/50">
            <TabsTrigger value="teams" className="gap-1 text-xs sm:text-sm"><Users className="h-4 w-4 hidden sm:block" /> Équipes</TabsTrigger>
            <TabsTrigger value="players" className="gap-1 text-xs sm:text-sm"><Trophy className="h-4 w-4 hidden sm:block" /> Joueurs</TabsTrigger>
            <TabsTrigger value="matches" className="gap-1 text-xs sm:text-sm"><Gamepad2 className="h-4 w-4 hidden sm:block" /> Matchs</TabsTrigger>
            <TabsTrigger value="lineup" className="gap-1 text-xs sm:text-sm"><Zap className="h-4 w-4 hidden sm:block" /> Alignement</TabsTrigger>
            <TabsTrigger value="articles" className="gap-1 text-xs sm:text-sm"><Newspaper className="h-4 w-4 hidden sm:block" /> Reportage</TabsTrigger>
          </TabsList>
          <TabsContent value="teams"><TeamsTab /></TabsContent>
          <TabsContent value="players"><PlayersTab /></TabsContent>
          <TabsContent value="matches"><MatchesTab /></TabsContent>
          <TabsContent value="lineup"><LineupTab /></TabsContent>
          <TabsContent value="articles"><ArticlesTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
