import type { Order, OrderResult } from '../../types/simulation';

interface Props {
  order: Order | null;
  onClose: () => void;
}

export default function ResultDrawer({ order, onClose }: Props) {
  if (!order) return null;
  const result = order.result;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[480px] max-w-[92vw] bg-slate-950 border-l border-slate-700 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
          <div>
            <div className="text-sm font-semibold text-slate-100">{order.label}</div>
            <div className="text-xs text-slate-500 font-mono uppercase tracking-wide mt-0.5">
              {RESULT_TYPE_LABEL[result.type] ?? result.type}
              {result.isAbnormal && (
                <span className="ml-2 text-red-400 font-bold">· ABNORMAL</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 text-2xl leading-none px-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {result.type === 'lab-panel'      && <LabResult result={result} />}
          {result.type === 'imaging-report' && <ImagingResult result={result} />}
          {result.type === 'ecg-report'     && <EcgResult result={result} />}
          {result.type === 'consult-note'   && <ConsultResult result={result} />}
        </div>
      </div>
    </>
  );
}

const RESULT_TYPE_LABEL: Record<string, string> = {
  'lab-panel':      'Lab Panel',
  'imaging-report': 'Radiology',
  'ecg-report':     'ECG',
  'consult-note':   'Consult Note',
};

/* ─── Lab Panel ─────────────────────────────────────────────────────────────── */

function LabResult({ result }: { result: OrderResult }) {
  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Pathology Report</div>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-1.5 px-2 text-slate-500 font-semibold uppercase tracking-wide">Test</th>
            <th className="text-right py-1.5 px-2 text-slate-500 font-semibold uppercase tracking-wide">Result</th>
            <th className="text-right py-1.5 px-2 text-slate-500 font-semibold uppercase tracking-wide">Reference</th>
          </tr>
        </thead>
        <tbody>
          {(result.values ?? []).map((v, i) => (
            <tr key={i} className={`border-b border-slate-800/50 ${v.flagged ? 'bg-red-950/30' : ''}`}>
              <td className="py-1.5 px-2 text-slate-300">{v.label}</td>
              <td className={`py-1.5 px-2 text-right font-mono font-bold ${v.flagged ? 'text-red-400' : 'text-slate-200'}`}>
                {v.value}
                {v.flagged && <span className="text-red-500 text-xs ml-1">▲</span>}
              </td>
              <td className="py-1.5 px-2 text-right text-slate-600 font-mono">{v.normal ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Imaging Report ─────────────────────────────────────────────────────────── */

function ImagingResult({ result }: { result: OrderResult }) {
  const text = result.reportText ?? '';
  const impIdx = text.toLowerCase().indexOf('impression:');
  const reportBody = impIdx >= 0 ? text.slice(0, impIdx).trim() : text;
  const impression = impIdx >= 0 ? text.slice(impIdx + 'impression:'.length).trim() : '';

  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Radiology Report</div>
      {reportBody && (
        <div>
          <div className="text-xs text-slate-600 uppercase tracking-wide mb-1.5">Findings</div>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line font-mono">{reportBody}</p>
        </div>
      )}
      {impression && (
        <div className="bg-amber-950/30 border border-amber-800/40 rounded px-3 py-2.5">
          <div className="text-xs text-amber-500 uppercase tracking-wide font-bold mb-1.5">Impression</div>
          <p className="text-sm text-amber-100 leading-relaxed">{impression}</p>
        </div>
      )}
    </div>
  );
}

/* ─── ECG Report ─────────────────────────────────────────────────────────────── */

function EcgResult({ result }: { result: OrderResult }) {
  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">ECG — Lead II</div>
      <div className="bg-slate-900 rounded border border-slate-700 p-3">
        <svg viewBox="0 0 440 80" className="w-full" fill="none" stroke="#22c55e" strokeWidth="1.5">
          <polyline points={ECG_POINTS} />
        </svg>
        <div className="flex items-center justify-between mt-1 px-1">
          <span className="text-xs text-slate-700 font-mono">25 mm/s</span>
          <span className="text-xs text-slate-700 font-mono">10 mm/mV</span>
        </div>
      </div>
      {result.reportText && (
        <div>
          <div className="text-xs text-slate-600 uppercase tracking-wide mb-1.5">Interpretation</div>
          <p className="text-sm text-slate-300 leading-relaxed">{result.reportText}</p>
        </div>
      )}
    </div>
  );
}

// Precomputed sinus rhythm strip (4 cycles, lead II)
const ECG_POINTS = (() => {
  const pts: string[] = [];
  const addCycle = (x0: number) => {
    const p: [number, number][] = [
      [x0,      40], [x0+8,  40], [x0+10, 37], [x0+14, 40],
      [x0+20,   40], [x0+22, 38], [x0+25, 18], [x0+27, 60],
      [x0+29,   38], [x0+31, 40],
      [x0+40,   40], [x0+48, 32], [x0+56, 40], [x0+68, 40],
    ];
    p.forEach(([x, y]) => pts.push(`${x},${y}`));
  };
  addCycle(4); addCycle(114); addCycle(224); addCycle(334);
  return pts.join(' ');
})();

/* ─── Consult Note ───────────────────────────────────────────────────────────── */

function ConsultResult({ result }: { result: OrderResult }) {
  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Consult Note</div>
      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{result.reportText}</p>
    </div>
  );
}
