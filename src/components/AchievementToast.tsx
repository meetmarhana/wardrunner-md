import { useEffect } from 'react';
import type { Achievement } from '../types/profile';

interface Props {
  achievements: Achievement[];
  onDismiss: (id: string) => void;
}

export default function AchievementToast({ achievements, onDismiss }: Props) {
  useEffect(() => {
    if (achievements.length === 0) return;

    const timers = achievements.map((achievement) =>
      setTimeout(() => {
        onDismiss(achievement.id);
      }, 4000)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [achievements, onDismiss]);

  if (achievements.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-2">
      {achievements.map((achievement) => (
        <div
          key={achievement.id}
          className="bg-slate-800 border border-green-600 rounded-xl p-3 w-72 shadow-xl relative"
        >
          {/* Dismiss button */}
          <button
            onClick={() => onDismiss(achievement.id)}
            className="absolute top-2 right-2 text-slate-400 hover:text-slate-200 text-sm leading-none"
            aria-label="Dismiss"
          >
            ✕
          </button>

          {/* Header label */}
          <p className="text-xs text-green-400 font-medium mb-2">
            🏆 Achievement Unlocked!
          </p>

          {/* Icon + details row */}
          <div className="flex items-start gap-3 pr-4">
            <span className="text-2xl leading-none mt-0.5">{achievement.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm leading-tight">
                {achievement.title}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                {achievement.description}
              </p>
            </div>
          </div>

          {/* XP badge */}
          <div className="mt-2 flex justify-end">
            <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-full px-2 py-0.5">
              +{achievement.xpReward} XP
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
