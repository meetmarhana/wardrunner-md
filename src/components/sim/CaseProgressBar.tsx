import type { CasePhase, PhaseDefinition } from '../../types/simulation';
import { PHASE_ORDER } from '../../types/simulation';

const DEFAULT_PHASES: PhaseDefinition[] = [
  { id: 'history',     label: 'History' },
  { id: 'workup',      label: 'Workup' },
  { id: 'treatment',   label: 'Treatment' },
  { id: 'complication', label: 'Reassess' },
  { id: 'disposition', label: 'Disposition' },
];

const PHASE_ICON: Record<CasePhase, string> = {
  history:     '🩺',
  workup:      '🧪',
  treatment:   '💊',
  complication:'⚠',
  disposition: '🏥',
};

interface Props {
  casePhase: CasePhase;
  simTimeMin: number;
  phases?: PhaseDefinition[];
  gamePhase: 'playing' | 'ended';
}

export default function CaseProgressBar({ casePhase, simTimeMin, phases, gamePhase }: Props) {
  const defs = phases ?? DEFAULT_PHASES;
  const currentIdx = PHASE_ORDER.indexOf(casePhase);

  return (
    <div
      className="shrink-0 bg-slate-950 border-t border-slate-800 flex items-stretch overflow-hidden"
      style={{ height: '52px' }}
    >
      {defs.map((def, i) => {
        const phaseIdx  = PHASE_ORDER.indexOf(def.id);
        const isActive  = phaseIdx === currentIdx;
        const isDone    = phaseIdx < currentIdx || gamePhase === 'ended';
        const isLocked  = phaseIdx > currentIdx;

        return (
          <div
            key={def.id}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 relative border-r border-slate-800 last:border-r-0 transition-colors"
            style={{
              background: isActive
                ? 'rgba(59,130,246,0.08)'
                : isDone
                  ? 'rgba(16,185,129,0.04)'
                  : 'transparent',
            }}
          >
            {/* Active indicator bar */}
            {isActive && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
            {isDone && !isActive && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-700/60" />
            )}

            {/* Icon + checkmark */}
            <div className="flex items-center gap-1">
              <span className={`text-sm leading-none ${isLocked ? 'opacity-25' : 'opacity-100'}`}>
                {isDone && !isActive ? '✓' : PHASE_ICON[def.id]}
              </span>
            </div>

            {/* Label */}
            <span
              className={`text-[10px] font-medium leading-none truncate px-1 ${
                isActive  ? 'text-blue-300'
                : isDone  ? 'text-emerald-600'
                : isLocked? 'text-slate-700'
                : 'text-slate-500'
              }`}
            >
              {def.label}
            </span>

            {/* Phase number */}
            <span className={`text-[9px] leading-none ${isLocked ? 'text-slate-800' : 'text-slate-700'}`}>
              {i + 1}/{defs.length}
            </span>
          </div>
        );
      })}

      {/* Timer on the right */}
      <div className="shrink-0 flex flex-col items-center justify-center px-3 border-l border-slate-800">
        <span className="text-[10px] text-slate-600 leading-none">T+</span>
        <span className="text-sm font-mono font-bold text-slate-400 leading-none mt-0.5">
          {simTimeMin < 60 ? `${simTimeMin}m` : `${Math.floor(simTimeMin / 60)}h${String(simTimeMin % 60).padStart(2, '0')}`}
        </span>
      </div>
    </div>
  );
}
