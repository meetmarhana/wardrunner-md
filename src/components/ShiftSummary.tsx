import type { ShiftState, ShiftResult, ShiftGrade } from '../types/shift';
import type { PearlRecord } from '../data/nightShift/scenarios';
import { formatShiftTime } from '../engine/shiftEngine';
import Disclaimer from './Disclaimer';

const GRADE_CONFIG: Record<ShiftGrade, { label: string; color: string; bg: string; message: string }> = {
  S: { label: 'S', color: 'text-yellow-300', bg: 'bg-yellow-900/30 border-yellow-600', message: 'Outstanding. All patients saved. Flawless triage and management.' },
  A: { label: 'A', color: 'text-green-400',  bg: 'bg-green-900/30 border-green-600',  message: 'Excellent work. Strong clinical reasoning and prioritisation.' },
  B: { label: 'B', color: 'text-blue-400',   bg: 'bg-blue-900/30 border-blue-600',   message: 'Good performance. Some delays or suboptimal decisions, but solid overall.' },
  C: { label: 'C', color: 'text-slate-300',  bg: 'bg-slate-700/50 border-slate-600',  message: 'Adequate. Significant gaps in prioritisation or management. Review the pearls below.' },
  D: { label: 'D', color: 'text-orange-400', bg: 'bg-orange-900/30 border-orange-700', message: 'Poor performance. Patients suffered from delays and wrong actions.' },
  F: { label: 'F', color: 'text-red-400',    bg: 'bg-red-900/30 border-red-700',    message: 'Critical failure. Review the teaching points carefully.' },
};

const SCORE_LABEL: Record<string, string> = {
  triage:    'Triage',
  safety:    'Safety',
  guideline: 'Guideline',
  time:      'Time',
  triageScore: 'Triage Order',
};

interface Props {
  shiftState: ShiftState;
  result: ShiftResult;
  pearls: PearlRecord;
  onReplay: () => void;
  onChooseAnother: () => void;
  onHome: () => void;
}

export default function ShiftSummary({ shiftState, result, pearls, onReplay, onChooseAnother, onHome }: Props) {
  const gc = GRADE_CONFIG[result.grade];
  const totalTime = shiftState.currentTime;

  const bestSave = shiftState.patients.find(
    p => p.outcome === 'saved' && p.deteriorationStepIndex > 0
  );
  const firstDeath = shiftState.patients.find(p => p.outcome === 'dead');
  const neverTouched = shiftState.patients.filter(p => p.firstActionAt === undefined && p.outcome !== 'pending');

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-2xl mx-auto px-5 py-10 space-y-7">

        {/* Grade banner */}
        <div className={`rounded-2xl border p-6 text-center ${gc.bg}`}>
          <div className={`text-7xl font-extrabold ${gc.color}`}>{gc.label}</div>
          <p className="text-slate-300 mt-2 text-sm">{gc.message}</p>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <span className="text-slate-400">Shift duration: <strong className="text-white">{formatShiftTime(totalTime)}</strong></span>
            <span className="text-slate-400">Patients: <strong className="text-white">{result.saved} saved · {result.harmed} harmed · {result.dead} died</strong></span>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="bg-slate-800 rounded-xl p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">Score Breakdown</div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {(['triage','safety','guideline','time'] as const).map(k => {
              const val = result.score[k];
              const color = val >= 75 ? 'text-green-400' : val >= 50 ? 'text-yellow-400' : 'text-red-400';
              return (
                <div key={k} className="bg-slate-700/50 rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-500 mb-1">{SCORE_LABEL[k]}</div>
                  <div className={`text-2xl font-bold ${color}`}>{val}</div>
                </div>
              );
            })}
            <div className="bg-slate-700/50 rounded-lg p-3 text-center">
              <div className="text-xs text-slate-500 mb-1">Triage Order</div>
              <div className={`text-2xl font-bold ${result.triageScore >= 75 ? 'text-green-400' : result.triageScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                {result.triageScore}
              </div>
            </div>
            <div className="bg-slate-700/80 rounded-lg p-3 text-center col-span-1">
              <div className="text-xs text-slate-500 mb-1">Overall</div>
              <div className={`text-2xl font-bold ${gc.color}`}>{result.score.overall}</div>
            </div>
          </div>
          {/* Triage order explanation */}
          <div className="bg-slate-700/30 rounded-lg px-4 py-3 text-xs text-slate-400">
            <span className="text-slate-300 font-semibold">Optimal triage order: </span>
            Sarah (Sepsis, 20 min) → Ray (STEMI, 25 min) → Marcus (Dissection, 30 min) → Amara (DKA, 45 min).
            Triage score rewards treating the most time-critical patients first.
          </div>
        </div>

        {/* Highlights */}
        {(bestSave || firstDeath || neverTouched.length > 0) && (
          <div className="grid grid-cols-1 gap-3">
            {bestSave && (
              <div className="bg-green-900/20 border border-green-700/40 rounded-xl px-4 py-3 flex gap-3 items-center text-sm">
                <span className="text-2xl">💚</span>
                <div>
                  <span className="text-green-300 font-semibold">Best Save: </span>
                  <span className="text-slate-300">{bestSave.name} — saved despite deteriorating during the shift.</span>
                </div>
              </div>
            )}
            {firstDeath && (
              <div className="bg-red-900/20 border border-red-700/40 rounded-xl px-4 py-3 flex gap-3 items-center text-sm">
                <span className="text-2xl">💔</span>
                <div>
                  <span className="text-red-300 font-semibold">First Loss: </span>
                  <span className="text-slate-300">{firstDeath.name} — first patient to deteriorate without timely intervention.</span>
                </div>
              </div>
            )}
            {neverTouched.length > 0 && (
              <div className="bg-orange-900/20 border border-orange-700/40 rounded-xl px-4 py-3 flex gap-3 items-center text-sm">
                <span className="text-2xl">⏳</span>
                <div>
                  <span className="text-orange-300 font-semibold">Never assessed: </span>
                  <span className="text-slate-300">{neverTouched.map(p => p.name).join(', ')}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* XP earned */}
        <div className="bg-amber-900/30 border border-amber-700/50 rounded-xl px-5 py-4 flex items-center justify-between">
          <div>
            <div className="text-amber-300 font-bold text-xl">+{result.xpEarned} XP</div>
            <div className="text-slate-400 text-xs mt-0.5">Added to your profile</div>
          </div>
          {result.newAchievementIds.length > 0 && (
            <div className="text-right">
              <div className="text-xs text-slate-500 mb-1">New achievements</div>
              <div className="flex flex-wrap gap-1.5 justify-end">
                {result.newAchievementIds.map(id => (
                  <span key={id} className="text-xs bg-amber-900/50 text-amber-300 border border-amber-700/50 px-2 py-0.5 rounded-full">
                    🏆 {id.replace(/night-shift-/g, '').replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Patient-by-patient breakdown */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Patient Breakdown &amp; Teaching</div>
          <div className="space-y-4">
            {shiftState.patients.map(p => {
              const pearl = pearls[p.id];
              const outcomeIcon  = p.outcome === 'saved' ? '✅' : p.outcome === 'harmed' ? '⚠️' : '☠️';
              const outcomeColor = p.outcome === 'saved' ? 'border-green-700/40 bg-green-900/10'
                                 : p.outcome === 'harmed' ? 'border-yellow-700/40 bg-yellow-900/10'
                                 : 'border-red-700/40 bg-red-900/10';
              const avg = Math.round((p.score.triage + p.score.safety + p.score.guideline + p.score.time) / 4);
              const actionsPerformed = p.completedActionIds.map(
                id => p.availableActions.find(a => a.id === id)?.label ?? id
              );

              return (
                <div key={p.id} className={`rounded-xl border p-5 space-y-3 ${outcomeColor}`}>
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white">{p.name}</span>
                      <span className="text-slate-400 text-sm ml-2">Bed {p.bedNumber}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-slate-400">Score: <strong className="text-white">{avg}</strong></span>
                      <span className="font-bold">{outcomeIcon} {p.outcome.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <div className="text-xs text-slate-400">
                    <span className="text-slate-300 font-semibold">Diagnosis: </span>{pearl?.diagnosis}
                  </div>

                  {/* Actions taken */}
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Actions you took:</div>
                    {actionsPerformed.length === 0 ? (
                      <span className="text-xs text-red-400 italic">None — patient was never assessed.</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {actionsPerformed.map((label, i) => {
                          const action = p.availableActions.find(a => a.label === label);
                          const isDangerous = action?.effect.isDangerous;
                          const isCorrect   = action?.effect.isCorrect;
                          return (
                            <span key={i} className={`text-xs px-2 py-0.5 rounded border ${
                              isDangerous ? 'bg-red-900/40 text-red-300 border-red-700/50' :
                              isCorrect   ? 'bg-green-900/30 text-green-300 border-green-700/50' :
                              'bg-slate-700/50 text-slate-400 border-slate-600/50'
                            }`}>
                              {label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Key actions */}
                  {pearl && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Optimal management:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {pearl.keyActions.map((a, i) => (
                          <span key={i} className="text-xs bg-blue-900/30 text-blue-300 border border-blue-700/40 px-2 py-0.5 rounded">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Teaching pearl */}
                  {pearl && (
                    <div className="bg-slate-800/60 rounded-lg px-3 py-2.5 text-xs text-slate-300 leading-relaxed border-l-2 border-blue-500">
                      <span className="text-blue-400 font-semibold">💡 Pearl: </span>{pearl.pearl}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Disclaimer compact className="mb-4" />

        {/* Actions */}
        <div className="flex gap-3 pb-8">
          <button
            onClick={onReplay}
            className="flex-1 py-3 bg-red-700 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
          >
            🔄 Try Again
          </button>
          <button
            onClick={onChooseAnother}
            className="flex-1 py-3 bg-blue-700 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
          >
            📋 Choose Shift
          </button>
          <button
            onClick={onHome}
            className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors"
          >
            🏥 Home
          </button>
        </div>
      </div>
    </div>
  );
}
