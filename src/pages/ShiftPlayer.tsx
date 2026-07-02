import { useState, useRef } from 'react';
import { SEPTIC_SHOCK_CASE } from '../data/simCases/septicShock';
import SimPlayer from './SimPlayer';
import MorningBriefingScreen from '../components/shift/MorningBriefingScreen';
import BetweenPatientScreen from '../components/shift/BetweenPatientScreen';
import ShiftSummaryScreen from '../components/shift/ShiftSummaryScreen';
import CareerProgressScreen from '../components/shift/CareerProgressScreen';
import type {
  ShiftLoopScreen,
  ShiftLoopMetrics,
  CaseOutcome,
} from '../types/shiftLoop';
import { getCareerLevel, getStaffMemoryLine } from '../types/shiftLoop';

// How many cases form a shift. All use the same case until more are added.
const SHIFT_QUEUE = [SEPTIC_SHOCK_CASE, SEPTIC_SHOCK_CASE, SEPTIC_SHOCK_CASE] as const;
const MAX_PATIENTS = SHIFT_QUEUE.length;

// Persistent XP stored in localStorage so career progress survives sessions
function loadXP(): number {
  const raw = localStorage.getItem('wardrunner_shift_xp');
  return raw ? parseInt(raw, 10) : 0;
}
function saveXP(xp: number): void {
  localStorage.setItem('wardrunner_shift_xp', String(xp));
}

interface Props {
  onHome: () => void;
}

export default function ShiftPlayer({ onHome }: Props) {
  const [screen, setScreen] = useState<ShiftLoopScreen>('morning-briefing');
  const [caseIndex, setCaseIndex] = useState(0);
  const [outcomes, setOutcomes] = useState<CaseOutcome[]>([]);
  const [lastOutcome, setLastOutcome] = useState<CaseOutcome | null>(null);
  const [persistentXP] = useState<number>(() => loadXP());
  const [xpAtShiftStart] = useState<number>(() => loadXP());
  const [shiftXP, setShiftXP] = useState(0);
  const simKey = useRef(0); // force SimPlayer remount between patients

  const totalXP = persistentXP + shiftXP;
  const careerLevel = getCareerLevel(totalXP);

  const metrics: ShiftLoopMetrics = {
    patientsSaved: outcomes.filter(o => o.survived).length,
    deaths:        outcomes.filter(o => !o.survived).length,
    outcomes,
    totalXP,
    xpAtShiftStart: persistentXP,
  };

  function handleBeginShift() {
    setCaseIndex(0);
    simKey.current += 1;
    setScreen('in-case');
  }

  function handleContinueShift(outcome: CaseOutcome) {
    const next = [...outcomes, outcome];
    setOutcomes(next);
    setLastOutcome(outcome);
    setShiftXP(prev => prev + outcome.xpEarned);
    saveXP(persistentXP + shiftXP + outcome.xpEarned);

    if (next.length >= MAX_PATIENTS) {
      setScreen('shift-summary');
    } else {
      setScreen('between-patient');
    }
  }

  function handleEndShift(outcome?: CaseOutcome) {
    const next = outcome ? [...outcomes, outcome] : outcomes;
    if (outcome) {
      setOutcomes(next);
      setShiftXP(prev => prev + outcome.xpEarned);
      saveXP(persistentXP + shiftXP + outcome.xpEarned);
    }
    setScreen('shift-summary');
  }

  function handleBetweenReady() {
    const nextIndex = caseIndex + 1;
    setCaseIndex(nextIndex);
    simKey.current += 1;
    setScreen('in-case');
  }

  function handleViewCareer() {
    setScreen('career-progress');
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (screen === 'morning-briefing') {
    return (
      <MorningBriefingScreen
        onBeginShift={handleBeginShift}
        careerLevel={careerLevel}
        totalXP={totalXP}
      />
    );
  }

  if (screen === 'in-case') {
    return (
      <SimPlayer
        key={simKey.current}
        onHome={() => handleEndShift()}
        onContinueShift={handleContinueShift}
        onEndShift={() => handleEndShift()}
        skipIntro={caseIndex > 0}
        patientNumber={caseIndex + 1}
      />
    );
  }

  if (screen === 'between-patient' && lastOutcome) {
    return (
      <BetweenPatientScreen
        lastOutcome={lastOutcome}
        patientNumber={caseIndex}
        staffMemory={getStaffMemoryLine(lastOutcome)}
        onReady={handleBetweenReady}
      />
    );
  }

  if (screen === 'shift-summary') {
    return (
      <ShiftSummaryScreen
        metrics={metrics}
        onViewCareer={handleViewCareer}
        onHome={onHome}
      />
    );
  }

  if (screen === 'career-progress') {
    return (
      <CareerProgressScreen
        xpBefore={xpAtShiftStart}
        xpAfter={totalXP}
        onHome={onHome}
      />
    );
  }

  return null;
}
