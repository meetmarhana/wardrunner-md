import { useRef, useEffect } from 'react';
import type { SimVitals, SimPatientStatus } from '../../types/simulation';

// ── ECG strip constants ────────────────────────────────────────────────────────
const ECG_CYCLE_W = 60;       // px per cardiac cycle
const ECG_CYCLES  = 20;       // total cycles (10 × 2 for seamless loop)
const ECG_HALF_W  = ECG_CYCLE_W * (ECG_CYCLES / 2); // 600px — animation scroll distance
const ECG_TOTAL_W = ECG_CYCLE_W * ECG_CYCLES;        // 1200px — SVG width
const ECG_H       = 42;
const ECG_MID     = 21;       // vertical center of strip

function buildEcgPoints(isArrest: boolean): string {
  const pts: string[] = [];
  for (let c = 0; c < ECG_CYCLES; c++) {
    const x = c * ECG_CYCLE_W;
    if (isArrest) {
      pts.push(`${x},${ECG_MID}`, `${x + ECG_CYCLE_W},${ECG_MID}`);
    } else {
      pts.push(
        `${x},${ECG_MID}`,                           // baseline start
        `${x+9},${ECG_MID}`,                         // pr baseline
        `${x+11},${ECG_MID-3}`,                      // p wave up
        `${x+14},${ECG_MID-7}`,                      // p wave peak
        `${x+17},${ECG_MID-3}`,                      // p wave down
        `${x+19},${ECG_MID}`,                        // pr segment
        `${x+27},${ECG_MID}`,                        // q start
        `${x+28},${ECG_MID+5}`,                      // Q
        `${x+30},${ECG_MID-15}`,                     // R peak
        `${x+32},${ECG_MID+9}`,                      // S
        `${x+33},${ECG_MID}`,                        // return
        `${x+40},${ECG_MID}`,                        // ST segment
        `${x+46},${ECG_MID-6}`,                      // T wave peak
        `${x+53},${ECG_MID}`,                        // T wave end
        `${x+60},${ECG_MID}`,                        // baseline
      );
    }
  }
  return pts.join(' ');
}

// ── Vitals ────────────────────────────────────────────────────────────────────

type Grade = 'green' | 'yellow' | 'red';

interface VitalSlot {
  id: string;
  label: string;
  unit: string;
  value: (v: SimVitals) => string;
  numeric: (v: SimVitals) => number;
  grade: (v: SimVitals) => Grade;
}

const VITALS: VitalSlot[] = [
  {
    id: 'hr', label: 'HR', unit: 'bpm',
    value: v => String(Math.round(v.hr)),
    numeric: v => v.hr,
    grade: v => v.hr > 120 || v.hr < 50 ? 'red' : v.hr > 100 || v.hr < 60 ? 'yellow' : 'green',
  },
  {
    id: 'bp', label: 'BP', unit: 'mmHg',
    value: v => `${Math.round(v.sbp)}/${Math.round(v.dbp)}`,
    numeric: v => v.sbp,
    grade: v => v.sbp < 80 ? 'red' : v.sbp < 100 ? 'yellow' : 'green',
  },
  {
    id: 'map', label: 'MAP', unit: 'mmHg',
    value: v => String(Math.round(v.map)),
    numeric: v => v.map,
    grade: v => v.map < 60 ? 'red' : v.map < 65 ? 'yellow' : 'green',
  },
  {
    id: 'spo2', label: 'SpO₂', unit: '%',
    value: v => String(Math.round(v.spo2)),
    numeric: v => v.spo2,
    grade: v => v.spo2 < 90 ? 'red' : v.spo2 < 95 ? 'yellow' : 'green',
  },
  {
    id: 'rr', label: 'RR', unit: '/min',
    value: v => String(Math.round(v.rr)),
    numeric: v => v.rr,
    grade: v => v.rr > 28 ? 'red' : v.rr > 20 ? 'yellow' : 'green',
  },
  {
    id: 'temp', label: 'Temp', unit: '°C',
    value: v => v.temp.toFixed(1),
    numeric: v => v.temp,
    grade: v => v.temp >= 39.5 || v.temp < 35 ? 'red' : v.temp >= 38 || v.temp < 36 ? 'yellow' : 'green',
  },
  {
    id: 'gcs', label: 'GCS', unit: '/15',
    value: v => String(Math.round(v.gcs)),
    numeric: v => v.gcs,
    grade: v => v.gcs <= 8 ? 'red' : v.gcs <= 12 ? 'yellow' : 'green',
  },
  {
    id: 'uo', label: 'UO', unit: 'mL/hr',
    value: v => String(Math.round(v.uoMlHr)),
    numeric: v => v.uoMlHr,
    grade: v => v.uoMlHr < 10 ? 'red' : v.uoMlHr < 30 ? 'yellow' : 'green',
  },
];

const GRADE_STYLE: Record<Grade, { val: string; bg: string }> = {
  green:  { val: 'text-emerald-400', bg: '' },
  yellow: { val: 'text-amber-400',   bg: 'bg-amber-950/25' },
  red:    { val: 'text-red-400',     bg: 'bg-red-950/50' },
};

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  vitals: SimVitals;
  prevVitals: SimVitals;
  status: SimPatientStatus;
}

export default function PatientMonitor({ vitals, prevVitals, status }: Props) {
  const isArrest  = status === 'cardiac-arrest';
  const ecgColor  = isArrest ? '#ef4444' : '#22c55e';
  const ecgPoints = buildEcgPoints(isArrest);

  const ecgGroupRef = useRef<SVGGElement | null>(null);
  const cellRefs    = useRef<Record<string, HTMLDivElement | null>>({});

  // ── Live ECG scroll animation ──────────────────────────────────────────────
  useEffect(() => {
    const el = ecgGroupRef.current;
    if (!el) return;
    // px/s = ECG_CYCLE_W * (HR beats/s)
    // time to scroll ECG_HALF_W px = ECG_HALF_W / (ECG_CYCLE_W * HR/60) seconds
    const bpm      = Math.max(30, isArrest ? 30 : vitals.hr);
    const duration = (ECG_HALF_W / bpm) * 60 * 1000; // ms
    const anim = el.animate(
      [
        { transform: 'translateX(0px)' },
        { transform: `translateX(-${ECG_HALF_W}px)` },
      ],
      { duration, iterations: Infinity, easing: 'linear' }
    );
    return () => anim.cancel();
  }, [vitals.hr, isArrest]);

  // ── Vital change flash ─────────────────────────────────────────────────────
  useEffect(() => {
    VITALS.forEach(slot => {
      const diff = slot.numeric(vitals) - slot.numeric(prevVitals);
      if (Math.abs(diff) > 0.4) {
        const el = cellRefs.current[slot.id];
        if (el) {
          el.animate(
            [
              { backgroundColor: 'rgba(96,165,250,0.22)' },
              { backgroundColor: 'transparent' },
            ],
            { duration: 1100, easing: 'ease-out' }
          );
        }
      }
    });
  }, [vitals]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-full bg-slate-950">

      {/* ── ECG Strip ─────────────────────────────────────────── */}
      <div
        className="shrink-0 bg-black border-b border-slate-800 overflow-hidden relative"
        style={{ height: `${ECG_H}px` }}
      >
        {/* Faint ECG grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              repeating-linear-gradient(90deg,rgba(34,197,94,0.07) 0,rgba(34,197,94,0.07) 1px,transparent 0,transparent ${ECG_CYCLE_W}px),
              repeating-linear-gradient(0deg,rgba(34,197,94,0.07) 0,rgba(34,197,94,0.07) 1px,transparent 0,transparent ${Math.round(ECG_H/3)}px)
            `,
          }}
        />

        {/* Scrolling waveform */}
        <svg
          width={ECG_TOTAL_W}
          height={ECG_H}
          className="absolute top-0 left-0"
          style={{ willChange: 'transform' }}
        >
          <g ref={ecgGroupRef}>
            <polyline
              points={ecgPoints}
              fill="none"
              stroke={ecgColor}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>

        {/* HR overlay (top-right of strip) */}
        <div
          className="absolute top-1 right-2 font-mono font-bold text-xs"
          style={{ color: ecgColor }}
        >
          {isArrest ? '——— ARREST ———' : `${Math.round(vitals.hr)} bpm`}
        </div>
      </div>

      {/* ── Vitals grid ───────────────────────────────────────── */}
      <div className={`grid grid-cols-4 gap-px bg-slate-800/40 flex-1 ${isArrest ? 'opacity-60' : ''}`}>
        {VITALS.map(slot => {
          const g = isArrest ? 'red' : slot.grade(vitals);
          const s = GRADE_STYLE[g];
          const diff    = slot.numeric(vitals) - slot.numeric(prevVitals);
          const noTrend = Math.abs(diff) < 0.4;
          const arrow   = noTrend ? '' : diff > 0 ? '↑' : '↓';
          const arrowCls = diff > 0 ? 'text-amber-400' : 'text-sky-400';

          return (
            <div
              key={slot.id}
              ref={el => { cellRefs.current[slot.id] = el; }}
              className={`${s.bg} ${g === 'red' && !isArrest ? 'animate-pulse' : ''} px-2 py-1.5 flex flex-col justify-center`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono tracking-wide">{slot.label}</span>
                {arrow && !isArrest && (
                  <span className={`text-xs font-bold ${arrowCls}`}>{arrow}</span>
                )}
              </div>
              <div className={`font-bold font-mono leading-tight text-xl ${s.val}`}>
                {isArrest
                  ? (slot.id === 'hr' ? '0' : slot.id === 'bp' ? '0/0' : '—')
                  : slot.value(vitals)}
              </div>
              <div className="text-xs text-slate-600 leading-none mt-0.5">{slot.unit}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
