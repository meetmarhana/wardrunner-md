import { useEffect, useRef } from 'react';
import type { Interruption, InterruptionSource } from '../../hooks/useInterruptionEngine';

const SOURCE_CFG: Record<InterruptionSource, { icon: string; label: string; bg: string; border: string; color: string; bar: string }> = {
  nurse:      { icon: '👩‍⚕️', label: 'Nurse Jenna',   bg: 'bg-indigo-950/95',  border: 'border-indigo-600/70', color: 'text-indigo-200',  bar: 'bg-indigo-500' },
  family:     { icon: '👥',   label: 'Family',        bg: 'bg-amber-950/95',   border: 'border-amber-600/70',  color: 'text-amber-200',   bar: 'bg-amber-500'  },
  lab:        { icon: '🔬',   label: 'Lab',           bg: 'bg-emerald-950/95', border: 'border-emerald-600/70',color: 'text-emerald-200', bar: 'bg-emerald-500'},
  pharmacy:   { icon: '💊',   label: 'Pharmacy',      bg: 'bg-purple-950/95',  border: 'border-purple-600/70', color: 'text-purple-200',  bar: 'bg-purple-500' },
  consultant: { icon: '☎',    label: 'Consultant',    bg: 'bg-sky-950/95',     border: 'border-sky-600/70',    color: 'text-sky-200',     bar: 'bg-sky-500'    },
};

interface Props {
  interruption: Interruption;
  onDismiss: () => void;
  onRespond: (response: string) => void;
}

export default function InterruptionBubble({ interruption, onDismiss, onRespond }: Props) {
  const cfg          = SOURCE_CFG[interruption.source];
  const barRef       = useRef<HTMLDivElement>(null);
  const durationSec  = (interruption.durationMs / 1000).toFixed(1);

  // Kick off the shrink animation once the element mounts
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    el.style.transition = `width ${durationSec}s linear`;
    // Trigger by starting from 100% and immediately shrinking to 0
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.width = '0%';
      });
    });
  }, [durationSec]);

  return (
    <div
      className={`
        absolute top-2 left-2 right-2 z-30
        rounded-xl border shadow-2xl
        ${cfg.bg} ${cfg.border}
        animate-bubble-in
      `}
    >
      {/* Timer bar */}
      <div className="h-0.5 rounded-t-xl overflow-hidden bg-slate-800/60">
        <div ref={barRef} className={`h-full ${cfg.bar} w-full`} />
      </div>

      <div className="px-3 pt-2 pb-2.5">
        {/* Header */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-sm leading-none">{cfg.icon}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wide ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>
          <button
            onClick={onDismiss}
            className="text-slate-600 hover:text-slate-400 text-xs leading-none"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>

        {/* Message */}
        <p className="text-xs text-slate-100 leading-snug mb-2">
          {interruption.text}
        </p>

        {/* Response buttons */}
        <div className="flex flex-wrap gap-1">
          {interruption.responses.map(r => (
            <button
              key={r}
              onClick={() => onRespond(r)}
              className={`
                text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors
                ${cfg.border} ${cfg.color}
                bg-slate-900/60 hover:bg-slate-800/80
              `}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
