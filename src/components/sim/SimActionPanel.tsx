import { useState } from 'react';
import type { SimAction, ActionCategory } from '../../types/simulation';

interface Props {
  actions: SimAction[];
  disabled: boolean;
  onAction: (action: SimAction) => void;
}

const CATEGORIES: { id: ActionCategory | 'all'; label: string }[] = [
  { id: 'all',         label: 'All' },
  { id: 'assessment',  label: 'Assess' },
  { id: 'investigation', label: 'Investigate' },
  { id: 'treatment',   label: 'Treat' },
  { id: 'disposition', label: 'Dispose' },
  { id: 'consult',     label: 'Consult' },
  { id: 'monitoring',  label: 'Monitor' },
];

const CAT_COLORS: Record<ActionCategory, string> = {
  assessment:    'border-blue-700/60  bg-blue-900/20  hover:border-blue-500  hover:bg-blue-900/40',
  investigation: 'border-violet-700/60 bg-violet-900/20 hover:border-violet-500 hover:bg-violet-900/40',
  treatment:     'border-emerald-700/60 bg-emerald-900/20 hover:border-emerald-500 hover:bg-emerald-900/40',
  procedure:     'border-orange-700/60 bg-orange-900/20 hover:border-orange-500 hover:bg-orange-900/40',
  disposition:   'border-sky-700/60 bg-sky-900/20 hover:border-sky-500 hover:bg-sky-900/40',
  consult:       'border-teal-700/60 bg-teal-900/20 hover:border-teal-500 hover:bg-teal-900/40',
  monitoring:    'border-slate-600  bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800',
};

export default function SimActionPanel({ actions, disabled, onAction }: Props) {
  const [tab, setTab] = useState<ActionCategory | 'all'>('all');

  const categories = CATEGORIES.filter(c => {
    if (c.id === 'all') return true;
    return actions.some(a => a.category === c.id);
  });

  const visible = tab === 'all' ? actions : actions.filter(a => a.category === tab);

  return (
    <div className="bg-slate-800/60 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Actions</span>
        <span className="text-xs text-slate-500">{actions.length} available</span>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 px-2 pt-2 pb-1 overflow-x-auto">
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setTab(c.id)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap shrink-0 ${
              tab === c.id
                ? 'bg-slate-600 border-slate-500 text-slate-100'
                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-300 hover:border-slate-600'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Action grid */}
      <div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-80 overflow-y-auto">
        {visible.length === 0 && (
          <div className="col-span-2 text-xs text-slate-500 italic p-2">
            No actions available in this category right now.
          </div>
        )}
        {visible.map(action => {
          const colors = CAT_COLORS[action.category] ?? CAT_COLORS.monitoring;
          return (
            <button
              key={action.id}
              onClick={() => !disabled && onAction(action)}
              disabled={disabled}
              className={`text-left rounded-lg border p-2.5 transition-all duration-150 ${
                disabled
                  ? 'opacity-40 cursor-not-allowed border-slate-700 bg-slate-800/30'
                  : colors + ' cursor-pointer'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg shrink-0 leading-none mt-0.5">{action.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-100 leading-tight">{action.label}</div>
                  {action.sublabel && (
                    <div className="text-xs text-slate-400 mt-0.5">{action.sublabel}</div>
                  )}
                  {action.description && (
                    <div className="text-xs text-slate-500 mt-1 leading-snug line-clamp-2">
                      {action.description}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
