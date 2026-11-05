import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { actions, countEvents, faceoffStats, type ActionKind, type BulldogsPlayer } from "@/lib/bulldogsStats";
import Rink from "./Rink";

export default function MatchArchives({ games, userId }: { games: Tables<"bulldogs_games">[]; userId: string }) {
  const [selectedId, setSelectedId] = useState("");
  const [period, setPeriod] = useState("all");
  const game = games.find(g => g.id === selectedId);
  const query = useQuery({ queryKey: ["bulldogs-events", "archives", userId], queryFn: async () => {
    const { data, error } = await supabase.from("bulldogs_events").select("*").order("created_at");
    if (error) throw error;
    return data;
  }});
  if (query.isPending) return <p role="status" className="py-8 text-muted-foreground">Chargement des archives…</p>;
  if (query.isError) return <div role="alert" className="py-8"><p>Impossible de charger les statistiques.</p><Button variant="outline" onClick={() => query.refetch()}>Réessayer</Button></div>;
  const allEvents = query.data;
  const dateLabel = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" });
  if (!game) return <section className="space-y-5"><h2 className="font-display text-2xl">Archives des matchs</h2>{!games.length ? <p className="text-muted-foreground py-8">Aucun match enregistré.</p> : <div className="divide-y divide-border">{games.slice().sort((a, b) => b.played_at.localeCompare(a.played_at) || b.created_at.localeCompare(a.created_at)).map(g => {
    const events = allEvents.filter(e => e.game_id === g.id);
    return <article key={g.id} className="flex flex-wrap items-center justify-between gap-4 py-5"><div className="min-w-0"><p className="text-sm text-muted-foreground">{dateLabel(g.played_at)}</p><h3 className="font-display text-xl break-words">Bulldogs — {g.opponent}</h3><p className="text-sm text-muted-foreground">{countEvents(events, "shot_for")} tirs pour · {countEvents(events, "shot_against")} tirs contre</p></div><div className="flex items-center gap-5"><span className="font-display text-3xl tabular-nums">{countEvents(events, "goal_for")} – {countEvents(events, "goal_against")}</span><Button variant="outline" onClick={() => { setSelectedId(g.id); setPeriod("all"); }}>Consulter<ArrowRight /></Button></div></article>;
  })}</div>}</section>;
  const events = allEvents.filter(e => e.game_id === game.id);
  const visibleEvents = events.filter(e => period === "all" || e.period === period);
  const roster = Array.isArray(game.roster) ? game.roster as unknown as BulldogsPlayer[] : [];
  return <section className="space-y-6">
    <div className="flex flex-wrap items-center gap-4"><Button variant="outline" onClick={() => setSelectedId("")}><ArrowLeft />Tous les matchs</Button><div><h2 className="font-display text-2xl break-words">Bulldogs — {game.opponent}</h2><p className="text-muted-foreground">{dateLabel(game.played_at)}</p></div></div>
    <div className="grid grid-cols-2 border-y border-border py-5 gap-4 text-center">{(["for", "against"] as const).map(side => <div key={side}><p className={`font-display text-xl ${side === "for" ? "text-primary" : "text-destructive"}`}>{side === "for" ? "BULLDOGS" : game.opponent}</p><p className="font-display text-5xl">{countEvents(events, side === "for" ? "goal_for" : "goal_against")}</p><p className="text-muted-foreground">{countEvents(events, side === "for" ? "shot_for" : "shot_against")} tirs</p></div>)}</div>
    <div className="flex flex-wrap gap-6"><p>Pénalités : <strong>{countEvents(events, "penalty")}</strong></p><p>Tirs bloqués : <strong>{countEvents(events, "blocked")}</strong></p><p>Mises-au-jeu : <strong>{countEvents(events, "faceoff_won")} gagnées · {countEvents(events, "faceoff_lost")} perdues</strong></p></div>
    <div className="overflow-x-auto"><h3 className="font-display text-xl mb-3">Statistiques par joueur</h3><table className="w-full text-sm"><thead><tr className="border-b border-border text-muted-foreground"><th className="text-left py-3">Joueur</th>{["Position", "Tirs", "Buts", "Bloqués", "Pén.", "M-A-J G", "M-A-J P", "%"].map(label => <th key={label} className="px-3 whitespace-nowrap">{label}</th>)}</tr></thead><tbody>{roster.map(p => { const f = faceoffStats(events, p.id); return <tr key={p.id} className="border-b border-border"><td className="py-3 whitespace-nowrap">#{p.number} {p.name}</td>{[p.position, countEvents(events, "shot_for", p.id), countEvents(events, "goal_for", p.id), countEvents(events, "blocked", p.id), countEvents(events, "penalty", p.id), p.position === "C" ? f.won : "—", p.position === "C" ? f.lost : "—", p.position === "C" ? `${f.percentage}%` : "—"].map((v, i) => <td key={i} className="text-center px-3">{v}</td>)}</tr>; })}</tbody></table></div>
    <div className="space-y-4"><div className="flex flex-wrap justify-between gap-3 items-center"><h3 className="font-display text-xl">Patinoire et actions</h3><select className="bulldogs-select max-w-48" aria-label="Période des archives" value={period} onChange={e => setPeriod(e.target.value)}><option value="all">Toutes les périodes</option>{["1", "2", "3", "PROL"].map(p => <option key={p} value={p}>Période {p}</option>)}</select></div><Rink events={visibleEvents} active={null} disabled onPlace={() => {}} /></div>
    <div><h3 className="font-display text-xl mb-3">Journal des actions · {visibleEvents.length}</h3>{!visibleEvents.length && <p className="text-muted-foreground">Aucune action enregistrée.</p>}<div className="max-h-80 overflow-y-auto divide-y divide-border">{visibleEvents.map(e => <p key={e.id} className="py-3 text-sm">P{e.period} · {actions[e.kind as ActionKind]?.label}{e.player_name ? ` · ${e.player_name}` : ""}</p>)}</div></div>
  </section>;
}