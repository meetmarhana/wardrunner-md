import type { SimVitals, SimPatientStatus } from '../../types/simulation';

interface Props {
  vitals: SimVitals;
  prevVitals: SimVitals;
  status: SimPatientStatus;
}

function trend(current: number, prev: number, _invertBad = false): 'up' | 'down' | 'stable' {
  const delta = current - prev;
  if (Math.abs(delta) < 0.5) return 'stable';
  return delta > 0 ? 'up' : 'down';
}

function TrendArrow({ direction, good }: { direction: 'up' | 'down' | 'stable'; good: boolean }) {
  if (direction === 'stable') return <span className="text-slate-500 text-xs">—</span>;
  const isPositive = (direction === 'up') === good;
  const color = isPositive ? 'text-emerald-400' : 'text-red-400';
  return <span className={`${color} text-xs font-bold`}>{direction === 'up' ? '↑' : '↓'}</span>;
}

function VRow({
  label,
  value,
  unit,
  prev,
  current,
  upIsGood,
  flagged,
}: {
  label: string;
  value: string;
  unit?: string;
  prev: number;
  current: number;
  upIsGood: boolean;
  flagged?: boolean;
}) {
  const dir = trend(current, prev);
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-700/50 last:border-0">
      <span className="text-slate-400 text-xs w-16 shrink-0">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={`font-mono text-sm font-medium ${flagged ? 'text-red-300' : 'text-slate-100'}`}>
          {value}
        </span>
        {unit && <span className="text-slate-500 text-xs">{unit}</span>}
        <TrendArrow direction={dir} good={upIsGood} />
      </div>
    </div>
  );
}

const STATUS_STYLE: Record<SimPatientStatus, { label: string; cls: string }> = {
  stable:          { label: 'Stable',         cls: 'bg-slate-700 text-slate-300' },
  guarded:         { label: 'Guarded',        cls: 'bg-amber-900/70 text-amber-300 animate-pulse' },
  critical:        { label: 'Critical',       cls: 'bg-red-900/80 text-red-300 animate-pulse' },
  improving:       { label: 'Improving',      cls: 'bg-emerald-900/70 text-emerald-300' },
  intubated:       { label: 'Intubated',      cls: 'bg-orange-900/70 text-orange-300' },
  'cardiac-arrest':{ label: 'Cardiac Arrest', cls: 'bg-red-800 text-red-200 animate-pulse' },
  dead:            { label: 'Deceased',       cls: 'bg-slate-800 text-slate-400' },
  discharged:      { label: 'Discharged',     cls: 'bg-emerald-900/70 text-emerald-300' },
  'icu-transferred':{ label: 'ICU',           cls: 'bg-blue-900/70 text-blue-300' },
};

export default function SimVitalsPanel({ vitals, prevVitals, status }: Props) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.guarded;

  return (
    <div className="bg-slate-800/60 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700">
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Vitals</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.cls}`}>{s.label}</span>
      </div>

      <div className="px-3 py-1">
        <VRow
          label="HR"
          value={String(Math.round(vitals.hr))}
          unit="bpm"
          prev={prevVitals.hr}
          current={vitals.hr}
          upIsGood={false}
          flagged={vitals.hr > 100 || vitals.hr < 50}
        />
        <VRow
          label="BP"
          value={`${Math.round(vitals.sbp)}/${Math.round(vitals.dbp)}`}
          unit="mmHg"
          prev={prevVitals.sbp}
          current={vitals.sbp}
          upIsGood={true}
          flagged={vitals.sbp < 90}
        />
        <VRow
          label="MAP"
          value={String(Math.round(vitals.map))}
          unit="mmHg"
          prev={prevVitals.map}
          current={vitals.map}
          upIsGood={true}
          flagged={vitals.map < 65}
        />
        <VRow
          label="RR"
          value={String(Math.round(vitals.rr))}
          unit="/min"
          prev={prevVitals.rr}
          current={vitals.rr}
          upIsGood={false}
          flagged={vitals.rr > 20 || vitals.rr < 8}
        />
        <VRow
          label="SpO₂"
          value={String(Math.round(vitals.spo2))}
          unit="%"
          prev={prevVitals.spo2}
          current={vitals.spo2}
          upIsGood={true}
          flagged={vitals.spo2 < 94}
        />
        <VRow
          label="Temp"
          value={vitals.temp.toFixed(1)}
          unit="°C"
          prev={prevVitals.temp}
          current={vitals.temp}
          upIsGood={false}
          flagged={vitals.temp > 38.3 || vitals.temp < 36.0}
        />
        <VRow
          label="GCS"
          value={String(Math.round(vitals.gcs))}
          unit="/15"
          prev={prevVitals.gcs}
          current={vitals.gcs}
          upIsGood={true}
          flagged={vitals.gcs < 15}
        />
        <VRow
          label="UO"
          value={Math.round(vitals.uoMlHr) < 0 ? '0' : String(Math.round(vitals.uoMlHr))}
          unit="mL/hr"
          prev={prevVitals.uoMlHr}
          current={vitals.uoMlHr}
          upIsGood={true}
          flagged={vitals.uoMlHr < 30}
        />
      </div>
    </div>
  );
}
