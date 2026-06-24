export type PatientStatus =
  | 'stable'
  | 'improving'
  | 'deteriorating'
  | 'critical'
  | 'discharged'
  | 'admitted'
  | 'icu'
  | 'or'
  | 'cath-lab'
  | 'dead';

export type Acuity = 1 | 2 | 3 | 4 | 5;

export type EventSeverity = 'info' | 'warning' | 'danger' | 'success';

export type UrgencyLevel = 'ok' | 'warning' | 'danger' | 'imminent';

export type ShiftGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface ShiftEvent {
  time: number;
  patientId: string | null;
  patientName?: string;
  text: string;
  severity: EventSeverity;
}

export interface ActionEffect {
  statusChange?: PatientStatus;
  deteriorationTimerDelta: number;
  scoreImpact: {
    triage?: number;
    safety?: number;
    guideline?: number;
    time?: number;
  };
  eventMessage: string;
  eventSeverity: EventSeverity;
  feedback: string;
  isCorrect: boolean;
  isDangerous: boolean;
  completesPatient?: boolean;
}

export interface ShiftAction {
  id: string;
  label: string;
  category: 'assessment' | 'investigation' | 'treatment' | 'disposition';
  icon: string;
  timeCost: number;
  effect: ActionEffect;
  requiresActionIds?: string[];
  oneTimeUse: boolean;
}

export interface DeteriorationStep {
  statusChange: PatientStatus;
  vitalsChange: Partial<{ bp: string; hr: number; rr: number; spo2: number; temp: number }>;
  eventMessage: string;
  isLethal: boolean;
}

export interface ShiftPatient {
  id: string;
  name: string;
  age: number;
  sex: 'M' | 'F';
  chiefComplaint: string;
  shortSummary: string;
  acuity: Acuity;
  bedNumber: number;
  status: PatientStatus;
  vitals: { bp: string; hr: number; rr: number; spo2: number; temp: number };
  redFlags: string[];
  availableActions: ShiftAction[];
  completedActionIds: string[];
  firstActionAt?: number;
  nextDeteriorationAt: number;
  deteriorationInterval: number;
  deteriorationSteps: DeteriorationStep[];
  deteriorationStepIndex: number;
  outcome: 'pending' | 'saved' | 'harmed' | 'dead';
  score: { triage: number; safety: number; guideline: number; time: number };
  eventLog: ShiftEvent[];
}

export interface ShiftScenario {
  id: string;
  name: string;
  description: string;
  setting: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  teachingFocus: string;
  estimatedMinutes: number;
  optimalPatientOrder: string[];
  patients: ShiftPatient[];
}

export interface ShiftState {
  scenarioId: string;
  currentTime: number;
  patients: ShiftPatient[];
  selectedPatientId: string | null;
  globalEventLog: ShiftEvent[];
  isComplete: boolean;
}

export interface ShiftResult {
  saved: number;
  harmed: number;
  dead: number;
  triageScore: number;
  score: { triage: number; safety: number; guideline: number; time: number; overall: number };
  grade: ShiftGrade;
  xpEarned: number;
  newAchievementIds: string[];
}

export interface BestShiftRecord {
  date: number;
  grade: ShiftGrade;
  saved: number;
  dead: number;
  overallScore: number;
  triageScore: number;
  xpEarned: number;
  scenarioId: string;
}

export interface ShiftPearl {
  diagnosis: string;
  pearl: string;
  keyActions: string[];
  dangerActions: string[];
  priorityReason: string;
}
