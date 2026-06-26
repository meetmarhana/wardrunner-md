import { useEffect, useRef } from 'react';
import type { SimEvent } from '../../types/simulation';

interface Props {
  events: SimEvent[];
}

// Case starts at 08:00
const CASE_START_MIN = 8 * 60;

function wallClock(simMin: number): string {
  const total = CASE_START_MIN + simMin;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ─── Per-severity text colour ─────────────────────────────────────────────────
const SEV_TEXT: Record<string, string> = {
  info:    'text-slate-300',
  warning: 'text-amber-300',
  danger:  'text-red-300',
  success: 'text-emerald-300',
};
const SEV_DOT: Record<string, string> = {
  info:    'bg-slate-500',
  warning: 'bg-amber-500',
  danger:  'bg-red-500',
  success: 'bg-emerald-500',
};

// ─── Per-source styling ───────────────────────────────────────────────────────
const SOURCE_BORDER: Record<string, string> = {
  nurse:          'border border-cyan-700/50   bg-cyan-950/30',
  consultant:     'border border-purple-700/50 bg-purple-950/30',
  patient:        'border border-amber-700/40  bg-amber-950/25',
  family:         'border border-orange-700/40 bg-orange-950/20',
  note:           'border border-slate-600/40  bg-slate-800/50',
  cascade:        'border border-red-800/40    bg-red-950/20',
  action:         'border border-slate-700/30  bg-slate-900/20',
  'order-arrived':'border border-slate-700/30  bg-slate-900/20',
  system:         'border border-slate-700/20  bg-transparent',
};

const SOURCE_BADGE: Record<string, { label: string; cls: string }> = {
  nurse:      { label: 'Nurse',   cls: 'bg-cyan-900/60 text-cyan-300 border border-cyan-700/40' },
  consultant: { label: 'Consult', cls: 'bg-purple-900/60 text-purple-300 border border-purple-700/40' },
  patient:    { label: 'Patient', cls: 'bg-amber-900/60 text-amber-300 border border-amber-700/40' },
  family:     { label: 'Family',  cls: 'bg-orange-900/60 text-orange-300 border border-orange-700/40' },
};

const SOURCE_DOT_OVERRIDE: Record<string, string> = {
  nurse:      'bg-cyan-500',
  consultant: 'bg-purple-500',
  patient:    'bg-amber-400',
  family:     'bg-orange-400',
  note:       'bg-slate-400',
};

const SOURCE_TEXT_OVERRIDE: Record<string, string> = {
  note: 'text-slate-400 italic text-xs leading-relaxed',
};

export default function SimTimeline({ events }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  return (
    <div className="bg-slate-800/60 rounded-xl border border-slate-700 flex flex-col h-full min-h-0">
      <div className="px-3 py-2 bg-slate-800 border-b border-slate-700 shrink-0 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Timeline</span>
        <span className="text-xs text-slate-500">{events.length} events</span>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 min-h-0">
        {events.map((ev, i) => {
          const sev    = ev.severity ?? 'info';
          const src    = ev.source ?? 'system';
          const badge  = SOURCE_BADGE[src];
          const dot    = SOURCE_DOT_OVERRIDE[src] ?? SEV_DOT[sev];
          const border = SOURCE_BORDER[src] ?? SOURCE_BORDER.system;
          const text   = SOURCE_TEXT_OVERRIDE[src] ?? SEV_TEXT[sev];

          return (
            <div key={i} className={`flex gap-2 items-start px-2 py-1.5 rounded-lg ${border}`}>
              <div className="shrink-0 flex flex-col items-center pt-1">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                  <span className="font-mono text-xs font-semibold text-slate-400 shrink-0">
                    {wallClock(ev.simTimeMin)}
                  </span>
                  {badge && (
                    <span className={`text-xs px-1.5 py-0 rounded font-semibold ${badge.cls}`}>
                      {badge.label}
                    </span>
                  )}
                </div>
                <p className={`text-xs leading-snug ${text}`}>{ev.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
