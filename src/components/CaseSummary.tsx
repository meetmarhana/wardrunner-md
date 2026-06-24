import { useState } from 'react';
import type { CaseData, GameState, DecisionCategory } from '../types/case';
import { computeFinalGrade } from '../engine/caseEngine';

interface Props {
  caseData: CaseData;
  gameState: GameState;
  onRestart: () => void;
  onHome: () => void;
}

// ─── Grade helpers ────────────────────────────────────────────────────────────

const gradeColor: Record<string, string> = {
  A: 'bg-green-500 text-white',
  B: 'bg-blue-500 text-white',
  C: 'bg-yellow-500 text-black',
  D: 'bg-orange-500 text-white',
  F: 'bg-red-600 text-white',
};

const gradeRing: Record<string, string> = {
  A: 'ring-green-500',
  B: 'ring-blue-500',
  C: 'ring-yellow-500',
  D: 'ring-orange-500',
  F: 'ring-red-600',
};

// ─── Score card ───────────────────────────────────────────────────────────────

interface ScoreCardProps {
  label: string;
  value: number;
}

function ScoreCard({ label, value }: ScoreCardProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const barColor =
    clamped >= 80
      ? 'bg-green-500'
      : clamped >= 60
      ? 'bg-blue-500'
      : clamped >= 40
      ? 'bg-yellow-500'
      : clamped >= 20
      ? 'bg-orange-500'
      : 'bg-red-600';

  return (
    <div className="flex-1 min-w-0 bg-slate-800 rounded-xl p-4 flex flex-col gap-2">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
        {label}
      </span>
      <span className="text-3xl font-bold text-white leading-none">{clamped}</span>
      <span className="text-xs text-slate-500">/100</span>
      <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

// ─── Category label map ───────────────────────────────────────────────────────

const categoryLabel: Record<DecisionCategory, string> = {
  stabilization: 'Stabilisation',
  history: 'History',
  investigation: 'Investigation',
  differential: 'Differential',
  diagnosis: 'Diagnosis',
  treatment: 'Treatment',
  disposition: 'Disposition',
  monitoring: 'Monitoring',
};

// ─── Disease map section ──────────────────────────────────────────────────────

interface DiseaseMapCardProps {
  icon: string;
  title: string;
  content: string | string[];
}

function DiseaseMapCard({ icon, title, content }: DiseaseMapCardProps) {
  const items = Array.isArray(content) ? content : [content];
  return (
    <div className="flex-shrink-0 w-52 bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col gap-2 snap-start">
      <div className="text-2xl">{icon}</div>
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</h4>
      <ul className="flex flex-col gap-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-slate-200 leading-snug">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CaseSummary({ caseData, gameState, onRestart, onHome }: Props) {
  const [historyOpen, setHistoryOpen] = useState(false);

  const grade = computeFinalGrade(gameState.scores);
  const { scores, history, earnedBadges } = gameState;
  const { diseaseMap, availableBadges, patient } = caseData;

  const earnedBadgeObjects = availableBadges.filter((b) => earnedBadges.includes(b.id));

  return (
    <div className="bg-slate-900 min-h-screen text-white">
      <div className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-8">

        {/* ── 1. HEADER ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1 flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Case Complete
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              {caseData.title}
            </h1>
            <p className="text-slate-400 text-sm">{caseData.subtitle}</p>
            <p className="text-slate-300 text-sm mt-1">
              {patient.age}yo {patient.sex === 'M' ? 'Male' : 'Female'} —{' '}
              <span className="italic">{patient.chiefComplaint}</span>
            </p>
          </div>

          {/* Grade badge */}
          <div
            className={`w-24 h-24 rounded-2xl ring-4 flex flex-col items-center justify-center flex-shrink-0 ${gradeColor[grade] ?? 'bg-slate-600 text-white'} ${gradeRing[grade] ?? 'ring-slate-600'}`}
          >
            <span className="text-5xl font-black leading-none">{grade}</span>
            <span className="text-xs font-semibold mt-1 opacity-80">Grade</span>
          </div>
        </div>

        {/* ── 2. SCORES ROW ─────────────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Performance Scores
          </h2>
          <div className="flex gap-3 flex-wrap sm:flex-nowrap">
            <ScoreCard label="Diagnostic" value={scores.diagnostic} />
            <ScoreCard label="Safety" value={scores.safety} />
            <ScoreCard label="Time" value={scores.time} />
            <ScoreCard label="Cost" value={scores.cost} />
            <ScoreCard label="Guideline" value={scores.guideline} />
          </div>
        </div>

        {/* ── 3. EARNED BADGES ──────────────────────────────────────────── */}
        {earnedBadgeObjects.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Earned Badges
            </h2>
            <div className="flex flex-wrap gap-2">
              {earnedBadgeObjects.map((badge) => (
                <div
                  key={badge.id}
                  title={badge.description}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                    badge.positive
                      ? 'bg-green-900/60 text-green-300 border border-green-700'
                      : 'bg-red-900/60 text-red-300 border border-red-700'
                  }`}
                >
                  <span>{badge.icon}</span>
                  <span>{badge.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 4. DECISION HISTORY ───────────────────────────────────────── */}
        <div>
          <button
            onClick={() => setHistoryOpen((o) => !o)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider hover:text-white transition-colors"
          >
            <span>{historyOpen ? '▾' : '▸'}</span>
            Decision History ({history.length})
          </button>

          {historyOpen && (
            <ul className="mt-3 flex flex-col gap-2">
              {history.map((entry, i) => (
                <li
                  key={i}
                  className={`flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 p-4 rounded-xl border ${
                    entry.correct
                      ? 'bg-green-950/40 border-green-800'
                      : 'bg-red-950/40 border-red-800'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-lg font-bold ${
                        entry.correct ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {entry.correct ? '✓' : '✗'}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        entry.correct
                          ? 'bg-green-800 text-green-200'
                          : 'bg-red-800 text-red-200'
                      }`}
                    >
                      {categoryLabel[entry.category] ?? entry.category}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-snug">{entry.feedback}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── 5. DISEASE MAP ────────────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Disease Map
          </h2>
          {/* Horizontal scrollable timeline */}
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            <DiseaseMapCard icon="🩺" title="Presenting Symptoms" content={diseaseMap.presenting} />
            <DiseaseMapCard icon="🚩" title="Red Flags" content={diseaseMap.redFlags} />
            <DiseaseMapCard icon="⚡" title="Best First Step" content={diseaseMap.bestFirstStep} />
            <DiseaseMapCard icon="🔬" title="Best Investigation" content={diseaseMap.bestInvestigation} />
            <DiseaseMapCard icon="✅" title="Diagnosis" content={diseaseMap.diagnosis} />
            <DiseaseMapCard icon="💊" title="Treatment" content={diseaseMap.treatment} />
            <DiseaseMapCard icon="📅" title="Follow-Up" content={diseaseMap.followUp} />
            <DiseaseMapCard icon="⚠️" title="Complications" content={diseaseMap.complications} />
          </div>
        </div>

        {/* ── 6. GUIDELINE REF ──────────────────────────────────────────── */}
        {diseaseMap.guidelineRef && (
          <div className="flex items-start gap-3 bg-slate-800 border border-slate-700 rounded-xl p-4">
            <span className="text-lg flex-shrink-0">📖</span>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Guideline Reference
              </span>
              <p className="text-sm text-slate-300">{diseaseMap.guidelineRef}</p>
            </div>
          </div>
        )}

        {/* ── 7. DISCLAIMER ─────────────────────────────────────────────── */}
        {caseData.disclaimer && (
          <div className="border border-amber-600 bg-amber-950/40 rounded-xl p-4 flex gap-3">
            <span className="text-lg flex-shrink-0">⚠️</span>
            <p className="text-sm text-amber-200 leading-relaxed">{caseData.disclaimer}</p>
          </div>
        )}

        {/* ── 8. BUTTONS ────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onRestart}
            className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            Restart Case
          </button>
          <button
            onClick={onHome}
            className="flex-1 py-3 px-6 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-white font-semibold rounded-xl transition-colors"
          >
            Back to Home
          </button>
        </div>

      </div>
    </div>
  );
}
