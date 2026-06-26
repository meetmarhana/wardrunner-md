import type { PatientSim, CascadeEvent, SimEvent, ActiveProblem, SimScores } from '../../types/simulation';

// ─── Apply a Single Cascade Event ────────────────────────────────────────────

export function applyCascadeEvent(
  patient: PatientSim,
  event: CascadeEvent,
  activeProblemCatalog: Record<string, string>,
  events: SimEvent[],
  scores?: SimScores,
): { patient: PatientSim; newEvents: SimEvent[]; forcedEndingId: string | null; updatedScores?: SimScores } {
  let p = { ...patient };

  // Vitals delta
  if (event.vitalsDelta) {
    const v = { ...p.vitals };
    for (const [k, delta] of Object.entries(event.vitalsDelta)) {
      const key = k as keyof typeof v;
      (v as Record<string, number>)[key] = Math.max(0, (v[key] ?? 0) + (delta ?? 0));
    }
    // Recompute MAP
    v.map = Math.round(v.dbp + (v.sbp - v.dbp) / 3);
    p = { ...p, vitals: v };
  }

  // Hidden vitals delta
  if (event.hiddenVitalsDelta) {
    const h = { ...p.hiddenVitals };
    for (const [k, delta] of Object.entries(event.hiddenVitalsDelta)) {
      h[k] = Math.max(0, (h[k] ?? 0) + (delta ?? 0));
    }
    p = { ...p, hiddenVitals: h };
  }

  // Flags
  const flags = { ...p.flags };
  if (event.setsFlags)   for (const f of event.setsFlags)  flags[f] = true;
  if (event.clearsFlags) for (const f of event.clearsFlags) delete flags[f];
  p = { ...p, flags };

  // Active problems
  if (event.addsActiveProblems) {
    const existing = new Set(p.activeProblems.map(ap => ap.id));
    const newProblems: ActiveProblem[] = event.addsActiveProblems
      .filter(id => !existing.has(id))
      .map(id => ({
        id,
        label: activeProblemCatalog[id] ?? id,
        discoveredAtMin: p.simTimeMinutes,
        source: 'cascade' as const,
      }));
    p = { ...p, activeProblems: [...p.activeProblems, ...newProblems] };
  }

  // Unlock additional actions
  if (event.addsAvailableActionIds) {
    const unlocked = new Set(p.unlockedActionIds);
    for (const id of event.addsAvailableActionIds) unlocked.add(id);
    p = { ...p, unlockedActionIds: [...unlocked] };
  }

  // Deterioration modifier
  if (event.deteriorationRateDelta !== undefined) {
    p = {
      ...p,
      activeDriftModifiers: {
        ...p.activeDriftModifiers,
        baseRateDelta: p.activeDriftModifiers.baseRateDelta + event.deteriorationRateDelta,
      },
    };
  }
  if (event.vitalsDriftModifier) {
    const vm = { ...p.activeDriftModifiers.vitals };
    for (const [k, delta] of Object.entries(event.vitalsDriftModifier)) {
      vm[k as keyof typeof vm] = (vm[k as keyof typeof vm] ?? 0) + (delta ?? 0);
    }
    p = { ...p, activeDriftModifiers: { ...p.activeDriftModifiers, vitals: vm } };
  }

  // Event log entry
  const newEvent: SimEvent = {
    simTimeMin: patient.simTimeMinutes,
    text: `${event.title}: ${event.narrative}`,
    severity: event.severity === 'fatal' ? 'danger' : event.severity === 'critical' ? 'danger' : event.severity,
    source: 'cascade',
  };

  let updatedScores = scores;
  if (event.scoreImpact && scores) {
    updatedScores = { ...scores };
    for (const [k, delta] of Object.entries(event.scoreImpact)) {
      const key = k as keyof SimScores;
      updatedScores[key] = Math.max(0, Math.min(100, (updatedScores[key] ?? 70) + (delta ?? 0)));
    }
  }

  return {
    patient: p,
    newEvents: [...events, newEvent],
    forcedEndingId: event.forcesEndingId ?? null,
    updatedScores,
  };
}

// ─── Process All Pending Cascades ─────────────────────────────────────────────

export function processPendingCascades(
  patient: PatientSim,
  cascadeEvents: Record<string, CascadeEvent>,
  activeProblemCatalog: Record<string, string>,
  events: SimEvent[],
  scores?: SimScores,
): { patient: PatientSim; newEvents: SimEvent[]; forcedEndingId: string | null; updatedScores?: SimScores } {
  let p = { ...patient, pendingCascadeIds: [] as string[] };
  let evts = events;
  let forcedEnding: string | null = null;
  let currentScores = scores;

  for (const cascadeId of patient.pendingCascadeIds) {
    const cascade = cascadeEvents[cascadeId];
    if (!cascade) continue;

    const result = applyCascadeEvent(p, cascade, activeProblemCatalog, evts, currentScores);
    p    = result.patient;
    evts = result.newEvents;
    if (result.forcedEndingId) forcedEnding = result.forcedEndingId;
    if (result.updatedScores) currentScores = result.updatedScores;
  }

  return { patient: p, newEvents: evts, forcedEndingId: forcedEnding, updatedScores: currentScores };
}
