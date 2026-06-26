import type { Order, PatientSim } from '../../types/simulation';

interface Props {
  patient: PatientSim;
  onViewResult: (orderId: string) => void;
}

const CASE_START_MIN = 8 * 60;

function wallClock(simMin: number): string {
  const total = CASE_START_MIN + simMin;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatRemaining(order: Order, currentMin: number): string {
  const rem = order.arrivedAtMin - currentMin;
  if (rem <= 0) return 'Now';
  return `~${rem} min`;
}

const ORDER_TYPE_ICON: Record<string, string> = {
  lab:       '🔬',
  imaging:   '🫁',
  cardiac:   '📈',
  procedure: '🩺',
  consult:   '👨‍⚕️',
  medication: '💊',
};

function OrderRow({
  order,
  simTime,
  onView,
}: {
  order: Order;
  simTime: number;
  onView?: () => void;
}) {
  const icon = ORDER_TYPE_ICON[order.type] ?? '📋';
  const arrived = order.isArrived;
  const viewed  = order.isViewed;

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg border ${
      arrived && !viewed
        ? 'border-amber-700/70 bg-amber-900/20'
        : arrived
        ? 'border-slate-700/40 bg-slate-800/30'
        : 'border-slate-700/30 bg-slate-900/20'
    }`}>
      <span className="text-base shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium truncate ${arrived ? 'text-slate-200' : 'text-slate-400'}`}>
            {order.label}
          </span>
          {arrived && !viewed && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-700/50 text-amber-200 font-semibold shrink-0">NEW</span>
          )}
          {viewed && order.result.isAbnormal && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-red-900/50 text-red-300 shrink-0">Abnormal</span>
          )}
        </div>
        {!arrived && (
          <span className="text-xs text-slate-500">Result in {formatRemaining(order, simTime)}</span>
        )}
      </div>
      {arrived && !viewed && onView && (
        <button
          onClick={onView}
          className="shrink-0 text-xs px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors"
        >
          View
        </button>
      )}
      {viewed && (
        <span className="text-xs text-slate-600 shrink-0">Viewed</span>
      )}
    </div>
  );
}

function ResultDetailModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  const res = order.result;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div
        className="bg-slate-800 border border-slate-600 rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <div>
            <div className="font-semibold text-slate-100">{order.label}</div>
            <div className="text-xs text-slate-400">
            Ordered {wallClock(order.orderedAtMin)}
            {' · '}Resulted {wallClock(order.arrivedAtMin)}
            {order.viewedAtMin !== undefined && ` · Reviewed ${wallClock(order.viewedAtMin)}`}
          </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-xl leading-none">×</button>
        </div>

        <div className="p-4 space-y-3">
          {res.type === 'lab-panel' && res.values && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-700">
                  <th className="text-left py-1">Test</th>
                  <th className="text-right py-1">Result</th>
                  <th className="text-right py-1 hidden sm:table-cell">Normal</th>
                </tr>
              </thead>
              <tbody>
                {res.values.map(v => (
                  <tr key={v.key} className={`border-b border-slate-700/40 ${v.flagged ? 'bg-red-900/10' : ''}`}>
                    <td className="py-1.5 text-slate-300">{v.label}</td>
                    <td className={`py-1.5 text-right font-mono font-semibold ${v.flagged ? 'text-red-300' : 'text-slate-100'}`}>
                      {v.flagged && '⚑ '}{v.value}
                    </td>
                    {v.normal && (
                      <td className="py-1.5 text-right text-slate-500 text-xs hidden sm:table-cell">{v.normal}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {(res.type === 'imaging-report' || res.type === 'ecg-report' || res.type === 'consult-note') && res.reportText && (
            <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed bg-slate-900/50 p-3 rounded-lg">
              {res.reportText}
            </pre>
          )}

          {res.revealsHiddenVitals && Object.keys(res.revealsHiddenVitals).length > 0 && (
            <div className="text-xs text-amber-400 bg-amber-900/20 border border-amber-700/40 rounded p-2">
              Values from this result are now tracked by the engine.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SimOrdersPanel({ patient, onViewResult }: Props) {
  const pending   = patient.pendingOrders;
  const completed = patient.completedOrders;
  const unviewed  = completed.filter(o => !o.isViewed);
  const viewed    = completed.filter(o => o.isViewed);

  // State for detail modal — inline since this component owns the modal
  const [viewing, setViewing] = React.useState<Order | null>(null);

  const handleView = (order: Order) => {
    onViewResult(order.id);
    setViewing(order);
  };

  if (pending.length === 0 && completed.length === 0) {
    return (
      <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-3">
        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Orders</div>
        <p className="text-xs text-slate-500 italic">No orders placed yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-slate-800/60 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-3 py-2 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Orders & Results</span>
          {unviewed.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-700/60 text-amber-200 font-semibold">
              {unviewed.length} new
            </span>
          )}
        </div>

        <div className="p-2 space-y-1.5 max-h-72 overflow-y-auto">
          {/* Unviewed results first */}
          {unviewed.map(o => (
            <OrderRow key={o.id} order={o} simTime={patient.simTimeMinutes} onView={() => handleView(o)} />
          ))}

          {/* Pending orders */}
          {pending.map(o => (
            <OrderRow key={o.id} order={o} simTime={patient.simTimeMinutes} />
          ))}

          {/* Viewed results (collapsed by default) */}
          {viewed.length > 0 && (
            <details className="group">
              <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400 py-1 list-none flex items-center gap-1">
                <span className="group-open:hidden">▶</span>
                <span className="hidden group-open:inline">▼</span>
                {viewed.length} viewed result{viewed.length !== 1 ? 's' : ''}
              </summary>
              <div className="space-y-1.5 mt-1.5">
                {viewed.map(o => (
                  <div
                    key={o.id}
                    className="cursor-pointer"
                    onClick={() => setViewing(o)}
                  >
                    <OrderRow order={o} simTime={patient.simTimeMinutes} />
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>

      {viewing && (
        <ResultDetailModal order={viewing} onClose={() => setViewing(null)} />
      )}
    </>
  );
}

// Needs React for useState inside component file
import React from 'react';
