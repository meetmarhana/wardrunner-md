import { useState } from 'react';
import type { Achievement } from '../types/profile';
import { ALL_ACHIEVEMENTS } from '../engine/achievementEngine';

interface Props {
  unlockedIds: string[];
  onBack: () => void;
}

type Category = 'All' | 'Clinical' | 'Safety' | 'Progression' | 'Mastery' | 'Speed';

const CATEGORIES: Category[] = ['All', 'Clinical', 'Safety', 'Progression', 'Mastery', 'Speed'];

export default function AchievementGallery({ unlockedIds, onBack }: Props) {
  const [activeCategory, setActiveCategory] = useState<Category>('All');

  const filteredAchievements: Achievement[] =
    activeCategory === 'All'
      ? ALL_ACHIEVEMENTS
      : ALL_ACHIEVEMENTS.filter(
          (a) => a.category.toLowerCase() === activeCategory.toLowerCase()
        );

  const totalUnlocked = unlockedIds.length;
  const totalAchievements = ALL_ACHIEVEMENTS.length;
  const progressPercent =
    totalAchievements > 0 ? Math.round((totalUnlocked / totalAchievements) * 100) : 0;

  return (
    <div className="bg-slate-900 min-h-screen text-white">
      {/* ── HEADER ── */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-700 px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-white transition-colors p-1 -ml-1"
            aria-label="Go back"
          >
            ← Back
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Achievements</h1>
            <p className="text-xs text-slate-400">
              {totalUnlocked} / {totalAchievements} unlocked
            </p>
          </div>
        </div>

        {/* ── PROGRESS BAR ── */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Overall Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* ── CATEGORY FILTER TABS ── */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── ACHIEVEMENT GRID ── */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filteredAchievements.map((achievement) => {
          const isUnlocked = unlockedIds.includes(achievement.id);
          const isSecret = achievement.secret && !isUnlocked;

          return (
            <div
              key={achievement.id}
              className={`relative rounded-xl p-3 border transition-all ${
                isUnlocked
                  ? 'bg-slate-800 border-green-700'
                  : 'bg-slate-800/40 border-slate-700'
              }`}
            >
              {/* Unlocked badge */}
              {isUnlocked && (
                <span className="absolute top-2 right-2 text-xs text-green-400 font-semibold bg-green-400/10 border border-green-400/30 rounded-full px-1.5 py-0.5">
                  ✓ Unlocked
                </span>
              )}

              {/* Icon */}
              <div
                className={`text-3xl mb-2 leading-none ${
                  isUnlocked ? '' : 'opacity-30 grayscale'
                }`}
              >
                {isSecret ? '🔒' : achievement.icon}
              </div>

              {isSecret ? (
                /* Secret locked state */
                <>
                  <p className="font-semibold text-slate-500 text-sm">
                    ??? Secret Achievement
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Keep playing to unlock this hidden achievement.
                  </p>
                </>
              ) : (
                /* Normal state */
                <>
                  <p
                    className={`font-semibold text-sm leading-tight pr-12 ${
                      isUnlocked ? 'text-white' : 'text-slate-500'
                    }`}
                  >
                    {achievement.title}
                  </p>
                  <p
                    className={`text-xs mt-1 leading-snug ${
                      isUnlocked ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {achievement.description}
                  </p>

                  {/* Category chip */}
                  <span
                    className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full border ${
                      isUnlocked
                        ? 'text-slate-300 border-slate-600 bg-slate-700'
                        : 'text-slate-600 border-slate-700 bg-slate-800/60'
                    }`}
                  >
                    {achievement.category}
                  </span>

                  {/* XP reward */}
                  <div className="mt-2">
                    <span
                      className={`text-xs font-semibold ${
                        isUnlocked ? 'text-amber-400' : 'text-slate-600'
                      }`}
                    >
                      +{achievement.xpReward} XP
                    </span>
                  </div>

                  {/* Condition text */}
                  {achievement.condition && (
                    <p className="text-xs text-slate-400 mt-1 leading-snug">
                      {achievement.condition}
                    </p>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
