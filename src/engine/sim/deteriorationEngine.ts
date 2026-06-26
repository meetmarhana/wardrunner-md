import type {
  PatientSim,
  SimVitals,
  ThresholdCondition,
  DeteriorationThreshold,
} from '../../types/simulation';

// ─── Condition Evaluation ─────────────────────────────────────────────────────

export function evaluateCondition(patient: PatientSim, cond: ThresholdCondition): boolean {
  if (cond.and) return cond.and.every(c => evaluateCondition(patient, c));
  if (cond.or)  return cond.or.some(c  => evaluateCondition(patient, c));

  if (cond.vitalBelow !== undefined) {
    const v = patient.vitals[cond.vitalBelow.key];
    if (v === undefined || v >= cond.vitalBelow.value) return false;
  }
  if (cond.vitalAbove !== undefined) {
    const v = patient.vitals[cond.vitalAbove.key];
    if (v === undefined || v <= cond.vitalAbove.value) return false;
  }
  if (cond.hiddenBelow !== undefined) {
    const v = patient.hiddenVitals[cond.hiddenBelow.key];
    if (v === undefined || v >= cond.hiddenBelow.value) return false;
  }
  if (cond.hiddenAbove !== undefined) {
    const v = patient.hiddenVitals[cond.hiddenAbove.key];
    if (v === undefined || v <= cond.hiddenAbove.value) return false;
  }
  if (cond.simTimeAbove !== undefined && patient.simTimeMinutes <= cond.simTimeAbove) return false;
  if (cond.simTimeBelow !== undefined && patient.simTimeMinutes >= cond.simTimeBelow) return false;
  if (cond.flagSet     !== undefined && !patient.flags[cond.flagSet])   return false;
  if (cond.flagNotSet  !== undefined &&  patient.flags[cond.flagNotSet]) return false;

  return true;
}

// ─── Drift Application ────────────────────────────────────────────────────────

function clampVital(key: keyof SimVitals, value: number): number {
  const limits: Partial<Record<keyof SimVitals, [number, number]>> = {
    hr:    [20,  250],
    sbp:   [0,   250],
    dbp:   [0,   180],
    map:   [0,   200],
    rr:    [0,   60],
    spo2:  [0,   100],
    temp:  [30,  44],
    gcs:   [3,   15],
    uoMlHr:[0,   800],
  };
  const [lo, hi] = limits[key] ?? [-Infinity, Infinity];
  return Math.max(lo, Math.min(hi, value));
}

export function applyDrift(patient: PatientSim): PatientSim {
  const curve = patient.deteriorationCurve;

  // Compute effective vital drift:
  //   base curve drift
  //   + per-action modifiers (set by treatment actions)
  //   + per-treatment-response modifiers (from TreatmentResponse[] when flag active)
  const effectiveVitalDrift: Partial<Record<keyof SimVitals, number>> = { ...curve.vitalsDriftPerMin };
  const effectiveHiddenDrift: Record<string, number>                  = { ...curve.hiddenDriftPerMin };

  // Apply treatment responses from the curve
  for (const tr of curve.treatmentResponses) {
    if (patient.flags[tr.requiresFlag]) {
      for (const [k, delta] of Object.entries(tr.vitalsDriftModifier)) {
        const key = k as keyof SimVitals;
        effectiveVitalDrift[key] = (effectiveVitalDrift[key] ?? 0) + delta;
      }
      if (tr.hiddenDriftModifier) {
        for (const [k, delta] of Object.entries(tr.hiddenDriftModifier)) {
          effectiveHiddenDrift[k] = (effectiveHiddenDrift[k] ?? 0) + (delta ?? 0);
        }
      }
    }
  }

  // Apply action-applied modifiers (stacked separately)
  for (const [k, delta] of Object.entries(patient.activeDriftModifiers.vitals)) {
    const key = k as keyof SimVitals;
    effectiveVitalDrift[key] = (effectiveVitalDrift[key] ?? 0) + delta;
  }
  for (const [k, delta] of Object.entries(patient.activeDriftModifiers.hidden)) {
    effectiveHiddenDrift[k] = (effectiveHiddenDrift[k] ?? 0) + delta;
  }

  // Apply to vitals (one tick = one sim-minute)
  const newVitals: SimVitals = { ...patient.vitals };
  for (const [k, delta] of Object.entries(effectiveVitalDrift)) {
    const key = k as keyof SimVitals;
    newVitals[key] = clampVital(key, (newVitals[key] ?? 0) + (delta ?? 0));
  }
  // Recompute MAP
  newVitals.map = Math.round(newVitals.dbp + (newVitals.sbp - newVitals.dbp) / 3);

  // Apply to hidden vitals
  const newHidden: Record<string, number> = { ...patient.hiddenVitals };
  for (const [k, delta] of Object.entries(effectiveHiddenDrift)) {
    newHidden[k] = Math.max(0, (newHidden[k] ?? 0) + delta);
  }

  return { ...patient, vitals: newVitals, hiddenVitals: newHidden };
}

// ─── Threshold Checking ───────────────────────────────────────────────────────

export function checkThresholds(
  patient: PatientSim,
  thresholds: DeteriorationThreshold[],
): string[] {
  const newCascades: string[] = [];

  for (const threshold of thresholds) {
    if (threshold.onlyOnce && patient.firedThresholdIds.includes(threshold.id)) continue;
    if (evaluateCondition(patient, threshold.condition)) {
      newCascades.push(threshold.triggersCascadeId);
    }
  }
  return newCascades;
}

// ─── Status Derivation ────────────────────────────────────────────────────────

export function deriveStatus(vitals: SimVitals, currentStatus: PatientSim['status']): PatientSim['status'] {
  // Terminal states are sticky
  if (currentStatus === 'dead' || currentStatus === 'cardiac-arrest' ||
      currentStatus === 'icu-transferred' || currentStatus === 'discharged') {
    return currentStatus;
  }
  if (vitals.sbp < 60 || vitals.gcs <= 5)   return 'critical';
  if (vitals.sbp < 85 || vitals.spo2 < 88 ||
      vitals.hr > 140  || vitals.gcs <= 10)  return 'critical';
  if (vitals.sbp < 100 || vitals.spo2 < 94 ||
      vitals.hr > 120  || vitals.gcs <= 13)  return 'guarded';
  if (vitals.sbp > 105 && vitals.spo2 >= 95 &&
      vitals.hr < 110  && vitals.gcs >= 14)  return 'improving';
  return 'stable';
}
