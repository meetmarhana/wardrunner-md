import type { Achievement } from '../types/profile';
import type { GameState } from '../types/case';
import achievementsData from '../data/achievements.json';

export const ALL_ACHIEVEMENTS: Achievement[] = achievementsData as Achievement[];

export function getAchievement(id: string): Achievement | undefined {
  return ALL_ACHIEVEMENTS.find(a => a.id === id);
}

// Check which achievements should unlock after a case completes.
// Returns array of newly earned achievement IDs.
export function checkAchievements(params: {
  gameState: GameState;
  grade: string;
  caseId: string;
  casesCompleted: number;     // total AFTER this case
  casesPassed: number;
  currentLevel: number;
  previousLevel: number;
  unlockedIds: string[];      // already unlocked
  consecutiveSafetyHighCases: number;
  allWrong: boolean;          // true if no wrong answers this case
}): string[] {
  const {
    gameState,
    grade,
    caseId,
    casesCompleted,
    casesPassed,
    currentLevel,
    previousLevel,
    unlockedIds,
    consecutiveSafetyHighCases,
    allWrong,
  } = params;

  const newIds: string[] = [];

  const unlock = (id: string) => {
    if (!unlockedIds.includes(id) && !newIds.includes(id)) newIds.push(id);
  };

  const scores = gameState.scores ?? {};

  // ── Progression ────────────────────────────────────────────────────────────

  // first-save: very first case ever completed
  if (casesCompleted === 1) {
    unlock('first-save');
  }

  // ten-cases: exactly 10 cases completed
  if (casesCompleted === 10) {
    unlock('ten-cases');
  }

  // fifty-saves: 50 cases passed (passed, not just completed)
  if (casesPassed === 50) {
    unlock('fifty-saves');
  }

  // Level-up badges — fire on the transition, not on each visit to that level
  if (currentLevel > previousLevel) {
    if (currentLevel >= 2) unlock('intern-badge');
    if (currentLevel >= 3) unlock('resident-badge');
    if (currentLevel >= 6) unlock('attending-badge');
    if (currentLevel >= 7) unlock('professor-badge');
  }

  // ── Clinical ───────────────────────────────────────────────────────────────

  // stemi-slayer: A grade on the ACS/STEMI case
  if (caseId === 'acs-stemi' && grade === 'A') {
    unlock('stemi-slayer');
  }

  // guideline-master: guideline sub-score ≥ 90
  if ((scores.guideline ?? 0) >= 90) {
    unlock('guideline-master');
  }

  // clinical-detective: diagnostic sub-score ≥ 90
  if ((scores.diagnostic ?? 0) >= 90) {
    unlock('clinical-detective');
  }

  // budget-boss: cost sub-score ≥ 90
  if ((scores.cost ?? 0) >= 90) {
    unlock('budget-boss');
  }

  // icu-transfer-avoided: passed a critical case without the case ending in critical/deceased
  const isCritical = gameState.severity === 'critical';
  if (isCritical && grade !== 'F') {
    unlock('icu-transfer-avoided');
  }

  // bounced-back: case completed with a non-critical severity (came back from guarded/critical)
  if (gameState.severity === 'stable' || gameState.severity === 'guarded') {
    unlock('bounced-back');
  }

  // ── Safety ─────────────────────────────────────────────────────────────────

  // no-harm-done: perfect safety score
  if ((scores.safety ?? 0) === 100) {
    unlock('no-harm-done');
  }

  // patient-safety-hero: safety score ≥ 80 in 5 consecutive cases
  // consecutiveSafetyHighCases is already incremented by the caller AFTER this case
  if (consecutiveSafetyHighCases >= 5) {
    unlock('patient-safety-hero');
  }

  // do-no-harm: zero wrong answers the entire case (allWrong === false means no wrongs)
  if (allWrong === false) {
    unlock('do-no-harm');
  }

  // ── Mastery / Secret ───────────────────────────────────────────────────────

  // perfect-run: grade A AND every tracked sub-score ≥ 80
  const subScoreKeys: (keyof typeof scores)[] = [
    'guideline',
    'diagnostic',
    'cost',
    'time',
    'safety',
  ];
  const allScoresHigh = subScoreKeys.every(k => (scores[k] ?? 0) >= 80);
  if (grade === 'A' && allScoresHigh) {
    unlock('perfect-run');
  }

  // aortic-ace: aortic dissection case completed without the thrombolysis trap
  // earnedBadges is used to track harmful in-case events
  const patientHarmed =
    Array.isArray(gameState.earnedBadges) &&
    gameState.earnedBadges.includes('patient-harmed');
  if (caseId === 'aortic-dissection' && !patientHarmed) {
    unlock('aortic-ace');
  }

  // ── Speed ──────────────────────────────────────────────────────────────────

  // speed-demon: time sub-score ≥ 90
  if ((scores.time ?? 0) >= 90) {
    unlock('speed-demon');
  }

  // rapid-responder: case finished in under 10 in-game minutes
  if ((gameState.elapsedMinutes ?? Infinity) < 10) {
    unlock('rapid-responder');
  }

  return newIds;
}
