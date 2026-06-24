import type { ShiftScenario, BestShiftRecord, ShiftGrade } from '../types/shift';

const DIFFICULTY_STYLE: Record<ShiftScenario['difficulty'], { label: string; classes: string }> = {
  beginner:     { label: 'Beginner',     classes: 'bg-green-900/40 text-green-300 border-green-700/50' },
  intermediate: { label: 'Intermediate', classes: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50' },
  advanced:     { label: 'Advanced',     classes: 'bg-red-900/40 text-red-300 border-red-700/50' },
};

const GRADE_COLOR: Record<ShiftGrade, string> = {
  S: 'text-yellow-300',
  A: 'text-green-400',
  B: 'text-blue-400',
  C: 'text-slate-300',
  D: 'text-orange-400',
  F: 'text-red-400',
};

const SETTING_ICON: Record<string, string> = {
  'Emergency Department':          '🚨',
  'Medical/Surgical ICU':          '🫁',
  'General Medical & Surgical Wards': '🏥',
};

interface Props {
  scenarios: ShiftScenario[];
  getBestShift: (scenarioId: string) => BestShiftRecord | null;
  onSelect: (scenario: ShiftScenario) => void;
  onBack: () => void;
}

export default function ScenarioSelector({ scenarios, getBestShift, onSelect, onBack }: Props) {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors text-sm">
          ← Home
        </button>
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Night Shift</span>
        <div className="w-16" />
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-10 space-y-6">

        {/* Title */}
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-1">Choose Your Shift</h1>
          <p className="text-slate-400 text-sm">Each scenario teaches different clinical skills. Pick one to begin.</p>
        </div>

        {/* Scenario cards */}
        <div className="space-y-4">
          {scenarios.map((scenario, index) => {
            const best = getBestShift(scenario.id);
            const diff = DIFFICULTY_STYLE[scenario.difficulty];
            const icon = SETTING_ICON[scenario.setting] ?? '🏥';

            return (
              <button
                key={scenario.id}
                onClick={() => onSelect(scenario)}
                className="w-full text-left bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 rounded-2xl p-5 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Scenario number + title */}
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-slate-500 text-sm font-bold">#{index + 1}</span>
                      <span className="text-lg">{icon}</span>
                      <h2 className="font-bold text-white text-base leading-tight">{scenario.name}</h2>
                    </div>

                    {/* Setting + difficulty */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-xs text-slate-400 bg-slate-700/60 px-2.5 py-0.5 rounded-full">
                        {scenario.setting}
                      </span>
                      <span className={`text-xs font-semibold border px-2.5 py-0.5 rounded-full ${diff.classes}`}>
                        {diff.label}
                      </span>
                      <span className="text-xs text-slate-400 bg-slate-700/60 px-2.5 py-0.5 rounded-full">
                        ~{scenario.estimatedMinutes} min
                      </span>
                      <span className="text-xs text-slate-400 bg-slate-700/60 px-2.5 py-0.5 rounded-full">
                        {scenario.patients.length} patients
                      </span>
                    </div>

                    {/* Teaching focus */}
                    <p className="text-sm text-slate-300 leading-snug">{scenario.teachingFocus}</p>
                  </div>

                  {/* Best shift record */}
                  <div className="shrink-0 text-right min-w-[80px]">
                    {best ? (
                      <div>
                        <div className={`text-3xl font-extrabold ${GRADE_COLOR[best.grade]}`}>{best.grade}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{best.saved}/{scenario.patients.length} saved</div>
                        <div className="text-xs text-amber-400">+{best.xpEarned} XP</div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="text-2xl text-slate-600">—</div>
                        <div className="text-xs text-slate-600 mt-0.5">Not played</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="h-px flex-1 bg-slate-700 group-hover:bg-slate-600 transition-colors" />
                  <span className="text-xs font-bold text-red-400 group-hover:text-red-300 ml-4 transition-colors uppercase tracking-wider">
                    {best ? 'Play Again →' : 'Start Shift →'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Completion progress */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Progress</div>
          <div className="flex items-center gap-3">
            {scenarios.map(s => {
              const best = getBestShift(s.id);
              return (
                <div key={s.id} className="flex-1 text-center">
                  <div className={`text-lg font-bold ${best ? (GRADE_COLOR[best.grade]) : 'text-slate-700'}`}>
                    {best ? best.grade : '?'}
                  </div>
                  <div className="text-xs text-slate-600 truncate">{s.name.split('—')[0].trim()}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-xs text-slate-500 text-center">
            {scenarios.filter(s => getBestShift(s.id) !== null).length} / {scenarios.length} scenarios completed
          </div>
        </div>
      </div>
    </div>
  );
}
