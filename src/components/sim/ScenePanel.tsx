import { useState, useEffect, useRef } from 'react';
import type {
  PatientSim, SimCase, SimEvent, CoachingEntry,
  CharacterMoods, DoctorMood, NurseMood, FamilyMood,
  DirectorCue, SimPatientStatus,
} from '../../types/simulation';
import type { Interruption } from '../../hooks/useInterruptionEngine';
import InterruptionBubble from './InterruptionBubble';

// ─── Doctor face paths (keyed by new DoctorMood) ─────────────────────────────

const DOCTOR_FACE: Record<DoctorMood, { mouth: string; browL: string; browR: string }> = {
  thinking:  { mouth: 'M 25 33 Q 30 36 35 33', browL: 'M 19 23 Q 24 21 27 23', browR: 'M 33 23 Q 36 21 41 23' },
  focused:   { mouth: 'M 25 33 Q 30 35 35 33', browL: 'M 19 21 Q 24 19 28 22', browR: 'M 32 22 Q 36 19 41 21' },
  concerned: { mouth: 'M 25 35 Q 30 32 35 35', browL: 'M 19 21 Q 24 19 28 22', browR: 'M 32 22 Q 36 19 41 21' },
  proud:     { mouth: 'M 23 32 Q 30 38 37 32', browL: 'M 19 24 Q 24 22 27 24', browR: 'M 33 24 Q 36 22 41 24' },
  alarmed:   { mouth: 'M 26 34 Q 30 37 34 34', browL: 'M 18 20 Q 24 17 28 20', browR: 'M 32 20 Q 36 17 42 20' },
};

// ─── Tone styling ─────────────────────────────────────────────────────────────

const TONE_STYLE: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  praise: { border: 'border-emerald-600/70', bg: 'bg-emerald-950/80', text: 'text-emerald-200', dot: 'bg-emerald-400' },
  teach:  { border: 'border-blue-600/70',    bg: 'bg-blue-950/80',    text: 'text-blue-200',    dot: 'bg-blue-400'    },
  nudge:  { border: 'border-amber-600/70',   bg: 'bg-amber-950/80',   text: 'text-amber-200',   dot: 'bg-amber-400'   },
  warn:   { border: 'border-red-600/70',     bg: 'bg-red-950/80',     text: 'text-red-200',     dot: 'bg-red-400'     },
};

// ─── Ambient nurse pool ───────────────────────────────────────────────────────

const BASE_AMBIENT = [
  'Obs done — charted.',
  'Let me know what you need.',
  'Monitoring continuously.',
  'On it.',
];

const FLAG_AMBIENT: Array<[string, string[]]> = [
  ['ivAccessEstablished', [
    "IV's patent — no infiltration.",
    'Line secure, running well.',
  ]],
  ['oxygenStarted', [
    'Mask on — sats picking up.',
    "She's more settled on the O2.",
    'O2 on, mask in place.',
  ]],
  ['fluidsStarted', [
    'Fluids running — watching the rate.',
    "First bag's going in well.",
  ]],
  ['antibioticsStarted', [
    "Drip's up. Watching for any reaction.",
    'No reaction so far — all good.',
  ]],
  ['culturesDrawn', [
    'Bottles labelled and with the runner.',
  ]],
  ['adequateFluids', [
    '30 mL/kg in. UO ticking up slightly.',
    "She's had her fluids — looking a bit better.",
  ]],
  ['icuCalled', [
    'ICU said ten minutes.',
    'Waiting on the ICU reg.',
  ]],
];

const STATUS_AMBIENT: Partial<Record<SimPatientStatus, string[]>> = {
  guarded: [
    "She's asking for some water.",
    'Family in the corridor — should I let them in?',
    'Call bell within reach.',
  ],
  critical: [
    "Doctor, I'm not happy with those obs.",
    'Cap refill up to 4 seconds.',
    "Colour's not right.",
    'BP dropping again.',
  ],
  improving: [
    "She's more settled now.",
    'Colour coming back.',
    'Looked at me when I checked on her.',
    'Urine output improving.',
  ],
};

function buildAmbientPool(flags: Record<string, boolean>, status: SimPatientStatus): string[] {
  const pool: string[] = [...BASE_AMBIENT];
  for (const [flag, msgs] of FLAG_AMBIENT) {
    if (flags[flag]) pool.push(...msgs);
  }
  const statusMsgs = STATUS_AMBIENT[status];
  if (statusMsgs) pool.push(...statusMsgs);
  return pool;
}

// ─── Patient SVG ──────────────────────────────────────────────────────────────

function PatientFigure({
  status,
  flags,
  rr,
}: {
  status: SimPatientStatus;
  flags: Record<string, boolean>;
  rr: number;
}) {
  const isArrested = status === 'cardiac-arrest';
  const isDead     = status === 'dead';
  const isCritical = status === 'critical' || isArrested;
  const isGood     = status === 'improving' || status === 'discharged';
  const isFeverish = isCritical && !isDead;

  const faceColor = isDead ? '#64748b' : isCritical ? '#fca5a5' : isGood ? '#86efac' : '#fde68a';
  const eyeState  = isDead ? 'x' : isCritical ? 'wide' : isGood ? 'soft' : 'neutral';

  // RR-based breathing: cycle = 60s / rr, scaled to real-time seconds
  const safeRr = Math.max(8, Math.min(rr, 40));
  const breathDuration = `${(60 / safeRr).toFixed(1)}s`;

  const bodyBreathStyle = isDead
    ? {}
    : {
        animation: `patient-breathe ${breathDuration} ease-in-out infinite`,
        transformBox: 'fill-box' as const,
        transformOrigin: 'center 88px',
      };

  return (
    <svg
      viewBox="0 0 240 116"
      width="240"
      height="116"
      aria-label={`Patient: ${status}`}
      className={isFeverish ? 'patient-shivering' : undefined}
    >
      {/* Bed frame */}
      <rect x="4"   y="76" width="232" height="38" rx="5" fill="#1e293b" stroke="#334155" strokeWidth="1" />
      {/* Headboard */}
      <rect x="196" y="58" width="40"  height="55" rx="4" fill="#1e3a5f" stroke="#2563eb" strokeWidth="0.5" />
      {/* IV pole */}
      <rect x="210" y="8"  width="3"   height="68" fill="#475569" />
      <rect x="200" y="8"  width="23"  height="3"  rx="1" fill="#475569" />
      {/* IV bag */}
      <rect x="206" y="11" width="11"  height="15" rx="3" fill="#bfdbfe" opacity="0.7" stroke="#93c5fd" strokeWidth="0.5" />
      {/* Pillow */}
      <ellipse cx="152" cy="77" rx="38" ry="10" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="0.5" />

      {/* ── Breathing body group ─────────────────────────────── */}
      <g style={bodyBreathStyle}>
        <rect   x="6"  y="78" width="190" height="34" rx="3" fill="#1e3a5f" opacity="0.8" />
        <rect   x="6"  y="78" width="190" height="16" rx="3" fill="#1d4ed8" opacity="0.5" />
        <ellipse cx="90" cy="92" rx="55" ry="14" fill="#1e40af" opacity="0.4" />
      </g>

      {/* Head */}
      <ellipse cx="152" cy="60" rx="24" ry="22" fill={faceColor} />
      {/* Hair */}
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
          {/* Left eye with blink */}
          <ellipse cx="145" cy="60" rx="3" ry={eyeState === 'wide' ? 3.5 : 2.5} fill="#1e293b">
            <animate
              attributeName="ry"
              values={`${eyeState === 'wide' ? 3.5 : 2.5};0.2;${eyeState === 'wide' ? 3.5 : 2.5}`}
              dur="4.2s"
              repeatCount="indefinite"
              begin="0s"
            />
          </ellipse>
          {/* Right eye with blink (slight offset) */}
          <ellipse cx="159" cy="60" rx="3" ry={eyeState === 'wide' ? 3.5 : 2.5} fill="#1e293b">
            <animate
              attributeName="ry"
              values={`${eyeState === 'wide' ? 3.5 : 2.5};0.2;${eyeState === 'wide' ? 3.5 : 2.5}`}
              dur="4.2s"
              repeatCount="indefinite"
              begin="0.07s"
            />
          </ellipse>
          {/* Worry brows */}
          {isCritical && (
            <>
              <path d="M 141 56 Q 145 53 149 56" stroke="#374151" strokeWidth="1.5" fill="none" />
              <path d="M 155 56 Q 159 53 163 56" stroke="#374151" strokeWidth="1.5" fill="none" />
            </>
          )}
        </>
      )}

      {/* Mouth */}
      {isGood   && <path d="M 146 70 Q 152 74 158 70" stroke="#374151" strokeWidth="2" fill="none" strokeLinecap="round" />}
      {isCritical && !isDead && <path d="M 146 71 Q 152 68 158 71" stroke="#374151" strokeWidth="2" fill="none" strokeLinecap="round" />}
      {!isGood && !isCritical && !isDead && <line x1="147" y1="70" x2="157" y2="70" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />}

      {/* Sweat drops — animated fall */}
      {isFeverish && (
        <>
          <ellipse cx="130" cy="60" rx="2" ry="3" fill="#93c5fd" opacity="0.8" className="sweat-drop" />
          <ellipse cx="174" cy="58" rx="1.5" ry="2.5" fill="#93c5fd" opacity="0.7" className="sweat-drop-2" />
        </>
      )}

      {/* O2 mask */}
      {flags['oxygenStarted'] && (
        <rect x="142" y="64" width="20" height="10" rx="4"
          fill="rgba(56,189,248,0.15)" stroke="#38bdf8" strokeWidth="1.5" />
      )}

      {/* Monitor alert dot */}
      {isCritical && (
        <circle cx="10" cy="85" r="4" fill="#ef4444" opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.2s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}

// ─── Doctor Avatar ────────────────────────────────────────────────────────────

function DoctorAvatar({ mood }: { mood: DoctorMood }) {
  const face = DOCTOR_FACE[mood];
  const isFocused = mood === 'focused';
  const isAlarmed = mood === 'alarmed';
  const coatStroke = isAlarmed ? '#ef4444' : isFocused ? '#3b82f6' : 'none';

  return (
    <svg viewBox="0 0 60 80" width="52" height="69">
      {/* White coat body */}
      <rect x="8" y="38" width="44" height="42" rx="5" fill="#e2e8f0"
        stroke={coatStroke} strokeWidth={isAlarmed || isFocused ? '1.5' : '0'} />
      {/* Scrubs underneath */}
      <rect x="18" y="38" width="24" height="42" fill="#3b82f6" opacity="0.4" />
      {/* Coat lapels */}
      <path d="M 30 38 L 16 52 L 16 38 Z" fill="#f1f5f9" opacity="0.7" />
      <path d="M 30 38 L 44 52 L 44 38 Z" fill="#f1f5f9" opacity="0.7" />
      {/* Stethoscope */}
      <path d="M 18 48 Q 28 60 30 54 Q 32 48 42 52" stroke="#64748b" strokeWidth="2" fill="none" />
      <circle cx="42" cy="53" r="3.5" fill="#475569" />
      {/* Focused — pen in hand */}
      {isFocused && <line x1="40" y1="58" x2="48" y2="72" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />}

      {/* Head */}
      <circle cx="30" cy="26" r="19" fill="#fcd9b4" />
      {/* Hair */}
      <path d="M 11 22 Q 30 10 49 22 Q 49 12 30 10 Q 11 12 11 22" fill="#1e293b" />
      {/* Eyes */}
      <circle cx="24" cy="26" r="2.5" fill="#1e293b" />
      <circle cx="36" cy="26" r="2.5" fill="#1e293b" />
      {/* Glasses */}
      <rect x="18" y="22" width="10" height="7" rx="2" fill="none" stroke="#94a3b8" strokeWidth="1" />
      <rect x="32" y="22" width="10" height="7" rx="2" fill="none" stroke="#94a3b8" strokeWidth="1" />
      <line x1="28" y1="25" x2="32" y2="25" stroke="#94a3b8" strokeWidth="1" />
      {/* Mood brows */}
      <path d={face.browL} stroke="#6b4226" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d={face.browR} stroke="#6b4226" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Mood mouth */}
      <path d={face.mouth} stroke="#9d7060" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Name badge */}
      <rect x="17" y="52" width="14" height="8" rx="1" fill="#dbeafe" />
      <line x1="19" y1="55" x2="29" y2="55" stroke="#93c5fd" strokeWidth="1" />
      <line x1="19" y1="57" x2="26" y2="57" stroke="#93c5fd" strokeWidth="1" />
    </svg>
  );
}

// ─── Nurse Avatar ─────────────────────────────────────────────────────────────

function NurseAvatar({ mood }: { mood: NurseMood }) {
  const isWorried  = mood === 'worried';
  const isRelieved = mood === 'relieved';
  const mouthD = isRelieved
    ? 'M 24 34 Q 30 38 36 34'   // smile
    : isWorried
    ? 'M 25 35 Q 30 32 35 35'   // frown
    : 'M 25 34 Q 30 37 35 34';  // gentle smile (default)
  const browStroke = isWorried ? '#7c2d12' : '#92400e';
  return (
    <svg viewBox="0 0 60 80" width="46" height="62">
      <rect x="8"  y="38" width="44" height="42" rx="5" fill="#1d4ed8" opacity="0.85" />
      <rect x="8"  y="44" width="44" height="6"  fill="#1e40af" opacity="0.5" />
      <circle cx="30" cy="26" r="18" fill="#fde8d0" />
      <path d="M 12 22 Q 30 10 48 22" stroke="#854d0e" strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="30" cy="13" rx="14" ry="5" fill="#854d0e" />
      <circle cx="30" cy="9"  r="5" fill="#78350f" />
      <circle cx="24" cy="27" r="2.5" fill="#1e293b" />
      <circle cx="36" cy="27" r="2.5" fill="#1e293b" />
      {/* Mood brows */}
      {isWorried ? (
        <>
          <path d="M 20 22 Q 24 19 28 22" stroke={browStroke} strokeWidth="1.5" fill="none" />
          <path d="M 32 22 Q 36 19 40 22" stroke={browStroke} strokeWidth="1.5" fill="none" />
        </>
      ) : (
        <>
          <path d="M 21 23 Q 24 21 27 23" stroke={browStroke} strokeWidth="1.5" fill="none" />
          <path d="M 33 23 Q 36 21 39 23" stroke={browStroke} strokeWidth="1.5" fill="none" />
        </>
      )}
      <path d={mouthD} stroke="#9d7060" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M 18 40 Q 30 48 42 40" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

// ─── Family Avatar ────────────────────────────────────────────────────────────

function FamilyAvatar({ mood }: { mood: FamilyMood }) {
  const isCrying   = mood === 'crying';
  const isRelieved = mood === 'relieved';
  const isHopeful  = mood === 'hopeful';
  const isAnxious  = mood === 'anxious';

  const mouthD = isRelieved
    ? 'M 24 34 Q 30 38 36 34'   // smile
    : isHopeful
    ? 'M 25 34 Q 30 36 35 34'   // slight smile
    : 'M 25 34 Q 30 31 35 34';  // frown (anxious/crying)

  const showWorriedBrows = isAnxious || isCrying;

  return (
    <svg viewBox="0 0 60 80" width="42" height="56">
      <rect x="10" y="38" width="40" height="42" rx="5" fill="#7c3aed" opacity="0.7" />
      <rect x="16" y="38" width="28" height="10" rx="2" fill="#6d28d9" opacity="0.5" />
      <circle cx="30" cy="26" r="17" fill="#fde8d0" />
      <path d="M 13 22 Q 30 8 47 22"  stroke="#92400e" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M 13 22 Q 11 36 13 44" stroke="#92400e" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M 47 22 Q 49 36 47 44" stroke="#92400e" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* Eyes — closed/wet when crying */}
      {isCrying ? (
        <>
          <line x1="21" y1="27" x2="27" y2="27" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
          <line x1="33" y1="27" x2="39" y2="27" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
          {/* Tear drops */}
          <ellipse cx="24" cy="30" rx="1.2" ry="2" fill="#93c5fd" opacity="0.8" />
          <ellipse cx="36" cy="30" rx="1.2" ry="2" fill="#93c5fd" opacity="0.8" />
        </>
      ) : (
        <>
          <circle cx="24" cy="27" r="2.5" fill="#1e293b" />
          <circle cx="36" cy="27" r="2.5" fill="#1e293b" />
        </>
      )}
      {showWorriedBrows && (
        <>
          <path d="M 20 22 Q 24 19 28 22" stroke="#92400e" strokeWidth="1.5" fill="none" />
          <path d="M 32 22 Q 36 19 40 22" stroke="#92400e" strokeWidth="1.5" fill="none" />
        </>
      )}
      <path d={mouthD} stroke="#9d7060" strokeWidth="1.5" fill="none" strokeLinecap="round" />
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
      className={`rounded-lg border text-xs leading-snug px-2 py-1.5 shadow-lg animate-bubble-in ${colorClass}`}
      style={{ maxWidth, minWidth: 72 }}
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
  acting?: boolean;
  interruption?: Interruption | null;
  onInterruptionDismiss?: () => void;
  onInterruptionRespond?: (response: string) => void;
  // Director System
  characterMoods?: CharacterMoods;
  activeCue?: DirectorCue | null;
}

export default function ScenePanel({
  patient, simCase, eventLog, coachingLog, acting = false,
  interruption, onInterruptionDismiss, onInterruptionRespond,
  characterMoods, activeCue,
}: Props) {
  const pres = simCase.presentation;

  const [ambientMsg, setAmbientMsg] = useState<string | null>(null);
  const ambientTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep latest state accessible in the timer callback without stale closures
  const stateRef = useRef({ flags: patient.flags, status: patient.status, simTimeMin: patient.simTimeMinutes, latestNurse: null as SimEvent | null });
  useEffect(() => {
    stateRef.current = {
      flags: patient.flags,
      status: patient.status,
      simTimeMin: patient.simTimeMinutes,
      latestNurse: [...eventLog].reverse().find(e => e.source === 'nurse') ?? null,
    };
  });

  // Ambient pulse — fires every 9–16 real-time seconds
  useEffect(() => {
    function scheduleTick() {
      pulseTimerRef.current = setTimeout(() => {
        const { flags, status, simTimeMin, latestNurse } = stateRef.current;
        const realNurseVisible = latestNurse && (simTimeMin - latestNurse.simTimeMin) < 6;
        if (!realNurseVisible && !ambientMsg) {
          const pool = buildAmbientPool(flags, status);
          const msg  = pool[Math.floor(Math.random() * pool.length)];
          setAmbientMsg(msg);
          if (ambientTimeoutRef.current) clearTimeout(ambientTimeoutRef.current);
          ambientTimeoutRef.current = setTimeout(() => setAmbientMsg(null), 5000);
        }
        scheduleTick();
      }, 9000 + Math.random() * 7000);
    }
    // First pulse after a short delay
    pulseTimerRef.current = setTimeout(scheduleTick, 12000 + Math.random() * 6000);
    return () => {
      if (pulseTimerRef.current)    clearTimeout(pulseTimerRef.current);
      if (ambientTimeoutRef.current) clearTimeout(ambientTimeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear ambient when a real nurse event arrives
  const prevEventCountRef = useRef(eventLog.length);
  useEffect(() => {
    if (eventLog.length > prevEventCountRef.current) {
      const newEvs = eventLog.slice(prevEventCountRef.current);
      if (newEvs.some(e => e.source === 'nurse')) {
        setAmbientMsg(null);
        if (ambientTimeoutRef.current) clearTimeout(ambientTimeoutRef.current);
      }
      prevEventCountRef.current = eventLog.length;
    }
  }, [eventLog]);

  // Latest messages
  const latestNurse  = [...eventLog].reverse().find(e => e.source === 'nurse');
  const latestFamily = [...eventLog].reverse().find(e => e.source === 'family');
  const latestCoach  = coachingLog.at(-1) ?? null;

  const nurseVisible  = latestNurse  ? (patient.simTimeMinutes - latestNurse.simTimeMin)  < 6 : false;
  const familyVisible = latestFamily ? (patient.simTimeMinutes - latestFamily.simTimeMin) < 6 : false;
  const coachVisible  = latestCoach  ? (patient.simTimeMinutes - latestCoach.simTimeMin)  < 8 : false;

  const showNurseBubble = (nurseVisible && latestNurse) || ambientMsg;
  const nurseBubbleText = nurseVisible && latestNurse
    ? latestNurse.text.replace(/^[^:]+:\s*"?/, '').replace(/"$/, '')
    : (ambientMsg ?? '');

  const allergy   = patient.revealedAllergies[0] ?? null;
  const rr = patient.vitals.rr ?? 16;

  // ── Director: derive moods + message slots ───────────────────────────────
  const defaultMoods: CharacterMoods = {
    doctor:  acting ? 'focused' : 'thinking',
    nurse:   'calm',
    patient: 'stable',
    family:  'anxious',
  };
  const moods = characterMoods ?? defaultMoods;

  // Override speech bubble when Director has a message for that actor
  const dirActor = activeCue?.actor;
  const dirMsg   = activeCue?.message ?? null;

  // Visual effect class on root
  const visualClass =
    activeCue?.visualEffect === 'greenGlow' ? 'director-green-glow' :
    activeCue?.visualEffect === 'redFlash'  ? 'director-red-flash'  :
    activeCue?.visualEffect === 'pulse'     ? 'director-pulse'       :
    activeCue?.visualEffect === 'softFade'  ? 'director-soft-fade'   :
    '';

  // Doctor speech: Director overrides coaching log when actor === 'doctor'
  const doctorBubbleText = dirActor === 'doctor' ? dirMsg
    : (coachVisible && latestCoach ? latestCoach.text : null);
  const doctorBubbleTone = dirActor === 'doctor' ? (activeCue?.tone ?? 'calm') : latestCoach?.tone ?? 'teach';

  // Nurse speech: Director overrides ambient/eventLog when actor === 'nurse'
  const nurseBubbleOverride = dirActor === 'nurse' ? dirMsg : null;
  const effectiveNurseBubble = nurseBubbleOverride
    ?? (showNurseBubble ? nurseBubbleText : null);

  // Patient speech bubble (new — only from Director)
  const patientBubbleText = dirActor === 'patient' ? dirMsg : null;

  // Family speech: Director overrides eventLog when actor === 'family'
  const familyBubbleText = dirActor === 'family' ? dirMsg
    : (familyVisible && latestFamily
        ? latestFamily.text.replace(/^[^:()]+\([^)]*\):\s*"?/, '').replace(/"$/, '') || latestFamily.text
        : null);

  return (
    <div className={`relative flex flex-col h-full overflow-hidden bg-slate-950 ${visualClass}`}>

      {/* ── Interruption overlay ────────────────────────────── */}
      {interruption && onInterruptionDismiss && onInterruptionRespond && (
        <InterruptionBubble
          key={interruption.id}
          interruption={interruption}
          onDismiss={onInterruptionDismiss}
          onRespond={onInterruptionRespond}
        />
      )}

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
      <div className="shrink-0 flex justify-center items-end px-2 pt-2 patient-living" style={{ height: '124px' }}>
        <PatientFigure status={patient.status} flags={patient.flags} rr={rr} />
      </div>

      {/* ── Characters row ─────────────────────────────────── */}
      <div className="flex-1 min-h-0 px-2 pb-2 flex items-end gap-1 overflow-hidden">

        {/* Doctor + coaching / Director bubble */}
        <div className={`flex flex-col items-center gap-1 shrink-0 ${moods.doctor === 'focused' ? '' : 'doctor-living'}`}>
          {doctorBubbleText && (() => {
            const tone = doctorBubbleTone;
            const ts = TONE_STYLE[tone as keyof typeof TONE_STYLE] ?? TONE_STYLE.teach;
            return (
              <div
                className={`rounded-lg border text-xs leading-snug px-2 py-1.5 shadow-lg animate-bubble-in ${ts.border} ${ts.bg} ${ts.text}`}
                style={{ maxWidth: 148, minWidth: 80 }}
                key={doctorBubbleText}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${ts.dot}`} />
                  <span className="font-semibold text-[10px] uppercase tracking-wide opacity-70">
                    {dirActor === 'doctor' ? (activeCue?.tone ?? 'calm') : latestCoach?.tone ?? 'teach'}
                  </span>
                </div>
                <div>{doctorBubbleText.length > 80 ? doctorBubbleText.slice(0, 77) + '…' : doctorBubbleText}</div>
              </div>
            );
          })()}
          <DoctorAvatar mood={moods.doctor} />
          <span className="text-[9px] text-slate-600">
            {moods.doctor === 'focused' ? '⏱ ordering…' : 'Dr. Patel'}
          </span>
        </div>

        {/* Nurse + speech bubble (real, ambient, or Director) */}
        <div className="flex flex-col items-center gap-1 shrink-0 flex-1 min-w-0 nurse-living">
          {effectiveNurseBubble && (
            <SpeechBubble
              key={effectiveNurseBubble}
              text={effectiveNurseBubble}
              colorClass="bg-indigo-950/80 border-indigo-700/60 text-indigo-200"
              maxWidth={148}
            />
          )}
          <NurseAvatar mood={moods.nurse} />
          <span className="text-[9px] text-slate-600">Nurse Jenna</span>
        </div>

        {/* Family — always shown; moods from Director */}
        <div className="flex flex-col items-center gap-1 shrink-0 family-living">
          {familyBubbleText && (
            <SpeechBubble
              key={familyBubbleText}
              text={familyBubbleText}
              colorClass="bg-amber-950/80 border-amber-700/60 text-amber-200"
              maxWidth={130}
            />
          )}
          <FamilyAvatar mood={moods.family} />
          <span className="text-[9px] text-slate-600">Family</span>
        </div>
      </div>

      {/* ── Patient speech bubble (Director only) ──────────────── */}
      {patientBubbleText && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <SpeechBubble
            key={patientBubbleText}
            text={patientBubbleText}
            colorClass="bg-slate-800/90 border-slate-600/60 text-slate-100"
            maxWidth={180}
          />
        </div>
      )}
    </div>
  );
}
