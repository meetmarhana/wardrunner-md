import { useEffect } from 'react';

interface Props {
  newRank: string;
  newLevel: number;
  unlockedSpecialty?: string;
  onDismiss: () => void;
}

export default function LevelUpNotification({ newRank, newLevel, unlockedSpecialty, onDismiss }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-amber-600 to-yellow-500 text-white p-6 rounded-2xl shadow-2xl min-w-72 animate-slide-in"
      style={{
        animation: 'slideInFromRight 0.4s ease-out forwards',
      }}
    >
      <style>{`
        @keyframes slideInFromRight {
          from { opacity: 0; transform: translateX(100%); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-white/80 hover:text-white text-xl leading-none"
        aria-label="Dismiss"
      >
        ✕
      </button>

      {/* Header */}
      <p className="text-2xl font-bold mb-1">🎉 Level Up!</p>

      {/* Rank line */}
      <p className="text-base font-semibold">
        You are now: {newRank} (Level {newLevel})
      </p>

      {/* Unlocked specialty */}
      {unlockedSpecialty && (
        <p className="mt-2 text-sm font-medium text-yellow-100">
          🔓 Unlocked: {unlockedSpecialty}
        </p>
      )}
    </div>
  );
}
