import { describe, expect, it } from "vitest";
import { buildArchiveStandings, buildArchiveScorers, type ArchiveData, type ArchiveMatch, type ArchiveTeam } from "./archiveStats";

const team: ArchiveTeam = { id: "home", name: "Équipe", abbr: "EQ", color: "", logo_url: null, division: "rookies" };
const match: ArchiveMatch = { id: "m", home_team_id: "home", away_team_id: "away", home_score: 3, away_score: 2, status: "final", match_date: "2026-04-20" };
describe("Archive season rules", () => {
  it("awards 2 points for a league win", () => expect(buildArchiveStandings([team], [match])[0].pts).toBe(2));
  it("awards 1 point for a league tie", () => expect(buildArchiveStandings([team], [{ ...match, away_score: 3 }])[0].pts).toBe(1));
  it("awards 0 points for a loss", () => expect(buildArchiveStandings([team], [{ ...match, away_score: 4 }])[0].pts).toBe(0));
  it("awards 1 point for a tournament overtime loss", () => expect(buildArchiveStandings([team], [{ ...match, away_score: 4, overtime: true }], true)[0].pts).toBe(1));
  it("tracks goals for, against and differential", () => {
    const row = buildArchiveStandings([team], [match])[0];
    expect([row.gf, row.ga, row.gf - row.ga]).toEqual([3, 2, 1]);
  });
  it("counts each assist as 2 points and each goal as 1", () => {
    const data: ArchiveData = { teams: [team], players: [{ id: "p", first_name: "A", last_name: "B", team_id: "home" }], matches: [match], events: [
      { match_id: "m", player_id: "p", assist_player_id: null, event_type: "goal" },
      { match_id: "m", player_id: "other", assist_player_id: "p", event_type: "goal" },
    ], tournament_teams: [], tournament_schedule: [], tournament_bracket: [] };
    expect(buildArchiveScorers(data, "rookies")[0]).toMatchObject({ goals: 1, assists: 1, pts: 3 });
  });
  it("does not count unfinished league matches", () => expect(buildArchiveStandings([team], [{ ...match, status: "scheduled" }])[0].gp).toBe(0));
});