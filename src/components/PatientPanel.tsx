import type { Vitals, Severity, Badge } from '../types/case';

interface Props {
  vitals: Vitals;
  severity: Severity;
  elapsedMinutes: number;
  scores: { diagnostic: number; safety: number; time: number; cost: number; guideline: number };
  earnedBadges: string[];
  availableBadges: Badge[];
  patientName?: string;
}

function formatElapsed(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function severityColor(severity: Severity): string {
  switch (severity) {
    case 'stable':   return 'bg-green-600 text-green-100';
    case 'guarded':  return 'bg-yellow-600 text-yellow-100';
    case 'critical': return 'bg-red-600 text-red-100';
    case 'deceased': return 'bg-slate-900 text-slate-300 border border-slate-600';
    default:         return 'bg-slate-600 text-slate-100';
  }
}

function indicatorColor(severity: Severity): string {
  switch (severity) {
    case 'stable':   return 'bg-green-400';
    case 'guarded':  return 'bg-yellow-400';
    case 'critical': return 'bg-red-500';
    case 'deceased': return 'bg-slate-900 border border-slate-500';
    default:         return 'bg-slate-500';
  }
}

function scoreBarColor(value: number): string {
  if (value >= 70) return 'bg-green-500';
  if (value >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

function isVitalAbnormal(key: string, value: number | string): boolean {
  if (typeof value !== 'number') return false;
  switch (key) {
    case 'hr':   return value > 100;
    case 'spo2': return value < 94;
    case 'rr':   return value > 20;
    case 'sbp':  return value < 100;
    default:     return false;
  }
}

const SCORE_LABELS: { key: keyof Props['scores']; label: string }[] = [
  { key: 'diagnostic', label: 'Diagnostic' },
  { key: 'safety',     label: 'Safety' },
  { key: 'time',       label: 'Time' },
  { key: 'cost',       label: 'Cost' },
  { key: 'guideline',  label: 'Guideline' },
];

export default function PatientPanel({
  vitals,
  severity,
  elapsedMinutes,
  scores,
  earnedBadges,
  availableBadges,
  patientName,
}: Props) {
  const negativeBadgeIds = new Set(
    availableBadges.filter((b) => b.positive === false).map((b) => b.id)
  );

  const sbp = vitals.bp ? Number(vitals.bp.split('/')[0]) : NaN;

  const vitalsRows: { label: string; key: string; value: number | string; unit: string }[] = [
    { label: 'BP',   key: 'sbp',  value: vitals.bp ?? '—', unit: 'mmHg' },
    { label: 'HR',   key: 'hr',   value: vitals.hr   ?? '—', unit: 'bpm' },
    { label: 'RR',   key: 'rr',   value: vitals.rr   ?? '—', unit: '/min' },
    { label: 'SpO₂', key: 'spo2', value: vitals.spo2 ?? '—', unit: '%' },
    { label: 'Temp', key: 'temp', value: vitals.temp ?? '—', unit: '°C' },
    { label: 'GCS',  key: 'gcs',  value: vitals.gcs  ?? '—', unit: '/15' },
  ];

  return (
    <aside className="flex flex-col gap-4 w-64 min-w-[16rem] bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-300 text-sm overflow-y-auto">

      {/* Header */}
      <div className="flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full flex-shrink-0 ${indicatorColor(severity)}`} />
        <h2 className="font-semibold text-slate-100 tracking-wide uppercase text-xs">
          Patient Status
        </h2>
      </div>

      {patientName && (
        <p className="text-slate-400 text-xs -mt-2 truncate">{patientName}</p>
      )}

      {/* Severity + Time */}
      <div className="flex items-center justify-between gap-2">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${severityColor(severity)}`}>
          {severity}
        </span>
        <span className="text-slate-400 text-xs">⏱ {formatElapsed(elapsedMinutes)}</span>
      </div>

      {/* Vitals Grid */}
      <div>
        <p className="text-slate-500 uppercase text-xs font-semibold mb-2 tracking-wider">Vitals</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          {vitalsRows.map(({ label, key, value, unit }) => {
            const numericValue = typeof value === 'number' ? value : NaN;
            const abnormal = !isNaN(numericValue) && isVitalAbnormal(key, numericValue);
            const bpAbnormal = key === 'sbp' && !isNaN(sbp) && isVitalAbnormal('sbp', sbp);

            return (
              <div key={key} className="bg-slate-800 rounded-lg px-2 py-1.5">
                <p className="text-slate-500 text-xs leading-none mb-0.5">{label}</p>
                <p className={`font-mono font-semibold leading-tight ${abnormal || bpAbnormal ? 'text-red-400' : 'text-slate-100'}`}>
                  {String(value)}
                  <span className="text-slate-500 font-normal text-xs ml-0.5">{unit}</span>
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scores */}
      <div>
        <p className="text-slate-500 uppercase text-xs font-semibold mb-2 tracking-wider">Scores</p>
        <div className="flex flex-col gap-2">
          {SCORE_LABELS.map(({ key, label }) => {
            const val = scores[key];
            return (
              <div key={key}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-slate-400">{label}</span>
                  <span className={`font-mono font-semibold ${val >= 70 ? 'text-green-400' : val >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {val}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${scoreBarColor(val)}`}
                    style={{ width: `${Math.min(100, Math.max(0, val))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges */}
      {earnedBadges.length > 0 && (
        <div>
          <p className="text-slate-500 uppercase text-xs font-semibold mb-2 tracking-wider">Badges</p>
          <div className="flex flex-wrap gap-1.5">
            {earnedBadges.map((id) => {
              const isNegative = negativeBadgeIds.has(id);
              const badge = availableBadges.find((b) => b.id === id);
              const label = badge?.label ?? id;
              return (
                <span
                  key={id}
                  title={badge?.description}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    isNegative
                      ? 'bg-orange-900 text-orange-300 border border-orange-700'
                      : 'bg-green-900 text-green-300 border border-green-700'
                  }`}
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
