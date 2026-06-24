import type { PlayerProfile } from '../types/profile';
import { getLevelForXP, LEVEL_CONFIG } from '../engine/profileEngine';
import { ALL_ACHIEVEMENTS } from '../engine/achievementEngine';

interface Props {
  profile: PlayerProfile;
  onBack: () => void;
  onNavigateAchievements: () => void;
}

// Format a case ID like "acs-stemi-v2" → "Acs Stemi V2"
function formatCaseId(id: string): string {
  return id
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const GRADE_COLORS: Record<string, string> = {
  A: 'text-green-400',
  B: 'text-blue-400',
  C: 'text-yellow-400',
  D: 'text-orange-400',
  F: 'text-red-400',
};

export default function Profile({ profile, onBack, onNavigateAchievements }: Props) {
  const levelData = getLevelForXP(profile.totalXP);
  const currentConfig = levelData.current;
  const nextConfig = levelData.next;
  const isMaxLevel = profile.level >= LEVEL_CONFIG[LEVEL_CONFIG.length - 1].level;

  // Recent cases — last 5, most recent first
  const recentCases = [...profile.caseHistory].reverse().slice(0, 5);

  // Earned achievements
  const earnedAchievements = ALL_ACHIEVEMENTS.filter(a =>
    profile.unlockedAchievementIds.includes(a.id)
  );
  const previewAchievements = earnedAchievements.slice(0, 6);

  const stats = [
    { label: 'Cases Completed', value: profile.casesCompleted },
    { label: 'Cases Passed',    value: profile.casesPassed },
    { label: 'Cases Failed',    value: profile.casesFailed },
    { label: 'Survival Rate',   value: `${profile.survivalRate.toFixed(0)}%` },
    { label: 'Average Score',   value: `${profile.averageScore.toFixed(0)}/100` },
    { label: 'Achievements',    value: `${profile.unlockedAchievementIds.length}/${ALL_ACHIEVEMENTS.length}` },
  ];

  return (
    <div className="bg-slate-900 min-h-screen text-white">
      {/* ── HEADER ── */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-700">
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
        >
          ← Back
        </button>
        <h1 className="text-xl font-bold flex-1 text-center pr-10">My Profile</h1>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">

        {/* ── RANK CARD ── */}
        <div className="bg-slate-800 rounded-2xl p-5 flex flex-col items-center gap-3 shadow-lg">
          {/* Avatar */}
          <div
            className={`rounded-full w-20 h-20 flex items-center justify-center text-3xl font-bold bg-gradient-to-br ${currentConfig.color} bg-slate-700`}
          >
            🩺
          </div>

          {/* Name */}
          <p className="text-xl font-bold">{profile.name}</p>

          {/* Rank badge */}
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold bg-slate-700 ${currentConfig.color}`}
          >
            {profile.rank}
          </span>

          {/* Level */}
          <p className="text-slate-300 text-sm">Level {profile.level}</p>

          {/* XP bar */}
          <div className="w-full">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>{profile.totalXP} XP</span>
              {isMaxLevel ? (
                <span className="text-yellow-400 font-semibold">MAX LEVEL</span>
              ) : nextConfig ? (
                <span>Next: {nextConfig.rank} at {nextConfig.xpRequired} XP</span>
              ) : null}
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-amber-500 to-yellow-400 h-2.5 rounded-full transition-all"
                style={{ width: `${levelData.progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── STATS GRID ── */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Statistics
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {stats.map(stat => (
              <div
                key={stat.label}
                className="bg-slate-800 rounded-xl p-4 flex flex-col gap-1"
              >
                <span className="text-xl font-bold text-white">{stat.value}</span>
                <span className="text-xs text-slate-400">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RECENT CASES ── */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Recent Cases
          </h2>
          {recentCases.length === 0 ? (
            <p className="text-slate-500 text-sm">No cases completed yet</p>
          ) : (
            <div className="space-y-2">
              {recentCases.map((record, i) => (
                <div
                  key={`${record.caseId}-${i}`}
                  className="bg-slate-800 rounded-xl px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {formatCaseId(record.caseId)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(record.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-3 shrink-0">
                    <span
                      className={`text-lg font-bold ${GRADE_COLORS[record.grade] ?? 'text-slate-300'}`}
                    >
                      {record.grade}
                    </span>
                    <span className="text-xs text-amber-400 font-semibold">
                      +{record.xpEarned} XP
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── ACHIEVEMENTS PREVIEW ── */}
        {earnedAchievements.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Achievements
            </h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {previewAchievements.map(a => (
                <div
                  key={a.id}
                  className="flex items-center gap-1.5 bg-slate-800 rounded-full px-3 py-1.5 text-sm"
                  title={a.description}
                >
                  <span>{a.icon}</span>
                  <span className="text-slate-200">{a.title}</span>
                </div>
              ))}
            </div>
            <button
              onClick={onNavigateAchievements}
              className="text-sm text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              View All Achievements →
            </button>
          </div>
        )}

        {/* ── UNLOCKED SPECIALTIES ── */}
        {profile.unlockedSpecialties.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Unlocked Specialties
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.unlockedSpecialties.map(specialty => (
                <span
                  key={specialty}
                  className="bg-slate-700 text-slate-200 text-sm rounded-full px-3 py-1.5 font-medium"
                >
                  {specialty}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
