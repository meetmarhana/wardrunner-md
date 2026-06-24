import type { PlayerProfile, CaseRecord, Rank, LevelConfig } from '../types/profile';
import type { GameState } from '../types/case';

export const LEVEL_CONFIG: LevelConfig[] = [
  { level: 1, rank: 'Medical Student', xpRequired: 0,    color: 'text-slate-400',   unlocksSpecialty: 'Cardiology' },
  { level: 2, rank: 'Intern',          xpRequired: 200,  color: 'text-green-400' },
  { level: 3, rank: 'Resident',        xpRequired: 600,  color: 'text-blue-400',   unlocksSpecialty: 'Internal Medicine' },
  { level: 4, rank: 'Senior Resident', xpRequired: 1400, color: 'text-purple-400', unlocksSpecialty: 'Emergency Medicine' },
  { level: 5, rank: 'Chief Resident',  xpRequired: 2800, color: 'text-yellow-400', unlocksSpecialty: 'ICU' },
  { level: 6, rank: 'Attending',       xpRequired: 5000, color: 'text-orange-400', unlocksSpecialty: 'Surgery' },
  { level: 7, rank: 'Professor',       xpRequired: 9000, color: 'text-red-400',    unlocksSpecialty: 'Advanced Cases' },
];

const STORAGE_KEY = 'wardrunner_profile';

export function createProfile(name: string): PlayerProfile {
  const id = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  const now = Date.now();
  return {
    id,
    name,
    createdAt: now,
    totalXP: 0,
    level: 1,
    rank: 'Medical Student',
    casesCompleted: 0,
    casesPassed: 0,
    casesFailed: 0,
    totalPatientsManaged: 0,
    averageScore: 0,
    survivalRate: 100,
    unlockedAchievementIds: [],
    caseHistory: [],
    unlockedSpecialties: getUnlockedSpecialties(1),
  };
}

export function loadProfile(): PlayerProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PlayerProfile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Storage may be unavailable (private browsing quota exceeded, etc.) — fail silently
  }
}

export function computeXPFromGame(gameState: GameState, grade: string): number {
  // Base XP by grade
  const baseXP: Record<string, number> = { A: 150, B: 100, C: 60, D: 30, F: 10 };
  let xp = baseXP[grade] ?? 10;

  // Bonus: +50 if patient severity at case end was not critical/deceased
  const noCritical = gameState.severity !== 'critical' && gameState.severity !== 'deceased';
  if (noCritical) xp += 50;

  // Bonus: +30 if guideline score >= 80
  if (gameState.scores.guideline >= 80) xp += 30;

  // Bonus: +20 if time score >= 80
  if (gameState.scores.time >= 80) xp += 20;

  return xp;
}

export function addCaseRecord(profile: PlayerProfile, record: CaseRecord): PlayerProfile {
  const updated = { ...profile };

  // Append record
  updated.caseHistory = [...profile.caseHistory, record];

  // Update XP and counts
  updated.totalXP = profile.totalXP + record.xpEarned;
  updated.casesCompleted = profile.casesCompleted + 1;
  updated.totalPatientsManaged = profile.totalPatientsManaged + 1;

  if (record.passed) {
    updated.casesPassed = profile.casesPassed + 1;
  } else {
    updated.casesFailed = profile.casesFailed + 1;
  }

  // Recalculate average score (mean of composite score across history)
  const compositeScores = updated.caseHistory.map(c => {
    const s = c.scores;
    return (s.diagnostic + s.safety + s.time + s.cost + s.guideline) / 5;
  });
  updated.averageScore =
    compositeScores.length > 0
      ? Math.round(compositeScores.reduce((a, b) => a + b, 0) / compositeScores.length)
      : 0;

  // Recalculate survival rate (% where patient did not end as 'deceased')
  // A passed case with grade >= C implies survival; treat 'passed' as a survival proxy
  const survived = updated.caseHistory.filter(c => c.passed).length;
  updated.survivalRate =
    updated.casesCompleted > 0
      ? Math.round((survived / updated.casesCompleted) * 100)
      : 100;

  // Recalculate level and rank
  const levelData = getLevelForXP(updated.totalXP);
  updated.level = levelData.level;
  updated.rank = levelData.rank;

  // Recalculate unlocked specialties
  updated.unlockedSpecialties = getUnlockedSpecialties(updated.level);

  return updated;
}

export function getLevelForXP(
  xp: number
): { level: number; rank: Rank; current: LevelConfig; next: LevelConfig | null; progressPct: number } {
  // Walk down from the highest level to find the current tier
  let current = LEVEL_CONFIG[0];
  for (let i = LEVEL_CONFIG.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_CONFIG[i].xpRequired) {
      current = LEVEL_CONFIG[i];
      break;
    }
  }

  const nextIndex = current.level; // level is 1-based; index = level - 1; next index = level
  const next = nextIndex < LEVEL_CONFIG.length ? LEVEL_CONFIG[nextIndex] : null;

  let progressPct = 100;
  if (next) {
    const span = next.xpRequired - current.xpRequired;
    const earned = xp - current.xpRequired;
    progressPct = Math.min(100, Math.round((earned / span) * 100));
  }

  return {
    level: current.level,
    rank: current.rank,
    current,
    next,
    progressPct,
  };
}

export function getUnlockedSpecialties(level: number): string[] {
  return LEVEL_CONFIG.filter(
    cfg => cfg.unlocksSpecialty !== undefined && cfg.level <= level
  ).map(cfg => cfg.unlocksSpecialty as string);
}
