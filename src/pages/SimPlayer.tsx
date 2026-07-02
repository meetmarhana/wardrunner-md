import { useState, useRef } from 'react';
import type { SimVitals, SimAction } from '../types/simulation';
import { initSimState, applyAction, getAvailableActions, checkEndings } from '../engine/sim/simEngine';
import { viewOrderResult } from '../engine/sim/orderEngine';
import { SEPTIC_SHOCK_CASE } from '../data/simCases/septicShock';
import SimCockpit from '../components/sim/SimCockpit';
import SimDebrief from '../components/sim/SimDebrief';
import CinematicIntro from '../components/sim/CinematicIntro';
import { computeOutcomeXP } from '../types/shiftLoop';
import type { CaseOutcome } from '../types/shiftLoop';

interface Props {
  onHome: () => void;
  onContinueShift?: (outcome: CaseOutcome) => void;
  onEndShift?: () => void;
  skipIntro?: boolean;
  patientNumber?: number;
}

export default function SimPlayer({ onHome, onContinueShift, onEndShift, skipIntro = false }: Props) {
  const [introComplete, setIntroComplete] = useState(skipIntro);
  const [simState, setSimState] = useState(() => initSimState(SEPTIC_SHOCK_CASE));
  const prevVitalsRef = useRef<SimVitals>(SEPTIC_SHOCK_CASE.presentation.initialVitals);
  const [acting, setActing] = useState(false);
  const [actingActionId, setActingActionId] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const { patient, phase, activeEndingId, eventLog, scores, casePhase, coachingLog } = simState;

  const availableActions = getAvailableActions(simState, SEPTIC_SHOCK_CASE.actions);

  const activeEnding = activeEndingId
    ? SEPTIC_SHOCK_CASE.endings.find(e => e.id === activeEndingId) ?? null
    : null;

  const liveEnding = phase === 'ended'
    ? activeEnding
    : (() => {
        const e = checkEndings(patient, SEPTIC_SHOCK_CASE.endings);
        return e ?? null;
      })();

  function handleAction(action: SimAction) {
    if (acting || phase === 'ended') return;
    setActing(true);
    setActingActionId(action.id);
    setLastAction(action.label);
    prevVitalsRef.current = { ...patient.vitals };
    setTimeout(() => {
      setSimState(prev => applyAction(prev, action, SEPTIC_SHOCK_CASE));
      setActing(false);
      setActingActionId(null);
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
    setActingActionId(null);
  }

  if (!introComplete) {
    return <CinematicIntro onComplete={() => setIntroComplete(true)} />;
  }

  if (liveEnding && phase === 'ended') {
    const completedSet = new Set(patient.completedActionIds);
    const survived = liveEnding.severity !== 'death';
    const culturesFirst = patient.metrics.culturesBeforeAbx === true;
    const allergyChecked = completedSet.has('check-allergies');
    const timeToAbx = typeof patient.metrics.timeToAntibiotics === 'number'
      ? patient.metrics.timeToAntibiotics
      : null;

    function buildOutcome(): CaseOutcome {
      const { total, breakdown } = computeOutcomeXP(
        liveEnding!.id, survived, culturesFirst, allergyChecked, timeToAbx,
      );
      return {
        endingId:          liveEnding!.id,
        survived,
        timeToAntibiotics: timeToAbx,
        culturesFirst,
        allergyChecked,
        patientName:       'Ruth Anand',
        xpEarned:          total,
        xpBreakdown:       breakdown,
      };
    }

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
        onHome={onEndShift ?? onHome}
        onContinueShift={onContinueShift ? () => onContinueShift(buildOutcome()) : undefined}
        onEndShift={onEndShift ? () => onEndShift() : undefined}
      />
    );
  }

  return (
    <SimCockpit
      simCase={SEPTIC_SHOCK_CASE}
      patient={patient}
      prevVitals={prevVitalsRef.current}
      availableActions={availableActions}
      acting={acting}
      actingActionId={actingActionId}
      lastAction={lastAction}
      eventLog={eventLog}
      casePhase={casePhase ?? 'history'}
      coachingLog={coachingLog ?? []}
      onAction={handleAction}
      onViewResult={handleViewResult}
      onHome={onHome}
    />
  );
}
