import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save } from "lucide-react";

const EDITION = "2026";
const CATEGORIES = [
  { value: "rookies", label: "Rookies" },
  { value: "intermediaire", label: "Les Young Guns" },
  { value: "elite", label: "Les vétérans" },
];

const TournamentTab = () => {
  return (
    <Tabs defaultValue="teams" className="space-y-4">
      <TabsList className="grid grid-cols-4 w-full bg-secondary/50">
        <TabsTrigger value="teams" className="text-xs sm:text-sm">Équipes</TabsTrigger>
        <TabsTrigger value="schedule" className="text-xs sm:text-sm">Horaire</TabsTrigger>
        <TabsTrigger value="bracket" className="text-xs sm:text-sm">Tableau</TabsTrigger>
        <TabsTrigger value="content" className="text-xs sm:text-sm">Textes</TabsTrigger>
      </TabsList>
      <TabsContent value="teams"><TournamentTeams /></TabsContent>
      <TabsContent value="schedule"><TournamentSchedule /></TabsContent>
      <TabsContent value="bracket"><TournamentBracket /></TabsContent>
      <TabsContent value="content"><TournamentContent /></TabsContent>
    </Tabs>
  );
};

// ─── Registered teams ──────────────────────────────
const TournamentTeams = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [teamId, setTeamId] = useState("");
  const [category, setCategory] = useState("rookies");

  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => (await supabase.from("teams").select("*").order("name")).data ?? [],
  });

  const { data: registered, isLoading } = useQuery({
    queryKey: ["tournament_teams", EDITION],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_teams")
        .select("id, category, team_id, teams:team_id(name, abbr, color)")
        .eq("edition", EDITION);
      if (error) throw error;
      return data ?? [];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tournament_teams").insert({ team_id: teamId, category, edition: EDITION });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tournament_teams", EDITION] });
      setTeamId("");
      toast({ title: "Équipe inscrite" });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tournament_teams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tournament_teams", EDITION] });
      toast({ title: "Retirée" });
    },
  });

  const availableTeams = (teams ?? []).filter((t: any) => !registered?.some((r: any) => r.team_id === t.id));

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <Label>Équipe</Label>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
              <SelectContent>
                {availableTeams.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Catégorie</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => add.mutate()} disabled={!teamId || add.isPending} className="gap-2">
            <Plus className="h-4 w-4" /> Inscrire
          </Button>
        </CardContent>
      </Card>

      {isLoading ? <p className="text-muted-foreground">Chargement...</p> : (
        <div className="space-y-2">
          {registered?.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold" style={{ color: r.teams?.color }}>{r.teams?.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">· {CATEGORIES.find(c => c.value === r.category)?.label}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove.mutate(r.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
          {registered?.length === 0 && <p className="text-muted-foreground text-center py-6">Aucune équipe inscrite</p>}
        </div>
      )}
    </div>
  );
};

// ─── Schedule ──────────────────────────────────────
const TournamentSchedule = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("rookies");
  const [matchDate, setMatchDate] = useState("");
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [venue, setVenue] = useState("");
  const [round, setRound] = useState("");

  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => (await supabase.from("teams").select("*").order("name")).data ?? [],
  });

  const { data: schedule, isLoading } = useQuery({
    queryKey: ["tournament_schedule", EDITION],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_schedule")
        .select("*, home:home_team_id(name, color), away:away_team_id(name, color)")
        .eq("edition", EDITION)
        .order("match_date");
      if (error) throw error;
      return data ?? [];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tournament_schedule").insert({
        edition: EDITION,
        category,
        match_date: new Date(matchDate).toISOString(),
        home_team_id: homeTeamId || null,
        away_team_id: awayTeamId || null,
        venue: venue || null,
        round: round || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tournament_schedule", EDITION] });
      setOpen(false); setMatchDate(""); setHomeTeamId(""); setAwayTeamId(""); setVenue(""); setRound("");
      toast({ title: "Match ajouté" });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tournament_schedule").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tournament_schedule", EDITION] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-display text-lg font-bold">Horaire du tournoi</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Nouveau match</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouveau match de tournoi</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); add.mutate(); }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Catégorie</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Ronde</Label><Input value={round} onChange={(e) => setRound(e.target.value)} placeholder="Quart, Demi, Finale..." /></div>
              </div>
              <div><Label>Date & heure</Label><Input type="datetime-local" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Équipe locale</Label>
                  <Select value={homeTeamId} onValueChange={setHomeTeamId}>
                    <SelectTrigger><SelectValue placeholder="À déterminer" /></SelectTrigger>
                    <SelectContent>{teams?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Équipe visiteur</Label>
                  <Select value={awayTeamId} onValueChange={setAwayTeamId}>
                    <SelectTrigger><SelectValue placeholder="À déterminer" /></SelectTrigger>
                    <SelectContent>{teams?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Lieu</Label><Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Aréna, terrain..." /></div>
              <Button type="submit" className="w-full" disabled={!matchDate || add.isPending}>Créer</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p className="text-muted-foreground">Chargement...</p> : (
        <div className="space-y-2">
          {schedule?.map((m: any) => (
            <Card key={m.id}>
              <CardContent className="p-3 flex items-center justify-between gap-3">
                <div className="text-sm">
                  <div className="text-xs text-muted-foreground uppercase">
                    {new Date(m.match_date).toLocaleString("fr-CA", { dateStyle: "short", timeStyle: "short" })}
                    {m.venue ? ` · ${m.venue}` : ""} · {CATEGORIES.find(c => c.value === m.category)?.label}
                    {m.round ? ` · ${m.round}` : ""}
                  </div>
                  <div>{m.home?.name ?? "TBD"} vs {m.away?.name ?? "TBD"}</div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove.mutate(m.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
          {schedule?.length === 0 && <p className="text-muted-foreground text-center py-6">Aucun match planifié</p>}
        </div>
      )}
    </div>
  );
};

// ─── Bracket ───────────────────────────────────────
const TournamentBracket = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("rookies");
  const [round, setRound] = useState("Quart de finale");
  const [position, setPosition] = useState("1");
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [homeLabel, setHomeLabel] = useState("");
  const [awayLabel, setAwayLabel] = useState("");

  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => (await supabase.from("teams").select("*").order("name")).data ?? [],
  });

  const { data: bracket, isLoading } = useQuery({
    queryKey: ["tournament_bracket", EDITION],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_bracket")
        .select("*, home:home_team_id(name, color), away:away_team_id(name, color)")
        .eq("edition", EDITION)
        .order("position");
      if (error) throw error;
      return data ?? [];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tournament_bracket").insert({
        edition: EDITION,
        category,
        round,
        position: parseInt(position) || 0,
        home_team_id: homeTeamId || null,
        away_team_id: awayTeamId || null,
        home_label: homeLabel || null,
        away_label: awayLabel || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tournament_bracket", EDITION] });
      setOpen(false); setHomeTeamId(""); setAwayTeamId(""); setHomeLabel(""); setAwayLabel("");
      toast({ title: "Confrontation ajoutée" });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tournament_bracket").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tournament_bracket", EDITION] }),
  });

  const updateScore = useMutation({
    mutationFn: async ({ id, home, away }: { id: string; home: number | null; away: number | null }) => {
      const { error } = await supabase.from("tournament_bracket").update({ home_score: home, away_score: away }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tournament_bracket", EDITION] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-display text-lg font-bold">Tableau éliminatoire</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Confrontation</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Ajouter une confrontation</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); add.mutate(); }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Catégorie</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Ronde</Label><Input value={round} onChange={(e) => setRound(e.target.value)} /></div>
              </div>
              <div><Label>Position (ordre)</Label><Input type="number" value={position} onChange={(e) => setPosition(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Équipe 1</Label>
                  <Select value={homeTeamId} onValueChange={setHomeTeamId}>
                    <SelectTrigger><SelectValue placeholder="À déterminer" /></SelectTrigger>
                    <SelectContent>{teams?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input className="mt-1" placeholder="Ou libellé (ex: Gagnant A)" value={homeLabel} onChange={(e) => setHomeLabel(e.target.value)} />
                </div>
                <div>
                  <Label>Équipe 2</Label>
                  <Select value={awayTeamId} onValueChange={setAwayTeamId}>
                    <SelectTrigger><SelectValue placeholder="À déterminer" /></SelectTrigger>
                    <SelectContent>{teams?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input className="mt-1" placeholder="Ou libellé" value={awayLabel} onChange={(e) => setAwayLabel(e.target.value)} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={add.isPending}>Ajouter</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p className="text-muted-foreground">Chargement...</p> : (
        <div className="space-y-2">
          {bracket?.map((b: any) => (
            <Card key={b.id}>
              <CardContent className="p-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="text-sm flex-1 min-w-[200px]">
                  <div className="text-xs text-muted-foreground uppercase">
                    {CATEGORIES.find(c => c.value === b.category)?.label} · {b.round} · #{b.position}
                  </div>
                  <div>{b.home?.name ?? b.home_label ?? "TBD"} vs {b.away?.name ?? b.away_label ?? "TBD"}</div>
                </div>
                <div className="flex gap-2 items-center">
                  <Input type="number" defaultValue={b.home_score ?? ""} className="w-16" onBlur={(e) => updateScore.mutate({ id: b.id, home: e.target.value ? parseInt(e.target.value) : null, away: b.away_score })} />
                  <span>:</span>
                  <Input type="number" defaultValue={b.away_score ?? ""} className="w-16" onBlur={(e) => updateScore.mutate({ id: b.id, home: b.home_score, away: e.target.value ? parseInt(e.target.value) : null })} />
                  <Button variant="ghost" size="icon" onClick={() => remove.mutate(b.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {bracket?.length === 0 && <p className="text-muted-foreground text-center py-6">Bracket vide</p>}
        </div>
      )}
    </div>
  );
};

// ─── Editable content ──────────────────────────────
const TournamentContent = () => {
  return (
    <div className="space-y-6">
      <ContentEditor section="reglements" defaultTitle="Règlements du tournoi" />
      <ContentEditor section="remerciements" defaultTitle="Remerciements" />
    </div>
  );
};

const ContentEditor = ({ section, defaultTitle }: { section: string; defaultTitle: string }) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loaded, setLoaded] = useState(false);

  useQuery({
    queryKey: ["tournament_content", EDITION, section],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_content")
        .select("*")
        .eq("edition", EDITION)
        .eq("section", section)
        .maybeSingle();
      if (error) throw error;
      if (!loaded) {
        setTitle(data?.title ?? defaultTitle);
        setBody(data?.body ?? "");
        setLoaded(true);
      }
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("tournament_content")
        .upsert({ edition: EDITION, section, title, body }, { onConflict: "edition,section" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tournament_content", EDITION, section] });
      toast({ title: "Enregistré" });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div>
          <Label>Titre — {section}</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label>Contenu</Label>
          <Textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="gap-2">
          <Save className="h-4 w-4" /> Enregistrer
        </Button>
      </CardContent>
    </Card>
  );
};

export default TournamentTab;
