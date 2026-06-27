import type { PatientSim, SimCase, SimPatientStatus } from '../../types/simulation';

interface Props {
  patient: PatientSim;
  simCase: SimCase;
}

export default function PatientSnapshot({ patient, simCase }: Props) {
  const hasAllergies = patient.revealedAllergies.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-1 bg-slate-900/60 border-b border-slate-800 shrink-0 flex items-center">
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Patient</span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">

        {/* ── Patient silhouette ── */}
        <PatientFigure status={patient.status} flags={patient.flags} />

        <div className="px-2 pb-2 space-y-1.5">

          {/* Chief complaint */}
          <div className="bg-slate-900/50 rounded px-2 py-1.5">
            <div className="text-xs text-slate-600 uppercase tracking-wider mb-0.5">Presenting</div>
            <div className="text-xs text-slate-200 font-medium leading-snug">
              {simCase.presentation.chiefComplaint}
            </div>
          </div>

          {/* Allergies — visually loud */}
          <div className={`rounded px-2 py-1.5 border ${
            hasAllergies
              ? 'bg-red-950/50 border-red-800/60'
              : 'bg-slate-900/30 border-slate-800/40'
          }`}>
            <div className={`text-xs uppercase tracking-wider font-bold mb-1 ${
              hasAllergies ? 'text-red-400' : 'text-slate-700'
            }`}>
              {hasAllergies ? '⚠ Allergies' : 'Allergies'}
            </div>
            {hasAllergies ? (
              <div className="flex flex-wrap gap-1">
                {patient.revealedAllergies.map((a, i) => (
                  <span key={i} className="text-xs bg-red-900/60 text-red-200 border border-red-700/50 px-1.5 py-0.5 rounded font-semibold">
                    {a}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-700 italic">Not yet checked</span>
            )}
          </div>

          {/* Active problems */}
          {patient.activeProblems.length > 0 && (
            <Section label="Active Problems">
              <div className="flex flex-wrap gap-1">
                {patient.activeProblems.map(p => (
                  <span key={p.id} className="text-xs bg-amber-900/30 text-amber-300 border border-amber-800/30 px-1.5 py-0.5 rounded">
                    {p.label}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Medications */}
          {patient.revealedMedications.length > 0 && (
            <Section label="Medications">
              {patient.revealedMedications.map((m, i) => (
                <div key={i} className="text-xs text-slate-400 leading-relaxed">• {m}</div>
              ))}
            </Section>
          )}

          {/* History */}
          {patient.knownHistory.length > 0 && (
            <Section label="History">
              {patient.knownHistory.map((h, i) => (
                <div key={i} className="text-xs text-slate-400 leading-relaxed">• {h}</div>
              ))}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Patient Figure ─────────────────────────────────────────────────────────────

const FIGURE_COLOR: Partial<Record<SimPatientStatus, string>> = {
  stable:            '#4ade80',
  guarded:           '#fbbf24',
  critical:          '#f87171',
  improving:         '#34d399',
  intubated:         '#fb923c',
  'cardiac-arrest':  '#ef4444',
  dead:              '#475569',
  discharged:        '#4ade80',
  'icu-transferred': '#60a5fa',
};

function PatientFigure({
  status,
  flags,
}: {
  status: SimPatientStatus;
  flags: Record<string, boolean>;
}) {
  const color    = FIGURE_COLOR[status] ?? '#fbbf24';
  const isArrest = status === 'cardiac-arrest';
  const isDead   = status === 'dead';

  return (
    <div className="flex flex-col items-center py-2 gap-1.5 border-b border-slate-800/50">
      {/* SVG figure */}
      <svg
        viewBox="0 0 100 108"
        width="52"
        height="56"
        aria-label={`Patient status: ${status}`}
      >
        <g
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          className={isArrest ? 'animate-pulse' : ''}
        >
          {/* Head */}
          <circle cx="50" cy="17" r="11" fill={color} fillOpacity={isDead ? 0.05 : 0.12} />
          {/* Neck / body */}
          <line x1="50" y1="28" x2="50" y2="70" />
          {/* Arms */}
          <line x1="50" y1="40" x2="27" y2="57" />
          <line x1="50" y1="40" x2="73" y2="57" />
          {/* Legs */}
          <line x1="50" y1="70" x2="34" y2="96" />
          <line x1="50" y1="70" x2="66" y2="96" />

          {/* O2 mask */}
          {flags['oxygenStarted'] && (
            <rect x="40" y="19" width="20" height="9" rx="2.5"
              stroke="#38bdf8" strokeWidth="1.5" fill="rgba(56,189,248,0.08)" />
          )}

          {/* IV line (right arm → IV bag icon) */}
          {flags['ivAccessEstablished'] && (
            <>
              <line x1="73" y1="57" x2="86" y2="44"
                stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="2.5,2" />
              <circle cx="87" cy="42" r="3.5" fill="#a78bfa" stroke="none" />
            </>
          )}

          {/* Dead — flat line across */}
          {isDead && (
            <line x1="20" y1="104" x2="80" y2="104"
              stroke="#475569" strokeWidth="1" strokeDasharray="4,3" />
          )}
        </g>
      </svg>

      {/* Treatment badges */}
      <div className="flex flex-wrap justify-center gap-1 px-2">
        {flags['oxygenStarted'] && (
          <Chip label="O₂" cls="bg-sky-900/60 text-sky-300 border-sky-700/50" />
        )}
        {flags['ivAccessEstablished'] && (
          <Chip label="IV" cls="bg-violet-900/60 text-violet-300 border-violet-700/50" />
        )}
        {flags['fluidsStarted'] && (
          <Chip label="IVF" cls="bg-blue-900/60 text-blue-300 border-blue-700/50" />
        )}
        {flags['antibioticsStarted'] && (
          <Chip label="Abx" cls="bg-emerald-900/60 text-emerald-300 border-emerald-700/50" />
        )}
        {flags['vasopressorsStarted'] && (
          <Chip label="Pressor" cls="bg-orange-900/60 text-orange-300 border-orange-700/50" />
        )}
        {flags['icuCalled'] && (
          <Chip label="ICU" cls="bg-blue-900/60 text-blue-200 border-blue-700/50" />
        )}
      </div>
    </div>
  );
}

function Chip({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`text-xs px-1.5 py-0 rounded border font-mono font-semibold ${cls}`}>
      {label}
    </span>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-600 uppercase tracking-wider font-semibold mb-1">{label}</div>
      {children}
    </div>
  );
}
