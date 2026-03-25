export interface Team {
  name: string;
  abbr: string;
  color: string;
}

export interface LiveMatch {
  id: string;
  home: Team;
  away: Team;
  homeScore: number;
  awayScore: number;
  period: string;
  time: string;
  isLive: boolean;
}

export interface RecentMatch {
  id: string;
  home: Team;
  away: Team;
  homeScore: number;
  awayScore: number;
  date: string;
  isFinal: boolean;
}

export interface Standing {
  rank: number;
  team: Team;
  gp: number;
  w: number;
  l: number;
  otl: number;
  pts: number;
}

export interface TopPlayer {
  name: string;
  team: Team;
  number: number;
  value: number;
}

export interface Highlight {
  time: string;
  event: string;
  player: string;
  team: Team;
}

const TEAMS: Record<string, Team> = {
  tigers: { name: "Tigres de Laval", abbr: "TIG", color: "#FF8C00" },
  wolves: { name: "Loups du Nord", abbr: "LDN", color: "#6B8FCC" },
  eagles: { name: "Aigles de Montréal", abbr: "AGL", color: "#CC3333" },
  bears: { name: "Ours de Québec", abbr: "ORS", color: "#8B4513" },
  hawks: { name: "Faucons de Sherbrooke", abbr: "FAU", color: "#2E8B57" },
  sharks: { name: "Requins de Gatineau", abbr: "REQ", color: "#4682B4" },
  lions: { name: "Lions de Trois-Rivières", abbr: "LIO", color: "#DAA520" },
  foxes: { name: "Renards de Drummondville", abbr: "REN", color: "#B22222" },
};

export const liveMatches: LiveMatch[] = [
  {
    id: "1",
    home: TEAMS.tigers,
    away: TEAMS.wolves,
    homeScore: 4,
    awayScore: 3,
    period: "3e",
    time: "12:34",
    isLive: true,
  },
  {
    id: "2",
    home: TEAMS.eagles,
    away: TEAMS.bears,
    homeScore: 2,
    awayScore: 2,
    period: "2e",
    time: "05:17",
    isLive: true,
  },
];

export const recentMatches: RecentMatch[] = [
  { id: "3", home: TEAMS.hawks, away: TEAMS.sharks, homeScore: 5, awayScore: 2, date: "24 mars", isFinal: true },
  { id: "4", home: TEAMS.lions, away: TEAMS.foxes, homeScore: 3, awayScore: 4, date: "23 mars", isFinal: true },
  { id: "5", home: TEAMS.tigers, away: TEAMS.eagles, homeScore: 6, awayScore: 1, date: "22 mars", isFinal: true },
];

export const standings: Standing[] = [
  { rank: 1, team: TEAMS.tigers, gp: 42, w: 30, l: 8, otl: 4, pts: 64 },
  { rank: 2, team: TEAMS.eagles, gp: 42, w: 28, l: 10, otl: 4, pts: 60 },
  { rank: 3, team: TEAMS.hawks, gp: 42, w: 25, l: 13, otl: 4, pts: 54 },
  { rank: 4, team: TEAMS.wolves, gp: 42, w: 23, l: 15, otl: 4, pts: 50 },
  { rank: 5, team: TEAMS.lions, gp: 42, w: 20, l: 17, otl: 5, pts: 45 },
  { rank: 6, team: TEAMS.sharks, gp: 42, w: 18, l: 20, otl: 4, pts: 40 },
  { rank: 7, team: TEAMS.foxes, gp: 42, w: 14, l: 24, otl: 4, pts: 32 },
  { rank: 8, team: TEAMS.bears, gp: 42, w: 10, l: 28, otl: 4, pts: 24 },
];

export const topScorers: TopPlayer[] = [
  { name: "Marc-André Dubois", team: TEAMS.tigers, number: 91, value: 32 },
  { name: "Jean-Philippe Roy", team: TEAMS.eagles, number: 17, value: 28 },
  { name: "Alexandre Côté", team: TEAMS.hawks, number: 9, value: 25 },
  { name: "Mathieu Tremblay", team: TEAMS.wolves, number: 22, value: 23 },
  { name: "Simon Gagnon", team: TEAMS.lions, number: 44, value: 21 },
];

export const topAssists: TopPlayer[] = [
  { name: "Pierre Lavoie", team: TEAMS.eagles, number: 88, value: 38 },
  { name: "Marc-André Dubois", team: TEAMS.tigers, number: 91, value: 35 },
  { name: "Luc Bergeron", team: TEAMS.wolves, number: 7, value: 30 },
  { name: "David Poulin", team: TEAMS.hawks, number: 14, value: 27 },
  { name: "Nicolas Caron", team: TEAMS.foxes, number: 33, value: 24 },
];

export const topPoints: TopPlayer[] = [
  { name: "Marc-André Dubois", team: TEAMS.tigers, number: 91, value: 67 },
  { name: "Pierre Lavoie", team: TEAMS.eagles, number: 88, value: 60 },
  { name: "Jean-Philippe Roy", team: TEAMS.eagles, number: 17, value: 55 },
  { name: "Alexandre Côté", team: TEAMS.hawks, number: 9, value: 50 },
  { name: "Luc Bergeron", team: TEAMS.wolves, number: 7, value: 48 },
];

export const highlights: Highlight[] = [
  { time: "18:22 - 3e", event: "⚡ BUT", player: "M-A. Dubois", team: TEAMS.tigers },
  { time: "15:45 - 3e", event: "⚡ BUT", player: "L. Bergeron", team: TEAMS.wolves },
  { time: "12:10 - 2e", event: "⚡ BUT", player: "M-A. Dubois", team: TEAMS.tigers },
  { time: "08:33 - 2e", event: "🥊 BAGARRE", player: "S. Gagnon vs P. Lavoie", team: TEAMS.lions },
  { time: "05:01 - 2e", event: "⚡ BUT", player: "J-P. Roy", team: TEAMS.eagles },
  { time: "19:55 - 1re", event: "⚡ BUT", player: "A. Côté", team: TEAMS.hawks },
  { time: "14:20 - 1re", event: "⚡ BUT PP", player: "M. Tremblay", team: TEAMS.wolves },
  { time: "02:11 - 1re", event: "⚡ BUT", player: "M-A. Dubois", team: TEAMS.tigers },
];

export const playerOfTheMatch = {
  name: "Marc-André Dubois",
  team: TEAMS.tigers,
  number: 91,
  goals: 3,
  assists: 1,
  points: 4,
  plusMinus: "+3",
};
