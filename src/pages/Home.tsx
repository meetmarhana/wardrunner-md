import { useState } from 'react';
import type { PlayerProfile } from '../types/profile';
import { getLevelForXP, LEVEL_CONFIG } from '../engine/profileEngine';
import { ALL_CASES } from '../data/allCases';
import { ALL_SCENARIOS } from '../data/nightShift/scenarios';
import Disclaimer from '../components/Disclaimer';

interface HomeProps {
  onNavigate: (page: string) => void;
  profile?: PlayerProfile;
}

function clearAllDemoData(): void {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('wardrunner_'));
  keys.forEach(k => localStorage.removeItem(k));
}

const GAME_MODES = [
  {
    id: 'specialties',
    icon: '🩺',
    title: 'Case Mode',
    subtitle: '15 cases · 5 specialties',
    description: 'Work through individual patient presentations. Investigate, diagnose, treat, and disposition.',
    color: 'border-blue-700/50 hover:border-blue-500',
    badge: 'bg-blue-900/50 text-blue-300',
  },
  {
    id: 'night-shift',
    icon: '🌙',
    title: 'Night Shift',
    subtitle: `${ALL_SCENARIOS.length} scenarios · Turn-based triage`,
    description: 'Manage multiple deteriorating patients simultaneously. Triage matters — treat the wrong patient first and someone dies.',
    color: 'border-red-700/50 hover:border-red-500',
    badge: 'bg-red-900/50 text-red-300',
  },
  {
    id: 'career',
    icon: '📈',
    title: 'Career Mode',
    subtitle: 'Structured progression',
    description: 'Complete cases in order, unlock specialties, earn XP, and climb from Intern to Consultant.',
    color: 'border-green-700/50 hover:border-green-500',
    badge: 'bg-green-900/50 text-green-300',
  },
  {
    id: 'builder',
    icon: '🔧',
    title: 'Case Builder',
    subtitle: 'Create your own',
    description: 'Design and export your own clinical cases. Shareable JSON format — build for your team.',
    color: 'border-purple-700/50 hover:border-purple-500',
    badge: 'bg-purple-900/50 text-purple-300',
  },
] as const;

const TARGET_USERS = [
  { icon: '🎓', label: 'Medical Students', desc: 'Practice clinical reasoning without patient risk.' },
  { icon: '🩻', label: 'Junior Doctors',   desc: 'Reinforce decision-making for on-call nights.' },
  { icon: '👨‍🏫', label: 'Educators',       desc: 'Build custom cases for your curriculum.' },
];

export default function Home({ onNavigate, profile }: HomeProps) {
  const [showHowToPlay, setShowHowToPlay]   = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const levelData  = profile ? getLevelForXP(profile.totalXP) : null;
  const levelColor = profile ? (LEVEL_CONFIG.find(l => l.level === profile.level)?.color ?? 'text-slate-400') : 'text-slate-400';

  const handleReset = () => {
    clearAllDemoData();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">

      {/* ── Top Bar ── */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-slate-700 bg-slate-900/95 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="font-bold tracking-tight text-white">WardRunner MD</span>
          <span className="bg-blue-600/80 text-blue-100 text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide hidden sm:inline">
            Beta
          </span>
        </div>
        <nav className="flex items-center gap-2 sm:gap-3 text-sm text-slate-400">
          <button className="hover:text-white transition-colors hidden sm:block" onClick={() => setShowHowToPlay(true)}>
            How to Play
          </button>
          <button className="hover:text-white transition-colors" onClick={() => onNavigate('career')}>
            Career
          </button>
          <button className="hover:text-white transition-colors hidden sm:block" onClick={() => onNavigate('builder')}>
            Builder
          </button>
          {profile && (
            <button
              onClick={() => onNavigate('profile')}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-full px-3 py-1 transition-colors"
            >
              <span className="text-sm">🩺</span>
              <span className={`font-semibold text-xs ${levelColor}`}>{profile.rank}</span>
              <span className="text-slate-500 text-xs">Lv.{profile.level}</span>
            </button>
          )}
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="px-5 py-16 sm:py-24 text-center bg-gradient-to-b from-slate-900 to-slate-800/60">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-900/30 border border-blue-700/40 rounded-full px-4 py-1.5 text-xs text-blue-300 font-semibold uppercase tracking-wider mb-6">
            Clinical reasoning meets RPG triage
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            WardRunner MD
          </h1>
          <p className="text-base sm:text-lg text-slate-300 mb-10 leading-relaxed max-w-xl mx-auto">
            Train your clinical decision-making through real patient scenarios.
            Make the right call — before the patient deteriorates.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => onNavigate('specialties')}
              className="px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-900/30"
            >
              🩺 Start Case Mode
            </button>
            <button
              onClick={() => onNavigate('night-shift')}
              className="px-7 py-3.5 bg-red-700 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-red-900/30"
            >
              🌙 Night Shift
            </button>
            <button
              onClick={() => setShowHowToPlay(true)}
              className="px-7 py-3.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors border border-slate-600"
            >
              How to Play
            </button>
          </div>

          {/* Stats row */}
          <div className="mt-12 grid grid-cols-3 gap-4 max-w-sm mx-auto text-center">
            <div>
              <div className="text-2xl font-bold text-blue-400">{ALL_CASES.length}</div>
              <div className="text-xs text-slate-500 mt-0.5">Cases</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">{ALL_SCENARIOS.length}</div>
              <div className="text-xs text-slate-500 mt-0.5">Shifts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">5</div>
              <div className="text-xs text-slate-500 mt-0.5">Score Axes</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── What is WardRunner? ── */}
      <section className="px-5 py-12 bg-slate-800/40 border-y border-slate-700/50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-4">What is WardRunner MD?</h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            WardRunner MD is a <strong className="text-white">clinical reasoning game</strong> that puts you in the seat of a doctor
            facing real patient scenarios. Every decision has a consequence — order the wrong test, miss a critical sign,
            or delay treatment, and the patient suffers.
          </p>
          <p className="text-slate-300 text-sm leading-relaxed">
            Unlike passive study, WardRunner forces active recall and decision-making under pressure. You'll learn
            from your mistakes immediately — every wrong answer comes with a teaching explanation grounded in current guidelines.
          </p>
        </div>
      </section>

      {/* ── Game Modes ── */}
      <section className="px-5 py-12">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-6">Game Modes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {GAME_MODES.map(mode => (
              <button
                key={mode.id}
                onClick={() => onNavigate(mode.id)}
                className={`text-left bg-slate-800 rounded-xl border p-5 transition-all group ${mode.color}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{mode.icon}</span>
                  <div>
                    <div className="font-bold text-white text-sm">{mode.title}</div>
                    <div className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-0.5 ${mode.badge}`}>
                      {mode.subtitle}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{mode.description}</p>
                <div className="mt-3 text-xs font-semibold text-slate-500 group-hover:text-slate-300 transition-colors">
                  Open →
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section className="px-5 py-12 bg-slate-800/40 border-y border-slate-700/50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-6">Who Is It For?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TARGET_USERS.map(u => (
              <div key={u.label} className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 text-center">
                <div className="text-3xl mb-2">{u.icon}</div>
                <div className="font-semibold text-white text-sm mb-1">{u.label}</div>
                <p className="text-xs text-slate-400 leading-relaxed">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Profile summary (if logged in) ── */}
      {profile && levelData && (
        <section className="px-5 py-10">
          <div className="max-w-2xl mx-auto bg-slate-800 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-lg font-bold ${levelColor}`}>{profile.rank}</div>
                <div className="text-slate-400 text-sm">Level {profile.level} · {profile.totalXP} XP</div>
              </div>
              <div className="flex gap-4 text-center text-sm">
                <div>
                  <div className="font-bold text-white">{profile.casesCompleted}</div>
                  <div className="text-slate-500 text-xs">Cases done</div>
                </div>
                <div>
                  <div className="font-bold text-white">{profile.unlockedAchievementIds.length}</div>
                  <div className="text-slate-500 text-xs">Achievements</div>
                </div>
              </div>
              <button
                onClick={() => onNavigate('profile')}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-semibold"
              >
                View Profile →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Disclaimer ── */}
      <section className="px-5 pb-6">
        <div className="max-w-2xl mx-auto">
          <Disclaimer />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 px-5 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between text-xs text-slate-600">
          <span>WardRunner MD — Built for medical education</span>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="hover:text-slate-400 transition-colors"
          >
            Reset Demo Data
          </button>
        </div>
      </footer>

      {/* ── How to Play Modal ── */}
      {showHowToPlay && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
          onClick={() => setShowHowToPlay(false)}
        >
          <div
            className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-7 shadow-2xl overflow-y-auto max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">How to Play</h2>
              <button onClick={() => setShowHowToPlay(false)} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
            </div>

            <div className="space-y-6 text-sm">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-3">Case Mode — 5 Steps</h3>
                <ol className="space-y-2.5">
                  {[
                    { icon: '🧑‍⚕️', step: 'Present',     desc: 'A patient arrives with a chief complaint and vitals.' },
                    { icon: '🔍', step: 'Investigate', desc: 'Order labs and imaging — each costs time and money.' },
                    { icon: '🧠', step: 'Diagnose',    desc: 'Pick the most likely diagnosis from your differentials.' },
                    { icon: '💊', step: 'Treat',       desc: 'Choose interventions in the right order.' },
                    { icon: '🚪', step: 'Disposition', desc: 'Discharge, admit, or escalate — justify your decision.' },
                  ].map(({ icon, step, desc }) => (
                    <li key={step} className="flex gap-3 items-start text-slate-300">
                      <span>{icon}</span>
                      <span><strong className="text-white">{step}: </strong>{desc}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-3">Night Shift Mode</h3>
                <ul className="space-y-2 text-slate-300">
                  {[
                    '⏱️ Time advances after each action — neglected patients deteriorate.',
                    '🚨 Warning badges show which patient is closest to crashing.',
                    '🎯 Treat the most urgent patient first — triage order scores matter.',
                    '🔗 Some actions require prerequisite steps to unlock.',
                  ].map(t => <li key={t} className="text-xs leading-relaxed">{t}</li>)}
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-green-400 mb-3">Score Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {['Diagnostic','Safety','Guideline','Time','Cost'].map(l => (
                    <span key={l} className="text-xs bg-slate-700 text-slate-300 px-3 py-1 rounded-full">{l}</span>
                  ))}
                </div>
              </div>
            </div>

            <Disclaimer className="mt-5" />

            <button
              onClick={() => { setShowHowToPlay(false); onNavigate('specialties'); }}
              className="mt-5 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
            >
              Start Playing
            </button>
          </div>
        </div>
      )}

      {/* ── Reset Confirm Modal ── */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            className="bg-slate-800 border border-slate-700 rounded-2xl max-w-sm w-full p-7 shadow-2xl text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-4xl mb-3">🗑️</div>
            <h2 className="text-lg font-bold text-white mb-2">Reset Demo Data?</h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              This will permanently clear your player profile, all best shift scores, and onboarding state.
              The page will reload. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2.5 bg-red-700 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
              >
                Reset &amp; Reload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
