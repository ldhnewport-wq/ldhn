import { actions, type ActionKind, type StatEvent } from "@/lib/bulldogsStats";
import { rinkPoint } from "@/lib/bulldogsStats";

export default function Rink({ events, active, disabled, onPlace }: { events: StatEvent[]; active: ActionKind | null; disabled: boolean; onPlace: (point: { x: number; y: number }) => void }) {
  return <div className="space-y-3">
    <svg viewBox="0 0 1000 500" role="img" aria-label="Patinoire — emplacement des tirs et buts" className={`bulldogs-rink w-full touch-manipulation ${active && !disabled ? "cursor-crosshair" : ""}`} onClick={e => {
      if (!active || disabled) return;
      const rect = e.currentTarget.getBoundingClientRect();
      onPlace(rinkPoint(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height));
    }}>
      <rect x="6" y="6" width="988" height="488" rx="115" className="rink-ice" />
      <path d="M500 8V492" className="rink-red-line" />
      <path d="M330 8V492M670 8V492" className="rink-blue-line" />
      <path d="M100 12V488M900 12V488" className="rink-red-line" />
      <circle cx="500" cy="250" r="72" className="rink-blue-line" />
      <circle cx="500" cy="250" r="5" className="rink-blue-dot" />
      {[200, 800].flatMap(x => [140, 360].map(y => <g key={`${x}-${y}`}><circle cx={x} cy={y} r="62" className="rink-red-line" /><circle cx={x} cy={y} r="5" className="rink-red-dot" /></g>))}
      <path d="M100 210a40 40 0 0 1 0 80M900 210a40 40 0 0 0 0 80" className="rink-blue-line" />
      <path d="M100 226H76V274H100M900 226H924V274H900" className="rink-red-line" />
      {events.map(e => {
        if (e.x === null || e.y === null || !(e.kind in actions)) return null;
        const action = actions[e.kind as ActionKind];
        return <g key={e.id} transform={`translate(${e.x * 10}, ${e.y * 5})`} className={`rink-marker marker-${action.tone}`}><title>{action.label}{e.player_name ? ` — ${e.player_name}` : ""} · P{e.period}</title>{e.kind.startsWith("goal") ? <circle r="12" /> : <path d="M-9 -9L9 9M-9 9L9 -9" />}</g>;
      })}
    </svg>
    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">{(["shot_for", "shot_against", "goal_for", "goal_against", "blocked"] as const).map(kind => <span key={kind} className="flex items-center gap-2"><span className={`marker-key marker-${actions[kind].tone}`}>{actions[kind].symbol}</span>{actions[kind].label}</span>)}</div>
  </div>;
}