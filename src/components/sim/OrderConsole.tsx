import { useState } from 'react';
import type { SimAction } from '../../types/simulation';

type Group = { id: string; label: string; icon: string };

const GROUPS: Group[] = [
  { id: 'assess',      label: 'Assessment',  icon: '🩺' },
  { id: 'labs',        label: 'Labs',         icon: '🧪' },
  { id: 'imaging',     label: 'Imaging',      icon: '📷' },
  { id: 'cardiac',     label: 'Cardiac',      icon: '🫀' },
  { id: 'treatment',   label: 'Treatments',   icon: '💊' },
  { id: 'consult',     label: 'Consults',     icon: '📞' },
  { id: 'disposition', label: 'Disposition',  icon: '🚪' },
];

function getGroup(action: SimAction): string {
  if (action.category === 'assessment')  return 'assess';
  if (action.category === 'disposition') return 'disposition';
  if (action.category === 'consult' || action.category === 'monitoring') return 'consult';
  if (action.category === 'treatment')   return 'treatment';
  if (action.category === 'investigation') {
    const t = action.effect.placesOrder?.type;
    if (t === 'imaging') return 'imaging';
    if (t === 'cardiac') return 'cardiac';
    return 'labs';
  }
  return 'assess';
}

interface Props {
  allActions: SimAction[];
  availableActionIds: Set<string>;
  completedActionIds: Set<string>;
  actingActionId: string | null;
  disabled: boolean;
  onAction: (action: SimAction) => void;
}

export default function OrderConsole({
  allActions,
  availableActionIds,
  completedActionIds,
  actingActionId,
  disabled,
  onAction,
}: Props) {
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const q = search.toLowerCase();
  const filtered = allActions.filter(a =>
    !q || a.label.toLowerCase().includes(q) || a.sublabel?.toLowerCase().includes(q)
  );

  const grouped = GROUPS
    .map(g => ({ ...g, actions: filtered.filter(a => getGroup(a) === g.id) }))
    .filter(g => g.actions.length > 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-1 bg-slate-900/60 border-b border-slate-800 shrink-0 flex items-center">
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Orders</span>
      </div>

      {/* Search */}
      <div className="px-2 py-1.5 border-b border-slate-800/60 shrink-0">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search orders…"
          className="w-full bg-slate-900 text-xs text-slate-200 placeholder-slate-700 px-2 py-1.5 rounded border border-slate-700/60 focus:outline-none focus:border-sky-600"
        />
      </div>

      {/* Groups */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {grouped.map(g => {
          const isCollapsed = collapsed.has(g.id);
          const availCount = g.actions.filter(
            a => availableActionIds.has(a.id) && !completedActionIds.has(a.id)
          ).length;

          return (
            <div key={g.id} className="border-b border-slate-800/30 last:border-0">
              {/* Group header */}
              <button
                onClick={() => toggle(g.id)}
                className="w-full flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-800/30 transition-colors"
              >
                <span className="text-xs">{g.icon}</span>
                <span className="text-xs font-semibold text-slate-500 flex-1 text-left">{g.label}</span>
                {availCount > 0 && (
                  <span className="text-xs bg-sky-900/60 text-sky-400 px-1.5 rounded-full font-semibold leading-tight">
                    {availCount}
                  </span>
                )}
                <span className="text-slate-700 text-xs">{isCollapsed ? '▸' : '▾'}</span>
              </button>

              {/* Actions */}
              {!isCollapsed && g.actions.map(action => {
                const isAvailable  = availableActionIds.has(action.id);
                const isDone       = completedActionIds.has(action.id);
                const isActing     = actingActionId === action.id;
                const clickable    = isAvailable && !isDone && !disabled;

                let lockedReason = '';
                if (!isDone && !isAvailable) {
                  if (action.requiresActionIds?.length) lockedReason = 'Requires prior action';
                  else if (action.requiresFlags?.length) lockedReason = 'Requirements not met';
                }

                return (
                  <button
                    key={action.id}
                    onClick={() => clickable && onAction(action)}
                    disabled={!clickable}
                    title={lockedReason || undefined}
                    className={`w-full text-left px-2.5 py-1.5 flex items-start gap-2 transition-all border-t border-slate-800/20 ${
                      isActing
                        ? 'bg-blue-900/30 border-l-2 border-blue-500'
                        : isDone
                        ? 'opacity-30'
                        : isAvailable
                        ? 'hover:bg-sky-900/20 cursor-pointer'
                        : 'opacity-20 cursor-not-allowed'
                    }`}
                  >
                    <span className={`text-base shrink-0 mt-0.5 ${isActing ? 'animate-pulse' : ''}`}>
                      {action.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-medium truncate ${
                          isActing    ? 'text-blue-300' :
                          isDone      ? 'text-slate-500 line-through' :
                          isAvailable ? 'text-slate-200' :
                                        'text-slate-500'
                        }`}>
                          {isActing ? `${action.label}…` : action.label}
                        </span>
                        {isDone && !isActing && (
                          <span className="text-emerald-500 text-xs shrink-0">✓</span>
                        )}
                      </div>
                      {isActing ? (
                        <span className="text-xs text-blue-400 animate-pulse">Processing…</span>
                      ) : (
                        <span className="text-xs text-slate-700">{action.timeCostMin} min</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}

        {grouped.length === 0 && (
          <p className="text-xs text-slate-700 text-center pt-6">No orders match.</p>
        )}
      </div>
    </div>
  );
}
