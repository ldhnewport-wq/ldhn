import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: vi.fn(() => { throw new Error("Cloud must not be accessed for device games"); }) } }));
import { addBulldogsEvent, listBulldogsEvents, listBulldogsGames, removeBulldogsEvent, saveBulldogsGame } from "./bulldogsStorage";
describe("Bulldogs without login", () => {
  beforeEach(() => localStorage.clear());
  it("saves and reads a match without an account or cloud request", async () => {
    const game = await saveBulldogsGame({ opponent: "Adversaire", played_at: "2026-11-05", roster: [] }, "");
    expect((await listBulldogsGames())[0]).toMatchObject({ id: game.id, opponent: "Adversaire", user_id: "device" });
  });
  it("keeps archived actions separated by match and supports corrections", async () => {
    const a = await saveBulldogsGame({ opponent: "A", played_at: "2026-11-05", roster: [] }, "");
    const b = await saveBulldogsGame({ opponent: "B", played_at: "2026-11-06", roster: [] }, "");
    await addBulldogsEvent({ game_id: a.id, kind: "goal_for", x: 25, y: 50 });
    await addBulldogsEvent({ game_id: b.id, kind: "shot_against" });
    const events = await listBulldogsEvents(undefined, a.id);
    expect(events).toHaveLength(1); expect(events[0]).toMatchObject({ kind: "goal_for", x: 25, y: 50 });
    await removeBulldogsEvent(events[0].id);
    expect(await listBulldogsEvents(undefined, a.id)).toHaveLength(0);
    expect(await listBulldogsEvents(undefined, b.id)).toHaveLength(1);
  });
});