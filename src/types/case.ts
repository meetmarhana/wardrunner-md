export type Severity = 'stable' | 'guarded' | 'critical' | 'deceased';
export type DecisionCategory =
  | 'stabilization'
  | 'history'
  | 'investigation'
  | 'differential'
  | 'diagnosis'
  | 'treatment'
  | 'disposition'
  | 'monitoring';

export interface Vitals {
  bp: string;       // e.g. "180/110"
  hr: number;       // bpm
  rr: number;       // breaths/min
  spo2: number;     // %
  temp: number;     // °C
  gcs?: number;     // 3–15
}

export interface VitalsDelta {
  bp?: string;
  hr?: number;
  rr?: number;
  spo2?: number;
  temp?: number;
  gcs?: number;
}

export interface ScoreDelta {
  diagnostic?: number;   // –10 to +10
  safety?: number;
  time?: number;
  cost?: number;
  guideline?: number;
}

export interface InvestigationResult {
  name: string;
  value: string;
  normal?: string;
  flagged?: boolean;
  image?: string;       // base64 or URL placeholder
}

export interface Choice {
  id: string;
  text: string;
  correct: boolean;
  feedback: string;
  nextNodeId: string;
  timeAdvanceMin: number;       // minutes this choice consumes
  vitalsDelta?: VitalsDelta;
  scoreDelta?: ScoreDelta;
  investigations?: InvestigationResult[];
  triggerBadge?: string;
  educationalNote?: string;
}

export interface CaseNode {
  id: string;
  category: DecisionCategory;
  prompt: string;
  context?: string;              // extra narrative shown above choices
  choices: Choice[];
  isTerminal?: boolean;
}

export interface PatientPresentation {
  age: number;
  sex: 'M' | 'F';
  chiefComplaint: string;
  history: string;
  initialVitals: Vitals;
  symptoms: string[];
  redFlags: string[];
  backgroundHistory: string;
}

export interface Badge {
  id: string;
  label: string;
  icon: string;
  description: string;
  positive: boolean;
}

export interface DiseaseMapEntry {
  presenting: string[];
  redFlags: string[];
  bestFirstStep: string;
  bestInvestigation: string;
  diagnosis: string;
  treatment: string;
  followUp: string;
  complications: string[];
  guidelineRef?: string;
}

export interface Calculator {
  name: string;
  fields: { label: string; key: string; type: 'number' | 'boolean' }[];
  formula: string;   // JS expression string evaluated at runtime
  interpretation: { range: string; meaning: string }[];
}

export interface GuidelineDrawerContent {
  title: string;
  body: string;
  calculators?: Calculator[];
}

export interface CaseData {
  id: string;
  specialty: string;
  title: string;
  subtitle: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  patient: PatientPresentation;
  startNodeId: string;
  nodes: CaseNode[];
  diseaseMap: DiseaseMapEntry;
  guideline: GuidelineDrawerContent;
  availableBadges: Badge[];
  disclaimer: string;
}

export interface GameState {
  caseId: string;
  currentNodeId: string;
  elapsedMinutes: number;
  severity: Severity;
  vitals: Vitals;
  scores: {
    diagnostic: number;
    safety: number;
    time: number;
    cost: number;
    guideline: number;
  };
  history: {
    nodeId: string;
    choiceId: string;
    feedback: string;
    correct: boolean;
    category: DecisionCategory;
  }[];
  earnedBadges: string[];
  investigations: InvestigationResult[];
  isComplete: boolean;
}
