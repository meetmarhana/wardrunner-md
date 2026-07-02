// ─── Vitals ──────────────────────────────────────────────────────────────────

export interface SimVitals {
  hr: number;       // bpm
  sbp: number;      // systolic mmHg
  dbp: number;      // diastolic mmHg
  map: number;      // mean arterial pressure (computed)
  rr: number;       // breaths/min
  spo2: number;     // %
  temp: number;     // °C
  gcs: number;      // 3–15
  uoMlHr: number;   // urine output mL/hr
}

// Hidden from player — engine tracks; only revealed when the right investigation is ordered AND viewed
export type HiddenVitals = Record<string, number>;
// e.g. { lactate: 5.8, creatinine: 203, wbc: 22.4, potassium: 3.6, bicarb: 16, fluidBalance: 0 }

// ─── Patient Status ───────────────────────────────────────────────────────────

export type SimPatientStatus =
  | 'stable'
  | 'guarded'
  | 'critical'
  | 'intubated'
  | 'cardiac-arrest'
  | 'dead'
  | 'improving'
  | 'discharged'
  | 'icu-transferred';

export interface ActiveProblem {
  id: string;
  label: string;
  discoveredAtMin: number;
  source: 'presentation' | 'cascade' | 'complication' | 'revealed';
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrderType = 'lab' | 'imaging' | 'cardiac' | 'procedure' | 'consult' | 'medication';

export interface OrderResultValue {
  key: string;
  label: string;
  value: string;
  flagged: boolean;
  normal?: string;
}

export interface OrderResult {
  type: 'lab-panel' | 'imaging-report' | 'ecg-report' | 'consult-note';
  values?: OrderResultValue[];
  reportText?: string;
  isAbnormal: boolean;
  // Applied to engine state when player opens/views the result
  revealsHiddenVitals?: Partial<HiddenVitals>;
  setsFlags?: string[];
}

export interface Order {
  id: string;
  actionId: string;
  type: OrderType;
  label: string;
  orderedAtMin: number;
  arrivedAtMin: number;    // orderedAtMin + timeCostMin
  viewedAtMin?: number;    // set when player opens the result
  result: OrderResult;
  isArrived: boolean;
  isViewed: boolean;
}

// Authored in case data; engine instantiates into Order
export interface OrderTemplate {
  type: OrderType;
  label: string;
  timeCostMin: number;
  result: OrderResult;
}

// ─── Case Phase System ────────────────────────────────────────────────────────

export type CasePhase = 'history' | 'workup' | 'treatment' | 'complication' | 'disposition';

export const PHASE_ORDER: CasePhase[] = [
  'history', 'workup', 'treatment', 'complication', 'disposition',
];

export interface PhaseDefinition {
  id: CasePhase;
  label: string;
  description?: string;
  unlockCondition?: ThresholdCondition;  // undefined = unlocks from start
}

// ─── Coaching System ──────────────────────────────────────────────────────────

export type CoachingTone = 'praise' | 'nudge' | 'warn' | 'teach';

export type CoachingTrigger =
  | { type: 'afterAction'; actionId: string }
  | { type: 'missedAction'; actionId: string; byMin: number }
  | { type: 'onCascade'; cascadeId: string }
  | { type: 'onPhase'; phase: CasePhase }
  | { type: 'atTime'; atMin: number };

export interface CoachingMessage {
  id: string;
  text: string;
  tone: CoachingTone;
  trigger: CoachingTrigger;
}

export interface CoachingEntry {
  id: string;
  simTimeMin: number;
  text: string;
  tone: CoachingTone;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export type ActionCategory =
  | 'assessment'
  | 'investigation'
  | 'treatment'
  | 'procedure'
  | 'disposition'
  | 'consult'
  | 'monitoring';

export interface SimScoreImpact {
  safety?: number;
  guideline?: number;
  time?: number;
  cost?: number;
  diagnostic?: number;
}

export interface SimEffect {
  // Information revelation
  revealsHistory?: string[];
  revealsMedications?: string[];
  revealsAllergies?: string[];
  addsActiveProblems?: string[];     // IDs looked up from case activeProblemCatalog

  // Order placement
  placesOrder?: OrderTemplate;

  // Immediate state changes
  vitalsDelta?: Partial<SimVitals>;
  hiddenVitalsDelta?: Partial<HiddenVitals>;

  // Deterioration modification (persists after action)
  deteriorationRateDelta?: number;
  vitalsDriftModifier?: Partial<Record<keyof SimVitals, number>>;
  hiddenDriftModifier?: Partial<Record<string, number>>;

  // Flag operations
  setsFlags?: string[];
  clearsFlags?: string[];

  // Cascade events to trigger immediately (checked before time advance)
  triggersCascadeIds?: string[];

  // Metric recording for personalised debrief
  // value = -1 means "use current simTime"
  recordsMetric?: { key: string; value: number | boolean };

  // Event log entry
  eventMessage?: string;
  eventSeverity?: 'info' | 'warning' | 'danger' | 'success';

  // Score tracking
  scoreImpact?: SimScoreImpact;

  // Problem list management
  resolvesProblems?: string[];   // problem IDs to move from active → resolved
}

export interface SimAction {
  id: string;
  label: string;
  sublabel?: string;
  description?: string;
  category: ActionCategory;
  icon: string;
  timeCostMin: number;

  // Availability gating — all conditions must pass
  requiresActionIds?: string[];   // all must be completed
  requiresFlags?: string[];       // all must be set
  blockedByFlags?: string[];      // any blocks the action
  availableOnce?: boolean;        // default: true

  // Phase gate: blocks action until this case phase is reached
  phase?: CasePhase;

  effect: SimEffect;

  // Called at order-instantiation time to generate a result from current patient state.
  // Not JSON-serializable — only valid in in-memory case data (TypeScript files).
  // Overrides effect.placesOrder.result when present.
  dynamicResult?: (patient: PatientSim) => OrderResult;
}

// ─── Deterioration ────────────────────────────────────────────────────────────

export interface ThresholdCondition {
  vitalBelow?: { key: keyof SimVitals; value: number };
  vitalAbove?: { key: keyof SimVitals; value: number };
  hiddenBelow?: { key: string; value: number };
  hiddenAbove?: { key: string; value: number };
  simTimeAbove?: number;
  simTimeBelow?: number;
  flagSet?: string;
  flagNotSet?: string;
  and?: ThresholdCondition[];
  or?: ThresholdCondition[];
}

export interface DeteriorationThreshold {
  id: string;
  condition: ThresholdCondition;
  triggersCascadeId: string;
  onlyOnce: boolean;
}

export interface TreatmentResponse {
  requiresFlag: string;
  vitalsDriftModifier: Partial<Record<keyof SimVitals, number>>;
  hiddenDriftModifier?: Partial<Record<string, number>>;
  baseRateModifier: number;
}

export interface DeteriorationCurve {
  baseRate: number;
  vitalsDriftPerMin: Partial<Record<keyof SimVitals, number>>;
  hiddenDriftPerMin: Record<string, number>;
  thresholds: DeteriorationThreshold[];
  treatmentResponses: TreatmentResponse[];
}

// ─── Cascade Events ───────────────────────────────────────────────────────────

export type CascadeSeverity = 'info' | 'warning' | 'critical' | 'fatal';

export interface CascadeEvent {
  id: string;
  title: string;
  narrative: string;
  severity: CascadeSeverity;
  vitalsDelta?: Partial<SimVitals>;
  hiddenVitalsDelta?: Partial<HiddenVitals>;
  setsFlags?: string[];
  clearsFlags?: string[];
  addsActiveProblems?: string[];
  addsAvailableActionIds?: string[];
  deteriorationRateDelta?: number;
  vitalsDriftModifier?: Partial<Record<keyof SimVitals, number>>;
  scoreImpact?: SimScoreImpact;
  forcesEndingId?: string;
}

// ─── Endings ──────────────────────────────────────────────────────────────────

export type EndingSeverity = 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical' | 'death';

export interface EndingCondition {
  vitalAbove?: { key: keyof SimVitals; value: number };
  vitalBelow?: { key: keyof SimVitals; value: number };
  hiddenAbove?: { key: string; value: number };
  hiddenBelow?: { key: string; value: number };
  flagSet?: string;
  flagNotSet?: string;
  metricBelow?: { key: string; value: number };
  metricAbove?: { key: string; value: number };
  simTimeAbove?: number;
  simTimeBelow?: number;
  and?: EndingCondition[];
  or?: EndingCondition[];
}

export interface EndingDebrief {
  keyMoment: string;
  whatWentWell: string[];
  whatWasMissed: string[];
  optimalPath: string;
  clinicalPearl: string;
  evidenceRef?: string;
}

export interface SimEnding {
  id: string;
  title: string;
  severity: EndingSeverity;
  narrative: string;
  priority: number;          // higher = checked first; death = 100
  condition: EndingCondition;
  debrief: EndingDebrief;
}

// ─── Patient Simulation State ─────────────────────────────────────────────────

export interface PatientSim {
  caseId: string;

  // Visible to player
  vitals: SimVitals;
  status: SimPatientStatus;
  activeProblems: ActiveProblem[];
  knownHistory: string[];
  revealedMedications: string[];
  revealedAllergies: string[];

  // Engine-internal (never rendered directly)
  internalDiagnosis: string;
  hiddenVitals: HiddenVitals;
  deteriorationCurve: DeteriorationCurve;
  // Active drift modifiers applied by actions/cascades (stacked on base curve)
  activeDriftModifiers: {
    vitals: Partial<Record<keyof SimVitals, number>>;
    hidden: Record<string, number>;
    baseRateDelta: number;
  };
  firedThresholdIds: string[];

  // Time
  simTimeMinutes: number;

  // Orders
  pendingOrders: Order[];
  completedOrders: Order[];

  // Actions
  completedActionIds: string[];

  // State flags
  flags: Record<string, boolean>;

  // Metrics for debrief personalisation
  metrics: Record<string, number | boolean>;

  // Pending cascades queued for processing this tick
  pendingCascadeIds: string[];

  // Unlocked action IDs (beyond what availability gating allows)
  unlockedActionIds: string[];

  // Nursing/consultant messages already fired (prevents re-fire for onlyOnce messages)
  firedNursingIds: string[];

  // Coaching messages already fired
  firedCoachingIds?: string[];

  // Problems that have been resolved (moved from activeProblems)
  resolvedProblems: ActiveProblem[];
}

// ─── Full Simulation State ────────────────────────────────────────────────────

// ─── Nursing / Consultant Messages ───────────────────────────────────────────

export interface NursingMessage {
  id: string;
  text: string;
  source?: 'nurse' | 'consultant' | 'patient' | 'family' | 'note';
  triggerAtMin?: number;
  requiresFlag?: string;
  flagNotSet?: string;
  vitalBelow?: { key: keyof SimVitals; value: number };
  vitalAbove?: { key: keyof SimVitals; value: number };
  onlyOnce?: boolean;                 // default: true
}

export interface SimEvent {
  simTimeMin: number;
  text: string;
  severity: 'info' | 'warning' | 'danger' | 'success';
  source: 'action' | 'cascade' | 'order-arrived' | 'system' | 'nurse' | 'consultant' | 'patient' | 'family' | 'note';
}

export interface SimScores {
  safety: number;       // 0–100
  guideline: number;
  time: number;
  cost: number;
  diagnostic: number;
}

export interface SimState {
  patient: PatientSim;
  phase: 'playing' | 'ended';
  activeEndingId: string | null;
  eventLog: SimEvent[];
  scores: SimScores;
  casePhase?: CasePhase;
  coachingLog?: CoachingEntry[];
}

// ─── Director System ──────────────────────────────────────────────────────────

export type DirectorActor =
  | 'doctor' | 'nurse' | 'patient' | 'family'
  | 'consultant' | 'lab' | 'radiology' | 'pharmacy' | 'hospital';

export type DirectorTone = 'calm' | 'praise' | 'nudge' | 'warn' | 'urgent' | 'relief' | 'sad';
export type DirectorPriority = 'low' | 'medium' | 'high';
export type VisualEffect = 'shake' | 'pulse' | 'greenGlow' | 'redFlash' | 'softFade' | 'flatline';
export type DirectorSound = 'monitorBeep' | 'labDing' | 'phoneRing' | 'alarm' | 'successChime';

export interface DirectorCue {
  id: string;
  trigger: {
    atTime?: number;                          // fires once simTimeMinutes ≥ this value
    afterActionId?: string;                   // fires once this action is completed
    missedActionId?: string;                  // combined with atTime: fires if action NOT done by atTime
    flagSet?: string;                         // fires when this flag becomes true
    flagNotSet?: string;                      // combined with atTime: fires if flag still false at atTime
    vitalBelow?: { key: keyof SimVitals; value: number };
    vitalAbove?: { key: keyof SimVitals; value: number };
  };
  actor: DirectorActor;
  tone: DirectorTone;
  message: string;
  priority: DirectorPriority;
  once: boolean;
  cooldownSec?: number;
  visualEffect?: VisualEffect;
  sound?: DirectorSound;
}

export type DoctorMood  = 'thinking' | 'focused' | 'proud' | 'concerned' | 'alarmed';
export type NurseMood   = 'calm' | 'attentive' | 'worried' | 'relieved';
export type PatientMood = 'stable' | 'scared' | 'confused' | 'distressed' | 'improving' | 'unconscious' | 'dead';
export type FamilyMood  = 'anxious' | 'hopeful' | 'relieved' | 'crying';

export interface CharacterMoods {
  doctor:  DoctorMood;
  nurse:   NurseMood;
  patient: PatientMood;
  family:  FamilyMood;
}

// ─── Case Definition ──────────────────────────────────────────────────────────

export interface CasePresentation {
  chiefComplaint: string;
  oneLiner: string;
  contextNote?: string;
  initialVitals: SimVitals;
  patientName?: string;
  patientAge?: string;
  patientLocation?: string;
  mrn?: string;
}

export interface SimCase {
  id: string;
  title: string;
  specialty: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  tags: string[];

  presentation: CasePresentation;

  // Full initial patient state (caseId filled by engine at init)
  initialPatientState: Omit<PatientSim, 'caseId'>;

  actions: SimAction[];
  cascadeEvents: Record<string, CascadeEvent>;
  activeProblemCatalog: Record<string, string>;  // id → display label
  endings: SimEnding[];
  nursingMessages?: NursingMessage[];
  phases?: PhaseDefinition[];
  coachingMessages?: CoachingMessage[];
  directorCues?: DirectorCue[];

  internalDiagnosis: string;
}
