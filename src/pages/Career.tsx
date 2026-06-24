import type { PlayerProfile } from '../types/profile';
import { LEVEL_CONFIG, getLevelForXP } from '../engine/profileEngine';
import { ALL_CASES } from '../data/allCases';

interface Props {
  profile: PlayerProfile;
  onBack: () => void;
  onPlayCase: (caseId: string) => void;
}

// Specialty metadata: level requirement, display label, color scheme, placeholder case count
const SPECIALTY_META: {
  name: string;
  unlockLevel: number;
  color: string;
  borderColor: string;
  bgColor: string;
  description: string;
}[] = [
  {
    name: 'Cardiology',
    unlockLevel: 1,
    color: 'text-red-400',
    borderColor: 'border-red-500',
    bgColor: 'bg-red-950/30',
    description: 'ECG interpretation, chest pain, heart failure',
  },
  {
    name: 'Internal Medicine',
    unlockLevel: 3,
    color: 'text-blue-400',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-950/30',
    description: 'Complex multi-system illness, diagnostic reasoning',
  },
  {
    name: 'Emergency Medicine',
    unlockLevel: 4,
    color: 'text-purple-400',
    borderColor: 'border-purple-500',
    bgColor: 'bg-purple-950/30',
    description: 'Acute presentations, resuscitation, rapid triage',
  },
  {
    name: 'ICU',
    unlockLevel: 5,
    color: 'text-yellow-400',
    borderColor: 'border-yellow-500',
    bgColor: 'bg-yellow-950/30',
    description: 'Ventilator management, organ support, critical care',
  },
  {
    name: 'Surgery',
    unlockLevel: 6,
    color: 'text-orange-400',
    borderColor: 'border-orange-500',
    bgColor: 'bg-orange-950/30',
    description: 'Peri-operative care, surgical emergencies',
  },
  {
    name: 'Advanced Cases',
    unlockLevel: 7,
    color: 'text-red-300',
    borderColor: 'border-red-400',
    bgColor: 'bg-red-900/20',
    description: 'Multi-system failures, rare diagnoses, teaching cases',
  },
];

const MOTIVATIONAL_MESSAGES: Record<string, string> = {
  'Medical Student': 'Every attending was once where you are. Keep going.',
  'Intern': "You're in the trenches now. Every decision shapes a patient's story.",
  'Resident': 'Pattern recognition is your superpower. Trust your training.',
  'Senior Resident': "You've seen things most haven't. Now teach what you know.",
  'Chief Resident': 'Leadership and clinical excellence — the rarest combination. You have both.',
  'Attending': "Your name means something now. Patients and teams look to you. Lead well.",
  'Professor': "You've become the textbook. Every case you teach ripples forward through generations.",
};

function LockIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ChevronLeft({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export default function Career({ profile, onBack, onPlayCase }: Props) {
  const levelData = getLevelForXP(profile.totalXP);
  const { current: currentLevelCfg, next: nextLevelCfg, progressPct } = levelData;

  // Time in service (days since createdAt)
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysInService = Math.max(1, Math.floor((Date.now() - profile.createdAt) / msPerDay));
  const weeksInService = Math.max(1, daysInService / 7);
  const casesPerWeek = (profile.casesCompleted / weeksInService).toFixed(1);

  // XP to next level
  const xpToNext = nextLevelCfg
    ? nextLevelCfg.xpRequired - profile.totalXP
    : 0;

  const motivationalMessage =
    MOTIVATIONAL_MESSAGES[profile.rank] ?? 'Keep pushing. Every case makes you sharper.';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* ── HEADER ── */}
      <header className="flex items-center gap-3 px-4 py-4 border-b border-slate-700/60 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-100 transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-800"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </button>
        <div className="h-4 w-px bg-slate-700" />
        <h1 className="text-lg font-bold tracking-tight">Career Mode</h1>
        <div className="ml-auto text-sm text-slate-400">
          Dr. <span className="text-slate-200 font-medium">{profile.name}</span>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 space-y-8">

        {/* ── MOTIVATIONAL BANNER ── */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 px-5 py-4">
          <p className="text-sm text-yellow-300/80 font-medium italic">
            "{motivationalMessage}"
          </p>
          <p className="text-xs text-slate-500 mt-1">— {profile.rank}</p>
        </div>

        {/* ── XP PROGRESS BAR ── */}
        <div className="rounded-xl bg-slate-800 border border-slate-700/60 px-5 py-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className={`text-xs font-semibold uppercase tracking-widest ${currentLevelCfg.color}`}>
                Level {profile.level}
              </span>
              <span className="text-slate-400 text-xs ml-2">— {profile.rank}</span>
            </div>
            <span className="text-xs text-slate-400">
              {profile.totalXP.toLocaleString()} XP total
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {nextLevelCfg ? (
            <div className="flex justify-between text-xs text-slate-500">
              <span>{progressPct}% to Level {nextLevelCfg.level}</span>
              <span>{xpToNext.toLocaleString()} XP needed</span>
            </div>
          ) : (
            <p className="text-xs text-yellow-400 font-medium">Maximum rank achieved.</p>
          )}
        </div>

        {/* ── CAREER TIMELINE ── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
            Career Timeline
          </h2>
          <div className="relative">
            {/* vertical track line */}
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-slate-700 z-0" />

            <div className="space-y-3">
              {LEVEL_CONFIG.map((cfg) => {
                const isCurrent = cfg.level === profile.level;
                const isCompleted = cfg.level < profile.level;
                const isFuture = cfg.level > profile.level;

                return (
                  <div
                    key={cfg.level}
                    className={`
                      relative z-10 flex items-start gap-4 rounded-xl border px-4 py-3 transition-all
                      ${isCurrent
                        ? 'bg-yellow-950/30 border-yellow-500/70 shadow-lg shadow-yellow-900/20'
                        : isCompleted
                        ? 'bg-slate-800/40 border-slate-700/40 opacity-70'
                        : 'bg-slate-800/20 border-slate-700/20 opacity-50'
                      }
                    `}
                  >
                    {/* Node dot */}
                    <div
                      className={`
                        flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                        ${isCurrent
                          ? 'bg-yellow-500 text-slate-900 ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-900'
                          : isCompleted
                          ? 'bg-green-700 text-green-100'
                          : 'bg-slate-700 text-slate-500'
                        }
                      `}
                    >
                      {isCompleted ? <CheckIcon size={16} /> : isFuture ? <LockIcon size={14} /> : cfg.level}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold text-sm ${isFuture ? 'text-slate-500' : 'text-slate-100'}`}>
                          {cfg.rank}
                        </span>
                        {isCurrent && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 rounded px-1.5 py-0.5 font-medium">
                            ← YOU ARE HERE
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-xs text-green-500 font-medium">Completed</span>
                        )}
                        {cfg.unlocksSpecialty && (
                          <span className={`text-xs px-1.5 py-0.5 rounded border font-medium
                            ${isFuture
                              ? 'text-slate-600 border-slate-700 bg-slate-800/50'
                              : 'text-yellow-300 border-yellow-600/50 bg-yellow-900/20'
                            }`}>
                            🏥 {cfg.unlocksSpecialty}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-slate-500">
                          {cfg.xpRequired > 0
                            ? `${cfg.xpRequired.toLocaleString()} XP required`
                            : 'Starting rank'}
                        </span>
                        <span className={`text-xs font-mono ${cfg.color}`}>
                          Lv.{cfg.level}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── SPECIALTY CARDS ── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
            Specialties
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SPECIALTY_META.map((spec) => {
              const unlocked = profile.level >= spec.unlockLevel;
              const unlockRank = LEVEL_CONFIG.find(c => c.level === spec.unlockLevel)?.rank ?? '';

              return (
                <div
                  key={spec.name}
                  className={`
                    rounded-xl border p-4 transition-all
                    ${unlocked
                      ? `${spec.bgColor} ${spec.borderColor}`
                      : 'bg-slate-800/20 border-slate-700/30 grayscale opacity-50'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className={`font-semibold text-sm ${unlocked ? spec.color : 'text-slate-500'}`}>
                        {spec.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{spec.description}</p>
                    </div>
                    {!unlocked && (
                      <div className="flex-shrink-0 text-slate-600 mt-0.5">
                        <LockIcon size={15} />
                      </div>
                    )}
                  </div>

                  {unlocked ? (
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {ALL_CASES.filter(c => c.specialty === spec.name).length} cases available
                      </span>
                      <button
                        onClick={() => onPlayCase(spec.name.toLowerCase().replace(/\s+/g, '-'))}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors
                          ${spec.color} bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-slate-500`}
                      >
                        Play →
                      </button>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-600">
                      Unlock at Level {spec.unlockLevel} — {unlockRank}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── CAREER STATS ── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
            Career Stats
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="Time in Service"
              value={`${daysInService}d`}
              sub={daysInService === 1 ? 'First day' : `${Math.floor(daysInService / 7)}w ${daysInService % 7}d`}
            />
            <StatCard
              label="Cases / Week"
              value={casesPerWeek}
              sub={`${profile.casesCompleted} total`}
            />
            <StatCard
              label="Cases Completed"
              value={profile.casesCompleted.toString()}
              sub={`${profile.casesPassed} passed · ${profile.casesFailed} failed`}
            />
            <StatCard
              label="XP to Next Level"
              value={nextLevelCfg ? xpToNext.toLocaleString() : '—'}
              sub={nextLevelCfg ? `→ ${nextLevelCfg.rank}` : 'Max rank'}
            />
          </div>
        </section>

        {/* bottom padding */}
        <div className="h-6" />
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-slate-800 border border-slate-700/60 rounded-xl px-4 py-3">
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="text-xl font-bold text-slate-100 mt-1">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
    </div>
  );
}
