import type { CaseData, GameState, Choice, Vitals, VitalsDelta, Severity } from '../types/case';

export function initGameState(caseData: CaseData): GameState {
  return {
    caseId: caseData.id,
    currentNodeId: caseData.startNodeId,
    elapsedMinutes: 0,
    severity: 'stable',
    vitals: { ...caseData.patient.initialVitals },
    scores: { diagnostic: 50, safety: 50, time: 50, cost: 50, guideline: 50 },
    history: [],
    earnedBadges: [],
    investigations: [],
    isComplete: false,
  };
}

export function applyChoice(state: GameState, caseData: CaseData, choice: Choice): GameState {
  const node = caseData.nodes.find(n => n.id === state.currentNodeId)!;
  const nextNode = caseData.nodes.find(n => n.id === choice.nextNodeId);

  const newVitals = applyVitalsDelta(state.vitals, choice.vitalsDelta);
  const newScores = { ...state.scores };
  if (choice.scoreDelta) {
    newScores.diagnostic = clamp(newScores.diagnostic + (choice.scoreDelta.diagnostic ?? 0));
    newScores.safety = clamp(newScores.safety + (choice.scoreDelta.safety ?? 0));
    newScores.time = clamp(newScores.time + (choice.scoreDelta.time ?? 0));
    newScores.cost = clamp(newScores.cost + (choice.scoreDelta.cost ?? 0));
    newScores.guideline = clamp(newScores.guideline + (choice.scoreDelta.guideline ?? 0));
  }

  const newBadges = [...state.earnedBadges];
  if (choice.triggerBadge && !newBadges.includes(choice.triggerBadge)) {
    newBadges.push(choice.triggerBadge);
  }

  const newInvestigations = [
    ...state.investigations,
    ...(choice.investigations ?? []),
  ];

  const historyEntry = {
    nodeId: node.id,
    choiceId: choice.id,
    feedback: choice.feedback,
    correct: choice.correct,
    category: node.category,
  };

  const isComplete = !nextNode || nextNode.isTerminal === true;

  return {
    ...state,
    currentNodeId: choice.nextNodeId,
    elapsedMinutes: state.elapsedMinutes + choice.timeAdvanceMin,
    vitals: newVitals,
    scores: newScores,
    severity: computeSeverity(newVitals),
    history: [...state.history, historyEntry],
    earnedBadges: newBadges,
    investigations: newInvestigations,
    isComplete,
  };
}

function applyVitalsDelta(vitals: Vitals, delta?: VitalsDelta): Vitals {
  if (!delta) return vitals;
  return {
    bp: delta.bp ?? vitals.bp,
    hr: delta.hr !== undefined ? clampHr(vitals.hr + delta.hr) : vitals.hr,
    rr: delta.rr !== undefined ? Math.max(4, vitals.rr + delta.rr) : vitals.rr,
    spo2: delta.spo2 !== undefined ? clampSpo2(vitals.spo2 + delta.spo2) : vitals.spo2,
    temp: delta.temp !== undefined ? vitals.temp + delta.temp : vitals.temp,
    gcs: delta.gcs !== undefined ? clampGcs((vitals.gcs ?? 15) + delta.gcs) : vitals.gcs,
  };
}

function computeSeverity(vitals: Vitals): Severity {
  const hr = vitals.hr;
  const spo2 = vitals.spo2;
  const gcs = vitals.gcs ?? 15;
  const [sys] = vitals.bp.split('/').map(Number);

  if (gcs <= 8 || spo2 < 85 || sys < 70 || hr > 160 || hr < 30) return 'deceased';
  if (gcs <= 12 || spo2 < 90 || sys < 90 || hr > 140 || hr < 40) return 'critical';
  if (spo2 < 94 || sys < 100 || hr > 110 || hr < 55) return 'guarded';
  return 'stable';
}

function clamp(v: number) { return Math.max(0, Math.min(100, v)); }
function clampHr(v: number) { return Math.max(0, Math.min(250, v)); }
function clampSpo2(v: number) { return Math.max(0, Math.min(100, v)); }
function clampGcs(v: number) { return Math.max(3, Math.min(15, v)); }

export function computeFinalGrade(scores: GameState['scores']): string {
  const avg = Object.values(scores).reduce((a, b) => a + b, 0) / 5;
  if (avg >= 85) return 'A';
  if (avg >= 70) return 'B';
  if (avg >= 55) return 'C';
  if (avg >= 40) return 'D';
  return 'F';
}

export function getCurrentNode(state: GameState, caseData: CaseData) {
  return caseData.nodes.find(n => n.id === state.currentNodeId);
}
