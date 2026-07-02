import { useState, useEffect } from 'react';
import type { CaseOutcome, XPLine } from '../../types/shiftLoop';

interface Props {
  lastOutcome: CaseOutcome;
  patientNumber: number;
  staffMemory: string | null;
  onReady: () => void;
}

const ROOM_PREP_SEQUENCE = [
  { icon: '🧹', text: 'Porters wheel patient away...' },
  { icon: '🛏️', text: 'Room being cleaned...' },
  { icon: '📟', text: 'Monitor reset...' },
  { icon: '🪢', text: 'Fresh linen laid out...' },
];

const HOSPITAL_EVENTS = [
  { icon: '☕', text: 'Someone left coffee on the nursing station. Origin unknown.' },
  { icon: '📢', text: 'Overhead: "Code Blue, Ward 7... stand down. False alarm."' },
  { icon: '🧹', text: 'Cleaner wheels a mop bucket through Bay 3, whistling.' },
  { icon: '👨‍⚕️', text: 'Intern: "Excuse me, Doctor — quick question about the last patient..."' },
  { icon: '📋', text: 'New GP referral arrives. Triage note says "routine". It is not.' },
  { icon: '🚑', text: 'Two ambulance crews swap notes at the bay doors.' },
  { icon: '📱', text: 'Radiology called — running 15 minutes behind.' },
  { icon: '🍕', text: 'Someone\'s left a pizza box in the staff room. Cold. Still tempting.' },
];

function pickEvent(seed: number): { icon: string; text: string } {
  return HOSPITAL_EVENTS[seed % HOSPITAL_EVENTS.length];
}

export default function BetweenPatientScreen({ lastOutcome, patientNumber, staffMemory, onReady }: Props) {
  const [step, setStep] = useState(0);
  const hospitalEvent = pickEvent(patientNumber * 7 + lastOutcome.xpEarned);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 300),
      setTimeout(() => setStep(2), 900),
      setTimeout(() => setStep(3), 1700),
      setTimeout(() => setStep(4), 2500),
      setTimeout(() => setStep(5), 3300),
      setTimeout(() => setStep(6), 4200),
      setTimeout(() => setStep(7), 5200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const earnedLines = lastOutcome.xpBreakdown.filter(l => l.earned);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-slate-100">
      <div className="w-full max-w-sm space-y-5">

        {/* XP earned panel */}
        {step >= 1 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shift-fade-in">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">
              Case Complete — XP Earned
            </div>
            <div className="space-y-1.5">
              {earnedLines.map((line: XPLine, i: number) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">{line.label}</span>
                  <span className="text-emerald-400 font-bold">+{line.xp}</span>
                </div>
              ))}
              <div className="border-t border-slate-700 pt-2 mt-2 flex justify-between items-center">
                <span className="text-white font-bold text-sm">Total</span>
                <span className="text-emerald-300 font-black text-lg">+{lastOutcome.xpEarned} XP</span>
              </div>
            </div>
          </div>
        )}

        {/* Staff memory */}
        {step >= 2 && staffMemory && (
          <div className="flex gap-2 items-start shift-fade-in">
            <span className="text-xl shrink-0">👩‍⚕️</span>
            <div className="text-sm text-slate-400 italic bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2">
              "{staffMemory}"
            </div>
          </div>
        )}

        {/* Room prep sequence */}
        {step >= 3 && (
          <div className="space-y-1.5 shift-fade-in">
            {ROOM_PREP_SEQUENCE.slice(0, Math.max(0, step - 2)).map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Hospital life event */}
        {step >= 6 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 shift-fade-in">
            <div className="flex gap-2 items-start text-sm text-slate-500">
              <span className="text-lg shrink-0">{hospitalEvent.icon}</span>
              <span className="italic">{hospitalEvent.text}</span>
            </div>
          </div>
        )}

        {/* Nurse incoming */}
        {step >= 7 && (
          <div className="shift-fade-in">
            <div className="flex gap-2 items-start mb-4">
              <span className="text-xl shrink-0">👩‍⚕️</span>
              <div className="bg-blue-950/60 border border-blue-800/50 rounded-xl px-4 py-3">
                <p className="text-sm text-blue-200 font-medium italic">
                  "Doctor... ambulance arriving. Bay 3."
                </p>
              </div>
            </div>
            <button
              onClick={onReady}
              className="w-full py-3.5 bg-blue-700 hover:bg-blue-600 rounded-xl text-white font-bold text-sm tracking-wide transition-colors"
            >
              ▶ Next Patient
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
