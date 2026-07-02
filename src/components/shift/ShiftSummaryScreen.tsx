import type { ShiftLoopMetrics } from '../../types/shiftLoop';
import { buildShiftRating } from '../../types/shiftLoop';

interface Props {
  metrics: ShiftLoopMetrics;
  onViewCareer: () => void;
  onHome: () => void;
}

function getHeadline(metrics: ShiftLoopMetrics): string {
  const { patientsSaved, deaths, outcomes } = metrics;
  const total = outcomes.length;
  if (total === 0) return 'SHIFT COMPLETE';
  if (deaths === 0 && patientsSaved === total) return 'FAULTLESS SHIFT';
  if (deaths === 0) return 'ALL PATIENTS SURVIVED';
  if (patientsSaved > deaths) return `${patientsSaved} SAVED, ${deaths} LOST`;
  if (deaths > patientsSaved) return 'DIFFICULT SHIFT';
  return 'SHIFT COMPLETE';
}

function getDrPatelQuote(metrics: ShiftLoopMetrics): string {
  const { deaths, patientsSaved, outcomes } = metrics;
  const total = outcomes.length;
  if (total === 0) return '"Short one today. See you tomorrow."';
  if (deaths === 0 && patientsSaved === total)
    return '"Excellent work today. Every patient accounted for. Get some rest."';
  if (deaths === 0)
    return '"Good shift. You kept everyone alive. That matters."';
  if (deaths === 1)
    return '"You lost one. That\'s going to stay with you — it should. But you saved the others. Review what happened. Come back tomorrow."';
  return '"Difficult shift. These happen. The debrief is tomorrow. Go home."';
}

function getBestSave(metrics: ShiftLoopMetrics): string | null {
  const best = metrics.outcomes.find(o => o.endingId === 'full-recovery');
  return best ? best.patientName : null;
}

function getBiggestLearning(metrics: ShiftLoopMetrics): string | null {
  const noAllergy = metrics.outcomes.find(o => !o.allergyChecked);
  if (noAllergy) return 'Check allergies before prescribing.';
  const noCultures = metrics.outcomes.find(o => !o.culturesFirst);
  if (noCultures) return 'Blood cultures before antibiotics.';
  const slowAbx = metrics.outcomes.find(o => o.timeToAntibiotics !== null && o.timeToAntibiotics > 80);
  if (slowAbx) return 'Target antibiotics within 60 minutes.';
  return null;
}

function avgAbxTime(metrics: ShiftLoopMetrics): string {
  const times = metrics.outcomes.map(o => o.timeToAntibiotics).filter((t): t is number => t !== null);
  if (times.length === 0) return '—';
  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  return `${avg} min`;
}

export default function ShiftSummaryScreen({ metrics, onViewCareer, onHome }: Props) {
  const rating = buildShiftRating(metrics);
  const headline = getHeadline(metrics);
  const drPatelQuote = getDrPatelQuote(metrics);
  const bestSave = getBestSave(metrics);
  const biggestLearning = getBiggestLearning(metrics);
  const xpGained = metrics.totalXP - metrics.xpAtShiftStart;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start py-10 px-6 text-slate-100">
      <div className="w-full max-w-sm space-y-4">

        {/* Newspaper masthead */}
        <div className="text-center border-b-2 border-slate-400 pb-3">
          <div className="text-[10px] text-slate-500 tracking-[0.4em] uppercase mb-1">
            City General Hospital
          </div>
          <h1 className="font-serif text-2xl font-black tracking-tight text-white uppercase">
            THE SHIFT DISPATCH
          </h1>
          <div className="text-[10px] text-slate-500 mt-1">
            Tuesday · Morning Edition
          </div>
        </div>

        {/* Headline */}
        <div className="text-center border-b border-slate-800 pb-4">
          <h2 className="font-serif text-3xl font-black text-white leading-tight">
            {headline}
          </h2>
          <div className="text-slate-500 text-xs mt-2 italic">
            Morning Shift · Bay 3 · Emergency Department
          </div>
        </div>

        {/* Two-column stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
            <div className="text-3xl font-black text-emerald-400">{metrics.patientsSaved}</div>
            <div className="text-xs text-slate-500 mt-1">Patients Saved</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
            <div className={`text-3xl font-black ${metrics.deaths > 0 ? 'text-red-400' : 'text-slate-600'}`}>
              {metrics.deaths}
            </div>
            <div className="text-xs text-slate-500 mt-1">Deaths</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
            <div className="text-3xl font-black text-blue-400">{avgAbxTime(metrics)}</div>
            <div className="text-xs text-slate-500 mt-1">Avg Antibiotic</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
            <div className={`text-3xl font-black ${
              rating.startsWith('A') ? 'text-emerald-400' :
              rating.startsWith('B') ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {rating}
            </div>
            <div className="text-xs text-slate-500 mt-1">Hospital Rating</div>
          </div>
        </div>

        {/* XP gained */}
        <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-3 text-center">
          <div className="text-xs text-emerald-500 uppercase tracking-wider mb-0.5">XP Earned This Shift</div>
          <div className="text-2xl font-black text-emerald-400">+{xpGained}</div>
        </div>

        {/* Highlights */}
        <div className="space-y-2">
          {bestSave && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
              <div className="text-[10px] text-emerald-500 uppercase tracking-wider mb-1">Best Save</div>
              <div className="text-sm text-slate-200 font-medium">{bestSave}</div>
            </div>
          )}
          {biggestLearning && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
              <div className="text-[10px] text-amber-500 uppercase tracking-wider mb-1">Key Learning</div>
              <div className="text-sm text-slate-200">{biggestLearning}</div>
            </div>
          )}
        </div>

        {/* Dr Patel quote */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <div className="flex gap-3 items-start">
            <span className="text-2xl shrink-0">👨‍⚕️</span>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Dr. Patel</div>
              <p className="text-sm text-slate-200 italic leading-relaxed">{drPatelQuote}</p>
            </div>
          </div>
        </div>

        {/* Tomorrow's shift teaser */}
        <div className="bg-blue-950/40 border border-blue-800/40 rounded-xl px-4 py-3 text-center">
          <div className="text-[10px] text-blue-500 uppercase tracking-wider">Tomorrow</div>
          <div className="text-sm text-slate-300 mt-1">Wednesday · Morning Shift · Available now</div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onViewCareer}
            className="flex-1 py-3.5 bg-blue-700 hover:bg-blue-600 rounded-xl text-white font-bold text-sm transition-colors"
          >
            Career Progress →
          </button>
          <button
            onClick={onHome}
            className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-semibold text-sm transition-colors border border-slate-700"
          >
            Home
          </button>
        </div>

      </div>
    </div>
  );
}
