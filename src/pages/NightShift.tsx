import { useState, useRef, useEffect } from 'react';
import type { ShiftState, ShiftPatient, ShiftAction, PatientStatus, UrgencyLevel, ShiftScenario } from '../types/shift';
import type { PlayerProfile } from '../types/profile';
import {
  initShiftState, applyShiftAction, selectShiftPatient,
  getAvailableActions, computeShiftResult, formatShiftTime,
  getUrgencyLevel, loadBestShift, saveBestShift,
} from '../engine/shiftEngine';
import { ALL_SCENARIOS, getPearls } from '../data/nightShift/scenarios';
import { loadProfile, saveProfile, getLevelForXP } from '../engine/profileEngine';
import ScenarioSelector from '../components/ScenarioSelector';
import ShiftBriefing from '../components/ShiftBriefing';
import ShiftSummary from '../components/ShiftSummary';

interface Props {
  profile: PlayerProfile;
  onHome: () => void;
  onShiftComplete?: (updatedProfile: PlayerProfile) => void;
}

type ShiftPhase = 'selecting' | 'briefing' | 'playing' | 'complete';

// ─── Styling constants ────────────────────────────────────────────────────────

const STATUS_STYLE: Record<PatientStatus, { label: string; classes: string }> = {
  stable:        { label: 'Stable',        classes: 'bg-green-900/60 text-green-300 border-green-700' },
  improving:     { label: 'Improving',     classes: 'bg-emerald-900/60 text-emerald-300 border-emerald-700' },
  deteriorating: { label: 'Deteriorating', classes: 'bg-yellow-900/60 text-yellow-300 border-yellow-700' },
  critical:      { label: 'CRITICAL',      classes: 'bg-red-900/70 text-red-300 border-red-500' },
  discharged:    { label: 'Discharged',    classes: 'bg-slate-700/60 text-slate-300 border-slate-600' },
  admitted:      { label: 'Admitted',      classes: 'bg-blue-900/60 text-blue-300 border-blue-700' },
  icu:           { label: 'ICU',           classes: 'bg-purple-900/60 text-purple-300 border-purple-700' },
  or:            { label: '🔪 OR',         classes: 'bg-orange-900/60 text-orange-300 border-orange-700' },
  'cath-lab':    { label: 'Cath Lab',      classes: 'bg-pink-900/60 text-pink-300 border-pink-700' },
  dead:          { label: '☠ Deceased',    classes: 'bg-slate-800/80 text-slate-500 border-slate-600' },
};

const ACUITY_COLOR: Record<number, string> = {
  1: 'bg-red-600 text-white',
  2: 'bg-orange-500 text-white',
  3: 'bg-yellow-500 text-black',
};

const CATEGORY_STYLE: Record<ShiftAction['category'], { label: string; color: string }> = {
  assessment:    { label: 'Assessment',    color: 'border-orange-600 text-orange-300 hover:bg-orange-900/30' },
  investigation: { label: 'Investigation', color: 'border-blue-600 text-blue-300 hover:bg-blue-900/30' },
  treatment:     { label: 'Treatment',     color: 'border-green-600 text-green-300 hover:bg-green-900/30' },
  disposition:   { label: 'Disposition',   color: 'border-purple-600 text-purple-300 hover:bg-purple-900/30' },
};

const URGENCY_BORDER: Record<UrgencyLevel, string> = {
  ok:       '',
  warning:  'ring-1 ring-yellow-500/50',
  danger:   'ring-2 ring-orange-500/70',
  imminent: 'ring-2 ring-red-500 animate-pulse',
};

// ─── Bed Card ────────────────────────────────────────────────────────────────

function BedCard({ patient, selected, urgency, onClick, flash }: {
  patient: ShiftPatient;
  selected: boolean;
  urgency: UrgencyLevel;
  onClick: () => void;
  flash: 'saved' | 'dead' | 'harmed' | null;
}) {
  const ss = STATUS_STYLE[patient.status];
  const isDone = patient.outcome !== 'pending';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-3 transition-all relative overflow-hidden ${
        selected
          ? 'border-blue-400 bg-blue-900/20 shadow-lg shadow-blue-900/30'
          : isDone
          ? 'border-slate-700 bg-slate-800/40 opacity-70'
          : `border-slate-700 bg-slate-800 hover:border-slate-500 ${URGENCY_BORDER[urgency]}`
      }`}
    >
      {/* Outcome flash overlay */}
      {flash && (
        <div className={`absolute inset-0 flex items-center justify-center rounded-xl text-lg font-bold z-10 ${
          flash === 'saved'  ? 'bg-green-900/80 text-green-300' :
          flash === 'harmed' ? 'bg-yellow-900/80 text-yellow-300' :
          'bg-red-900/80 text-red-300'
        }`}>
          {flash === 'saved' ? '✅ SAVED' : flash === 'harmed' ? '⚠️ HARMED' : '☠️ LOST'}
        </div>
      )}

      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-slate-500">BED {patient.bedNumber}</span>
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${ACUITY_COLOR[patient.acuity] ?? 'bg-slate-600 text-white'}`}>
          P{patient.acuity}
        </span>
      </div>
      <div className="font-semibold text-sm text-white truncate">{patient.name}</div>
      <div className="text-xs text-slate-400 truncate mt-0.5">{patient.shortSummary}</div>
      <div className={`mt-2 text-xs font-semibold px-2 py-0.5 rounded-full border inline-block ${ss.classes}`}>
        {ss.label}
      </div>

      {urgency !== 'ok' && !isDone && (
        <div className={`mt-1.5 text-xs font-bold flex items-center gap-1 ${
          urgency === 'imminent' ? 'text-red-400' :
          urgency === 'danger'   ? 'text-orange-400' :
          'text-yellow-400'
        }`}>
          {urgency === 'imminent' ? '🚨 Crashing imminently!' :
           urgency === 'danger'   ? '⚠️ Deteriorating soon' :
           '⚡ Needs attention'}
        </div>
      )}

      {patient.outcome === 'saved'  && <div className="mt-1 text-xs text-green-400 font-bold">✅ Dispositioned</div>}
      {patient.outcome === 'harmed' && <div className="mt-1 text-xs text-yellow-500 font-bold">⚠️ Harmed</div>}
      {patient.outcome === 'dead'   && <div className="mt-1 text-xs text-red-500 font-bold">☠ Patient lost</div>}
    </button>
  );
}

// ─── Main NightShift Component ────────────────────────────────────────────────

export default function NightShift({ profile, onHome, onShiftComplete }: Props) {
  const [phase, setPhase]               = useState<ShiftPhase>('selecting');
  const [selectedScenario, setSelectedScenario] = useState<ShiftScenario | null>(null);
  const [shiftState, setShiftState]     = useState<ShiftState>(() => initShiftState(ALL_SCENARIOS[0]));
  const [lastFeedback, setLastFeedback] = useState<{
    text: string; isCorrect: boolean; isDangerous: boolean;
  } | null>(null);
  const [flashMap, setFlashMap]         = useState<Record<string, 'saved' | 'dead' | 'harmed'>>({});
  const [result, setResult]             = useState(() =>
    computeShiftResult(initShiftState(ALL_SCENARIOS[0]), ALL_SCENARIOS[0].optimalPatientOrder)
  );
  const [profileFired, setProfileFired] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [shiftState.globalEventLog.length]);

  // Fire profile update once on complete
  useEffect(() => {
    if (!shiftState.isComplete || profileFired || !selectedScenario) return;
    setProfileFired(true);

    const r = computeShiftResult(shiftState, selectedScenario.optimalPatientOrder);
    setResult(r);

    // Save best shift per scenario
    saveBestShift({
      date: Date.now(),
      grade: r.grade,
      saved: r.saved,
      dead: r.dead,
      overallScore: r.score.overall,
      triageScore: r.triageScore,
      xpEarned: r.xpEarned,
      scenarioId: selectedScenario.id,
    }, selectedScenario.id);

    // Check three-shifts-cleared achievement
    const allCleared = ALL_SCENARIOS.every(s => loadBestShift(s.id) !== null);
    const extraAchievements = allCleared ? ['three-shifts-cleared'] : [];

    // Update profile
    const currentProfile = loadProfile() ?? profile;
    const allNewAchievements = [
      ...new Set([...currentProfile.unlockedAchievementIds, ...r.newAchievementIds, ...extraAchievements]),
    ];
    const updated = {
      ...currentProfile,
      totalXP: currentProfile.totalXP + r.xpEarned,
      casesCompleted: currentProfile.casesCompleted + 1,
      unlockedAchievementIds: allNewAchievements,
    };
    const levelData = getLevelForXP(updated.totalXP);
    updated.level = levelData.level;
    updated.rank  = levelData.rank;
    saveProfile(updated);
    onShiftComplete?.(updated);

    setPhase('complete');
  }, [shiftState.isComplete]);

  const selectedPatient = shiftState.patients.find(p => p.id === shiftState.selectedPatientId) ?? null;
  const availableActions = selectedPatient ? getAvailableActions(selectedPatient) : [];

  const handleSelectScenario = (scenario: ShiftScenario) => {
    setSelectedScenario(scenario);
    setShiftState(initShiftState(scenario));
    setResult(computeShiftResult(initShiftState(scenario), scenario.optimalPatientOrder));
    setLastFeedback(null);
    setFlashMap({});
    setProfileFired(false);
    setPhase('briefing');
  };

  const handleAction = (action: ShiftAction) => {
    if (!shiftState.selectedPatientId) return;

    const prevPatients = shiftState.patients;
    const newState = applyShiftAction(shiftState, shiftState.selectedPatientId, action);
    setShiftState(newState);
    setLastFeedback({
      text: action.effect.feedback,
      isCorrect: action.effect.isCorrect,
      isDangerous: action.effect.isDangerous,
    });

    const newFlashes: Record<string, 'saved' | 'dead' | 'harmed'> = {};
    for (const p of newState.patients) {
      const prev = prevPatients.find(x => x.id === p.id);
      if (prev?.outcome === 'pending' && p.outcome !== 'pending') {
        newFlashes[p.id] = p.outcome as 'saved' | 'dead' | 'harmed';
      }
    }
    if (Object.keys(newFlashes).length > 0) {
      setFlashMap(prev => ({ ...prev, ...newFlashes }));
      setTimeout(() => {
        setFlashMap(prev => {
          const next = { ...prev };
          for (const id of Object.keys(newFlashes)) delete next[id];
          return next;
        });
      }, 2200);
    }
  };

  const handleSelectPatient = (id: string) => {
    setShiftState(selectShiftPatient(shiftState, id));
    setLastFeedback(null);
  };

  const handleReplay = () => {
    if (!selectedScenario) return;
    const fresh = initShiftState(selectedScenario);
    setShiftState(fresh);
    setResult(computeShiftResult(fresh, selectedScenario.optimalPatientOrder));
    setLastFeedback(null);
    setFlashMap({});
    setProfileFired(false);
    setPhase('playing');
  };

  const handleChooseAnother = () => {
    setPhase('selecting');
  };

  // ── Selecting ─────────────────────────────────────────────────────────────
  if (phase === 'selecting') {
    return (
      <ScenarioSelector
        scenarios={ALL_SCENARIOS}
        getBestShift={loadBestShift}
        onSelect={handleSelectScenario}
        onBack={onHome}
      />
    );
  }

  // ── Briefing ──────────────────────────────────────────────────────────────
  if (phase === 'briefing' && selectedScenario) {
    return (
      <ShiftBriefing
        scenario={selectedScenario}
        bestShift={loadBestShift(selectedScenario.id)}
        onStart={() => setPhase('playing')}
        onBack={() => setPhase('selecting')}
      />
    );
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  if (phase === 'complete' && selectedScenario) {
    return (
      <ShiftSummary
        shiftState={shiftState}
        result={result}
        pearls={getPearls(selectedScenario.id)}
        onReplay={handleReplay}
        onChooseAnother={handleChooseAnother}
        onHome={onHome}
      />
    );
  }

  // ── Playing ───────────────────────────────────────────────────────────────

  const actionsByCategory = (['assessment','investigation','treatment','disposition'] as const)
    .map(cat => ({ cat, actions: availableActions.filter(a => a.category === cat) }))
    .filter(g => g.actions.length > 0);

  const completedCount = shiftState.patients.filter(p => p.outcome !== 'pending').length;
  const scenarioName   = selectedScenario?.name ?? 'Night Shift';

  return (
    <div className="h-screen bg-slate-900 text-white flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-slate-700 bg-slate-900 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setPhase('selecting')}
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            ← Shifts
          </button>
          <div className="h-4 w-px bg-slate-700" />
          <span className="font-semibold text-white text-sm truncate max-w-[200px]">🌙 {scenarioName}</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Time</div>
            <div className="text-xl font-mono font-bold text-amber-400">{formatShiftTime(shiftState.currentTime)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Patients</div>
            <div className="text-xl font-bold text-white">
              {completedCount}<span className="text-slate-500 text-sm">/{shiftState.patients.length}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main 3-column layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Bed Board */}
        <aside className="w-56 shrink-0 border-r border-slate-700 p-3 overflow-y-auto space-y-2 bg-slate-900">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Bed Board</div>
          {shiftState.patients.map(p => (
            <BedCard
              key={p.id}
              patient={p}
              selected={p.id === shiftState.selectedPatientId}
              urgency={getUrgencyLevel(p, shiftState.currentTime)}
              onClick={() => handleSelectPatient(p.id)}
              flash={flashMap[p.id] ?? null}
            />
          ))}
        </aside>

        {/* Center: Patient Detail */}
        <main className="flex-1 overflow-y-auto p-5 space-y-4">
          {!selectedPatient ? (
            <div className="h-full flex items-center justify-center text-slate-500">
              <div className="text-center space-y-2">
                <div className="text-4xl">👈</div>
                <p className="text-lg font-medium text-slate-400">Select a patient</p>
                <p className="text-sm text-slate-500">Warning badges indicate imminent deterioration.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Patient header */}
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold text-white">{selectedPatient.name}</h2>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${ACUITY_COLOR[selectedPatient.acuity] ?? 'bg-slate-600 text-white'}`}>
                        Priority {selectedPatient.acuity}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_STYLE[selectedPatient.status].classes}`}>
                        {STATUS_STYLE[selectedPatient.status].label}
                      </span>
                      {(() => {
                        const u = getUrgencyLevel(selectedPatient, shiftState.currentTime);
                        if (u === 'imminent') return <span className="text-xs font-bold text-red-400 animate-pulse">🚨 Crashing imminently!</span>;
                        if (u === 'danger')   return <span className="text-xs font-bold text-orange-400">⚠️ Deteriorating soon</span>;
                        if (u === 'warning')  return <span className="text-xs font-bold text-yellow-400">⚡ Needs attention</span>;
                        return null;
                      })()}
                    </div>
                    <p className="text-slate-300 text-sm mt-1">
                      {selectedPatient.age}yo {selectedPatient.sex === 'M' ? 'Male' : 'Female'} — {selectedPatient.chiefComplaint}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-500 shrink-0">Bed {selectedPatient.bedNumber}</div>
                </div>

                {/* Vitals */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {[
                    { label: 'BP',   val: selectedPatient.vitals.bp,   unit: '' },
                    { label: 'HR',   val: selectedPatient.vitals.hr,   unit: ' bpm' },
                    { label: 'RR',   val: selectedPatient.vitals.rr,   unit: '/min' },
                    { label: 'SpO₂', val: selectedPatient.vitals.spo2, unit: '%' },
                    { label: 'Temp', val: selectedPatient.vitals.temp, unit: '°C' },
                  ].map(v => (
                    <span key={v.label} className="bg-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded">
                      {v.label}: <strong>{v.val}{v.unit}</strong>
                    </span>
                  ))}
                </div>

                {/* Red flags */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedPatient.redFlags.map((f, i) => (
                    <span key={i} className="text-xs bg-red-900/50 text-red-300 border border-red-800/50 rounded-full px-2.5 py-0.5">
                      ⚠️ {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Feedback */}
              {lastFeedback && (
                <div className={`rounded-xl p-4 border text-sm leading-relaxed ${
                  lastFeedback.isDangerous
                    ? 'bg-red-900/40 border-red-700 text-red-200'
                    : lastFeedback.isCorrect
                    ? 'bg-green-900/40 border-green-700 text-green-200'
                    : 'bg-slate-700/50 border-slate-600 text-slate-200'
                }`}>
                  <span className="font-semibold mr-1.5">
                    {lastFeedback.isDangerous ? '🚨 Dangerous:' : lastFeedback.isCorrect ? '✅ Correct:' : '💡 Note:'}
                  </span>
                  {lastFeedback.text}
                </div>
              )}

              {/* Completed actions */}
              {selectedPatient.completedActionIds.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Completed</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedPatient.completedActionIds.map(id => {
                      const a = selectedPatient.availableActions.find(x => x.id === id);
                      return a ? (
                        <span key={id} className={`text-xs border rounded px-2.5 py-1 ${
                          a.effect.isDangerous ? 'bg-red-900/30 text-red-400 border-red-800/50' :
                          a.effect.isCorrect   ? 'bg-green-900/20 text-green-400 border-green-800/50' :
                          'bg-slate-700/40 text-slate-400 border-slate-600/50'
                        }`}>
                          {a.icon} {a.label} ✓
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Actions or done state */}
              {selectedPatient.outcome !== 'pending' ? (
                <div className="text-center py-8 text-slate-500">
                  <div className="text-3xl mb-2">
                    {selectedPatient.outcome === 'saved' ? '✅' : selectedPatient.outcome === 'harmed' ? '⚠️' : '☠️'}
                  </div>
                  <p className="font-medium text-slate-400">
                    {selectedPatient.outcome === 'saved'  ? 'Patient dispositioned successfully.' :
                     selectedPatient.outcome === 'harmed' ? 'Patient dispositioned with harm.' :
                     'Patient has died.'} Select another patient.
                  </p>
                </div>
              ) : actionsByCategory.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p>No actions available. Complete prerequisite steps first.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {actionsByCategory.map(({ cat, actions }) => {
                    const style = CATEGORY_STYLE[cat];
                    return (
                      <div key={cat}>
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">{style.label}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {actions.map(action => (
                            <button
                              key={action.id}
                              onClick={() => handleAction(action)}
                              className={`text-left rounded-lg border bg-slate-800/60 px-4 py-3 transition-colors ${style.color}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{action.icon} {action.label}</span>
                                <span className="text-xs text-slate-500 ml-2 shrink-0">+{action.timeCost}min</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>

        {/* Right: Event Log — hidden on narrow screens */}
        <aside className="hidden lg:flex w-72 shrink-0 border-l border-slate-700 flex-col bg-slate-900">
          <div className="px-4 py-3 border-b border-slate-700 text-xs font-semibold uppercase tracking-wider text-slate-500 shrink-0">
            Event Log
          </div>
          <div ref={logRef} className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {shiftState.globalEventLog.map((evt, i) => (
              <div
                key={i}
                className={`text-xs rounded px-2.5 py-2 border ${
                  evt.severity === 'danger'  ? 'bg-red-900/30 border-red-800/50 text-red-300' :
                  evt.severity === 'warning' ? 'bg-yellow-900/30 border-yellow-800/50 text-yellow-300' :
                  evt.severity === 'success' ? 'bg-green-900/30 border-green-800/50 text-green-300' :
                  'bg-slate-800/60 border-slate-700 text-slate-300'
                }`}
              >
                <div className="text-slate-500 font-mono mb-0.5">{formatShiftTime(evt.time)}</div>
                <div>{evt.text}</div>
              </div>
            ))}
          </div>

          {/* Live scores */}
          <div className="border-t border-slate-700 p-3 space-y-1.5 shrink-0">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Live Scores</div>
            {shiftState.patients.map(p => {
              const avg = Math.round((p.score.triage + p.score.safety + p.score.guideline + p.score.time) / 4);
              const u = getUrgencyLevel(p, shiftState.currentTime);
              return (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <span className={`truncate max-w-[110px] ${
                    u === 'imminent' ? 'text-red-400 font-semibold' :
                    u === 'danger'   ? 'text-orange-400' :
                    u === 'warning'  ? 'text-yellow-400' :
                    'text-slate-400'
                  }`}>
                    {u === 'imminent' ? '🚨 ' : u === 'danger' ? '⚠️ ' : ''}{p.name.split(' ')[0]}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1.5 bg-slate-700 rounded-full">
                      <div
                        className={`h-full rounded-full transition-all ${
                          avg >= 70 ? 'bg-green-500' : avg >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${avg}%` }}
                      />
                    </div>
                    <span className="text-slate-300 font-mono w-6 text-right">{avg}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
