import { useState, useEffect, useRef, useCallback } from 'react';
import type { SimAction, SimCase, PatientSim, SimEvent, SimVitals, SimPatientStatus, CasePhase, CoachingEntry } from '../../types/simulation';

// ── Toast system ───────────────────────────────────────────────────────────────
interface ToastData {
  id: number;
  text: string;
  source: string;
  severity: 'info' | 'warning' | 'danger' | 'success';
}

const TOAST_SOURCE_ICON: Record<string, string> = {
  nurse:      '👩‍⚕️',
  consultant: '☎',
  family:     '👥',
  cascade:    '⚠',
  patient:    '🧑',
};
const TOAST_SOURCE_LABEL: Record<string, string> = {
  nurse:      'Nurse',
  consultant: 'Consult',
  family:     'Family',
  cascade:    'Alert',
  patient:    'Patient',
};

function ToastCard({ toast, onDismiss }: { toast: ToastData; onDismiss: () => void }) {
  const isDanger = toast.severity === 'danger';
  return (
    <div
      className={`rounded border shadow-xl px-3 py-2 flex gap-2 items-start animate-fade-in ${
        isDanger
          ? 'bg-red-950/90 border-red-700/60'
          : 'bg-slate-900/95 border-slate-700/60'
      }`}
    >
      <span className="text-base leading-none mt-0.5 shrink-0">
        {TOAST_SOURCE_ICON[toast.source] ?? '🔔'}
      </span>
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-bold mb-0.5 ${isDanger ? 'text-red-400' : 'text-slate-400'}`}>
          {TOAST_SOURCE_LABEL[toast.source] ?? 'System'}
        </div>
        <div className="text-xs text-slate-200 leading-snug">{toast.text}</div>
      </div>
      <button
        onClick={onDismiss}
        className="text-slate-600 hover:text-slate-300 text-xs leading-none shrink-0 mt-0.5"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
import { useSimAudio } from '../../hooks/useSimAudio';
import OrderConsole from './OrderConsole';
import PatientMonitor from './PatientMonitor';
import ResultsWorkspace from './ResultsWorkspace';
import EventTimeline from './EventTimeline';
import ScenePanel from './ScenePanel';
import HospitalFeed from './HospitalFeed';
import CaseProgressBar from './CaseProgressBar';
import ComboDisplay from './ComboDisplay';
import { useInterruptionEngine } from '../../hooks/useInterruptionEngine';
import type { InterruptionSource } from '../../hooks/useInterruptionEngine';
import { useDirector } from '../../hooks/useDirector';

const CASE_START_MIN = 8 * 60;
function wallClock(simMin: number): string {
  const total = CASE_START_MIN + simMin;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function formatSimTime(min: number): string {
  if (min < 60) return `T+${min}`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `T+${h}h${String(m).padStart(2, '0')}`;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  stable:            { label: 'Stable',       cls: 'bg-slate-700 text-slate-300'                    },
  guarded:           { label: 'Guarded',      cls: 'bg-amber-800/80 text-amber-200'                 },
  critical:          { label: 'Critical',     cls: 'bg-red-800/80 text-red-200 animate-pulse'       },
  improving:         { label: 'Improving',    cls: 'bg-emerald-800/80 text-emerald-200'              },
  intubated:         { label: 'Intubated',    cls: 'bg-orange-800/80 text-orange-200'               },
  'cardiac-arrest':  { label: 'ARREST',       cls: 'bg-red-600 text-white animate-pulse'            },
  dead:              { label: 'Deceased',     cls: 'bg-slate-900 text-slate-400'                    },
  discharged:        { label: 'Discharged',   cls: 'bg-emerald-800/80 text-emerald-200'             },
  'icu-transferred': { label: 'ICU Transfer', cls: 'bg-blue-800/80 text-blue-200'                  },
};

type MobileTab = 'orders' | 'monitor' | 'results' | 'chart' | 'feed';

interface Props {
  simCase: SimCase;
  patient: PatientSim;
  prevVitals: SimVitals;
  availableActions: SimAction[];
  acting: boolean;
  actingActionId: string | null;
  lastAction: string | null;
  eventLog: SimEvent[];
  casePhase: CasePhase;
  coachingLog: CoachingEntry[];
  onAction: (action: SimAction) => void;
  onViewResult: (orderId: string) => void;
  onHome: () => void;
}

export default function SimCockpit({
  simCase,
  patient,
  prevVitals,
  availableActions,
  acting,
  actingActionId,
  lastAction,
  eventLog,
  casePhase,
  coachingLog,
  onAction,
  onViewResult,
  onHome,
}: Props) {
  const [mobileTab, setMobileTab] = useState<MobileTab>('orders');
  const [toasts, setToasts]       = useState<ToastData[]>([]);
  const toastIdRef                = useRef(0);
  const { enabled: soundOn, setEnabled: setSoundOn, play } = useSimAudio();

  // ── Interruption engine ───────────────────────────────────────────────────
  const { interruption, dismiss: dismissInterruption, respond: respondInterruption } =
    useInterruptionEngine(patient, acting);

  // ── Director system ───────────────────────────────────────────────────────
  const { activeCue, characterMoods, dismissCue: dismissDirectorCue } = useDirector(patient, simCase);

  // Convert Director cues for non-scene actors into priority interruptions
  const SCENE_ACTORS = new Set(['doctor', 'nurse', 'patient', 'family']);
  const directorInterruption = activeCue && !SCENE_ACTORS.has(activeCue.actor)
    ? {
        id:        activeCue.id,
        source:    activeCue.actor as InterruptionSource,
        text:      activeCue.message,
        responses: ['Noted'],
        durationMs: activeCue.priority === 'high' ? 9000 : activeCue.priority === 'medium' ? 7000 : 5500,
      }
    : null;

  // Director interruptions override ambient interruptions
  const effectiveInterruption = directorInterruption ?? interruption;

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Sound effects + toast interruptions ───────────────────────────────────
  const prevArrivedCount = useRef(0);
  const prevEventCount   = useRef(0);
  const prevStatus       = useRef<SimPatientStatus>(patient.status);

  const allOrders    = [...patient.pendingOrders, ...patient.completedOrders];
  const arrivedCount = patient.completedOrders.length;

  useEffect(() => {
    if (arrivedCount > prevArrivedCount.current) play('lab-arrived');
    prevArrivedCount.current = arrivedCount;
  }, [arrivedCount, play]);

  useEffect(() => {
    const len = eventLog.length;
    if (len > prevEventCount.current) {
      const newEvents = eventLog.slice(prevEventCount.current);
      newEvents.forEach(ev => {
        // Sound
        if (['nurse', 'consultant', 'family'].includes(ev.source)) play('message');
        if (ev.severity === 'danger') play('critical');
        // Toast — interruptions only
        const shouldToast =
          ev.severity === 'danger' ||
          ['nurse', 'consultant', 'family', 'cascade'].includes(ev.source);
        if (shouldToast) {
          const id = ++toastIdRef.current;
          setToasts(prev => [...prev, { id, text: ev.text, source: ev.source, severity: ev.severity }].slice(-3));
          setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
        }
      });
    }
    prevEventCount.current = len;
  }, [eventLog, play]);

  useEffect(() => {
    if (patient.status !== prevStatus.current) {
      if (patient.status === 'critical' || patient.status === 'cardiac-arrest') play('critical');
    }
    prevStatus.current = patient.status;
  }, [patient.status, play]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const badge        = STATUS_BADGE[patient.status] ?? STATUS_BADGE.guarded;
  const availableIds = new Set(availableActions.map(a => a.id));
  const completedIds = new Set(patient.completedActionIds);

  const completedTreatments = simCase.actions.filter(
    a => a.category === 'treatment' && completedIds.has(a.id)
  );

  const consoleProps = {
    allActions:         simCase.actions,
    availableActionIds: availableIds,
    completedActionIds: completedIds,
    actingActionId,
    disabled:           acting,
    onAction: (action: SimAction) => { play('order-placed'); onAction(action); },
  };

  const monitorEl = (
    <PatientMonitor
      vitals={patient.vitals}
      prevVitals={prevVitals}
      status={patient.status}
    />
  );

  const resultsEl = (
    <ResultsWorkspace
      orders={allOrders}
      completedTreatments={completedTreatments}
      onViewResult={onViewResult}
    />
  );

  const timelineEl = <EventTimeline events={eventLog} />;
  const scenePanelEl = (
    <ScenePanel
      patient={patient}
      simCase={simCase}
      eventLog={eventLog}
      coachingLog={coachingLog}
      acting={acting}
      interruption={effectiveInterruption}
      onInterruptionDismiss={directorInterruption ? dismissDirectorCue : dismissInterruption}
      onInterruptionRespond={directorInterruption ? dismissDirectorCue : respondInterruption}
      characterMoods={characterMoods}
      activeCue={activeCue && SCENE_ACTORS.has(activeCue.actor) ? activeCue : null}
    />
  );
  const feedEl = <HospitalFeed events={eventLog} />;

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="shrink-0 bg-slate-950 border-b border-slate-800 px-3 flex items-center gap-2" style={{ height: '44px' }}>
        <button
          onClick={onHome}
          className="text-slate-600 hover:text-slate-200 text-sm px-1 shrink-0"
          aria-label="Back"
        >
          ←
        </button>

        <span className="text-sm font-semibold text-slate-200 truncate flex-1 min-w-0">
          {simCase.title}
        </span>

        {/* Acting flash */}
        {acting && lastAction && (
          <span className="text-xs text-blue-400 font-mono hidden sm:block animate-pulse shrink-0">
            ⏱ {lastAction}…
          </span>
        )}

        {/* Clock */}
        <div className="flex items-center gap-1 font-mono shrink-0">
          <span className="text-sm font-bold text-slate-100">{wallClock(patient.simTimeMinutes)}</span>
          <span className="text-xs text-slate-600">({formatSimTime(patient.simTimeMinutes)})</span>
        </div>

        {/* Status badge */}
        <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${badge.cls}`}>
          {badge.label}
        </span>

        {/* Sound toggle */}
        <button
          onClick={() => setSoundOn(!soundOn)}
          title={soundOn ? 'Sound on' : 'Sound off'}
          className={`text-sm px-1 rounded shrink-0 transition-colors ${
            soundOn ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'
          }`}
        >
          {soundOn ? '🔊' : '🔇'}
        </button>
      </header>

      {/* ── Desktop cockpit ───────────────────────────────────────────────── */}
      <div
        className="hidden lg:grid min-h-0 overflow-hidden"
        style={{
          gridTemplateColumns: '220px 1fr 272px',
          height: 'calc(100vh - 44px - 52px)',
        }}
      >
        {/* ── LEFT: Order Console ─────────────────────────── */}
        <div className="border-r border-slate-800 overflow-hidden flex flex-col">
          <OrderConsole {...consoleProps} />
        </div>

        {/* ── CENTER: Monitor + Results + Timeline ─────────── */}
        <div className="border-r border-slate-800 flex flex-col overflow-hidden">
          {/* Monitor */}
          <div className="shrink-0 border-b border-slate-800" style={{ height: '185px' }}>
            {monitorEl}
          </div>
          {/* Results — grows to fill remaining space */}
          <div className="flex-1 min-h-0 border-b border-slate-800 overflow-hidden">
            {resultsEl}
          </div>
          {/* Timeline */}
          <div className="shrink-0 overflow-hidden" style={{ height: '124px' }}>
            {timelineEl}
          </div>
        </div>

        {/* ── RIGHT: Scene + Combo + Feed ──────────────────── */}
        <div className="flex flex-col overflow-hidden">
          <div className="border-b border-slate-800 overflow-hidden" style={{ height: '50%' }}>
            {scenePanelEl}
          </div>
          <ComboDisplay completedActionIds={patient.completedActionIds} />
          <div className="flex-1 min-h-0 overflow-hidden">
            {feedEl}
          </div>
        </div>
      </div>

      {/* ── Case Progress Bar ─────────────────────────────────────────────── */}
      <div className="hidden lg:block shrink-0">
        <CaseProgressBar
          casePhase={casePhase}
          simTimeMin={patient.simTimeMinutes}
          phases={simCase.phases}
          gamePhase={patient.status === 'dead' || patient.status === 'discharged' || patient.status === 'icu-transferred' ? 'ended' : 'playing'}
        />
      </div>

      {/* ── Mobile layout ─────────────────────────────────────────────────── */}
      <div className="lg:hidden flex-1 min-h-0 overflow-y-auto pb-14">
        {mobileTab === 'orders'  && (
          <div style={{ height: 'calc(100vh - 102px)' }}>
            <OrderConsole {...consoleProps} />
          </div>
        )}
        {mobileTab === 'monitor' && (
          <div className="p-2 space-y-2">
            <div style={{ height: '185px' }}>{monitorEl}</div>
            <div style={{ height: '200px' }}>{timelineEl}</div>
          </div>
        )}
        {mobileTab === 'results' && (
          <div style={{ height: 'calc(100vh - 102px)' }}>{resultsEl}</div>
        )}
        {mobileTab === 'chart' && (
          <div style={{ height: 'calc(100vh - 102px)' }}>{scenePanelEl}</div>
        )}
        {mobileTab === 'feed' && (
          <div style={{ height: 'calc(100vh - 102px)' }}>{feedEl}</div>
        )}
      </div>

      {/* ── Toast overlay ─────────────────────────────────────────────────── */}
      {toasts.length > 0 && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ top: '52px', right: '12px', width: '272px' }}
        >
          <div className="space-y-2 pointer-events-auto">
            {toasts.map(t => (
              <ToastCard key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
            ))}
          </div>
        </div>
      )}

      {/* ── Mobile tab bar ────────────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-800 flex z-40" style={{ height: '56px' }}>
        {(
          [
            ['orders',  '📋', 'Orders' ],
            ['monitor', '📊', 'Monitor'],
            ['results', '🧪', 'Results'],
            ['chart',   '👤', 'Chart'  ],
            ['feed',    '💬', 'Feed'   ],
          ] as [MobileTab, string, string][]
        ).map(([id, icon, label]) => (
          <button
            key={id}
            onClick={() => setMobileTab(id)}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors ${
              mobileTab === id ? 'text-sky-400' : 'text-slate-600 hover:text-slate-400'
            }`}
          >
            <span className="text-base leading-none">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
