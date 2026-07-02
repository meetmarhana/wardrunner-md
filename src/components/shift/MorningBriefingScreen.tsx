import { useState, useEffect } from 'react';
import type { CareerLevel } from '../../types/shiftLoop';

interface Props {
  onBeginShift: () => void;
  careerLevel: CareerLevel;
  totalXP: number;
}

const SHIFT_STATS = [
  { label: 'ED Volume',   value: 'Busy — 12 patients waiting', icon: '🏥' },
  { label: 'Occupancy',   value: '87% beds occupied',           icon: '🛏️' },
  { label: 'Consultant',  value: 'Dr. Patel · Infectious Disease', icon: '👨‍⚕️' },
  { label: 'Weather',     value: 'Overcast, 14°C',              icon: '☁️' },
];

const DR_PATEL_LINES = [
  'Morning. Ambulance has been busy since 6am.',
  'Ruth Anand is in Bay 3 — septic picture, family\'s anxious.',
  'Good luck. I\'ll be around if you need me.',
];

export default function MorningBriefingScreen({ onBeginShift, careerLevel, totalXP }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 500),
      setTimeout(() => setStep(2), 1200),
      setTimeout(() => setStep(3), 1900),
      setTimeout(() => setStep(4), 2500),
      setTimeout(() => setStep(5), 3100),
      setTimeout(() => setStep(6), 3700),
      setTimeout(() => setStep(7), 4500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-slate-100">
      <div className="w-full max-w-sm space-y-5">

        {/* Hospital header */}
        {step >= 1 && (
          <div className="text-center shift-fade-in">
            <div className="text-5xl mb-3">🏥</div>
            <h1 className="text-xl font-bold tracking-widest uppercase text-white">
              City General Hospital
            </h1>
            <div className="text-[10px] text-slate-500 tracking-[0.35em] uppercase mt-1">
              Emergency Department
            </div>
          </div>
        )}

        {/* Date / shift */}
        {step >= 2 && (
          <div className="text-center shift-fade-in">
            <div className="text-slate-400 text-sm font-medium">Tuesday Morning · 08:00</div>
            <div className="text-slate-600 text-xs mt-0.5 tracking-wider uppercase">Morning Shift</div>
          </div>
        )}

        {/* Divider */}
        {step >= 3 && (
          <div className="border-t border-slate-800 shift-fade-in" />
        )}

        {/* Shift stats — appear one by one */}
        {step >= 3 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5 shift-fade-in">
            {SHIFT_STATS.slice(0, Math.min(step - 2, 4)).map((s, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </span>
                <span className="text-slate-300 font-medium text-right">{s.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Career badge */}
        {step >= 7 && (
          <div className="text-center shift-fade-in">
            <div className="inline-block bg-blue-950/60 border border-blue-800/50 rounded-lg px-4 py-2.5">
              <div className="text-[10px] text-blue-500 uppercase tracking-wider">You are</div>
              <div className="text-white font-bold text-sm mt-0.5">{careerLevel}</div>
              <div className="text-xs text-slate-500 mt-0.5">{totalXP} XP</div>
            </div>
          </div>
        )}

        {/* Dr Patel speech */}
        {step >= 7 && (
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 shift-fade-in">
            <div className="flex gap-3 items-start">
              <div className="text-2xl shrink-0">👨‍⚕️</div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                  Dr. Patel · Consultant
                </div>
                {DR_PATEL_LINES.map((line, i) => (
                  <p key={i} className="text-sm text-slate-200 italic leading-relaxed">
                    "{line}"
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Begin shift */}
        {step >= 7 && (
          <div className="pt-2 shift-fade-in">
            <button
              onClick={onBeginShift}
              className="w-full py-3.5 bg-blue-700 hover:bg-blue-600 rounded-xl text-white font-bold text-sm tracking-wide transition-colors shadow-lg shadow-blue-900/40"
            >
              Begin Shift →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
