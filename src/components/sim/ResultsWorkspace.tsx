import { useState } from 'react';
import type { Order, SimAction } from '../../types/simulation';
import ResultDrawer from './ResultDrawer';

const CASE_START_MIN = 8 * 60;
function wallClock(m: number): string {
  const t = CASE_START_MIN + m;
  return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

type Tab = 'inbox' | 'labs' | 'imaging' | 'cardiac' | 'consults' | 'mar';

const TABS: { id: Tab; label: string }[] = [
  { id: 'inbox',   label: 'Inbox'    },
  { id: 'labs',    label: 'Labs'     },
  { id: 'imaging', label: 'Imaging'  },
  { id: 'cardiac', label: 'Cardiac'  },
  { id: 'consults',label: 'Consults' },
  { id: 'mar',     label: 'MAR'      },
];

const TYPE_MAP: Record<string, string[]> = {
  labs:     ['lab'],
  imaging:  ['imaging'],
  cardiac:  ['cardiac'],
  consults: ['consult', 'procedure'],
};

interface Props {
  orders: Order[];
  completedTreatments: SimAction[];
  onViewResult: (orderId: string) => void;
}

export default function ResultsWorkspace({ orders, completedTreatments, onViewResult }: Props) {
  const [tab, setTab]               = useState<Tab>('inbox');
  const [drawerOrder, setDrawerOrder] = useState<Order | null>(null);

  const arrived = orders.filter(o => o.isArrived);
  const pending  = orders.filter(o => !o.isArrived);
  const unread   = arrived.filter(o => !o.isViewed);

  function openOrder(order: Order) {
    onViewResult(order.id);
    setDrawerOrder(order);
  }

  const byType = (types: string[]) => arrived.filter(o => types.includes(o.type));

  function countFor(t: Tab): number {
    if (t === 'inbox') return unread.length + pending.length;
    if (t === 'mar')   return completedTreatments.length;
    return byType(TYPE_MAP[t] ?? []).length;
  }

  const renderContent = () => {
    if (tab === 'mar') return <MarList treatments={completedTreatments} />;

    if (tab === 'inbox') {
      const read = arrived.filter(o => o.isViewed);
      if (unread.length === 0 && pending.length === 0 && read.length === 0)
        return <p className="text-xs text-slate-700 text-center pt-6">Inbox empty.</p>;
      return (
        <div className="space-y-1">
          {unread.map(o => <ResultRow key={o.id} order={o} isNew onOpen={() => openOrder(o)} />)}
          {pending.map(o => <PendingRow key={o.id} order={o} />)}
          {read.map(o => <ResultRow key={o.id} order={o} onOpen={() => openOrder(o)} />)}
        </div>
      );
    }

    const list = byType(TYPE_MAP[tab] ?? []);
    if (list.length === 0)
      return <p className="text-xs text-slate-700 text-center pt-6">No {tab} results yet.</p>;
    return (
      <div className="space-y-1">
        {list.map(o => (
          <ResultRow key={o.id} order={o} isNew={!o.isViewed} onOpen={() => openOrder(o)} />
        ))}
      </div>
    );
  };

  return (
    <>
      <ResultDrawer order={drawerOrder} onClose={() => setDrawerOrder(null)} />

      <div className="flex flex-col h-full">
        {/* Tab bar */}
        <div className="flex border-b border-slate-800 shrink-0 overflow-x-auto scrollbar-none bg-slate-900/50">
          {TABS.map(t => {
            const count = countFor(t.id);
            const hasUnread = t.id === 'inbox' && unread.length > 0;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative px-3 py-1.5 text-xs font-medium flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors ${
                  tab === t.id
                    ? 'text-slate-100 border-b-2 border-sky-500'
                    : 'text-slate-600 hover:text-slate-300'
                }`}
              >
                {t.label}
                {count > 0 && (
                  <span className={`text-xs px-1 rounded-full font-semibold leading-tight ${
                    hasUnread
                      ? 'bg-sky-600 text-white'
                      : t.id === 'mar'
                      ? 'bg-emerald-900/80 text-emerald-300'
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 p-1.5">
          {renderContent()}
        </div>
      </div>
    </>
  );
}

/* ─── Result row (arrived) ───────────────────────────────────────────────────── */

function ResultRow({
  order,
  isNew = false,
  onOpen,
}: {
  order: Order;
  isNew?: boolean;
  onOpen: () => void;
}) {
  const icon =
    order.type === 'lab'     ? '🧪' :
    order.type === 'imaging' ? '🩻' :
    order.type === 'cardiac' ? '🫀' : '📋';

  return (
    <button
      onClick={onOpen}
      className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 transition-colors ${
        isNew
          ? 'bg-sky-950/50 border border-sky-700/50 hover:bg-sky-900/40'
          : 'bg-slate-900/30 border border-slate-800/20 hover:bg-slate-800/40'
      }`}
    >
      <span className="text-sm shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {isNew && <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0 animate-pulse" />}
          <span className={`text-xs font-medium truncate ${isNew ? 'text-slate-100' : 'text-slate-500'}`}>
            {order.label}
          </span>
          {order.result.isAbnormal && (
            <span className="text-xs text-red-400 font-bold shrink-0">ABNL</span>
          )}
        </div>
        <div className={`text-xs ${isNew ? 'text-sky-400' : 'text-slate-700'}`}>
          {isNew ? `Available ${wallClock(order.arrivedAtMin)} · tap to open` : wallClock(order.arrivedAtMin)}
        </div>
      </div>
    </button>
  );
}

/* ─── Pending row ────────────────────────────────────────────────────────────── */

function PendingRow({ order }: { order: Order }) {
  return (
    <div className="px-2 py-1.5 rounded bg-slate-900/20 border border-slate-800/20 flex items-center justify-between">
      <span className="text-xs text-slate-600">{order.label}</span>
      <span className="text-xs text-amber-600 font-mono">→ {wallClock(order.arrivedAtMin)}</span>
    </div>
  );
}

/* ─── MAR ────────────────────────────────────────────────────────────────────── */

function MarList({ treatments }: { treatments: SimAction[] }) {
  if (treatments.length === 0)
    return <p className="text-xs text-slate-700 text-center pt-6">No medications administered.</p>;
  return (
    <div className="space-y-1">
      {treatments.map(t => (
        <div
          key={t.id}
          className="flex items-center justify-between px-2 py-1.5 rounded bg-emerald-950/20 border border-emerald-900/30"
        >
          <div>
            <div className="text-xs text-slate-200 font-medium">{t.label}</div>
            {t.sublabel && <div className="text-xs text-slate-600">{t.sublabel}</div>}
          </div>
          <span className="text-xs text-emerald-400 font-medium shrink-0 ml-2">✓ Administered</span>
        </div>
      ))}
    </div>
  );
}
