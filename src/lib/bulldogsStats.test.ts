import { describe, expect, it } from "vitest";
import { countEvents, faceoffStats, needsPlayer, rinkPoint, type StatEvent } from "./bulldogsStats";
const event = (kind: string, player_id = "c1"): StatEvent => ({ id: kind, kind, player_id, player_name: "Centre", period: "1", x: null, y: null });
describe("Bulldogs statistics", () => {
  it("keeps shots for and against separate", () => {
    const events = [event("shot_for"), event("shot_for"), event("shot_against")];
    expect(countEvents(events, "shot_for")).toBe(2);
    expect(countEvents(events, "shot_against")).toBe(1);
  });
  it("keeps goals for and against separate", () => {
    const events = [event("goal_for"), event("goal_against"), event("goal_against")];
    expect(countEvents(events, "goal_for")).toBe(1);
    expect(countEvents(events, "goal_against")).toBe(2);
  });
  it("attributes faceoffs to the selected centre", () => {
    expect(faceoffStats([event("faceoff_won"), event("faceoff_won"), event("faceoff_lost"), event("faceoff_lost", "c2")], "c1")).toEqual({ won: 2, lost: 1, percentage: 67 });
  });
  it("requires a player for penalties and blocked shots", () => { expect(needsPlayer("penalty")).toBe(true); expect(needsPlayer("blocked")).toBe(true); expect(needsPlayer("shot_against")).toBe(false); });
  it("stores rink locations as proportional coordinates", () => { expect(rinkPoint(200, 100, 800, 400)).toEqual({ x: 25, y: 25 }); });
});