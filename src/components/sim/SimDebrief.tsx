import type { SimEnding, SimScores, SimAction, SimEvent, Order } from '../../types/simulation';

const CATEGORY_LABEL: Record<string, string> = {
  assessment:    'Assessment',
  investigation: 'Investigation',
  treatment:     'Treatment',
  procedure:     'Procedure',
  disposition:   'Disposition',
  consult:       'Consult',
  monitoring:    'Monitoring',
};

const CASE_START_MIN = 8 * 60;
function wallClock(simMin: number): string {
  const total = CASE_START_MIN + simMin;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const JOURNAL_SOURCE_LABEL: Partial<Record<SimEvent['source'], string>> = {
  note:       'Progress Note',
  consultant: 'Consultant',
  nurse:      'Nursing',
  patient:    'Patient',
  family:     'Family',
};

interface Props {
  ending: SimEnding;
  scores: SimScores;
  simTimeMin: number;
  completedActionIds: string[];
  allActions: SimAction[];
  completedOrders: Order[];
  eventLog: SimEvent[];
  metrics: Record<string, number | boolean>;
  onRestart: () => void;
  onHome: () => void;
}

const SEVERITY_STYLE: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  excellent:  { bg: 'bg-emerald-900/30', border: 'border-emerald-600', text: 'text-emerald-300', badge: 'bg-emerald-700 text-emerald-100' },
  good:       { bg: 'bg-blue-900/30',    border: 'border-blue-600',    text: 'text-blue-300',    badge: 'bg-blue-700 text-blue-100' },
  acceptable: { bg: 'bg-slate-800/40',   border: 'border-slate-600',   text: 'text-slate-300',   badge: 'bg-slate-600 text-slate-100' },
  poor:       { bg: 'bg-amber-900/30',   border: 'border-amber-700',   text: 'text-amber-300',   badge: 'bg-amber-700 text-amber-100' },
  critical:   { bg: 'bg-orange-900/30',  border: 'border-orange-700',  text: 'text-orange-300',  badge: 'bg-orange-700 text-orange-100' },
  death:      { bg: 'bg-red-950/50',     border: 'border-red-700',     text: 'text-red-300',     badge: 'bg-red-800 text-red-100' },
};

const SCORE_LABEL: Record<keyof SimScores, string> = {
  safety:     'Patient Safety',
  guideline:  'Guideline Adherence',
  time:       'Time to Treatment',
  cost:       'Resource Use',
  diagnostic: 'Diagnostic Reasoning',
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 80 ? 'bg-emerald-500' :
    value >= 60 ? 'bg-amber-500' :
    value >= 40 ? 'bg-orange-500' :
    'bg-red-500';

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs font-mono font-semibold text-slate-200">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-700">
        <div
          className={`h-1.5 rounded-full ${color} transition-all`}
          style={{ width: `${Math.max(2, value)}%` }}
        />
      </div>
    </div>
  );
}

function formatTime(min: number): string {
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h ${min % 60}min`;
}

// ─── Replay Goals ─────────────────────────────────────────────────────────────

interface Goal {
  id: string;
  label: string;
  detail: string;
  check: (completedIds: Set<string>, metrics: Record<string, number | boolean>, endingId: string) => boolean;
}

const REPLAY_GOALS: Goal[] = [
  {
    id: 'abx-within-80',
    label: 'Antibiotics within 80 min',
    detail: 'Hour-1 bundle target — every minute of delay increases mortality.',
    check: (_, m) => typeof m.timeToAntibiotics === 'number' && m.timeToAntibiotics < 80,
  },
  {
    id: 'abx-within-45',
    label: 'Antibiotics within 45 min',
    detail: 'Expert target: antibiotics before the patient enters frank shock.',
    check: (_, m) => typeof m.timeToAntibiotics === 'number' && m.timeToAntibiotics < 45,
  },
  {
    id: 'cultures-first',
    label: 'Blood cultures before antibiotics',
    detail: 'Essential for source identification and antibiotic stewardship.',
    check: (_, m) => m.culturesBeforeAbx === true,
  },
  {
    id: 'allergy-checked',
    label: 'Allergy checked before prescribing',
    detail: 'Two-minute check that prevents a fatal medication error.',
    check: (ids) => ids.has('check-allergies'),
  },
  {
    id: 'no-ctpa',
    label: 'No unnecessary CTPA',
    detail: 'PE was not the diagnosis — CTPA delays treatment by 45 minutes.',
    check: (_, m) => m.ctpaOrdered !== true,
  },
  {
    id: 'no-saline',
    label: 'Avoided normal saline',
    detail: 'Balanced crystalloid (Hartmann\'s) is preferred over saline in sepsis.',
    check: (ids) => !ids.has('fluids-ns-1'),
  },
  {
    id: 'lactate-repeated',
    label: 'Repeated lactate to track clearance',
    detail: 'Lactate clearance ≥10% confirms resuscitation is working.',
    check: (ids) => ids.has('vbg-repeat'),
  },
  {
    id: 'full-recovery',
    label: 'Full recovery — no shock, optimal antibiotics',
    detail: 'The best possible outcome: Ruth discharged on day 5 with no organ dysfunction.',
    check: (_, __, endingId) => endingId === 'full-recovery',
  },
];

// ─── Run Summary metrics ──────────────────────────────────────────────────────

interface MetricRow {
  label: string;
  value: string;
  good: boolean | null; // null = neutral
}

function buildRunSummary(
  metrics: Record<string, number | boolean>,
  completedIds: Set<string>,
): MetricRow[] {
  const rows: MetricRow[] = [];

  const abxTime = metrics.timeToAntibiotics;
  if (typeof abxTime === 'number') {
    rows.push({
      label: 'Time to antibiotics',
      value: `${abxTime} min`,
      good: abxTime < 80,
    });
  } else {
    rows.push({ label: 'Time to antibiotics', value: 'Not given', good: false });
  }

  rows.push({
    label: 'Allergy checked first',
    value: completedIds.has('check-allergies') ? 'Yes' : 'No',
    good: completedIds.has('check-allergies'),
  });

  rows.push({
    label: 'Cultures before antibiotics',
    value: metrics.culturesBeforeAbx === true ? 'Yes' : metrics.culturesBeforeAbx === false ? 'No' : '—',
    good: metrics.culturesBeforeAbx === true ? true : metrics.culturesBeforeAbx === false ? false : null,
  });

  rows.push({
    label: 'CTPA ordered',
    value: metrics.ctpaOrdered === true ? 'Yes — 45 min delay' : 'No',
    good: metrics.ctpaOrdered !== true,
  });

  rows.push({
    label: 'Saline used',
    value: completedIds.has('fluids-ns-1') ? 'Yes — hyperchloraemia risk' : 'No',
    good: !completedIds.has('fluids-ns-1'),
  });

  rows.push({
    label: 'Lactate repeated',
    value: completedIds.has('vbg-repeat') ? 'Yes' : 'No',
    good: completedIds.has('vbg-repeat') ? true : null,
  });

  return rows;
}

// ─── Narrative stanza ─────────────────────────────────────────────────────────

function buildNarrative(
  endingId: string,
  simTimeMin: number,
  completedIds: Set<string>,
): string {
  const hadAbx       = completedIds.has('antibiotics-pip-tazo') || completedIds.has('antibiotics-meropenem') || completedIds.has('antibiotics-ceftriaxone');
  const hadFluids    = completedIds.has('fluids-hartmanns-1') || completedIds.has('fluids-ns-1');
  const hadCultures  = completedIds.has('draw-blood-cultures');
  const calledICU    = completedIds.has('call-icu');
  const checkedAllergy = completedIds.has('check-allergies');

  const hourStr = simTimeMin >= 60
    ? `${Math.floor(simTimeMin / 60)}h ${simTimeMin % 60}min`
    : `${simTimeMin} min`;

  if (endingId === 'full-recovery') {
    return `Ruth Anand arrived at 08:00 in septic shock — confused, cold, and hypotensive. ${checkedAllergy ? 'You checked her allergies first and ' : ''}${hadCultures ? 'drew cultures before ' : ''}${hadAbx ? 'started antibiotics within the hour' : 'managed her fluids'}. ${hadFluids ? 'Fluids ran in fast. ' : ''}She stabilised over ${hourStr}. Discharged Day 5. No organ dysfunction. Her daughter Priya sent a card.`;
  }
  if (endingId === 'icu-transfer') {
    return `Ruth Anand arrived at 08:00 in septic shock. Despite your efforts over ${hourStr}, she needed escalation — ${calledICU ? 'you called ICU when it counted' : 'the intensivist was called'}. She spent 48 hours on the unit. Stable by Day 3. A difficult case handled under pressure.`;
  }
  if (endingId === 'death') {
    return `Ruth Anand arrived at 08:00 in septic shock. The next ${hourStr} were a fight. ${!hadAbx ? 'Antibiotics were delayed. ' : ''}${!hadFluids ? 'Fluids came late. ' : ''}She didn't make it. Her daughter was with her at the end. Review this case — the decisions that mattered most came early.`;
  }
  // fallback
  return `Ruth Anand arrived at 08:00 in septic shock. Over ${hourStr} you made decisions that shaped her outcome. Every case like this is a chance to do better next time.`;
}

function NarrativeStanza({ endingId, simTimeMin, completedIds }: { endingId: string; simTimeMin: number; completedIds: Set<string> }) {
  const text = buildNarrative(endingId, simTimeMin, completedIds);
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-5 relative overflow-hidden">
      {/* Accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-sky-600 via-indigo-600 to-slate-700 rounded-l-xl" />
      <div className="pl-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">Case Story</div>
        <p className="text-sm text-slate-300 leading-relaxed font-medium italic">
          {text}
        </p>
      </div>
    </div>
  );
}

export default function SimDebrief({ ending, scores, simTimeMin, completedActionIds, allActions, completedOrders, eventLog, metrics, onRestart, onHome }: Props) {
  const sev = SEVERITY_STYLE[ending.severity] ?? SEVERITY_STYLE.acceptable;
  const db  = ending.debrief;

  const avgScore = Math.round(
    Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length
  );

  const completedSet = new Set(completedActionIds);

  // Actions the player never took — group by category
  const missedActions = allActions.filter(a => !completedSet.has(a.id));
  const missedByCategory: Record<string, typeof missedActions> = {};
  for (const a of missedActions) {
    if (!missedByCategory[a.category]) missedByCategory[a.category] = [];
    missedByCategory[a.category].push(a);
  }

  const runSummary = buildRunSummary(metrics, completedSet);
  const goalsAchieved = REPLAY_GOALS.filter(g => g.check(completedSet, metrics, ending.id));
  const goalsMissed   = REPLAY_GOALS.filter(g => !g.check(completedSet, metrics, ending.id));

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-start py-8 px-4">
      <div className="w-full max-w-2xl space-y-4">

        {/* Narrative stanza */}
        <NarrativeStanza endingId={ending.id} simTimeMin={simTimeMin} completedIds={completedSet} />

        {/* Outcome header */}
        <div className={`rounded-xl border-2 ${sev.border} ${sev.bg} p-5`}>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <span className={`text-xs font-semibold uppercase tracking-wider ${sev.text}`}>Case Complete</span>
              <h1 className={`text-2xl font-bold mt-1 ${sev.text}`}>{ending.title}</h1>
              <p className="text-xs text-slate-400 mt-1">Case time: {formatTime(simTimeMin)}</p>
            </div>
            <div className={`text-center px-4 py-2 rounded-lg ${sev.badge}`}>
              <div className="text-2xl font-bold">{avgScore}</div>
              <div className="text-xs">Overall</div>
            </div>
          </div>

          <p className="text-slate-200 text-sm leading-relaxed mt-3">{ending.narrative}</p>
        </div>

        {/* Scores */}
        <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-4 space-y-3">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Performance</div>
          {(Object.keys(scores) as Array<keyof SimScores>).map(k => (
            <ScoreBar key={k} label={SCORE_LABEL[k]} value={scores[k]} />
          ))}
        </div>

        {/* Run Summary — personalised metrics */}
        <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-4">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">This Run</div>
          <div className="divide-y divide-slate-700/50">
            {runSummary.map((row, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <span className="text-xs text-slate-400">{row.label}</span>
                <span className={`text-xs font-semibold ${
                  row.good === true  ? 'text-emerald-400' :
                  row.good === false ? 'text-red-400' :
                  'text-slate-400'
                }`}>
                  {row.good === true  && '✓ '}{row.good === false && '✗ '}{row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Key moment */}
        <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-4">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Key Moment</div>
          <p className="text-sm text-slate-200 leading-relaxed">{db.keyMoment}</p>
        </div>

        {/* What went well / what was missed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {db.whatWentWell.length > 0 && (
            <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-xl p-4">
              <div className="text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-2">What Went Well</div>
              <ul className="space-y-1">
                {db.whatWentWell.map((w, i) => (
                  <li key={i} className="text-xs text-slate-200 flex gap-2">
                    <span className="text-emerald-400 shrink-0">✓</span>{w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {db.whatWasMissed.length > 0 && (
            <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4">
              <div className="text-xs font-semibold text-red-300 uppercase tracking-wider mb-2">What Was Missed</div>
              <ul className="space-y-1">
                {db.whatWasMissed.map((w, i) => (
                  <li key={i} className="text-xs text-slate-200 flex gap-2">
                    <span className="text-red-400 shrink-0">✗</span>{w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Optimal path */}
        <div className="bg-blue-900/20 border border-blue-700/40 rounded-xl p-4">
          <div className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2">Optimal Approach</div>
          <p className="text-sm text-slate-200 leading-relaxed">{db.optimalPath}</p>
        </div>

        {/* Clinical pearl */}
        <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-4">
          <div className="text-xs font-semibold text-amber-300 uppercase tracking-wider mb-2">Clinical Pearl</div>
          <p className="text-sm text-slate-200 leading-relaxed">{db.clinicalPearl}</p>
          {db.evidenceRef && (
            <p className="text-xs text-slate-500 mt-2 italic">{db.evidenceRef}</p>
          )}
        </div>

        {/* Replay Goals */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Replay Goals — {goalsAchieved.length}/{REPLAY_GOALS.length}
          </div>
          <div className="space-y-2">
            {REPLAY_GOALS.map(g => {
              const achieved = goalsAchieved.includes(g);
              return (
                <div key={g.id} className={`flex gap-2 items-start px-2 py-1.5 rounded-lg ${achieved ? 'bg-emerald-900/20' : 'bg-slate-900/30'}`}>
                  <span className={`shrink-0 text-sm mt-0.5 ${achieved ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {achieved ? '✓' : '○'}
                  </span>
                  <div>
                    <div className={`text-xs font-medium ${achieved ? 'text-emerald-300' : 'text-slate-500'}`}>{g.label}</div>
                    {!achieved && <div className="text-xs text-slate-600 mt-0.5">{g.detail}</div>}
                  </div>
                </div>
              );
            })}
          </div>
          {goalsMissed.length === 0 && (
            <p className="text-xs text-emerald-400 font-semibold text-center mt-3">All goals achieved — perfect run.</p>
          )}
        </div>

        {/* Case Journal */}
        <details className="group bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
          <summary className="px-4 py-3 cursor-pointer text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between select-none hover:text-slate-300 transition-colors">
            <span>Case Journal</span>
            <span className="text-slate-600 group-open:rotate-180 transition-transform">▼</span>
          </summary>

          <div className="border-t border-slate-700 p-4 space-y-4">

            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Patient</div>
              <p className="text-xs text-slate-300 font-mono">65F · The Morning Admission · Admitted 08:00 · Case duration: {formatTime(simTimeMin)}</p>
            </div>

            {eventLog.filter(e => JOURNAL_SOURCE_LABEL[e.source as keyof typeof JOURNAL_SOURCE_LABEL]).length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Clinical Record</div>
                <div className="space-y-2">
                  {eventLog
                    .filter(e => JOURNAL_SOURCE_LABEL[e.source as keyof typeof JOURNAL_SOURCE_LABEL])
                    .map((e, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="font-mono text-xs text-slate-500 shrink-0 pt-0.5">{wallClock(e.simTimeMin)}</span>
                        <div>
                          <span className="text-xs text-slate-500 font-medium">
                            {JOURNAL_SOURCE_LABEL[e.source as keyof typeof JOURNAL_SOURCE_LABEL]} —
                          </span>
                          <span className="text-xs text-slate-300 leading-snug"> {e.text}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {completedOrders.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Investigations</div>
                <div className="space-y-1">
                  {completedOrders.map(o => (
                    <div key={o.id} className="flex items-baseline gap-2 text-xs">
                      <span className="font-mono text-slate-500 shrink-0">{wallClock(o.orderedAtMin)}</span>
                      <span className="text-slate-300">{o.label}</span>
                      <span className="text-slate-600">→ resulted {wallClock(o.arrivedAtMin)}</span>
                      {o.viewedAtMin !== undefined && (
                        <span className="text-slate-600">· reviewed {wallClock(o.viewedAtMin)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Outcome</div>
              <p className="text-xs text-slate-300">{ending.title} — {ending.narrative.slice(0, 160)}{ending.narrative.length > 160 ? '…' : ''}</p>
            </div>
          </div>
        </details>

        {/* What you never discovered */}
        {Object.keys(missedByCategory).length > 0 && (
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              What You Never Discovered
            </div>
            <div className="space-y-3">
              {Object.entries(missedByCategory).map(([cat, actions]) => (
                <div key={cat}>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                    {CATEGORY_LABEL[cat] ?? cat}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {actions.map(a => (
                      <span
                        key={a.id}
                        className="text-xs px-2 py-0.5 rounded-md bg-slate-700/60 text-slate-400 border border-slate-600/40"
                      >
                        {a.icon} {a.label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={onRestart}
            className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-semibold text-sm transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={onHome}
            className="px-6 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm transition-colors"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
