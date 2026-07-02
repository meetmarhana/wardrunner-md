import { useEffect, useRef } from 'react';
import type { SimEvent } from '../../types/simulation';

const CASE_START_MIN = 8 * 60;
function wallClock(simMin: number): string {
  const total = CASE_START_MIN + simMin;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const SOURCE_CONFIG: Record<string, { icon: string; label: string; color: string; bg: string; border: string }> = {
  nurse:           { icon: '👩‍⚕️', label: 'Nurse Jenna',   color: 'text-indigo-300',  bg: 'bg-indigo-950/40',   border: 'border-indigo-800/40'  },
  consultant:      { icon: '☎',    label: 'Consult',       color: 'text-sky-300',     bg: 'bg-sky-950/40',      border: 'border-sky-800/40'     },
  family:          { icon: '👥',   label: 'Family',        color: 'text-amber-300',   bg: 'bg-amber-950/40',    border: 'border-amber-800/40'   },
  patient:         { icon: '🧑',   label: 'Patient',       color: 'text-orange-300',  bg: 'bg-orange-950/40',   border: 'border-orange-800/40'  },
  cascade:         { icon: '⚠',    label: 'Alert',         color: 'text-red-300',     bg: 'bg-red-950/50',      border: 'border-red-700/50'     },
  'order-arrived': { icon: '🔬',   label: 'Lab',           color: 'text-emerald-300', bg: 'bg-emerald-950/40',  border: 'border-emerald-800/40' },
  note:            { icon: '📋',   label: 'Note',          color: 'text-slate-400',   bg: 'bg-slate-900/40',    border: 'border-slate-700/40'   },
};

const FEED_SOURCES = new Set(['nurse', 'consultant', 'family', 'patient', 'note', 'order-arrived', 'cascade']);

function clean(source: string, text: string): string {
  if (source === 'nurse') return text.replace(/^[^:]+:\s*"?/, '').replace(/"$/, '');
  if (source === 'family') return text.replace(/^[^:()]+\([^)]*\):\s*"?/, '').replace(/"$/, '') || text;
  return text;
}

interface Props {
  events: SimEvent[];
}

export default function HospitalFeed({ events }: Props) {
  const feed     = events.filter(e => FEED_SOURCES.has(e.source));
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLenRef = useRef(feed.length);

  useEffect(() => {
    if (feed.length !== prevLenRef.current) {
      prevLenRef.current = feed.length;
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [feed.length]);

  if (feed.length === 0) {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-slate-950 border-t border-slate-800/60">
        <div className="shrink-0 px-2 py-1.5 border-b border-slate-800/40 flex items-center gap-1.5">
          <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-wide">Live Feed</span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-700 animate-pulse" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-xs text-slate-700">Waiting for events…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-950 border-t border-slate-800/60">
      {/* Header */}
      <div className="shrink-0 px-2 py-1.5 border-b border-slate-800/40 flex items-center gap-1.5">
        <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-wide">Live Feed</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[9px] text-slate-700 ml-auto">{feed.length} events</span>
      </div>

      {/* Scrollable feed — newest at bottom */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin py-1 px-1.5 space-y-1">
        {feed.map((ev, i) => {
          const cfg = SOURCE_CONFIG[ev.source] ?? SOURCE_CONFIG.note;
          const text = clean(ev.source, ev.text);
          const isLast = i === feed.length - 1;

          return (
            <div
              key={`${ev.source}-${ev.simTimeMin}-${i}`}
              className={`flex gap-2 px-2 py-1.5 rounded-lg border ${cfg.bg} ${cfg.border} animate-feed-in`}
              style={{ animationDelay: isLast ? '0ms' : '0ms', animationFillMode: 'both' }}
            >
              {/* Icon */}
              <div className="shrink-0 text-sm leading-none mt-0.5 select-none">{cfg.icon}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 mb-0.5">
                  <span className={`text-[10px] font-bold leading-none ${cfg.color}`}>{cfg.label}</span>
                  <span className="text-[9px] text-slate-700 font-mono leading-none">{wallClock(ev.simTimeMin)}</span>
                </div>
                <p className="text-xs text-slate-200 leading-snug break-words">
                  {text}
                </p>
              </div>

              {/* Severity dot */}
              {ev.severity === 'danger' && (
                <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-500 mt-1 animate-pulse" />
              )}
              {ev.severity === 'warning' && (
                <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400 mt-1" />
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
