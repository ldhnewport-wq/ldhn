import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, Json } from "@/integrations/supabase/types";

type Game = Tables<"bulldogs_games">;
type Event = Tables<"bulldogs_events">;
const key = "ldhn-bulldogs-device-v1";
type DeviceData = { games: Game[]; events: Event[] };
function read(): DeviceData {
  const saved = localStorage.getItem(key);
  if (!saved) return { games: [], events: [] };
  const parsed = JSON.parse(saved) as DeviceData;
  if (!Array.isArray(parsed.games) || !Array.isArray(parsed.events)) throw new Error("Les données de cet appareil sont illisibles.");
  return parsed;
}
function write(data: DeviceData) { localStorage.setItem(key, JSON.stringify(data)); }
export async function listBulldogsGames(userId?: string): Promise<Game[]> {
  if (!userId) return read().games;
  const { data, error } = await supabase.from("bulldogs_games").select("*").order("created_at", { ascending: false });
  if (error) throw error; return data;
}
export async function listBulldogsEvents(userId?: string, gameId?: string): Promise<Event[]> {
  if (!userId) return read().events.filter(e => !gameId || e.game_id === gameId);
  let query = supabase.from("bulldogs_events").select("*").order("created_at");
  if (gameId) query = query.eq("game_id", gameId);
  const { data, error } = await query;
  if (error) throw error; return data;
}
export async function saveBulldogsGame(payload: { opponent: string; played_at: string; roster: Json }, gameId: string, userId?: string): Promise<Game> {
  if (!userId) {
    const data = read();
    const previous = data.games.find(g => g.id === gameId);
    const game: Game = { ...payload, id: gameId || crypto.randomUUID(), user_id: "device", created_at: previous?.created_at ?? new Date().toISOString() };
    data.games = [game, ...data.games.filter(g => g.id !== game.id)]; write(data); return game;
  }
  const result = gameId ? await supabase.from("bulldogs_games").update(payload).eq("id", gameId).select().single() : await supabase.from("bulldogs_games").insert({ ...payload, user_id: userId }).select().single();
  if (result.error) throw result.error; return result.data;
}
export async function addBulldogsEvent(payload: TablesInsert<"bulldogs_events">, userId?: string) {
  if (!userId) {
    const data = read();
    if (!data.games.some(g => g.id === payload.game_id)) throw new Error("Match introuvable sur cet appareil.");
    data.events.push({ id: crypto.randomUUID(), game_id: payload.game_id, kind: payload.kind, player_id: payload.player_id ?? null, player_name: payload.player_name ?? null, period: payload.period ?? "1", x: payload.x ?? null, y: payload.y ?? null, created_at: new Date().toISOString() });
    write(data); return;
  }
  const { error } = await supabase.from("bulldogs_events").insert(payload); if (error) throw error;
}
export async function removeBulldogsEvent(id: string, userId?: string) {
  if (!userId) { const data = read(); data.events = data.events.filter(e => e.id !== id); write(data); return; }
  const { error } = await supabase.from("bulldogs_events").delete().eq("id", id); if (error) throw error;
}