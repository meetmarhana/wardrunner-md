import type { SimEvent } from '../../types/simulation';

const CASE_START_MIN = 8 * 60;
function wallClock(m: number): string {
  const t = CASE_START_MIN + m;
  return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

const SOURCE_CLS: Record<string, string> = {
  action:          'text-sky-400',
  cascade:         'text-amber-400',
  'order-arrived': 'text-emerald-400',
  nurse:           'text-violet-400',
  consultant:      'text-blue-400',
  family:          'text-pink-400',
  patient:         'text-orange-400',
  note:            'text-slate-400',
  system:          'text-slate-600',
};

interface Props {
  events: SimEvent[];
}

export default function EventTimeline({ events }: Props) {
  const sorted = [...events].reverse();

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-1 bg-slate-900/60 border-b border-slate-800 shrink-0 flex items-center">
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Timeline</span>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {sorted.length === 0 ? (
          <p className="text-xs text-slate-700 text-center pt-4">No events yet.</p>
        ) : (
          <div className="py-0.5">
            {sorted.map((ev, i) => (
              <div key={i} className="flex items-baseline gap-2 px-3 py-0.5 hover:bg-slate-900/30">
                <span className="text-xs font-mono text-slate-600 shrink-0 w-11 leading-relaxed">
                  {wallClock(ev.simTimeMin)}
                </span>
                <span className="text-slate-700 text-xs shrink-0">—</span>
                <span className={`text-xs leading-relaxed ${SOURCE_CLS[ev.source] ?? 'text-slate-400'}`}>
                  {ev.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
