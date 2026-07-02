import { useState, useEffect, useRef } from 'react';

// ─── Scene definitions ─────────────────────────────────────────────────────────

interface Scene {
  id: string;
  durationMs: number;
  speaker?: 'narrator' | 'nurse' | 'patient' | 'family' | 'doctor' | 'system';
  speakerLabel?: string;
  text: string;
  subtext?: string;
}

const SCENES: Scene[] = [
  {
    id: 'location',
    durationMs: 2200,
    speaker: 'narrator',
    text: 'ED Bay 3  ·  08:00',
    subtext: 'City General Hospital',
  },
  {
    id: 'nurse-handover',
    durationMs: 4800,
    speaker: 'nurse',
    speakerLabel: 'Nurse Jenna',
    text: 'Handover from nights. Ruth Anand, 65F, brought in by ambulance. Query sepsis. She\'s confused and her BP is in the gutter.',
  },
  {
    id: 'patient-speaks',
    durationMs: 3600,
    speaker: 'patient',
    speakerLabel: 'Ruth',
    text: "I'm cold... where... where am I?",
  },
  {
    id: 'family-distress',
    durationMs: 4000,
    speaker: 'family',
    speakerLabel: 'Priya (daughter)',
    text: 'Please — she was perfectly fine yesterday. What\'s happening to her?!',
  },
  {
    id: 'vitals-alarm',
    durationMs: 2600,
    speaker: 'narrator',
    text: 'BP 82/50  ·  HR 118  ·  Temp 38.9°C  ·  SpO₂ 91%',
    subtext: 'Monitor alarming',
  },
  {
    id: 'doctor-enters',
    durationMs: 5000,
    speaker: 'doctor',
    speakerLabel: 'Dr. Patel — Consultant',
    text: "I've reviewed her chart. She needs you right now.",
    subtext: 'Your senior is watching.',
  },
  {
    id: 'title',
    durationMs: 3000,
    speaker: 'system',
    text: 'YOUR SHIFT STARTS',
  },
];

// ─── Speaker icon ──────────────────────────────────────────────────────────────

function SpeakerIcon({ speaker }: { speaker: Scene['speaker'] }) {
  if (speaker === 'narrator' || speaker === 'system') return null;

  const MAP: Record<string, { icon: string; cls: string }> = {
    nurse:  { icon: '👩‍⚕️', cls: 'bg-indigo-900/60 border-indigo-600/50' },
    patient: { icon: '🧓', cls: 'bg-slate-800/60 border-slate-600/50' },
    family:  { icon: '👩', cls: 'bg-amber-900/60 border-amber-600/50' },
    doctor:  { icon: '👨‍⚕️', cls: 'bg-sky-900/60 border-sky-600/50' },
  };
  const cfg = MAP[speaker!] ?? { icon: '❓', cls: 'bg-slate-800 border-slate-600' };

  return (
    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-2xl shrink-0 ${cfg.cls}`}>
      {cfg.icon}
    </div>
  );
}

// ─── Speaker colour ────────────────────────────────────────────────────────────

const SPEAKER_TEXT: Record<string, string> = {
  narrator: 'text-slate-400',
  nurse:    'text-indigo-300',
  patient:  'text-slate-200',
  family:   'text-amber-300',
  doctor:   'text-sky-300',
  system:   'text-white',
};

const SPEAKER_LABEL_CLR: Record<string, string> = {
  nurse:   'text-indigo-400',
  patient: 'text-slate-400',
  family:  'text-amber-400',
  doctor:  'text-sky-400',
};

// ─── Scene card ────────────────────────────────────────────────────────────────

interface CardProps {
  scene: Scene;
  visible: boolean;
}

function SceneCard({ scene, visible }: CardProps) {
  const isTitle    = scene.speaker === 'system';
  const isNarrator = scene.speaker === 'narrator';

  return (
    <div
      className="absolute inset-0 flex items-center justify-center px-8"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.55s ease-in-out',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      {isTitle ? (
        /* ── Title card ── */
        <div className="text-center">
          <div
            className="font-black tracking-widest text-white uppercase"
            style={{ fontSize: 'clamp(2rem, 8vw, 4rem)', letterSpacing: '0.18em' }}
          >
            {scene.text}
          </div>
          <div className="mt-4 h-0.5 w-24 bg-red-500 mx-auto rounded" />
        </div>
      ) : isNarrator ? (
        /* ── Narrator caption ── */
        <div className="text-center max-w-lg">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500 mb-3 font-mono">
            {scene.subtext}
          </div>
          <div className="text-2xl font-semibold text-slate-300 font-mono tracking-wide">
            {scene.text}
          </div>
        </div>
      ) : (
        /* ── Character speech ── */
        <div className="max-w-xl w-full">
          {/* Speaker row */}
          <div className="flex items-center gap-3 mb-4">
            <SpeakerIcon speaker={scene.speaker} />
            <span className={`text-sm font-bold tracking-wide ${SPEAKER_LABEL_CLR[scene.speaker!] ?? 'text-slate-400'}`}>
              {scene.speakerLabel}
            </span>
          </div>

          {/* Speech bubble */}
          <div className="relative bg-slate-900/80 border border-slate-700/60 rounded-xl px-5 py-4 shadow-2xl backdrop-blur-sm">
            <p className={`text-base leading-relaxed font-medium ${SPEAKER_TEXT[scene.speaker!] ?? 'text-slate-200'}`}>
              "{scene.text}"
            </p>
            {scene.subtext && (
              <p className="text-xs text-slate-500 mt-2 italic">{scene.subtext}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Monitor pulse line (decorative) ──────────────────────────────────────────

function PulseLine() {
  return (
    <svg
      viewBox="0 0 300 40"
      className="w-48 h-8 opacity-30"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polyline
        points="0,20 60,20 75,5 85,35 95,10 105,28 115,20 300,20"
        fill="none"
        stroke="#22c55e"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Progress dots ─────────────────────────────────────────────────────────────

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex gap-1.5 items-center">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i === current
              ? 'w-3 h-1.5 bg-slate-400'
              : i < current
              ? 'w-1.5 h-1.5 bg-slate-600'
              : 'w-1.5 h-1.5 bg-slate-800'
          }`}
        />
      ))}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface Props {
  onComplete: () => void;
}

export default function CinematicIntro({ onComplete }: Props) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [visible, setVisible]       = useState(false);
  const [done, setDone]             = useState(false);
  const timerRef                    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fade in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Advance scenes
  useEffect(() => {
    if (done) return;
    const scene = SCENES[sceneIndex];
    if (!scene) {
      handleComplete();
      return;
    }
    timerRef.current = setTimeout(() => {
      if (sceneIndex < SCENES.length - 1) {
        setSceneIndex(i => i + 1);
      } else {
        handleComplete();
      }
    }, scene.durationMs);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneIndex, done]);

  function handleComplete() {
    if (done) return;
    setDone(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    // Fade out then fire onComplete
    setVisible(false);
    setTimeout(onComplete, 600);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease-in-out',
      }}
    >
      {/* ── Ambient vignette ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {/* ── Top bar ── */}
      <div className="relative shrink-0 flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <PulseLine />
          <span className="text-xs font-mono text-slate-600 tracking-widest uppercase">WardRunner</span>
        </div>
        <button
          onClick={handleComplete}
          className="text-xs text-slate-600 hover:text-slate-400 transition-colors px-3 py-1 rounded border border-slate-800 hover:border-slate-600"
        >
          Skip intro ›
        </button>
      </div>

      {/* ── Scene area ── */}
      <div className="relative flex-1 min-h-0">
        {SCENES.map((scene, i) => (
          <SceneCard key={scene.id} scene={scene} visible={i === sceneIndex} />
        ))}
      </div>

      {/* ── Bottom bar ── */}
      <div className="relative shrink-0 flex items-center justify-between px-5 pb-6 pt-3">
        <ProgressDots total={SCENES.length} current={sceneIndex} />
        <span className="text-xs text-slate-700 font-mono">
          {sceneIndex + 1} / {SCENES.length}
        </span>
      </div>
    </div>
  );
}
