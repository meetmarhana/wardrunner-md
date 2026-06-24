import type { ShiftScenario } from '../types/shift';
import type { BestShiftRecord } from '../types/shift';

const ACUITY_COLOR: Record<number, string> = {
  1: 'bg-red-600 text-white',
  2: 'bg-orange-500 text-white',
  3: 'bg-yellow-500 text-black',
};

const GRADE_COLOR: Record<string, string> = {
  S: 'text-yellow-300',
  A: 'text-green-400',
  B: 'text-blue-400',
  C: 'text-slate-300',
  D: 'text-orange-400',
  F: 'text-red-400',
};

interface Props {
  scenario: ShiftScenario;
  bestShift: BestShiftRecord | null;
  onStart: () => void;
  onBack: () => void;
}

export default function ShiftBriefing({ scenario, bestShift, onStart, onBack }: Props) {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors text-sm">
          ← Home
        </button>
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">ED Handover</span>
        <div className="w-16" />
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-10 space-y-7">

        {/* Title */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">🌙</span>
            <h1 className="text-3xl font-extrabold text-white">Night Shift Handover</h1>
          </div>
          <p className="text-slate-400 text-sm ml-12">St. Mercy Hospital — Emergency Department — 19:00</p>
        </div>

        {/* Hospital status */}
        <div className="bg-amber-900/30 border border-amber-700/50 rounded-xl px-5 py-4 flex gap-4 items-start">
          <span className="text-2xl">⚠️</span>
          <div>
            <div className="font-semibold text-amber-300 text-sm">Status: BUSY — 4 patients awaiting assessment</div>
            <div className="text-amber-200/70 text-xs mt-1">
              You are the registrar on call. No senior cover for 2 hours. Make every minute count.
            </div>
          </div>
        </div>

        {/* Patient list */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Current Patients</div>
          <div className="space-y-2">
            {scenario.patients.map(p => (
              <div key={p.id} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex items-center gap-4">
                <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${ACUITY_COLOR[p.acuity]}`}>
                  P{p.acuity}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm">{p.name} — <span className="text-slate-400 font-normal">Bed {p.bedNumber}</span></div>
                  <div className="text-slate-400 text-xs truncate">{p.chiefComplaint}</div>
                </div>
                <div className="text-right shrink-0">
                  {['95/60','82/50','108/72','165/95'].at(p.bedNumber - 1) && (
                    <div className="text-xs text-slate-500">BP {p.vitals.bp} · HR {p.vitals.hr}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rules of engagement */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-5 py-4 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">How This Works</div>
          <div className="space-y-2 text-sm">
            {[
              { icon: '⏱️', text: 'Time advances after every action — neglected patients deteriorate.' },
              { icon: '⚠️', text: 'Acuity is NOT the same as time-to-deterioration. The quieter patient may crash first.' },
              { icon: '🔗', text: 'Some actions are locked until prerequisites are completed.' },
              { icon: '💀', text: 'Wrong treatments can harm or kill — read the feedback carefully.' },
              { icon: '🎯', text: 'Objective: save as many patients as possible before the shift ends.' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex gap-3 items-start">
                <span className="text-base shrink-0">{icon}</span>
                <span className="text-slate-300">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Best shift record */}
        {bestShift ? (
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl px-5 py-3 flex items-center justify-between">
            <div className="text-sm text-slate-400">Your best shift</div>
            <div className="flex items-center gap-4 text-sm">
              <span className={`text-xl font-extrabold ${GRADE_COLOR[bestShift.grade]}`}>{bestShift.grade}</span>
              <span className="text-slate-300">{bestShift.saved}/4 saved</span>
              <span className="text-amber-400 font-semibold">+{bestShift.xpEarned} XP</span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl px-5 py-3 text-center text-slate-500 text-sm">
            No shift records yet — this is your first.
          </div>
        )}

        {/* Start button */}
        <button
          onClick={onStart}
          className="w-full py-4 bg-red-700 hover:bg-red-600 text-white font-bold rounded-xl text-lg transition-colors shadow-lg shadow-red-900/40"
        >
          🌙 Start Night Shift
        </button>
      </div>
    </div>
  );
}
