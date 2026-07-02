// ─── Shift Loop Types (Morning Shift meta-layer) ──────────────────────────────

export type CareerLevel =
  | 'Intern'
  | 'Foundation Year 1'
  | 'Foundation Year 2'
  | 'Core Medical Trainee'
  | 'Senior Trainee'
  | 'Specialty Registrar'
  | 'Senior Registrar'
  | 'Consultant';

export const CAREER_THRESHOLDS: { level: CareerLevel; xp: number }[] = [
  { level: 'Intern',               xp: 0    },
  { level: 'Foundation Year 1',    xp: 150  },
  { level: 'Foundation Year 2',    xp: 350  },
  { level: 'Core Medical Trainee', xp: 600  },
  { level: 'Senior Trainee',       xp: 900  },
  { level: 'Specialty Registrar',  xp: 1300 },
  { level: 'Senior Registrar',     xp: 1800 },
  { level: 'Consultant',           xp: 2500 },
];

export function getCareerLevel(xp: number): CareerLevel {
  const sorted = [...CAREER_THRESHOLDS].reverse();
  return sorted.find(t => xp >= t.xp)?.level ?? 'Intern';
}

export function getNextThreshold(xp: number): { level: CareerLevel; xp: number } | null {
  return CAREER_THRESHOLDS.find(t => t.xp > xp) ?? null;
}

// ─── Case Outcome ─────────────────────────────────────────────────────────────

export interface XPLine {
  label: string;
  xp: number;
  earned: boolean;
}

export interface CaseOutcome {
  endingId: string;
  survived: boolean;
  timeToAntibiotics: number | null;
  culturesFirst: boolean;
  allergyChecked: boolean;
  patientName: string;
  xpEarned: number;
  xpBreakdown: XPLine[];
}

export function computeOutcomeXP(
  endingId: string,
  survived: boolean,
  culturesFirst: boolean,
  allergyChecked: boolean,
  timeToAntibiotics: number | null,
): { total: number; breakdown: XPLine[] } {
  const lines: XPLine[] = [
    {
      label: survived ? 'Patient survived' : 'Case completed',
      xp: survived ? 100 : 30,
      earned: true,
    },
    { label: 'Full recovery',           xp: 50, earned: endingId === 'full-recovery' },
    { label: 'Blood cultures first',    xp: 20, earned: culturesFirst },
    { label: 'Allergy checked',         xp: 15, earned: allergyChecked },
    {
      label: 'Antibiotics < 60 min',
      xp: 25,
      earned: timeToAntibiotics !== null && timeToAntibiotics < 60,
    },
    {
      label: 'Antibiotics < 45 min (bonus)',
      xp: 15,
      earned: timeToAntibiotics !== null && timeToAntibiotics < 45,
    },
  ];
  const total = lines.filter(l => l.earned).reduce((sum, l) => sum + l.xp, 0);
  return { total, breakdown: lines };
}

// ─── Shift State ──────────────────────────────────────────────────────────────

export interface ShiftLoopMetrics {
  patientsSaved: number;
  deaths: number;
  outcomes: CaseOutcome[];
  totalXP: number;
  xpAtShiftStart: number;
}

export type ShiftLoopScreen =
  | 'morning-briefing'
  | 'in-case'
  | 'between-patient'
  | 'shift-summary'
  | 'career-progress';

export function buildShiftRating(metrics: ShiftLoopMetrics): string {
  const { patientsSaved, deaths, outcomes } = metrics;
  const total = outcomes.length;
  if (total === 0) return 'N/A';
  const abxTimes = outcomes.map(o => o.timeToAntibiotics).filter((t): t is number => t !== null);
  const avgAbx = abxTimes.length > 0 ? abxTimes.reduce((a, b) => a + b, 0) / abxTimes.length : null;
  let score = 100;
  score -= deaths * 25;
  if (avgAbx !== null && avgAbx > 80) score -= 10;
  if (avgAbx !== null && avgAbx > 60) score -= 5;
  if (patientsSaved === total && total > 0) score += 10;
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 75) return 'A-';
  if (score >= 65) return 'B+';
  if (score >= 55) return 'B';
  if (score >= 45) return 'B-';
  return 'C';
}

export function getStaffMemoryLine(outcome: CaseOutcome): string {
  if (outcome.endingId === 'full-recovery')
    return "Great save earlier. Ruth's family asked me to pass on their thanks.";
  if (outcome.endingId === 'icu-transfer')
    return "Good call escalating that one. ICU have her stable now.";
  if (outcome.endingId === 'death-anaphylaxis')
    return "The allergy incident has been flagged. Dr. Patel wants a word after the shift.";
  if (outcome.survived)
    return "Tough one earlier. Patient's on the ward now — stable.";
  return "Difficult case. These things happen. Focus on the next one.";
}
