import { useState, useEffect } from 'react';
import {
  getCareerLevel,
  getNextThreshold,
  CAREER_THRESHOLDS,
} from '../../types/shiftLoop';

interface Props {
  xpBefore: number;
  xpAfter: number;
  onHome: () => void;
}

export default function CareerProgressScreen({ xpBefore, xpAfter, onHome }: Props) {
  const [displayXP, setDisplayXP] = useState(xpBefore);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [step, setStep] = useState(0);

  const levelBefore = getCareerLevel(xpBefore);
  const levelAfter  = getCareerLevel(xpAfter);
  const didLevelUp  = levelBefore !== levelAfter;

  const next = getNextThreshold(xpAfter);
  const current = CAREER_THRESHOLDS.findLast(t => t.xp <= xpAfter) ?? CAREER_THRESHOLDS[0];
  const progressPct = next
    ? Math.min(100, Math.round(((xpAfter - current.xp) / (next.xp - current.xp)) * 100))
    : 100;

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 400);
    const t2 = setTimeout(() => {
      // Animate XP counter
      const gap = xpAfter - xpBefore;
      const steps = 30;
      const interval = 1200 / steps;
      let i = 0;
      const timer = setInterval(() => {
        i++;
        setDisplayXP(Math.round(xpBefore + (gap * i) / steps));
        if (i >= steps) {
          clearInterval(timer);
          setDisplayXP(xpAfter);
          if (didLevelUp) setTimeout(() => setShowLevelUp(true), 300);
        }
      }, interval);
      return () => clearInterval(timer);
    }, 600);
    const t3 = setTimeout(() => setStep(2), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [xpBefore, xpAfter, didLevelUp]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-slate-100">
      <div className="w-full max-w-sm space-y-6">

        {/* Header */}
        <div className="text-center shift-fade-in">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Shift Complete</div>
          <h1 className="text-2xl font-black text-white mt-1">Career Progress</h1>
        </div>

        {/* Level display */}
        {step >= 1 && (
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 text-center shift-fade-in">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Current Role</div>
            <div className="text-2xl font-black text-white">{levelAfter}</div>
            <div className="text-sm text-slate-500 mt-1">{displayXP.toLocaleString()} XP</div>

            {/* XP progress bar */}
            <div className="mt-4">
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              {next && (
                <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                  <span>{current.level}</span>
                  <span>{next.level} at {next.xp.toLocaleString()} XP</span>
                </div>
              )}
              {!next && (
                <div className="text-[10px] text-amber-500 mt-1 text-center">
                  Maximum level reached
                </div>
              )}
            </div>
          </div>
        )}

        {/* Level up announcement */}
        {showLevelUp && (
          <div className="bg-emerald-950/50 border-2 border-emerald-700/60 rounded-xl p-5 text-center shift-fade-in">
            <div className="text-3xl mb-2">🎓</div>
            <div className="text-xs text-emerald-400 uppercase tracking-wider font-bold mb-1">
              Level Up
            </div>
            <div className="text-lg font-black text-white">{levelBefore}</div>
            <div className="text-slate-500 text-sm my-1">→</div>
            <div className="text-xl font-black text-emerald-300">{levelAfter}</div>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              New responsibilities unlocked. Dr. Patel expects more from you now.
            </p>
          </div>
        )}

        {/* XP gained this shift */}
        {step >= 2 && (
          <div className="text-center shift-fade-in">
            <div className="text-xs text-slate-600">
              +{(xpAfter - xpBefore).toLocaleString()} XP earned this shift
            </div>
          </div>
        )}

        {/* Home button */}
        {step >= 2 && (
          <div className="shift-fade-in">
            <button
              onClick={onHome}
              className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-bold text-sm transition-colors border border-slate-700"
            >
              Return Home
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
