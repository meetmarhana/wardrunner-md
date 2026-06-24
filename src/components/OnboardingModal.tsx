import { useState } from 'react';

const ONBOARDING_KEY = 'wardrunner_onboarding_done';

export function isOnboardingDone(): boolean {
  try { return localStorage.getItem(ONBOARDING_KEY) === '1'; } catch { return true; }
}

function markOnboardingDone(): void {
  try { localStorage.setItem(ONBOARDING_KEY, '1'); } catch { /* noop */ }
}

interface Props {
  onComplete: () => void;
}

const STEPS = [
  {
    icon: '🏥',
    title: 'Welcome to WardRunner MD',
    content: (
      <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
        <p>
          WardRunner MD is a <strong className="text-white">clinical reasoning simulation game</strong> designed
          for medical students, junior doctors, and healthcare educators.
        </p>
        <p>
          Work through real patient scenarios — order investigations, make diagnoses, choose treatments,
          and disposition patients — before time runs out.
        </p>
        <div className="bg-amber-900/30 border border-amber-700/40 rounded-lg px-4 py-3 text-xs text-amber-200/80">
          <span className="font-semibold text-amber-300">⚠️ Educational Only.</span>{' '}
          This is not medical advice. Do not use this game to guide real clinical decisions.
        </div>
      </div>
    ),
  },
  {
    icon: '🩺',
    title: 'How Cases Work',
    content: (
      <div className="space-y-3 text-sm text-slate-300">
        <p>Each case follows a five-step loop:</p>
        <ol className="space-y-2.5">
          {[
            { icon: '🧑‍⚕️', step: 'Present',     desc: 'Read the patient history and vitals.' },
            { icon: '🔍', step: 'Investigate', desc: 'Order tests — but every test costs time and money.' },
            { icon: '🧠', step: 'Diagnose',    desc: 'Choose the most likely diagnosis.' },
            { icon: '💊', step: 'Treat',       desc: 'Pick the right interventions in the right order.' },
            { icon: '🚪', step: 'Disposition', desc: 'Discharge, admit, or escalate — and justify it.' },
          ].map(({ icon, step, desc }) => (
            <li key={step} className="flex gap-3 items-start">
              <span className="text-base">{icon}</span>
              <span><strong className="text-white">{step}: </strong>{desc}</span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-slate-500">Wrong answers reduce your score — but they always come with an explanation.</p>
      </div>
    ),
  },
  {
    icon: '🌙',
    title: 'Night Shift Mode',
    content: (
      <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
        <p>
          Night Shift is a <strong className="text-white">turn-based triage game</strong>.
          You manage multiple patients simultaneously — each deteriorating on their own clock.
        </p>
        <div className="space-y-2">
          {[
            { icon: '⏱️', text: 'Time advances after every action — neglected patients deteriorate.' },
            { icon: '🚨', text: 'Urgency warnings show when a patient is close to crashing.' },
            { icon: '🔗', text: 'Some actions are locked behind prerequisites — work in sequence.' },
            { icon: '🎯', text: 'Triage score rewards treating the most urgent patient first.' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex gap-3 items-start bg-slate-700/40 rounded-lg px-3 py-2">
              <span className="shrink-0">{icon}</span>
              <span className="text-xs">{text}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: '📊',
    title: 'Scoring & Learning',
    content: (
      <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
        <p>Your performance is tracked across five categories:</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Diagnostic',  color: 'bg-purple-900/40 text-purple-300 border-purple-700/40' },
            { label: 'Safety',      color: 'bg-red-900/40 text-red-300 border-red-700/40' },
            { label: 'Guideline',   color: 'bg-blue-900/40 text-blue-300 border-blue-700/40' },
            { label: 'Time',        color: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/40' },
            { label: 'Cost',        color: 'bg-green-900/40 text-green-300 border-green-700/40' },
          ].map(({ label, color }) => (
            <div key={label} className={`text-xs font-semibold px-3 py-2 rounded-lg border ${color}`}>{label}</div>
          ))}
        </div>
        <p className="text-xs text-slate-400">
          Scores are for <strong className="text-white">learning and reflection</strong> — not clinical validation.
          Every mistake has a teaching explanation. Read them carefully.
        </p>
        <p className="text-xs text-slate-500">
          Earn XP, unlock specialties, and collect achievements as you progress.
        </p>
      </div>
    ),
  },
] as const;

export default function OnboardingModal({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      markOnboardingDone();
      onComplete();
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-7 shadow-2xl">

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-blue-500' : i < step ? 'w-2 bg-blue-700' : 'w-2 bg-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="text-center mb-5">
          <div className="text-4xl mb-3">{current.icon}</div>
          <h2 className="text-xl font-bold text-white mb-4">{current.title}</h2>
        </div>

        <div className="mb-6">{current.content}</div>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-xl transition-colors text-sm"
            >
              ← Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
          >
            {isLast ? 'Start Playing →' : 'Next →'}
          </button>
        </div>

        {/* Skip */}
        <button
          onClick={() => { markOnboardingDone(); onComplete(); }}
          className="w-full mt-3 text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          Skip intro
        </button>
      </div>
    </div>
  );
}
