import { useState } from 'react';
import { ALL_CASES } from '../data/allCases';
import type { CaseData } from '../types/case';

interface SpecialtiesProps {
  onSelectCase: (caseId: string) => void;
  onBack: () => void;
  unlockedSpecialties?: string[];
}

const cases: CaseData[] = ALL_CASES;

const SPECIALTY_TABS = [
  { id: 'all', label: 'All', specialty: null },
  { id: 'cardiology', label: 'Cardiology', specialty: 'Cardiology' },
  { id: 'internal-medicine', label: 'Internal Medicine', specialty: 'Internal Medicine' },
  { id: 'emergency', label: 'Emergency', specialty: 'Emergency Medicine' },
  { id: 'icu', label: 'ICU', specialty: 'ICU' },
  { id: 'surgery', label: 'Surgery', specialty: 'Surgery' },
];

const DIFFICULTY_CONFIG: Record<
  string,
  { label: string; classes: string }
> = {
  beginner: { label: 'Beginner', classes: 'bg-green-900/50 text-green-300 border border-green-700/50' },
  intermediate: { label: 'Intermediate', classes: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/50' },
  advanced: { label: 'Advanced', classes: 'bg-red-900/50 text-red-300 border border-red-700/50' },
};

const SPECIALTY_COLOR: Record<string, string> = {
  cardiology: 'text-red-400',
  pulmonology: 'text-blue-400',
  neurology: 'text-purple-400',
  gastroenterology: 'text-amber-400',
  emergency: 'text-orange-400',
};

function CaseCard({
  caseData,
  onSelect,
}: {
  caseData: CaseData;
  onSelect: () => void;
}) {
  const diffConfig =
    DIFFICULTY_CONFIG[caseData.difficulty] ?? DIFFICULTY_CONFIG['intermediate'];
  const specialtyColor = SPECIALTY_COLOR[caseData.specialty] ?? 'text-slate-400';
  const estimatedMinutes = caseData.estimatedMinutes ?? 15;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col gap-4 hover:border-slate-500 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-base leading-tight truncate">
            {caseData.title}
          </h3>
          <p className={`text-sm mt-0.5 font-medium ${specialtyColor}`}>
            {caseData.subtitle ?? caseData.specialty.charAt(0).toUpperCase() + caseData.specialty.slice(1)}
          </p>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${diffConfig.classes}`}
        >
          {diffConfig.label}
        </span>
      </div>

      {/* Patient Preview */}
      <div className="bg-slate-900/60 rounded-xl px-4 py-3 border border-slate-700/50">
        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
          Patient
        </p>
        <p className="text-sm text-slate-200">
          {caseData.patient.age}yo {caseData.patient.sex === 'M' ? 'Male' : 'Female'} —{' '}
          <span className="text-slate-300 italic">{caseData.patient.chiefComplaint}</span>
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
          <span>🕐</span>
          <span>~{estimatedMinutes} min</span>
        </div>
        <button
          onClick={onSelect}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Play Case
        </button>
      </div>
    </div>
  );
}

export default function Specialties({ onSelectCase, onBack, unlockedSpecialties = ['Cardiology'] }: SpecialtiesProps) {
  const [activeTab, setActiveTab] = useState<string>('all');

  const isSpecialtyUnlocked = (specialty: string | null) =>
    specialty === null || unlockedSpecialties.includes(specialty);

  const filteredCases =
    activeTab === 'all'
      ? cases
      : cases.filter((c) => c.specialty === (SPECIALTY_TABS.find(t => t.id === activeTab)?.specialty ?? activeTab));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Top Bar */}
      <header className="px-6 py-4 border-b border-slate-700 flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
        >
          <span className="text-lg leading-none">←</span>
          Back
        </button>
        <div className="h-5 w-px bg-slate-700" />
        <span className="text-sm text-slate-400">Case Selection</span>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Page Title */}
        <h1 className="text-3xl font-extrabold text-white mb-2">Choose a Case</h1>
        <p className="text-slate-400 mb-8">
          Select a clinical scenario and start working through the diagnosis.
        </p>

        {/* Specialty Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {SPECIALTY_TABS.map((tab) => {
            const unlocked = isSpecialtyUnlocked(tab.specialty);
            const count = tab.id === 'all'
              ? cases.filter(c => unlockedSpecialties.includes(c.specialty)).length
              : cases.filter(c => c.specialty === tab.specialty).length;
            return (
              <button
                key={tab.id}
                onClick={() => unlocked && setActiveTab(tab.id)}
                disabled={!unlocked}
                className={`
                  flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors
                  ${!unlocked
                    ? 'bg-slate-800/50 text-slate-600 border border-slate-700/50 cursor-not-allowed'
                    : activeTab === tab.id
                    ? 'bg-blue-600 text-white border border-blue-500'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600'
                  }
                `}
              >
                {tab.label}
                {!unlocked && <span className="text-xs">🔒</span>}
                {unlocked && (
                  <span className="text-xs bg-slate-700/80 text-slate-300 px-1.5 py-0.5 rounded-full">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Case Grid */}
        {filteredCases.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCases.map((c) => (
              <CaseCard
                key={c.id}
                caseData={c}
                onSelect={() => onSelectCase(c.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500">
            <div className="text-4xl mb-3">🔒</div>
            <p className="text-lg font-medium">Coming Soon</p>
            <p className="text-sm mt-1">More specialties are on the way.</p>
          </div>
        )}

        {/* Coming Soon Banner */}
        <div className="mt-10 bg-slate-800/50 border border-slate-700/50 rounded-2xl px-6 py-5 text-center">
          <p className="text-slate-400 text-sm">
            <span className="font-semibold text-slate-300">More cases coming soon.</span>{' '}
            Pulmonology, Neurology, Emergency Medicine, and more are in development.
          </p>
        </div>
      </div>
    </div>
  );
}
