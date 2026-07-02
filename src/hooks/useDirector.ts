import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  PatientSim, SimCase, DirectorCue, CharacterMoods,
  DoctorMood, NurseMood, PatientMood, FamilyMood,
} from '../types/simulation';

// ─── Trigger evaluation ───────────────────────────────────────────────────────

function evaluateTrigger(cue: DirectorCue, patient: PatientSim): boolean {
  const t = cue.trigger;

  // afterActionId: must have completed this action
  if (t.afterActionId && !patient.completedActionIds.includes(t.afterActionId)) return false;

  // missedActionId: fire only if action NOT done (requires atTime)
  if (t.missedActionId && patient.completedActionIds.includes(t.missedActionId)) return false;

  // atTime: sim time must have reached threshold
  if (t.atTime !== undefined && patient.simTimeMinutes < t.atTime) return false;

  // flagSet: flag must be true
  if (t.flagSet && !patient.flags[t.flagSet]) return false;

  // flagNotSet: flag must NOT be set (meaningful combined with atTime or another condition)
  if (t.flagNotSet && patient.flags[t.flagNotSet]) return false;

  // vitalBelow: vital must be below value
  if (t.vitalBelow && patient.vitals[t.vitalBelow.key] >= t.vitalBelow.value) return false;

  // vitalAbove: vital must be above value
  if (t.vitalAbove && patient.vitals[t.vitalAbove.key] <= t.vitalAbove.value) return false;

  // A cue with no trigger conditions at all always fires — guard against that
  const hasAnyCondition =
    t.afterActionId || t.missedActionId || t.atTime !== undefined ||
    t.flagSet || t.flagNotSet || t.vitalBelow || t.vitalAbove;
  if (!hasAnyCondition) return false;

  return true;
}

// ─── Mood derivation ──────────────────────────────────────────────────────────

function deriveCharacterMoods(patient: PatientSim, activeCue: DirectorCue | null): CharacterMoods {
  const s     = patient.status;
  const actor = activeCue?.actor;
  const tone  = activeCue?.tone;

  // ── Doctor ──────────────────────────────────────────────────────────────────
  let doctor: DoctorMood = 'thinking';
  if (s === 'cardiac-arrest' || s === 'dead') doctor = 'alarmed';
  else if (s === 'critical')                  doctor = 'concerned';
  else if (s === 'improving' || s === 'discharged' || s === 'icu-transferred') doctor = 'proud';
  else if (actor === 'doctor' && (tone === 'warn' || tone === 'urgent')) doctor = 'concerned';
  else if (actor === 'doctor' && (tone === 'praise' || tone === 'relief'))  doctor = 'proud';
  else if (actor === 'doctor' && tone === 'nudge')                          doctor = 'focused';

  // ── Nurse ────────────────────────────────────────────────────────────────────
  let nurse: NurseMood = 'calm';
  if (s === 'cardiac-arrest')                              nurse = 'worried';
  else if (s === 'critical')                               nurse = 'attentive';
  else if (s === 'improving' || s === 'discharged')        nurse = 'relieved';
  else if (actor === 'nurse' && (tone === 'warn' || tone === 'urgent')) nurse = 'worried';
  else if (actor === 'nurse' && tone === 'relief')                       nurse = 'relieved';
  else if (actor === 'nurse' && tone === 'nudge')                        nurse = 'attentive';

  // ── Patient ──────────────────────────────────────────────────────────────────
  let patientMood: PatientMood = 'stable';
  if (s === 'dead')                             patientMood = 'dead';
  else if (s === 'cardiac-arrest' || s === 'intubated') patientMood = 'unconscious';
  else if (s === 'critical')                    patientMood = 'distressed';
  else if (s === 'guarded')                     patientMood = patient.flags.oxygenStarted ? 'scared' : 'confused';
  else if (s === 'improving' || s === 'discharged')     patientMood = 'improving';
  else if (actor === 'patient' && tone === 'relief')    patientMood = 'improving';
  else if (actor === 'patient' && (tone === 'sad' || tone === 'urgent')) patientMood = 'distressed';

  // ── Family ────────────────────────────────────────────────────────────────────
  let family: FamilyMood = 'anxious';
  if (s === 'dead')                                         family = 'crying';
  else if (s === 'improving' || s === 'discharged')         family = 'relieved';
  else if (s === 'icu-transferred')                         family = 'hopeful';
  else if (actor === 'family' && (tone === 'sad' || tone === 'urgent')) family = 'crying';
  else if (actor === 'family' && tone === 'relief')         family = 'relieved';
  else if (actor === 'family' && tone === 'praise')         family = 'hopeful';

  return { doctor, nurse, patient: patientMood, family };
}

// ─── Duration by priority ─────────────────────────────────────────────────────

const PRIORITY_MS: Record<string, number> = {
  low:    5500,
  medium: 7500,
  high:   10000,
};

// ─── Director Hook ────────────────────────────────────────────────────────────

export function useDirector(
  patient: PatientSim,
  simCase: SimCase,
): {
  activeCue: DirectorCue | null;
  characterMoods: CharacterMoods;
  dismissCue: () => void;
} {
  const [activeCue, setActiveCue] = useState<DirectorCue | null>(null);

  const firedOnce      = useRef<Set<string>>(new Set());
  const lastFiredMs    = useRef<Map<string, number>>(new Map());
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Snapshot patient into a ref for timer callbacks
  const patientRef = useRef(patient);
  useEffect(() => { patientRef.current = patient; });

  const dismissCue = useCallback(() => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    setActiveCue(null);
  }, []);

  // State key: re-run evaluation whenever meaningful state changes
  const completedStr = patient.completedActionIds.join(',');
  const flagsStr = Object.entries(patient.flags)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .sort()
    .join(',');
  const stateKey = [
    patient.simTimeMinutes,
    patient.status,
    completedStr,
    patient.vitals.sbp,
    patient.vitals.spo2,
    flagsStr,
  ].join('|');

  useEffect(() => {
    const cues = simCase.directorCues;
    if (!cues || cues.length === 0) return;

    const p   = patientRef.current;
    const now = Date.now();

    const PRIORITY_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };

    const candidates = cues.filter(cue => {
      // once-guard
      if (cue.once && firedOnce.current.has(cue.id)) return false;
      // cooldown
      if (cue.cooldownSec) {
        const last = lastFiredMs.current.get(cue.id) ?? 0;
        if (now - last < cue.cooldownSec * 1000) return false;
      }
      return evaluateTrigger(cue, p);
    });

    if (candidates.length === 0) return;

    // Pick highest priority; among equals pick first-authored (deterministic)
    candidates.sort((a, b) => (PRIORITY_RANK[b.priority] ?? 0) - (PRIORITY_RANK[a.priority] ?? 0));
    const chosen = candidates[0];

    // Don't preempt an equal-or-higher priority active cue
    if (activeCue && (PRIORITY_RANK[activeCue.priority] ?? 0) >= (PRIORITY_RANK[chosen.priority] ?? 0)) {
      return;
    }

    // Fire
    if (chosen.once) firedOnce.current.add(chosen.id);
    lastFiredMs.current.set(chosen.id, now);

    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    setActiveCue(chosen);
    dismissTimerRef.current = setTimeout(
      () => setActiveCue(null),
      PRIORITY_MS[chosen.priority] ?? 7500,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateKey]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
  }, []);

  const characterMoods = deriveCharacterMoods(patient, activeCue);

  return { activeCue, characterMoods, dismissCue };
}
