# Architecture
- Season archives read frozen JSON snapshots from `season_archives`, including team/player metadata, rather than live league tables; later edits must not change historical standings.
- Archive statistics live in `src/lib/archiveStats.ts` with focused rule tests; league and tournament category keys are mapped explicitly because their stored values differ.
- Bulldogs games and action events are separate owner-scoped records with Realtime invalidation, so tracking cannot modify league or archive data.
- Bulldogs rink coordinates use percentages and statistics derive from the event journal, so corrections and screen resizing preserve totals and locations.
- Bulldogs match archives are read-only views of owner-scoped saved games and their event journal; they reuse live statistic calculations and do not alter season snapshots.