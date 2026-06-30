import type {
  SimState,
  SimCase,
  SimAction,
  PatientSim,
  ActiveProblem,
  SimEnding,
  EndingCondition,
  SimVitals,
  NursingMessage,
  CasePhase,
  PhaseDefinition,
  CoachingMessage,
  CoachingEntry,
} from '../../types/simulation';
import { PHASE_ORDER } from '../../types/simulation';
import { applyDrift, checkThresholds, deriveStatus, evaluateCondition } from './deteriorationEngine';
import { resolveOrders, instantiateOrder } from './orderEngine';
import { processPendingCascades } from './cascadeEngine';

// ─── Initialise ───────────────────────────────────────────────────────────────

export function initSimState(simCase: SimCase): SimState {
  const patient: PatientSim = {
    ...simCase.initialPatientState,
    caseId: simCase.id,
    firedCoachingIds: [],
  };
  return {
    patient,
    phase: 'playing',
    activeEndingId: null,
    casePhase: 'history',
    coachingLog: [],
    eventLog: [
      {
        simTimeMin: 0,
        text: `${simCase.presentation.contextNote ?? 'Patient arrives.'} ${simCase.presentation.oneLiner}`,
        severity: 'warning',
        source: 'system',
      },
    ],
    scores: { safety: 100, guideline: 70, time: 100, cost: 100, diagnostic: 70 },
  };
}

// ─── Available Actions ────────────────────────────────────────────────────────

export function getAvailableActions(state: SimState, caseActions: SimAction[]): SimAction[] {
  const { patient } = state;
  const completed = new Set(patient.completedActionIds);
  const unlocked  = new Set(patient.unlockedActionIds);
  const currentPhase = state.casePhase ?? 'history';

  return caseActions.filter(action => {
    // Once-only actions already done
    if ((action.availableOnce !== false) && completed.has(action.id)) return false;

    // Phase gate: action's required phase must be reached or earlier
    if (action.phase) {
      const currentIdx = PHASE_ORDER.indexOf(currentPhase);
      const requiredIdx = PHASE_ORDER.indexOf(action.phase);
      if (requiredIdx > currentIdx) return false;
    }

    // Unless explicitly unlocked, check standard gates
    if (!unlocked.has(action.id)) {
      // Required actions must all be completed
      if (action.requiresActionIds?.some(id => !completed.has(id))) return false;
      // Required flags must all be set
      if (action.requiresFlags?.some(f => !patient.flags[f])) return false;
    }

    // Blocking flags prevent the action regardless of unlocked status
    if (action.blockedByFlags?.some(f => patient.flags[f])) return false;

    return true;
  });
}

// ─── Apply Action ─────────────────────────────────────────────────────────────

export function applyAction(state: SimState, action: SimAction, simCase: SimCase): SimState {
  if (state.phase === 'ended') return state;

  let patient = { ...state.patient };
  let events  = [...state.eventLog];
  let scores  = { ...state.scores };

  // 1. Mark completed
  if (!patient.completedActionIds.includes(action.id)) {
    patient = { ...patient, completedActionIds: [...patient.completedActionIds, action.id] };
  }

  const fx = action.effect;

  // 2. Reveal information
  if (fx.revealsHistory?.length) {
    patient = { ...patient, knownHistory: [...new Set([...patient.knownHistory, ...fx.revealsHistory])] };
  }
  if (fx.revealsMedications?.length) {
    patient = { ...patient, revealedMedications: [...new Set([...patient.revealedMedications, ...fx.revealsMedications])] };
  }
  if (fx.revealsAllergies?.length) {
    patient = { ...patient, revealedAllergies: [...new Set([...patient.revealedAllergies, ...fx.revealsAllergies])] };
  }
  if (fx.addsActiveProblems?.length) {
    const existing = new Set(patient.activeProblems.map(ap => ap.id));
    const newProbs: ActiveProblem[] = fx.addsActiveProblems
      .filter(id => !existing.has(id))
      .map(id => ({
        id,
        label: simCase.activeProblemCatalog[id] ?? id,
        discoveredAtMin: patient.simTimeMinutes,
        source: 'revealed' as const,
      }));
    patient = { ...patient, activeProblems: [...patient.activeProblems, ...newProbs] };
  }

  // 3. Place order (use dynamicResult override if present)
  if (fx.placesOrder) {
    const resolvedResult = action.dynamicResult ? action.dynamicResult(patient) : fx.placesOrder.result;
    const template = { ...fx.placesOrder, result: resolvedResult };
    const order = instantiateOrder(action.id, template, patient.simTimeMinutes);
    patient = { ...patient, pendingOrders: [...patient.pendingOrders, order] };
  }

  // 4. Immediate vitals delta
  if (fx.vitalsDelta) {
    const v = { ...patient.vitals };
    for (const [k, delta] of Object.entries(fx.vitalsDelta)) {
      const key = k as keyof SimVitals;
      (v as Record<string, number>)[key] = Math.max(0, (v[key] ?? 0) + (delta ?? 0));
    }
    v.map = Math.round(v.dbp + (v.sbp - v.dbp) / 3);
    patient = { ...patient, vitals: v };
  }
  if (fx.hiddenVitalsDelta) {
    const h = { ...patient.hiddenVitals };
    for (const [k, delta] of Object.entries(fx.hiddenVitalsDelta)) {
      h[k] = Math.max(0, (h[k] ?? 0) + (delta ?? 0));
    }
    patient = { ...patient, hiddenVitals: h };
  }

  // 5. Drift modifiers (persist for future ticks)
  if (fx.deteriorationRateDelta !== undefined) {
    patient = {
      ...patient,
      activeDriftModifiers: {
        ...patient.activeDriftModifiers,
        baseRateDelta: patient.activeDriftModifiers.baseRateDelta + fx.deteriorationRateDelta,
      },
    };
  }
  if (fx.vitalsDriftModifier) {
    const vm = { ...patient.activeDriftModifiers.vitals };
    for (const [k, delta] of Object.entries(fx.vitalsDriftModifier)) {
      vm[k as keyof typeof vm] = (vm[k as keyof typeof vm] ?? 0) + (delta ?? 0);
    }
    patient = { ...patient, activeDriftModifiers: { ...patient.activeDriftModifiers, vitals: vm } };
  }
  if (fx.hiddenDriftModifier) {
    const hm = { ...patient.activeDriftModifiers.hidden };
    for (const [k, delta] of Object.entries(fx.hiddenDriftModifier)) {
      hm[k] = (hm[k] ?? 0) + (delta ?? 0);
    }
    patient = { ...patient, activeDriftModifiers: { ...patient.activeDriftModifiers, hidden: hm } };
  }

  // 6. Flags
  const flags = { ...patient.flags };
  if (fx.setsFlags)   for (const f of fx.setsFlags)  flags[f] = true;
  if (fx.clearsFlags) for (const f of fx.clearsFlags) delete flags[f];
  patient = { ...patient, flags };

  // 7. Metrics
  if (fx.recordsMetric) {
    const val = fx.recordsMetric.value === -1 ? patient.simTimeMinutes : fx.recordsMetric.value;
    // Only record timing metrics the first time (lower time = earlier action)
    const existing = patient.metrics[fx.recordsMetric.key];
    const shouldUpdate = existing === undefined ||
      (typeof val === 'number' && typeof existing === 'number' && val < (existing as number));
    if (shouldUpdate) {
      patient = { ...patient, metrics: { ...patient.metrics, [fx.recordsMetric.key]: val } };
    }
  }

  // 7b. Resolve problems (move active → resolved)
  if (fx.resolvesProblems?.length) {
    const ids = new Set(fx.resolvesProblems);
    const nowResolved = patient.activeProblems.filter(p => ids.has(p.id));
    const stillActive  = patient.activeProblems.filter(p => !ids.has(p.id));
    if (nowResolved.length) {
      patient = {
        ...patient,
        activeProblems: stillActive,
        resolvedProblems: [...patient.resolvedProblems, ...nowResolved],
      };
    }
  }

  // 8. Queue immediate cascades
  if (fx.triggersCascadeIds?.length) {
    patient = {
      ...patient,
      pendingCascadeIds: [...patient.pendingCascadeIds, ...fx.triggersCascadeIds],
    };
  }

  // 9. Score impact
  if (fx.scoreImpact) {
    for (const [k, delta] of Object.entries(fx.scoreImpact)) {
      const key = k as keyof typeof scores;
      scores[key] = Math.max(0, Math.min(100, (scores[key] ?? 70) + (delta ?? 0)));
    }
  }

  // 10. Event log
  if (fx.eventMessage) {
    events = [...events, {
      simTimeMin: patient.simTimeMinutes,
      text: fx.eventMessage,
      severity: fx.eventSeverity ?? 'info',
      source: 'action',
    }];
  }

  // 10b. afterAction coaching
  let coachingLog = state.coachingLog ?? [];
  if (simCase.coachingMessages?.length) {
    const firedIds = patient.firedCoachingIds ?? [];
    const newEntries = fireAfterActionCoaching(
      simCase.coachingMessages, firedIds, action.id, patient.simTimeMinutes,
    );
    if (newEntries.length) {
      coachingLog = [...coachingLog, ...newEntries];
      patient = {
        ...patient,
        firedCoachingIds: [...firedIds, ...newEntries.map(e => e.id)],
      };
    }
  }

  // Process any immediately-queued cascades BEFORE advancing time
  const cascadeResult = processPendingCascades(
    patient,
    simCase.cascadeEvents,
    simCase.activeProblemCatalog,
    events,
    scores,
  );
  patient = cascadeResult.patient;
  events  = cascadeResult.newEvents;
  if (cascadeResult.updatedScores) scores = cascadeResult.updatedScores;

  let forcedEnding = cascadeResult.forcedEndingId;

  // Derive status after immediate effects
  patient = { ...patient, status: deriveStatus(patient.vitals, patient.status) };

  // Now advance time
  const timeResult = advanceTime(
    {
      patient,
      phase: state.phase,
      activeEndingId: state.activeEndingId,
      eventLog: events,
      scores,
      casePhase: state.casePhase ?? 'history',
      coachingLog,
    },
    action.timeCostMin,
    simCase,
  );

  if (forcedEnding && !timeResult.activeEndingId) {
    return { ...timeResult, phase: 'ended', activeEndingId: forcedEnding };
  }
  return timeResult;
}

// ─── Advance Time (1-min ticks) ───────────────────────────────────────────────

export function advanceTime(state: SimState, minutes: number, simCase: SimCase): SimState {
  if (state.phase === 'ended') return state;

  let patient      = state.patient;
  let events       = state.eventLog;
  let scores       = state.scores;
  let activeEndingId = state.activeEndingId;
  let casePhase    = state.casePhase ?? 'history';
  let coachingLog  = state.coachingLog ?? [];

  for (let i = 0; i < minutes; i++) {
    // 1. Advance clock
    patient = { ...patient, simTimeMinutes: patient.simTimeMinutes + 1 };

    // 2. Apply drift (disease progresses every minute)
    patient = applyDrift(patient);

    // 3. Resolve arrived orders
    const orderResult = resolveOrders(patient, events);
    patient = orderResult.patient;
    events  = orderResult.newEvents;

    // 4. Check deterioration thresholds → queue new cascades
    const newCascadeIds = checkThresholds(
      patient,
      simCase.initialPatientState.deteriorationCurve.thresholds,
    );
    if (newCascadeIds.length) {
      // Mark thresholds fired
      const newFired = [...patient.firedThresholdIds];
      for (const id of simCase.initialPatientState.deteriorationCurve.thresholds) {
        if (newCascadeIds.includes(id.triggersCascadeId) && id.onlyOnce && !newFired.includes(id.id)) {
          newFired.push(id.id);
        }
      }
      patient = {
        ...patient,
        firedThresholdIds: newFired,
        pendingCascadeIds: [...patient.pendingCascadeIds, ...newCascadeIds],
      };
    }

    // 5. Process cascades
    const cascadeResult = processPendingCascades(
      patient,
      simCase.cascadeEvents,
      simCase.activeProblemCatalog,
      events,
      scores,
    );
    patient = cascadeResult.patient;
    events  = cascadeResult.newEvents;
    if (cascadeResult.updatedScores) scores = cascadeResult.updatedScores;

    if (cascadeResult.forcedEndingId) {
      activeEndingId = cascadeResult.forcedEndingId;
      patient = { ...patient, status: deriveStatus(patient.vitals, patient.status) };
      return { patient, phase: 'ended', activeEndingId, eventLog: events, scores, casePhase, coachingLog };
    }

    // 6. Derive patient status
    patient = { ...patient, status: deriveStatus(patient.vitals, patient.status) };

    // 6.5 Fire nursing / consultant messages
    if (simCase.nursingMessages?.length) {
      const fired = checkNursingMessages(patient, simCase.nursingMessages);
      if (fired.length) {
        for (const msg of fired) {
          events = [...events, {
            simTimeMin: patient.simTimeMinutes,
            text: msg.text,
            severity: 'info',
            source: (msg.source ?? 'nurse') as import('../../types/simulation').SimEvent['source'],
          }];
        }
        patient = {
          ...patient,
          firedNursingIds: [...patient.firedNursingIds, ...fired.map(m => m.id)],
        };
      }
    }

    // 6.6 Phase transitions
    if (simCase.phases?.length) {
      const nextPhase = tryAdvancePhase(casePhase, patient, simCase.phases);
      if (nextPhase !== casePhase) {
        casePhase = nextPhase;
        // Fire onPhase coaching
        if (simCase.coachingMessages?.length) {
          const firedIds = patient.firedCoachingIds ?? [];
          const entries = fireOnPhaseCoaching(simCase.coachingMessages, firedIds, casePhase, patient.simTimeMinutes);
          if (entries.length) {
            coachingLog = [...coachingLog, ...entries];
            patient = { ...patient, firedCoachingIds: [...firedIds, ...entries.map(e => e.id)] };
          }
        }
      }
    }

    // 6.7 Time-based and missed-action coaching
    if (simCase.coachingMessages?.length) {
      const firedIds = patient.firedCoachingIds ?? [];
      const entries = fireTimeBasedCoaching(
        simCase.coachingMessages, firedIds, patient.completedActionIds, patient.simTimeMinutes,
      );
      if (entries.length) {
        coachingLog = [...coachingLog, ...entries];
        patient = { ...patient, firedCoachingIds: [...firedIds, ...entries.map(e => e.id)] };
      }
    }

    // 7. Check endings (highest priority first)
    const ending = checkEndings(patient, simCase.endings);
    if (ending) {
      activeEndingId = ending.id;
      return { patient, phase: 'ended', activeEndingId, eventLog: events, scores, casePhase, coachingLog };
    }
  }

  return { patient, phase: 'playing', activeEndingId, eventLog: events, scores, casePhase, coachingLog };
}

// ─── Phase System ─────────────────────────────────────────────────────────────

function tryAdvancePhase(
  current: CasePhase,
  patient: PatientSim,
  phases: PhaseDefinition[],
): CasePhase {
  const currentIdx = PHASE_ORDER.indexOf(current);
  if (currentIdx >= PHASE_ORDER.length - 1) return current;

  const nextId = PHASE_ORDER[currentIdx + 1];
  const nextDef = phases.find(p => p.id === nextId);
  if (!nextDef) return current;
  if (!nextDef.unlockCondition) return nextId; // auto-advance if no condition
  return evaluateCondition(patient, nextDef.unlockCondition) ? nextId : current;
}

// ─── Coaching Helpers ─────────────────────────────────────────────────────────

function fireAfterActionCoaching(
  messages: CoachingMessage[],
  firedIds: string[],
  actionId: string,
  simTime: number,
): CoachingEntry[] {
  return messages
    .filter(m => {
      if (firedIds.includes(m.id)) return false;
      if (m.trigger.type !== 'afterAction') return false;
      return (m.trigger as { type: 'afterAction'; actionId: string }).actionId === actionId;
    })
    .map(m => ({ id: m.id, simTimeMin: simTime, text: m.text, tone: m.tone }));
}

function fireOnPhaseCoaching(
  messages: CoachingMessage[],
  firedIds: string[],
  phase: CasePhase,
  simTime: number,
): CoachingEntry[] {
  return messages
    .filter(m => {
      if (firedIds.includes(m.id)) return false;
      if (m.trigger.type !== 'onPhase') return false;
      return (m.trigger as { type: 'onPhase'; phase: CasePhase }).phase === phase;
    })
    .map(m => ({ id: m.id, simTimeMin: simTime, text: m.text, tone: m.tone }));
}

function fireTimeBasedCoaching(
  messages: CoachingMessage[],
  firedIds: string[],
  completedActionIds: string[],
  simTime: number,
): CoachingEntry[] {
  const entries: CoachingEntry[] = [];
  for (const m of messages) {
    if (firedIds.includes(m.id)) continue;
    if (m.trigger.type === 'missedAction') {
      const t = m.trigger as { type: 'missedAction'; actionId: string; byMin: number };
      if (simTime >= t.byMin && !completedActionIds.includes(t.actionId)) {
        entries.push({ id: m.id, simTimeMin: simTime, text: m.text, tone: m.tone });
      }
    } else if (m.trigger.type === 'atTime') {
      const t = m.trigger as { type: 'atTime'; atMin: number };
      if (simTime >= t.atMin) {
        entries.push({ id: m.id, simTimeMin: simTime, text: m.text, tone: m.tone });
      }
    }
  }
  return entries;
}

// ─── Nursing / Consultant Messages ───────────────────────────────────────────

function checkNursingMessages(patient: PatientSim, messages: NursingMessage[]): NursingMessage[] {
  return messages.filter(msg => {
    if ((msg.onlyOnce !== false) && patient.firedNursingIds.includes(msg.id)) return false;
    if (msg.triggerAtMin !== undefined && patient.simTimeMinutes < msg.triggerAtMin) return false;
    if (msg.requiresFlag && !patient.flags[msg.requiresFlag]) return false;
    if (msg.flagNotSet && patient.flags[msg.flagNotSet]) return false;
    if (msg.vitalBelow && patient.vitals[msg.vitalBelow.key] >= msg.vitalBelow.value) return false;
    if (msg.vitalAbove && patient.vitals[msg.vitalAbove.key] < msg.vitalAbove.value) return false;
    return true;
  });
}

// ─── Ending Check ─────────────────────────────────────────────────────────────

function evaluateEndingCondition(patient: PatientSim, cond: EndingCondition): boolean {
  if (cond.and) return cond.and.every(c => evaluateEndingCondition(patient, c));
  if (cond.or)  return cond.or.some(c  => evaluateEndingCondition(patient, c));

  if (cond.vitalAbove !== undefined && patient.vitals[cond.vitalAbove.key] <= cond.vitalAbove.value) return false;
  if (cond.vitalBelow !== undefined && patient.vitals[cond.vitalBelow.key] >= cond.vitalBelow.value) return false;
  if (cond.hiddenAbove !== undefined) {
    const v = patient.hiddenVitals[cond.hiddenAbove.key] ?? 0;
    if (v <= cond.hiddenAbove.value) return false;
  }
  if (cond.hiddenBelow !== undefined) {
    const v = patient.hiddenVitals[cond.hiddenBelow.key] ?? 0;
    if (v >= cond.hiddenBelow.value) return false;
  }
  if (cond.flagSet    !== undefined && !patient.flags[cond.flagSet])   return false;
  if (cond.flagNotSet !== undefined &&  patient.flags[cond.flagNotSet]) return false;
  if (cond.simTimeAbove !== undefined && patient.simTimeMinutes <= cond.simTimeAbove) return false;
  if (cond.simTimeBelow !== undefined && patient.simTimeMinutes >= cond.simTimeBelow) return false;
  if (cond.metricBelow !== undefined) {
    const v = (patient.metrics[cond.metricBelow.key] as number) ?? Infinity;
    if (v >= cond.metricBelow.value) return false;
  }
  if (cond.metricAbove !== undefined) {
    const v = (patient.metrics[cond.metricAbove.key] as number) ?? -Infinity;
    if (v <= cond.metricAbove.value) return false;
  }
  return true;
}

export function checkEndings(patient: PatientSim, endings: SimEnding[]): SimEnding | null {
  const sorted = [...endings].sort((a, b) => b.priority - a.priority);
  for (const ending of sorted) {
    if (evaluateEndingCondition(patient, ending.condition)) return ending;
  }
  return null;
}

// Re-export for convenience
export { evaluateCondition } from './deteriorationEngine';
export { viewOrderResult } from './orderEngine';
