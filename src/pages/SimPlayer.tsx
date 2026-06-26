import { useState, useRef } from 'react';
import type { SimVitals, SimAction, SimPatientStatus, PatientSim } from '../types/simulation';
import { initSimState, applyAction, getAvailableActions, checkEndings } from '../engine/sim/simEngine';
import { viewOrderResult } from '../engine/sim/orderEngine';
import { SEPTIC_SHOCK_CASE } from '../data/simCases/septicShock';
import SimVitalsPanel from '../components/sim/SimVitalsPanel';
import SimActionPanel from '../components/sim/SimActionPanel';
import SimOrdersPanel from '../components/sim/SimOrdersPanel';
import SimTimeline from '../components/sim/SimTimeline';
import SimDebrief from '../components/sim/SimDebrief';

interface Props {
  onHome: () => void;
}

const STATUS_BADGE: Record<SimPatientStatus, { label: string; cls: string }> = {
  stable:           { label: 'Stable',         cls: 'bg-slate-700 text-slate-300' },
  guarded:          { label: 'Guarded',         cls: 'bg-amber-800/80 text-amber-200' },
  critical:         { label: 'Critical',        cls: 'bg-red-800/80 text-red-200 animate-pulse' },
  improving:        { label: 'Improving',       cls: 'bg-emerald-800/80 text-emerald-200' },
  intubated:        { label: 'Intubated',       cls: 'bg-orange-800/80 text-orange-200' },
  'cardiac-arrest': { label: 'Cardiac Arrest',  cls: 'bg-red-900 text-red-200 animate-pulse' },
  dead:             { label: 'Deceased',        cls: 'bg-slate-900 text-slate-400' },
  discharged:       { label: 'Discharged',      cls: 'bg-emerald-800/80 text-emerald-200' },
  'icu-transferred':{ label: 'ICU Transfer',    cls: 'bg-blue-800/80 text-blue-200' },
};

function deriveObservation(patient: PatientSim): string {
  const { vitals, flags, status } = patient;

  if (flags['anaphylaxisActive']) return 'Acute anaphylaxis. Urticaria and angioedema visible. Airway at immediate risk.';
  if (flags['periArrest'])        return 'Peri-arrest. BP unrecordable. GCS falling rapidly. Airway at risk.';
  if (status === 'cardiac-arrest') return 'In cardiac arrest. CPR in progress.';

  if (vitals.sbp < 70) {
    return flags['vasopressorsStarted']
      ? 'Profound hypotension despite vasopressors. Refractory septic shock.'
      : 'BP critically low. Vasopressor support required urgently.';
  }
  if (vitals.sbp < 80) {
    return flags['vasopressorsStarted']
      ? 'In septic shock — MAP partially supported by noradrenaline. Trending.'
      : 'Septic shock established. Vasopressors needed now.';
  }
  if (vitals.sbp < 90) {
    return (flags['antibioticsStarted'] && flags['fluidsStarted'])
      ? 'Haemodynamically compromised, but responding to initial resuscitation.'
      : 'Hypotensive. Source control and fluid resuscitation are immediate priorities.';
  }
  if (vitals.gcs < 11) return 'Significantly confused. Airway needs formal assessment.';

  if (flags['antibioticsStarted'] && flags['adequateFluids']) {
    return vitals.hr > 110
      ? 'Treatment commenced. Still tachycardic — monitoring closely for response.'
      : 'Responding to treatment. Vitals trending in the right direction.';
  }
  if (flags['antibioticsStarted']) return 'Antibiotics running. Fluid resuscitation ongoing.';
  if (flags['fluidsStarted'])      return 'Fluids running. Source control still pending — antibiotics not yet commenced.';

  if (status === 'critical') return 'Critically unwell. Immediate intervention required.';
  if (status === 'guarded')  return 'Condition guarded. Initial assessment in progress.';

  return 'Monitoring closely. Clinical picture evolving.';
}

function formatSimTime(min: number): string {
  if (min < 60) return `T+${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `T+${h}h ${String(m).padStart(2, '0')}m`;
}

export default function SimPlayer({ onHome }: Props) {
  const [simState, setSimState] = useState(() => initSimState(SEPTIC_SHOCK_CASE));
  const prevVitalsRef = useRef<SimVitals>(SEPTIC_SHOCK_CASE.presentation.initialVitals);
  const [acting, setActing] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const { patient, phase, activeEndingId, eventLog, scores } = simState;

  const availableActions = getAvailableActions(simState, SEPTIC_SHOCK_CASE.actions);

  const activeEnding = activeEndingId
    ? SEPTIC_SHOCK_CASE.endings.find(e => e.id === activeEndingId) ?? null
    : null;

  // Also check endings inline (in case phase is 'playing' but condition met)
  const liveEnding = phase === 'ended'
    ? activeEnding
    : (() => {
        const e = checkEndings(patient, SEPTIC_SHOCK_CASE.endings);
        return e ?? null;
      })();

  function handleAction(action: SimAction) {
    if (acting || phase === 'ended') return;
    setActing(true);
    setLastAction(action.label);
    prevVitalsRef.current = { ...patient.vitals };

    // Small timeout so the UI can flash "processing" state
    setTimeout(() => {
      setSimState(prev => applyAction(prev, action, SEPTIC_SHOCK_CASE));
      setActing(false);
    }, 120);
  }

  function handleViewResult(orderId: string) {
    setSimState(prev => ({
      ...prev,
      patient: viewOrderResult(prev.patient, orderId, prev.patient.simTimeMinutes),
    }));
  }

  function handleRestart() {
    prevVitalsRef.current = SEPTIC_SHOCK_CASE.presentation.initialVitals;
    setSimState(initSimState(SEPTIC_SHOCK_CASE));
    setLastAction(null);
  }

  // Show debrief when ended
  if (liveEnding && phase === 'ended') {
    return (
      <SimDebrief
        ending={liveEnding}
        scores={scores}
        simTimeMin={patient.simTimeMinutes}
        completedActionIds={patient.completedActionIds}
        allActions={SEPTIC_SHOCK_CASE.actions}
        completedOrders={patient.completedOrders}
        eventLog={eventLog}
        metrics={patient.metrics}
        onRestart={handleRestart}
        onHome={onHome}
      />
    );
  }

  const badge = STATUS_BADGE[patient.status] ?? STATUS_BADGE.guarded;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-slate-900/95 border-b border-slate-700 px-4 py-2.5 flex items-center gap-3 flex-wrap">
        <button
          onClick={onHome}
          className="text-slate-400 hover:text-slate-200 text-sm transition-colors mr-1"
          aria-label="Home"
        >
          ←
        </button>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-100 truncate">{SEPTIC_SHOCK_CASE.title}</div>
          <div className="text-xs text-slate-400">{SEPTIC_SHOCK_CASE.presentation.oneLiner}</div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-sm font-semibold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
            {formatSimTime(patient.simTimeMinutes)}
          </span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${badge.cls}`}>
            {badge.label}
          </span>
        </div>
      </header>

      {/* ── Clinical Impression ──────────────────────────────────────────── */}
      <div className="bg-slate-800/50 border-b border-slate-700/50 px-4 py-1.5">
        <span className="text-xs text-slate-400 font-medium">Clinical impression: </span>
        <span className="text-xs text-slate-300 italic">{deriveObservation(patient)}</span>
      </div>

      {/* ── Action flash ─────────────────────────────────────────────────── */}
      {acting && lastAction && (
        <div className="bg-blue-900/40 border-b border-blue-700/40 px-4 py-1.5 text-xs text-blue-300 text-center">
          ⏱ {lastAction}…
        </div>
      )}

      {/* ── Main Grid ────────────────────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-3 p-3 min-h-0">

        {/* ── LEFT: Patient chart ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 overflow-y-auto">

          {/* Vitals */}
          <SimVitalsPanel
            vitals={patient.vitals}
            prevVitals={prevVitalsRef.current}
            status={patient.status}
          />

          {/* Active Problems */}
          {patient.activeProblems.length > 0 && (
            <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-3">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Active Problems</div>
              <ul className="space-y-1">
                {patient.activeProblems.map(p => (
                  <li key={p.id} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="text-red-400 mt-0.5 shrink-0">●</span>
                    <span>{p.label}</span>
                    <span className="text-slate-600 ml-auto shrink-0">T+{p.discoveredAtMin}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Resolved Problems */}
          {patient.resolvedProblems.length > 0 && (
            <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-3">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Resolved</div>
              <ul className="space-y-1">
                {patient.resolvedProblems.map(p => (
                  <li key={p.id} className="flex items-start gap-2 text-xs text-slate-500">
                    <span className="text-emerald-600 mt-0.5 shrink-0">✓</span>
                    <span className="line-through">{p.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Known History */}
          {patient.knownHistory.length > 0 && (
            <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-3">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">History</div>
              <ul className="space-y-1.5">
                {patient.knownHistory.map((h, i) => (
                  <li key={i} className="text-xs text-slate-300 leading-snug flex gap-2">
                    <span className="text-slate-600 shrink-0">·</span>{h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Medications & Allergies */}
          {(patient.revealedMedications.length > 0 || patient.revealedAllergies.length > 0) && (
            <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-3 space-y-3">
              {patient.revealedMedications.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Medications</div>
                  <ul className="space-y-1">
                    {patient.revealedMedications.map((m, i) => (
                      <li key={i} className="text-xs text-slate-300 flex gap-2">
                        <span className="text-slate-600 shrink-0">💊</span>{m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {patient.revealedAllergies.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-red-300 uppercase tracking-wider mb-1.5">⚠ Allergies</div>
                  <ul className="space-y-1">
                    {patient.revealedAllergies.map((a, i) => (
                      <li key={i} className="text-xs text-red-300 font-semibold flex gap-2 bg-red-900/20 px-2 py-1 rounded-md">
                        <span className="shrink-0">⚑</span>{a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Presentation (always shown, gives initial context) */}
          <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-3">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Presentation</div>
            <p className="text-xs text-slate-400 leading-relaxed italic">
              "{SEPTIC_SHOCK_CASE.presentation.contextNote}"
            </p>
            <div className="mt-2 text-xs text-slate-500 space-y-1">
              <div><span className="text-slate-400 font-medium">Chief complaint:</span> {SEPTIC_SHOCK_CASE.presentation.chiefComplaint}</div>
              <div><span className="text-slate-400 font-medium">Difficulty:</span> {SEPTIC_SHOCK_CASE.difficulty}</div>
            </div>
          </div>
        </div>

        {/* ── CENTER: Actions + Orders ─────────────────────────────────────── */}
        <div className="flex flex-col gap-3 min-h-0">

          {/* Action panel */}
          <SimActionPanel
            actions={availableActions}
            disabled={acting || phase === 'ended'}
            onAction={handleAction}
          />

          {/* Orders + Results inbox */}
          <SimOrdersPanel
            patient={patient}
            onViewResult={handleViewResult}
          />
        </div>

        {/* ── RIGHT: Timeline ──────────────────────────────────────────────── */}
        <div className="flex flex-col min-h-0 lg:h-[calc(100vh-80px)] lg:sticky lg:top-[64px]">
          <SimTimeline events={eventLog} />
        </div>
      </div>
    </div>
  );
}
