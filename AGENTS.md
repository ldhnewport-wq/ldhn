# Architecture
- Season archives read frozen JSON snapshots from `season_archives`, including team/player metadata, rather than live league tables; later edits must not change historical standings.
- Archive statistics live in `src/lib/archiveStats.ts` with focused rule tests; league and tournament category keys are mapped explicitly because their stored values differ.