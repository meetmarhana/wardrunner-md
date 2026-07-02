import { useState, useEffect, useRef } from 'react';

// ─── Sepsis Bundle definition ─────────────────────────────────────────────────

interface BundleStep {
  label: string;
  icon:  string;
  ids:   string[];   // any one of these counts
}

const BUNDLE: BundleStep[] = [
  { label: 'Lactate',   icon: '🩸', ids: ['order-vbg'] },
  { label: 'Cultures',  icon: '🧫', ids: ['draw-blood-cultures'] },
  { label: 'IV Access', icon: '💉', ids: ['establish-iv-access'] },
  { label: 'O₂',        icon: '💨', ids: ['oxygen-therapy'] },
  { label: 'Fluids',    icon: '💧', ids: ['fluids-hartmanns-1','fluids-hartmanns-2','fluids-hartmanns-3','fluids-ns-1','fluids-ns-2','fluids-ns-3'] },
  { label: 'Abx',       icon: '💊', ids: ['antibiotics-pip-tazo','antibiotics-meropenem','antibiotics-ceftriaxone'] },
];

// ─── XP flash ─────────────────────────────────────────────────────────────────

function XpFlash({ text }: { text: string }) {
  return (
    <div className="animate-float-up absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-emerald-300 whitespace-nowrap pointer-events-none">
      {text}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  completedActionIds: string[];
}

export default function ComboDisplay({ completedActionIds: ids }: Props) {
  const completedSet = new Set(ids);

  const done = BUNDLE.filter(step => step.ids.some(id => completedSet.has(id)));
  const count = done.length;
  const total = BUNDLE.length;
  const perfect = count === total;

  const [showXp, setShowXp]   = useState(false);
  const prevCount = useRef(0);

  // Flash XP when count increases
  useEffect(() => {
    if (count > prevCount.current) {
      if (perfect) {
        setShowXp(true);
        setTimeout(() => setShowXp(false), 1800);
      }
      prevCount.current = count;
    }
  }, [count, perfect]);

  if (count === 0) return null;

  return (
    <div className="relative shrink-0 border-t border-slate-800/60 bg-slate-950 px-2 py-1.5">
      {/* Label */}
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[9px] font-bold uppercase tracking-wide ${perfect ? 'text-emerald-400' : 'text-slate-500'}`}>
          {perfect ? '🔥 Sepsis Bundle Complete!' : `Sepsis Bundle ${count}/${total}`}
        </span>
        {perfect && (
          <span className="text-[9px] text-emerald-600 font-mono">+200 XP</span>
        )}
      </div>

      {/* Steps */}
      <div className="flex gap-1">
        {BUNDLE.map(step => {
          const isDone = step.ids.some(id => completedSet.has(id));
          return (
            <div
              key={step.label}
              className="flex-1 flex flex-col items-center gap-0.5"
              title={step.label}
            >
              <span className={`text-xs leading-none ${isDone ? 'opacity-100' : 'opacity-20'}`}>
                {step.icon}
              </span>
              <span className={`text-[8px] leading-none font-medium truncate ${isDone ? 'text-emerald-400' : 'text-slate-700'}`}>
                {isDone ? '✓' : step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* XP flash */}
      {showXp && <XpFlash text="🔥 Perfect Bundle! +200 XP" />}
    </div>
  );
}
