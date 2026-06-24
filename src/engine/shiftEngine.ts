import type {
  ShiftScenario, ShiftState, ShiftAction, ShiftEvent, ShiftPatient,
  ShiftResult, ShiftGrade, BestShiftRecord, UrgencyLevel,
} from '../types/shift';

function bestShiftKey(scenarioId: string): string {
  return `wardrunner_best_shift_${scenarioId}`;
}

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v));
}

function applyDeteriorationUpTo(patient: ShiftPatient, upToTime: number): ShiftPatient {
  let p = { ...patient };
  while (
    upToTime >= p.nextDeteriorationAt &&
    p.deteriorationStepIndex < p.deteriorationSteps.length &&
    p.outcome === 'pending'
  ) {
    const step = p.deteriorationSteps[p.deteriorationStepIndex];
    const evt: ShiftEvent = {
      time: p.nextDeteriorationAt,
      patientId: p.id,
      patientName: p.name,
      text: step.eventMessage,
      severity: step.isLethal ? 'danger' : 'warning',
    };
    p = {
      ...p,
      status: step.statusChange,
      vitals: { ...p.vitals, ...step.vitalsChange },
      eventLog: [...p.eventLog, evt],
      outcome: step.isLethal ? 'dead' : p.outcome,
      deteriorationStepIndex: p.deteriorationStepIndex + 1,
      nextDeteriorationAt: p.nextDeteriorationAt + p.deteriorationInterval,
    };
  }
  return p;
}

export function initShiftState(scenario: ShiftScenario): ShiftState {
  return {
    scenarioId: scenario.id,
    currentTime: 0,
    patients: scenario.patients.map(p => ({
      ...p,
      completedActionIds: [],
      firstActionAt: undefined,
      outcome: 'pending',
      deteriorationStepIndex: 0,
      eventLog: [],
      score: { triage: 50, safety: 100, guideline: 50, time: 100 },
    })),
    selectedPatientId: null,
    globalEventLog: [{
      time: 0,
      patientId: null,
      text: '🏥 Night shift started. 4 patients require immediate attention.',
      severity: 'info',
    }],
    isComplete: false,
  };
}

export function applyShiftAction(
  state: ShiftState,
  patientId: string,
  action: ShiftAction,
): ShiftState {
  const idx = state.patients.findIndex(p => p.id === patientId);
  if (idx === -1) return state;

  const newTime = state.currentTime + action.timeCost;
  const effect = action.effect;
  let acting = { ...state.patients[idx] };

  // Track first action time
  if (acting.firstActionAt === undefined) {
    acting.firstActionAt = newTime;
  }

  if (!acting.completedActionIds.includes(action.id)) {
    acting.completedActionIds = [...acting.completedActionIds, action.id];
  }

  if (effect.statusChange) acting.status = effect.statusChange;

  acting.nextDeteriorationAt += effect.deteriorationTimerDelta;

  acting.score = {
    triage:    clamp(acting.score.triage    + (effect.scoreImpact.triage    ?? 0)),
    safety:    clamp(acting.score.safety    + (effect.scoreImpact.safety    ?? 0)),
    guideline: clamp(acting.score.guideline + (effect.scoreImpact.guideline ?? 0)),
    time:      clamp(acting.score.time      + (effect.scoreImpact.time      ?? 0)),
  };

  acting.eventLog = [...acting.eventLog, {
    time: newTime,
    patientId: acting.id,
    patientName: acting.name,
    text: effect.eventMessage,
    severity: effect.eventSeverity,
  }];

  if (effect.completesPatient) {
    acting.outcome = effect.isDangerous ? 'harmed' : 'saved';
  }

  // Check deterioration for all patients after time advances
  const updatedPatients = state.patients.map((p, i) =>
    applyDeteriorationUpTo(i === idx ? acting : { ...p }, newTime)
  );

  // Inject global deterioration warning events
  const newGlobalEvents: ShiftEvent[] = [
    {
      time: newTime,
      patientId: acting.id,
      patientName: acting.name,
      text: `[Bed ${acting.bedNumber}] ${effect.eventMessage}`,
      severity: effect.eventSeverity,
    },
  ];

  // Collect deterioration events from other patients into global log
  for (let i = 0; i < updatedPatients.length; i++) {
    if (i === idx) continue;
    const prev = state.patients[i];
    const next = updatedPatients[i];
    if (next.deteriorationStepIndex > prev.deteriorationStepIndex) {
      // Patient deteriorated — their events are already in patient.eventLog; mirror to global
      for (let s = prev.deteriorationStepIndex; s < next.deteriorationStepIndex; s++) {
        const step = prev.deteriorationSteps[s];
        newGlobalEvents.push({
          time: prev.nextDeteriorationAt + (s - prev.deteriorationStepIndex) * prev.deteriorationInterval,
          patientId: next.id,
          patientName: next.name,
          text: `[Bed ${next.bedNumber}] ${step.eventMessage}`,
          severity: step.isLethal ? 'danger' : 'warning',
        });
      }
    }
  }

  const allDone = updatedPatients.every(p => p.outcome !== 'pending');

  return {
    ...state,
    currentTime: newTime,
    patients: updatedPatients,
    globalEventLog: [...state.globalEventLog, ...newGlobalEvents.sort((a, b) => a.time - b.time)],
    isComplete: allDone,
  };
}

export function selectShiftPatient(state: ShiftState, id: string | null): ShiftState {
  return { ...state, selectedPatientId: id };
}

export function getAvailableActions(patient: ShiftPatient): ShiftAction[] {
  if (patient.outcome !== 'pending') return [];
  return patient.availableActions.filter(a => {
    if (a.oneTimeUse && patient.completedActionIds.includes(a.id)) return false;
    if (a.requiresActionIds?.length) {
      return a.requiresActionIds.every(req => patient.completedActionIds.includes(req));
    }
    return true;
  });
}

export function getUrgencyLevel(patient: ShiftPatient, currentTime: number): UrgencyLevel {
  if (patient.outcome !== 'pending') return 'ok';
  if (patient.deteriorationStepIndex >= patient.deteriorationSteps.length) return 'ok';
  const timeLeft = patient.nextDeteriorationAt - currentTime;
  if (timeLeft <= 5)  return 'imminent';
  if (timeLeft <= 12) return 'danger';
  if (timeLeft <= 22) return 'warning';
  return 'ok';
}

export function computeTriageScore(patients: ShiftPatient[], optimalOrder: string[]): number {
  const treated = [...patients]
    .filter(p => p.firstActionAt !== undefined)
    .sort((a, b) => (a.firstActionAt ?? 0) - (b.firstActionAt ?? 0))
    .map(p => p.id);

  if (treated.length === 0) return 0;

  let score = 100;

  // Penalty: first patient treated is not the most urgent
  const mostUrgentId = optimalOrder[0];
  if (treated[0] !== mostUrgentId) score -= 25;

  // Penalty: patient deteriorated before first treatment
  for (const p of patients) {
    if (p.firstActionAt !== undefined && p.deteriorationStepIndex > 0) {
      score -= 15;
    }
    // Penalty: never touched
    if (p.firstActionAt === undefined && p.outcome !== 'pending') {
      score -= 30;
    }
  }

  // Penalty: out-of-optimal order (compare treated order to optimal order subset)
  const optFiltered = optimalOrder.filter(id => treated.includes(id));
  for (let i = 0; i < treated.length; i++) {
    if (treated[i] !== optFiltered[i]) score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

export function computeShiftGrade(overall: number, saved: number, total: number): ShiftGrade {
  if (overall >= 88 && saved === total) return 'S';
  if (overall >= 78) return 'A';
  if (overall >= 63) return 'B';
  if (overall >= 48) return 'C';
  if (overall >= 33) return 'D';
  return 'F';
}

export function computeShiftResult(state: ShiftState, optimalOrder: string[]): ShiftResult {
  const ps = state.patients;
  const saved  = ps.filter(p => p.outcome === 'saved').length;
  const harmed = ps.filter(p => p.outcome === 'harmed').length;
  const dead   = ps.filter(p => p.outcome === 'dead').length;

  const avg = (k: 'triage' | 'safety' | 'guideline' | 'time') =>
    Math.round(ps.reduce((s, p) => s + p.score[k], 0) / ps.length);

  const triage    = avg('triage');
  const safety    = avg('safety');
  const guideline = avg('guideline');
  const time      = avg('time');
  const triageScore = computeTriageScore(ps, optimalOrder);
  const overall   = Math.round((triage + safety + guideline + time + triageScore) / 5);
  const grade     = computeShiftGrade(overall, saved, ps.length);

  let xpEarned = saved * 80 + harmed * 20;
  if (overall >= 80) xpEarned += 100;
  else if (overall >= 60) xpEarned += 50;

  const newAchievementIds: string[] = [];

  // Universal shift achievements
  if (saved + harmed + dead === ps.length) newAchievementIds.push('night-shift-first');
  if (saved + harmed === ps.length && dead === 0) newAchievementIds.push('night-shift-no-deaths');
  if (saved === ps.length) newAchievementIds.push('night-shift-perfect');
  if (triageScore >= 80)   newAchievementIds.push('night-shift-triage-master');
  if (ps.some(p => p.outcome === 'saved' && p.deteriorationStepIndex > 0))
    newAchievementIds.push('night-shift-code-blue');

  // Cross-scenario quality achievements
  if (triageScore >= 90) newAchievementIds.push('perfect-triage-any');
  if (dead === 0 && saved + harmed === ps.length) newAchievementIds.push('no-death-night');

  // Scenario-specific achievements
  if (state.scenarioId === 'night-shift-2') {
    if (saved > 0) newAchievementIds.push('icu-first-save');
    const hyperkalemia = ps.find(p => p.id === 'ns2-p1');
    if (hyperkalemia?.outcome === 'saved') newAchievementIds.push('hyperkalemia-hero');
  }
  if (state.scenarioId === 'night-shift-3') {
    if (saved + harmed + dead === ps.length) newAchievementIds.push('ward-call-warrior');
  }

  return { saved, harmed, dead, triageScore, score: { triage, safety, guideline, time, overall }, grade, xpEarned, newAchievementIds };
}

export function loadBestShift(scenarioId: string): BestShiftRecord | null {
  try {
    const raw = localStorage.getItem(bestShiftKey(scenarioId));
    return raw ? JSON.parse(raw) as BestShiftRecord : null;
  } catch { return null; }
}

export function saveBestShift(record: BestShiftRecord, scenarioId: string): void {
  try {
    const existing = loadBestShift(scenarioId);
    if (!existing || record.overallScore > existing.overallScore) {
      localStorage.setItem(bestShiftKey(scenarioId), JSON.stringify(record));
    }
  } catch { /* noop */ }
}

export function formatShiftTime(minutes: number): string {
  const total = 19 * 60 + minutes;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
