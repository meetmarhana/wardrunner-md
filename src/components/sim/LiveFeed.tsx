import type { SimEvent } from '../../types/simulation';

const CASE_START_MIN = 8 * 60;
function wallClock(m: number): string {
  const t = CASE_START_MIN + m;
  return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

const SOURCE_CFG: Record<string, { label: string; badge: string }> = {
  nurse:           { label: 'Nurse',   badge: 'bg-violet-900/60 text-violet-300 border-violet-700/50' },
  consultant:      { label: 'Consult', badge: 'bg-blue-900/60 text-blue-300 border-blue-700/50' },
  family:          { label: 'Family',  badge: 'bg-pink-900/60 text-pink-300 border-pink-700/50' },
  patient:         { label: 'Patient', badge: 'bg-orange-900/60 text-orange-300 border-orange-700/50' },
  note:            { label: 'Note',    badge: 'bg-slate-800 text-slate-400 border-slate-700/50' },
  'order-arrived': { label: 'Lab',     badge: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50' },
  cascade:         { label: 'Alert',   badge: 'bg-red-900/60 text-red-300 border-red-700/50' },
};

const FEED_SOURCES = new Set(['nurse', 'consultant', 'family', 'patient', 'note', 'order-arrived', 'cascade']);

interface Props {
  events: SimEvent[];
}

export default function LiveFeed({ events }: Props) {
  const feed = [...events].filter(e => FEED_SOURCES.has(e.source)).reverse();

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-1 bg-slate-900/60 border-b border-slate-800 shrink-0 flex items-center">
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Live Feed</span>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 p-1.5 space-y-1">
        {feed.length === 0 ? (
          <p className="text-xs text-slate-700 text-center pt-4">No communications yet.</p>
        ) : (
          feed.map((ev, i) => {
            const cfg = SOURCE_CFG[ev.source];
            const isAlert = ev.severity === 'danger';
            return (
              <div
                key={i}
                className={`rounded px-2 py-1.5 border ${
                  isAlert
                    ? 'bg-red-950/40 border-red-800/50'
                    : 'bg-slate-900/50 border-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  {cfg && (
                    <span className={`text-xs px-1.5 rounded border font-semibold leading-tight ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                  )}
                  <span className="text-xs text-slate-700 font-mono">{wallClock(ev.simTimeMin)}</span>
                </div>
                <p className={`text-xs leading-relaxed ${isAlert ? 'text-red-200' : 'text-slate-300'}`}>
                  {ev.text}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
