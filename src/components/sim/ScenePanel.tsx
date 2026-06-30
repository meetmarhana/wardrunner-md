import type { PatientSim, SimCase, SimEvent, CoachingEntry, SimPatientStatus } from '../../types/simulation';

// ─── Tone styling ─────────────────────────────────────────────────────────────

const TONE_STYLE: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  praise: { border: 'border-emerald-600/70', bg: 'bg-emerald-950/80', text: 'text-emerald-200', dot: 'bg-emerald-400' },
  teach:  { border: 'border-blue-600/70',    bg: 'bg-blue-950/80',    text: 'text-blue-200',    dot: 'bg-blue-400'    },
  nudge:  { border: 'border-amber-600/70',   bg: 'bg-amber-950/80',   text: 'text-amber-200',   dot: 'bg-amber-400'   },
  warn:   { border: 'border-red-600/70',     bg: 'bg-red-950/80',     text: 'text-red-200',     dot: 'bg-red-400'     },
};

// ─── Patient SVG (lying in bed) ───────────────────────────────────────────────

function PatientFigure({ status, flags }: { status: SimPatientStatus; flags: Record<string, boolean> }) {
  const isArrested = status === 'cardiac-arrest';
  const isDead     = status === 'dead';
  const isCritical = status === 'critical' || isArrested;
  const isGood     = status === 'improving' || status === 'discharged';

  const faceColor  = isDead ? '#64748b' : isCritical ? '#fca5a5' : isGood ? '#86efac' : '#fde68a';
  const eyeState   = isDead ? 'x' : isCritical ? 'open-wide' : isGood ? 'soft' : 'neutral';

  return (
    <svg viewBox="0 0 240 116" width="240" height="116" aria-label={`Patient: ${status}`}>
      {/* Bed frame */}
      <rect x="4" y="76" width="232" height="38" rx="5" fill="#1e293b" stroke="#334155" strokeWidth="1" />
      {/* Headboard */}
      <rect x="196" y="58" width="40" height="55" rx="4" fill="#1e3a5f" stroke="#2563eb" strokeWidth="0.5" />
      {/* IV pole */}
      <rect x="210" y="8" width="3" height="68" fill="#475569" />
      <rect x="200" y="8" width="23" height="3" rx="1" fill="#475569" />
      {/* IV bag */}
      <rect x="206" y="11" width="11" height="15" rx="3" fill="#bfdbfe" opacity="0.7" stroke="#93c5fd" strokeWidth="0.5" />
      {/* Mattress/blanket */}
      <rect x="6" y="78" width="190" height="34" rx="3" fill="#1e3a5f" opacity="0.8" />
      {/* Blanket folds */}
      <rect x="6" y="78" width="190" height="16" rx="3" fill="#1d4ed8" opacity="0.5" />
      {/* Pillow */}
      <ellipse cx="152" cy="77" rx="38" ry="10" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="0.5" />
      {/* Body outline under blanket */}
      <ellipse cx="90" cy="92" rx="55" ry="14" fill="#1e40af" opacity="0.4" />

      {/* Head */}
      <ellipse cx="152" cy="60" rx="24" ry="22" fill={faceColor} />
      {/* Hair (white/grey — elderly) */}
      <path d="M 130 52 Q 152 40 174 52" stroke="#94a3b8" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M 128 58 Q 126 48 130 44" stroke="#94a3b8" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 176 58 Q 178 48 174 44" stroke="#94a3b8" strokeWidth="4" fill="none" strokeLinecap="round" />

      {/* Eyes */}
      {eyeState === 'x' ? (
        <>
          <line x1="143" y1="57" x2="149" y2="63" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <line x1="149" y1="57" x2="143" y2="63" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <line x1="155" y1="57" x2="161" y2="63" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <line x1="161" y1="57" x2="155" y2="63" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="145" cy="60" rx="3" ry={eyeState === 'open-wide' ? 3.5 : 2.5} fill="#1e293b" />
          <ellipse cx="159" cy="60" rx="3" ry={eyeState === 'open-wide' ? 3.5 : 2.5} fill="#1e293b" />
          {isCritical && (
            <>
              <path d="M 141 56 Q 145 53 149 56" stroke="#374151" strokeWidth="1.5" fill="none" />
              <path d="M 155 56 Q 159 53 163 56" stroke="#374151" strokeWidth="1.5" fill="none" />
            </>
          )}
        </>
      )}

      {/* Mouth */}
      {isGood ? (
        <path d="M 146 70 Q 152 74 158 70" stroke="#374151" strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : isCritical ? (
        <path d="M 146 71 Q 152 68 158 71" stroke="#374151" strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : (
        <line x1="147" y1="70" x2="157" y2="70" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />
      )}

      {/* Sweat drops (critical) */}
      {isCritical && !isDead && (
        <>
          <ellipse cx="130" cy="64" rx="2" ry="3" fill="#93c5fd" opacity="0.8" />
          <ellipse cx="174" cy="62" rx="1.5" ry="2.5" fill="#93c5fd" opacity="0.7" />
        </>
      )}

      {/* O2 mask */}
      {flags['oxygenStarted'] && (
        <rect x="142" y="64" width="20" height="10" rx="4"
          fill="rgba(56,189,248,0.15)" stroke="#38bdf8" strokeWidth="1.5" />
      )}

      {/* Monitoring dots (critical) */}
      {isCritical && (
        <circle cx="10" cy="85" r="4" fill="#ef4444" opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.2s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}

// ─── Doctor Avatar ────────────────────────────────────────────────────────────

function DoctorAvatar() {
  return (
    <svg viewBox="0 0 60 80" width="52" height="69">
      {/* White coat body */}
      <rect x="8" y="38" width="44" height="42" rx="5" fill="#e2e8f0" />
      {/* Scrubs underneath */}
      <rect x="18" y="38" width="24" height="42" fill="#3b82f6" opacity="0.4" />
      {/* Coat lapels */}
      <path d="M 30 38 L 16 52 L 16 38 Z" fill="#f1f5f9" opacity="0.7" />
      <path d="M 30 38 L 44 52 L 44 38 Z" fill="#f1f5f9" opacity="0.7" />
      {/* Stethoscope */}
      <path d="M 18 48 Q 28 60 30 54 Q 32 48 42 52" stroke="#64748b" strokeWidth="2" fill="none" />
      <circle cx="42" cy="53" r="3.5" fill="#475569" />
      {/* Head */}
      <circle cx="30" cy="26" r="19" fill="#fcd9b4" />
      {/* Hair (dark) */}
      <path d="M 11 22 Q 30 10 49 22 Q 49 12 30 10 Q 11 12 11 22" fill="#1e293b" />
      {/* Eyes */}
      <circle cx="24" cy="26" r="2.5" fill="#1e293b" />
      <circle cx="36" cy="26" r="2.5" fill="#1e293b" />
      {/* Glasses */}
      <rect x="18" y="22" width="10" height="7" rx="2" fill="none" stroke="#94a3b8" strokeWidth="1" />
      <rect x="32" y="22" width="10" height="7" rx="2" fill="none" stroke="#94a3b8" strokeWidth="1" />
      <line x1="28" y1="25" x2="32" y2="25" stroke="#94a3b8" strokeWidth="1" />
      {/* Slight smile */}
      <path d="M 25 33 Q 30 36 35 33" stroke="#9d7060" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Name badge */}
      <rect x="17" y="52" width="14" height="8" rx="1" fill="#dbeafe" />
      <line x1="19" y1="55" x2="29" y2="55" stroke="#93c5fd" strokeWidth="1" />
      <line x1="19" y1="57" x2="26" y2="57" stroke="#93c5fd" strokeWidth="1" />
    </svg>
  );
}

// ─── Nurse Avatar ─────────────────────────────────────────────────────────────

function NurseAvatar() {
  return (
    <svg viewBox="0 0 60 80" width="46" height="62">
      {/* Body — blue scrubs */}
      <rect x="8" y="38" width="44" height="42" rx="5" fill="#1d4ed8" opacity="0.85" />
      {/* Scrubs stripe */}
      <rect x="8" y="44" width="44" height="6" fill="#1e40af" opacity="0.5" />
      {/* Head */}
      <circle cx="30" cy="26" r="18" fill="#fde8d0" />
      {/* Hair (pulled back) */}
      <path d="M 12 22 Q 30 10 48 22" stroke="#854d0e" strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="30" cy="13" rx="14" ry="5" fill="#854d0e" />
      {/* Hair bun */}
      <circle cx="30" cy="9" r="5" fill="#78350f" />
      {/* Eyes */}
      <circle cx="24" cy="27" r="2.5" fill="#1e293b" />
      <circle cx="36" cy="27" r="2.5" fill="#1e293b" />
      {/* Alert eyebrows */}
      <path d="M 21 23 Q 24 21 27 23" stroke="#92400e" strokeWidth="1.5" fill="none" />
      <path d="M 33 23 Q 36 21 39 23" stroke="#92400e" strokeWidth="1.5" fill="none" />
      {/* Mouth */}
      <path d="M 25 34 Q 30 37 35 34" stroke="#9d7060" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Stethoscope around neck */}
      <path d="M 18 40 Q 30 48 42 40" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

// ─── Family Avatar ────────────────────────────────────────────────────────────

function FamilyAvatar() {
  return (
    <svg viewBox="0 0 60 80" width="42" height="56">
      {/* Body — civilian clothes */}
      <rect x="10" y="38" width="40" height="42" rx="5" fill="#7c3aed" opacity="0.7" />
      <rect x="16" y="38" width="28" height="10" rx="2" fill="#6d28d9" opacity="0.5" />
      {/* Head */}
      <circle cx="30" cy="26" r="17" fill="#fde8d0" />
      {/* Hair (longer) */}
      <path d="M 13 22 Q 30 8 47 22" stroke="#92400e" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M 13 22 Q 11 36 13 44" stroke="#92400e" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M 47 22 Q 49 36 47 44" stroke="#92400e" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* Eyes (worried) */}
      <circle cx="24" cy="27" r="2.5" fill="#1e293b" />
      <circle cx="36" cy="27" r="2.5" fill="#1e293b" />
      {/* Worried brows */}
      <path d="M 20 22 Q 24 19 28 22" stroke="#92400e" strokeWidth="1.5" fill="none" />
      <path d="M 32 22 Q 36 19 40 22" stroke="#92400e" strokeWidth="1.5" fill="none" />
      {/* Mouth (slight frown) */}
      <path d="M 25 34 Q 30 31 35 34" stroke="#9d7060" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// ─── Speech Bubble ────────────────────────────────────────────────────────────

function SpeechBubble({
  text,
  colorClass = 'bg-slate-800/90 border-slate-600/60 text-slate-200',
  maxWidth = 160,
}: {
  text: string;
  colorClass?: string;
  maxWidth?: number;
}) {
  return (
    <div
      className={`rounded-lg border text-xs leading-snug px-2 py-1.5 shadow-lg ${colorClass}`}
      style={{ maxWidth, minWidth: 80 }}
    >
      {text.length > 90 ? text.slice(0, 87) + '…' : text}
    </div>
  );
}

// ─── ScenePanel ───────────────────────────────────────────────────────────────

interface Props {
  patient: PatientSim;
  simCase: SimCase;
  eventLog: SimEvent[];
  coachingLog: CoachingEntry[];
}

export default function ScenePanel({ patient, simCase, eventLog, coachingLog }: Props) {
  const pres = simCase.presentation;

  // Latest messages by source (visible within 6 sim-minutes window)
  const latestNurse  = [...eventLog].reverse().find(e => e.source === 'nurse');
  const latestFamily = [...eventLog].reverse().find(e => e.source === 'family');
  const latestCoach  = coachingLog.at(-1) ?? null;

  const nurseVisible  = latestNurse  ? (patient.simTimeMinutes - latestNurse.simTimeMin)  < 6 : false;
  const familyVisible = latestFamily ? (patient.simTimeMinutes - latestFamily.simTimeMin) < 6 : false;
  const coachVisible  = latestCoach  ? (patient.simTimeMinutes - latestCoach.simTimeMin)  < 8 : false;

  const allergy = patient.revealedAllergies[0] ?? null;
  const toneStyle = latestCoach ? TONE_STYLE[latestCoach.tone] ?? TONE_STYLE.teach : TONE_STYLE.teach;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-950">

      {/* ── Patient header ─────────────────────────────────── */}
      <div className="shrink-0 px-3 pt-2 pb-1.5 border-b border-slate-800/60">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-sm font-bold text-slate-100 truncate">
            {pres.patientName ?? 'Patient'}
          </span>
          <span className="text-xs text-slate-500 shrink-0">{pres.patientAge}</span>
          <span className="text-xs text-slate-600 shrink-0 truncate">{pres.patientLocation}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-600">{pres.mrn}</span>
          {allergy && (
            <span className="text-xs font-bold text-red-400 bg-red-950/50 border border-red-800/60 rounded px-1.5 py-0 leading-5">
              ⚠ {allergy.split('—')[0].trim()}
            </span>
          )}
        </div>
        <div className="text-xs text-slate-400 mt-0.5 truncate">
          CC: {pres.chiefComplaint}
        </div>
      </div>

      {/* ── Patient figure ─────────────────────────────────── */}
      <div className="shrink-0 flex justify-center items-end px-2 pt-2" style={{ height: '124px' }}>
        <PatientFigure status={patient.status} flags={patient.flags} />
      </div>

      {/* ── Characters row ─────────────────────────────────── */}
      <div className="flex-1 min-h-0 px-2 pb-2 flex items-end gap-1 overflow-hidden">

        {/* Doctor + coaching bubble */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          {coachVisible && latestCoach && (
            <div className={`rounded-lg border text-xs leading-snug px-2 py-1.5 shadow-lg animate-fade-in ${toneStyle.border} ${toneStyle.bg} ${toneStyle.text}`}
              style={{ maxWidth: 148, minWidth: 80 }}>
              <div className="flex items-center gap-1 mb-0.5">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${toneStyle.dot}`} />
                <span className="font-semibold text-[10px] uppercase tracking-wide opacity-70">
                  {latestCoach.tone}
                </span>
              </div>
              <div>{latestCoach.text.length > 80 ? latestCoach.text.slice(0, 77) + '…' : latestCoach.text}</div>
            </div>
          )}
          <DoctorAvatar />
          <span className="text-[9px] text-slate-600">Doctor</span>
        </div>

        {/* Nurse + speech bubble */}
        <div className="flex flex-col items-center gap-1 shrink-0 flex-1 min-w-0">
          {nurseVisible && latestNurse && (
            <SpeechBubble
              text={latestNurse.text.replace(/^[^:]+:\s*"?/, '').replace(/"$/, '')}
              colorClass="bg-indigo-950/80 border-indigo-700/60 text-indigo-200"
              maxWidth={148}
            />
          )}
          <NurseAvatar />
          <span className="text-[9px] text-slate-600">Nurse Jenna</span>
        </div>

        {/* Family + speech bubble (only when messages have fired) */}
        {latestFamily && (
          <div className="flex flex-col items-center gap-1 shrink-0">
            {familyVisible && (
              <SpeechBubble
                text={latestFamily.text.replace(/^[^:()]+\([^)]*\):\s*"?/, '').replace(/"$/, '') || latestFamily.text}
                colorClass="bg-amber-950/80 border-amber-700/60 text-amber-200"
                maxWidth={130}
              />
            )}
            <FamilyAvatar />
            <span className="text-[9px] text-slate-600">Family</span>
          </div>
        )}
      </div>
    </div>
  );
}
