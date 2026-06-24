import { useState, useEffect } from 'react';
import type { CaseData, GameState, Choice } from '../types/case';
import type { PlayerProfile } from '../types/profile';
import { initGameState, applyChoice, getCurrentNode, computeFinalGrade } from '../engine/caseEngine';
import { computeXPFromGame, addCaseRecord } from '../engine/profileEngine';
import { checkAchievements } from '../engine/achievementEngine';
import PatientPanel from '../components/PatientPanel';
import DecisionCard from '../components/DecisionCard';
import GuidelineDrawer from '../components/GuidelineDrawer';
import InvestigationViewer from '../components/InvestigationViewer';
import CaseSummary from '../components/CaseSummary';

interface Props {
  caseData: CaseData;
  profile: PlayerProfile;
  onHome: () => void;
  onCaseComplete?: (updatedProfile: PlayerProfile, prevLevel: number, newAchievementIds: string[]) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  stabilization: '🚨 Stabilization',
  history: '📋 History & Exam',
  investigation: '🔬 Investigations',
  differential: '🤔 Differential Diagnosis',
  diagnosis: '✅ Diagnosis',
  treatment: '💊 Treatment',
  disposition: '🏥 Disposition',
  monitoring: '📊 Monitoring',
};

export default function CasePlayer({ caseData, profile, onHome, onCaseComplete }: Props) {
  const [gameState, setGameState] = useState<GameState>(() => initGameState(caseData));
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [guidelineOpen, setGuidelineOpen] = useState(false);
  const [investigationsOpen, setInvestigationsOpen] = useState(false);
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);
  const [profileFired, setProfileFired] = useState(false);

  const currentNode = getCurrentNode(gameState, caseData);

  // Fire profile update exactly once when case completes
  useEffect(() => {
    if (!gameState.isComplete || profileFired) return;
    setProfileFired(true);

    const grade = computeFinalGrade(gameState.scores);
    const xpEarned = computeXPFromGame(gameState, grade);
    const prevLevel = profile.level;

    const allWrong = !gameState.history.some(h => !h.correct);
    const consecutiveSafetyHighCases = 0; // simplified — full streak tracking would need profile history
    const newAchievementIds = checkAchievements({
      gameState,
      grade,
      caseId: caseData.id,
      casesCompleted: profile.casesCompleted + 1,
      casesPassed: profile.casesPassed + (grade >= 'C' && grade !== 'F' && grade !== 'D' ? 1 : 0),
      currentLevel: profile.level,
      previousLevel: prevLevel,
      unlockedIds: profile.unlockedAchievementIds,
      consecutiveSafetyHighCases,
      allWrong,
    });

    const record = {
      caseId: caseData.id,
      completedAt: Date.now(),
      grade,
      scores: gameState.scores,
      earnedBadges: gameState.earnedBadges,
      xpEarned,
      passed: ['A', 'B', 'C'].includes(grade),
    };

    const updatedProfile = addCaseRecord(
      { ...profile, unlockedAchievementIds: [...profile.unlockedAchievementIds, ...newAchievementIds] },
      record
    );

    onCaseComplete?.(updatedProfile, prevLevel, newAchievementIds);
  }, [gameState.isComplete]);

  const handleChoiceSelect = (choiceId: string) => {
    if (revealed) return;
    setSelectedChoiceId(choiceId);
    setRevealed(true);
  };

  const handleContinue = () => {
    if (!selectedChoiceId || !currentNode) return;
    const choice = currentNode.choices.find(c => c.id === selectedChoiceId);
    if (!choice) return;
    const newState = applyChoice(gameState, caseData, choice);
    setGameState(newState);
    setSelectedChoiceId(null);
    setRevealed(false);
  };

  const handleRestart = () => {
    setGameState(initGameState(caseData));
    setSelectedChoiceId(null);
    setRevealed(false);
  };

  const selectedChoice: Choice | undefined = currentNode?.choices.find(
    c => c.id === selectedChoiceId
  );

  const investigationCount = gameState.investigations.length;

  if (gameState.isComplete) {
    return (
      <CaseSummary
        caseData={caseData}
        gameState={gameState}
        onRestart={handleRestart}
        onHome={onHome}
      />
    );
  }

  if (!currentNode) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <p>No current node found. Case data may be invalid.</p>
      </div>
    );
  }

  const categoryLabel = CATEGORY_LABELS[currentNode.category] ?? currentNode.category;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      {/* Left sidebar */}
      <aside className="w-72 flex-shrink-0 border-r border-slate-700 p-4 overflow-y-auto">
        <PatientPanel
          vitals={gameState.vitals}
          severity={gameState.severity}
          elapsedMinutes={gameState.elapsedMinutes}
          scores={gameState.scores}
          earnedBadges={gameState.earnedBadges}
          availableBadges={caseData.availableBadges}
          patientName={`${caseData.patient.age}yo ${caseData.patient.sex === 'M' ? 'Male' : 'Female'}`}
        />
      </aside>

      {/* Main game area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-slate-700 bg-slate-900 sticky top-0 z-10">
          <h1 className="text-lg font-semibold text-white truncate max-w-xs">
            {caseData.title}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGuidelineOpen(true)}
              className="px-3 py-1.5 text-sm rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
            >
              📖 Guideline
            </button>
            <button
              onClick={() => setInvestigationsOpen(true)}
              className="relative px-3 py-1.5 text-sm rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
            >
              🧪 Results
              {investigationCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {investigationCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowHomeConfirm(true)}
              className="px-3 py-1.5 text-sm rounded-md bg-slate-700 hover:bg-red-700 text-slate-200 transition-colors"
            >
              🏠 Home
            </button>
          </div>
        </header>

        <div className="flex-1 px-6 py-6 space-y-6 max-w-3xl mx-auto w-full">
          {/* Patient Presentation */}
          <section className="bg-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-base font-semibold text-white">
                {caseData.patient.age}yo {caseData.patient.sex === 'M' ? 'Male' : 'Female'}
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-300 text-sm">{caseData.patient.chiefComplaint}</span>
            </div>

            {/* Initial vitals compact row */}
            <div className="flex flex-wrap gap-2 text-xs text-slate-400">
              {(['hr','bp','rr','spo2','temp'] as const).map(key => {
                const v = caseData.patient.initialVitals[key];
                if (v === undefined) return null;
                const labels: Record<string, string> = { hr: 'HR', bp: 'BP', rr: 'RR', spo2: 'SpO₂', temp: 'T' };
                return (
                  <span key={key} className="bg-slate-700 rounded px-2 py-1">
                    {labels[key]} {String(v)}{key === 'spo2' ? '%' : key === 'temp' ? '°C' : ''}
                  </span>
                );
              })}
            </div>

            {/* Red flags */}
            {caseData.patient.redFlags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {caseData.patient.redFlags.map((flag, i) => (
                  <span key={i} className="text-xs bg-red-900/60 text-red-300 border border-red-700 rounded-full px-2.5 py-0.5">
                    ⚠️ {flag}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Node Section */}
          <section className="space-y-4">
            <span className="inline-block text-xs font-semibold bg-slate-700 text-slate-300 rounded-full px-3 py-1">
              {categoryLabel}
            </span>

            {currentNode.context && (
              <div className="bg-slate-800 rounded-lg px-4 py-3">
                <p className="text-slate-300 text-sm italic leading-relaxed">{currentNode.context}</p>
              </div>
            )}

            <p className="text-white text-xl font-semibold leading-snug">
              {currentNode.prompt}
            </p>
          </section>

          {/* Choices */}
          <section className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentNode.choices.map(choice => (
                <DecisionCard
                  key={choice.id}
                  choice={choice}
                  selected={selectedChoiceId === choice.id}
                  revealed={revealed}
                  onSelect={() => handleChoiceSelect(choice.id)}
                  disabled={revealed && selectedChoiceId !== choice.id}
                />
              ))}
            </div>

            {/* Feedback block */}
            {revealed && selectedChoice && (
              <div className={`rounded-xl p-4 border ${
                selectedChoice.correct
                  ? 'bg-green-900/40 border-green-600 text-green-200'
                  : 'bg-red-900/40 border-red-600 text-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{selectedChoice.correct ? '✅' : '❌'}</span>
                  <span className="font-semibold text-sm">
                    {selectedChoice.correct ? 'Correct' : 'Incorrect'}
                  </span>
                  {selectedChoice.scoreDelta && (
                    <span className={`ml-auto text-xs font-bold ${
                      (selectedChoice.scoreDelta.diagnostic ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {(selectedChoice.scoreDelta.diagnostic ?? 0) >= 0 ? '+' : ''}
                      {selectedChoice.scoreDelta.diagnostic ?? 0} diag
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed">{selectedChoice.feedback}</p>
                {selectedChoice.educationalNote && (
                  <p className="mt-2 text-xs italic text-blue-300 border-t border-blue-800/50 pt-2">
                    💡 {selectedChoice.educationalNote}
                  </p>
                )}
              </div>
            )}

            {revealed && (
              <div className="flex justify-end">
                <button
                  onClick={handleContinue}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors text-sm"
                >
                  Continue →
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Guideline Drawer */}
      <GuidelineDrawer
        content={caseData.guideline}
        isOpen={guidelineOpen}
        onClose={() => setGuidelineOpen(false)}
      />

      {/* Investigation Viewer */}
      <InvestigationViewer
        investigations={gameState.investigations}
        isOpen={investigationsOpen}
        onClose={() => setInvestigationsOpen(false)}
      />

      {/* Home Confirm Dialog */}
      {showHomeConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full mx-4 border border-slate-600 shadow-2xl">
            <h2 className="text-white font-semibold text-lg mb-2">Leave this case?</h2>
            <p className="text-slate-400 text-sm mb-6">Your progress will be lost.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowHomeConfirm(false)}
                className="px-4 py-2 text-sm rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
              >
                Stay
              </button>
              <button
                onClick={() => { setShowHomeConfirm(false); onHome(); }}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors"
              >
                Leave Case
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
