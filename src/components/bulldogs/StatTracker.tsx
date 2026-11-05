import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Undo2, Save } from "lucide-react";
import { listBulldogsGames, listBulldogsEvents, saveBulldogsGame, addBulldogsEvent, removeBulldogsEvent } from "@/lib/bulldogsStorage";
import { toast } from "sonner";
import { actions, countEvents, faceoffStats, needsPlayer, positions, type ActionKind, type BulldogsPlayer, type Position } from "@/lib/bulldogsStats";
import Rink from "./Rink";
import MatchArchives from "./MatchArchives";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const positionLabels: Record<Position, string> = { C: "Centre", AG: "Ailier gauche", AD: "Ailier droit", DG: "Défenseur gauche", DD: "Défenseur droit", G: "Gardien" };
const localDate = () => new Date().toLocaleDateString("en-CA");
export default function StatTracker() {
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [gameId, setGameId] = useState("");
  const [opponent, setOpponent] = useState("");
  const [date, setDate] = useState(localDate);
  const [roster, setRoster] = useState<BulldogsPlayer[]>([]);
  const [dirty, setDirty] = useState(false);
  const [active, setActive] = useState<ActionKind | null>(null);
  const [playerId, setPlayerId] = useState("");
  const [centreId, setCentreId] = useState("");
  const [period, setPeriod] = useState("1");
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setGameId(""); setRoster([]); setOpponent(""); setActive(null); setDirty(false);
    qc.removeQueries({ queryKey: ["bulldogs-events"] });
  }, [session?.user.id, qc]);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_, next) => { setSession(next); setAuthReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);
  const games = useQuery({ queryKey: ["bulldogs-games", session?.user.id ?? "device"], enabled: authReady, queryFn: () => listBulldogsGames(session?.user.id) });
  const selectedGame = games.data?.find(g => g.id === gameId);
  useEffect(() => {
    if (!selectedGame) return;
    setOpponent(selectedGame.opponent); setDate(selectedGame.played_at);
    setRoster(Array.isArray(selectedGame.roster) ? selectedGame.roster as unknown as BulldogsPlayer[] : []);
    setDirty(false); setActive(null); setPlayerId(""); setCentreId("");
  }, [selectedGame]);
  const eventQuery = useQuery({ queryKey: ["bulldogs-events", gameId, session?.user.id ?? "device"], enabled: authReady && !!gameId, queryFn: () => listBulldogsEvents(session?.user.id, gameId) });
  const events = eventQuery.data ?? [];
  useEffect(() => {
    if (!session) return;
    const channel = supabase.channel(`bulldogs-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bulldogs_games" }, () => qc.invalidateQueries({ queryKey: ["bulldogs-games"] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "bulldogs_events", ...(gameId ? { filter: `game_id=eq.${gameId}` } : {}) }, () => qc.invalidateQueries({ queryKey: ["bulldogs-events"] })).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session, gameId, qc]);
  const run = async (work: () => Promise<void>) => {
    if (busy) return; setBusy(true);
    try { await work(); } catch (error) { toast.error(error instanceof Error ? error.message : "Sauvegarde impossible. Vérifiez votre connexion."); } finally { setBusy(false); }
  };
  const save = () => run(async () => {
    if (!opponent.trim()) { toast.error("Indiquez l’équipe adverse."); return; }
    if (roster.some(p => !p.name.trim())) { toast.error("Indiquez le nom de chaque joueur."); return; }
    const payload = { opponent: opponent.trim(), played_at: date, roster: roster as unknown as Json };
    const result = await saveBulldogsGame(payload, gameId, session?.user.id);
    setGameId(result.id); setDirty(false);
    await qc.invalidateQueries({ queryKey: ["bulldogs-games"] }); toast.success("Match et alignement enregistrés");
  });
  const record = (kind: ActionKind, point?: { x: number; y: number }, selectedId = playerId) => run(async () => {
    if (!gameId || dirty) { toast.error("Enregistrez le match et l’alignement avant de saisir les actions."); return; }
    const player = roster.find(p => p.id === selectedId);
    if (needsPlayer(kind) && !player) { toast.error("Sélectionnez un joueur."); return; }
    if (kind.startsWith("faceoff") && player?.position !== "C") { toast.error("Sélectionnez un centre."); return; }
    if (actions[kind].location && !point) return;
    await addBulldogsEvent({ game_id: gameId, kind, period, player_id: player?.id ?? null, player_name: player ? `#${player.number} ${player.name}` : null, x: point?.x ?? null, y: point?.y ?? null }, session?.user.id);
    await qc.invalidateQueries({ queryKey: ["bulldogs-events"] });
    setActive(null);
  });
  const remove = (id: string) => run(async () => {
    await removeBulldogsEvent(id, session?.user.id);
    await qc.invalidateQueries({ queryKey: ["bulldogs-events"] });
  });
  const updatePlayer = (id: string, update: Partial<BulldogsPlayer>) => { setRoster(current => current.map(p => p.id === id ? { ...p, ...update } : p)); setDirty(true); };
  const ready = !!gameId && !dirty && !busy && !eventQuery.isPending && !eventQuery.isError;
  if (!authReady) return <p className="text-muted-foreground">Chargement…</p>;
  return <Tabs defaultValue="live">
    <TabsList className="mb-6"><TabsTrigger value="live">Prise de statistiques</TabsTrigger><TabsTrigger value="archives">Archives</TabsTrigger></TabsList>
    <TabsContent value="archives">{games.isPending ? <p role="status">Chargement des matchs…</p> : games.isError ? <Button variant="outline" onClick={() => games.refetch()}>Réessayer le chargement des matchs</Button> : <MatchArchives games={games.data ?? []} userId={session?.user.id} />}</TabsContent>
    <TabsContent value="live" forceMount className="data-[state=inactive]:hidden"><section className="space-y-7">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-2xl">Prise de statistiques</h2><div className="flex gap-2"><Button variant="outline" disabled={busy} onClick={() => { if (dirty && !window.confirm("Quitter sans enregistrer les changements ?")) return; setGameId(""); setOpponent(""); setDate(localDate()); setRoster(roster.map(p => ({ ...p }))); setDirty(true); setActive(null); }}><Plus />Nouveau match</Button>{session && <Button variant="ghost" onClick={() => supabase.auth.signOut()}>Déconnexion</Button>}</div></div>
    {(games.isError || eventQuery.isError) && <p role="alert" className="text-destructive">Impossible de charger les statistiques. <Button variant="link" onClick={() => { games.refetch(); eventQuery.refetch(); }}>Réessayer</Button></p>}
    <div className="grid gap-4 sm:grid-cols-3"><label className="space-y-2"><span>Match enregistré</span><select className="bulldogs-select" value={gameId} disabled={busy} onChange={e => { if (dirty && !window.confirm("Quitter sans enregistrer les changements ?")) return; setGameId(e.target.value); }}><option value="">Nouveau match</option>{games.data?.map(g => <option key={g.id} value={g.id}>{g.played_at} · {g.opponent}</option>)}</select></label><label className="space-y-2"><span>Adversaire</span><Input value={opponent} onChange={e => { setOpponent(e.target.value); setDirty(true); }} placeholder="Équipe adverse" /></label><label className="space-y-2"><span>Date du match</span><Input type="date" value={date} onChange={e => { setDate(e.target.value); setDirty(true); }} /></label></div>
    <details className="border-y border-border py-4" open={!gameId || dirty}><summary className="cursor-pointer font-display text-xl">Alignement · {roster.length} joueurs</summary><div className="mt-4 space-y-3">{roster.map(p => <div key={p.id} className="grid grid-cols-[60px_1fr_40px] sm:grid-cols-[70px_1fr_190px_40px] gap-2"><Input aria-label="Numéro du joueur" value={p.number} onChange={e => updatePlayer(p.id, { number: e.target.value })} placeholder="#" /><Input aria-label="Nom du joueur" value={p.name} onChange={e => updatePlayer(p.id, { name: e.target.value })} placeholder="Nom du joueur" /><select aria-label="Position du joueur" className="bulldogs-select col-span-2 sm:col-span-1 row-start-2 sm:row-start-auto" value={p.position} onChange={e => updatePlayer(p.id, { position: e.target.value as Position })}>{positions.map(pos => <option key={pos} value={pos}>{positionLabels[pos]}</option>)}</select><Button variant="ghost" size="icon" aria-label={`Retirer ${p.name || "le joueur"}`} onClick={() => { setRoster(roster.filter(row => row.id !== p.id)); setDirty(true); }}><Trash2 /></Button></div>)}<Button variant="outline" onClick={() => { setRoster([...roster, { id: crypto.randomUUID(), name: "", number: "", position: "C" }]); setDirty(true); }}><Plus />Ajouter un joueur</Button></div></details>
    <div className="flex flex-wrap items-center gap-3"><Button onClick={save} disabled={busy}><Save />Enregistrer le match et l’alignement</Button><span role="status" className="text-sm text-muted-foreground">{busy ? "Enregistrement…" : dirty || !gameId ? "Non enregistré" : "Enregistré"}</span></div>
    <div className="grid grid-cols-2 gap-6 border-y border-border py-5 text-center"><div><p className="font-display text-lg text-primary">BULLDOGS</p><p className="font-display text-6xl">{countEvents(events, "goal_for")}</p><p className="text-muted-foreground">{countEvents(events, "shot_for")} tirs</p></div><div><p className="font-display text-lg text-destructive">{opponent || "ADVERSAIRE"}</p><p className="font-display text-6xl">{countEvents(events, "goal_against")}</p><p className="text-muted-foreground">{countEvents(events, "shot_against")} tirs</p></div></div>
    <div className="grid gap-6 lg:grid-cols-[1fr_250px]">
      <div className="space-y-4"><div className="flex flex-wrap items-center gap-2"><span className="text-muted-foreground mr-2">Période</span>{["1", "2", "3", "PROL"].map(p => <Button key={p} variant={period === p ? "default" : "outline"} onClick={() => setPeriod(p)}>{p}</Button>)}</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{(["shot_for", "shot_against", "goal_for", "goal_against", "blocked", "penalty"] as const).map(kind => <Button key={kind} disabled={!ready} variant={active === kind ? "default" : "outline"} className="h-12" onClick={() => { if (needsPlayer(kind) && !roster.some(p => p.id === playerId)) { toast.error("Sélectionnez un joueur."); return; } if (kind === "penalty") record(kind); else setActive(active === kind ? null : kind); }}><Plus />{actions[kind].label}</Button>)}</div>
        <div className="flex flex-wrap justify-between items-center gap-2"><p role="status" className="text-sm text-muted-foreground">{active ? `${actions[active].label} : sélectionnez l’emplacement sur la patinoire` : "Emplacements des actions"}</p>{active && <Button variant="ghost" size="sm" onClick={() => setActive(null)}>Annuler</Button>}<select aria-label="Filtrer la patinoire par période" className="bulldogs-select max-w-44" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Toutes les périodes</option>{["1", "2", "3", "PROL"].map(p => <option key={p} value={p}>Période {p}</option>)}</select></div>
        <Rink events={events.filter(e => filter === "all" || e.period === filter)} active={active} disabled={!ready} onPlace={point => { if (active) record(active, point); }} />
      </div>
      <aside className="space-y-5"><label className="block space-y-2"><span>Joueur · action</span><select className="bulldogs-select" value={playerId} onChange={e => setPlayerId(e.target.value)}><option value="">Sélectionner un joueur</option>{roster.map(p => <option key={p.id} value={p.id}>#{p.number} {p.name} · {p.position}</option>)}</select></label><div className="flex justify-between border-b border-border pb-3"><span>Pénalités</span><strong>{countEvents(events, "penalty")}</strong></div><div className="flex justify-between border-b border-border pb-3"><span>Tirs bloqués</span><strong>{countEvents(events, "blocked")}</strong></div><label className="block space-y-2"><span>Centre · mises-au-jeu</span><select className="bulldogs-select" value={centreId} onChange={e => setCentreId(e.target.value)}><option value="">Sélectionner un centre</option>{roster.filter(p => p.position === "C").map(p => <option key={p.id} value={p.id}>#{p.number} {p.name}</option>)}</select></label><div className="grid grid-cols-2 gap-2"><Button disabled={!ready || !roster.some(p => p.id === centreId && p.position === "C")} onClick={() => record("faceoff_won", undefined, centreId)}>Gagnée</Button><Button variant="destructive" disabled={!ready || !roster.some(p => p.id === centreId && p.position === "C")} onClick={() => record("faceoff_lost", undefined, centreId)}>Perdue</Button></div></aside>
    </div>
    <div className="overflow-x-auto"><h3 className="font-display text-xl mb-3">Statistiques par joueur</h3><table className="w-full text-sm"><thead><tr className="border-b border-border text-muted-foreground"><th className="text-left py-3">Joueur</th>{["Tirs", "Buts", "Bloqués", "Pén.", "M-A-J G", "M-A-J P", "%"].map(label => <th key={label} className="px-3 whitespace-nowrap">{label}</th>)}</tr></thead><tbody>{roster.map(p => { const f = faceoffStats(events, p.id); return <tr key={p.id} className="border-b border-border"><td className="py-3 whitespace-nowrap">#{p.number} {p.name} <span className="text-muted-foreground">· {p.position}</span></td>{[countEvents(events, "shot_for", p.id), countEvents(events, "goal_for", p.id), countEvents(events, "blocked", p.id), countEvents(events, "penalty", p.id), p.position === "C" ? f.won : "—", p.position === "C" ? f.lost : "—", p.position === "C" ? `${f.percentage}%` : "—"].map((v, i) => <td key={i} className="text-center px-3">{v}</td>)}</tr>; })}</tbody></table></div>
    <div><div className="flex items-center justify-between mb-3"><h3 className="font-display text-xl">Journal des actions · {events.length}</h3><Button variant="outline" size="sm" disabled={!ready || !events.length} onClick={() => { const last = events.at(-1); if (last) remove(last.id); }}><Undo2 />Dernière action</Button></div><div className="max-h-72 overflow-y-auto divide-y divide-border">{events.slice().reverse().map(e => <div key={e.id} className="flex justify-between items-center gap-3 py-2 text-sm"><span>P{e.period} · {actions[e.kind as ActionKind]?.label} {e.player_name && `· ${e.player_name}`}</span><Button aria-label="Supprimer cette action" variant="ghost" size="icon" disabled={busy} onClick={() => remove(e.id)}><Trash2 /></Button></div>)}</div></div>
  </section></TabsContent></Tabs>;
}