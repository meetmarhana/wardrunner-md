export type Rank =
  | 'Medical Student'
  | 'Intern'
  | 'Resident'
  | 'Senior Resident'
  | 'Chief Resident'
  | 'Attending'
  | 'Professor';

export interface CaseRecord {
  caseId: string;
  completedAt: number; // timestamp
  grade: string;       // A/B/C/D/F
  scores: { diagnostic: number; safety: number; time: number; cost: number; guideline: number };
  earnedBadges: string[];
  xpEarned: number;
  passed: boolean;     // grade >= C
}

export interface PlayerProfile {
  id: string;          // uuid-like, generated once
  name: string;
  createdAt: number;
  totalXP: number;
  level: number;       // 1–7
  rank: Rank;
  casesCompleted: number;
  casesPassed: number;
  casesFailed: number;
  totalPatientsManaged: number;
  averageScore: number;
  survivalRate: number; // % of cases patient survived
  unlockedAchievementIds: string[];
  caseHistory: CaseRecord[];
  unlockedSpecialties: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;       // emoji
  xpReward: number;
  condition: string;  // human-readable unlock condition
  category: 'clinical' | 'progression' | 'mastery' | 'safety' | 'speed';
  secret?: boolean;
}

export interface LevelConfig {
  level: number;
  rank: Rank;
  xpRequired: number;   // total XP to reach this level
  unlocksSpecialty?: string;
  color: string;        // tailwind color class for badge
}
