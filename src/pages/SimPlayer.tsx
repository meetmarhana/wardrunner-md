import { useState, useRef } from 'react';
import type { SimVitals, SimAction } from '../types/simulation';
import { initSimState, applyAction, getAvailableActions, checkEndings } from '../engine/sim/simEngine';
import { viewOrderResult } from '../engine/sim/orderEngine';
import { SEPTIC_SHOCK_CASE } from '../data/simCases/septicShock';
import SimCockpit from '../components/sim/SimCockpit';
import SimDebrief from '../components/sim/SimDebrief';

interface Props {
  onHome: () => void;
}

export default function SimPlayer({ onHome }: Props) {
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
