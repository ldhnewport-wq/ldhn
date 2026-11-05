export const positions = ["C", "AG", "AD", "DG", "DD", "G"] as const;
export type Position = typeof positions[number];
export interface BulldogsPlayer { id: string; name: string; number: string; position: Position }
export const actions = {
  shot_for: { label: "Tir pour", symbol: "×", tone: "for", location: true },
  shot_against: { label: "Tir contre", symbol: "×", tone: "against", location: true },
  goal_for: { label: "But pour", symbol: "○", tone: "for", location: true },
  goal_against: { label: "But contre", symbol: "○", tone: "against", location: true },
  blocked: { label: "Tir bloqué", symbol: "×", tone: "blocked", location: true },
  penalty: { label: "Pénalité", symbol: "", tone: "neutral", location: false },
  faceoff_won: { label: "Mise-au-jeu gagnée", symbol: "", tone: "for", location: false },
  faceoff_lost: { label: "Mise-au-jeu perdue", symbol: "", tone: "against", location: false },
} as const;
export type ActionKind = keyof typeof actions;
export interface StatEvent { id: string; kind: string; player_id: string | null; player_name: string | null; period: string; x: number | null; y: number | null }
export function countEvents(events: StatEvent[], kind: ActionKind, playerId?: string) {
  return events.filter(e => e.kind === kind && (!playerId || e.player_id === playerId)).length;
}
export function faceoffStats(events: StatEvent[], playerId: string) {
  const won = countEvents(events, "faceoff_won", playerId);
  const lost = countEvents(events, "faceoff_lost", playerId);
  return { won, lost, percentage: won + lost ? Math.round(won / (won + lost) * 100) : 0 };
}
export function needsPlayer(kind: ActionKind) { return ["blocked", "penalty", "faceoff_won", "faceoff_lost"].includes(kind); }
export function rinkPoint(x: number, y: number, width: number, height: number) {
  return { x: Math.max(0, Math.min(100, x / width * 100)), y: Math.max(0, Math.min(100, y / height * 100)) };
}