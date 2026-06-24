import type { InvestigationResult } from '../types/case';

interface Props {
  investigations: InvestigationResult[];
  isOpen: boolean;
  onClose: () => void;
}

export default function InvestigationViewer({ investigations, isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    /* Overlay */
    <div
      className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Investigation Results"
    >
      {/* Modal panel — stop click propagation so clicking inside doesn't close */}
      <div
        className="relative w-full max-w-2xl bg-slate-900 rounded-xl border border-slate-700 p-6 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5 shrink-0">
          <h2 className="text-lg font-semibold text-slate-100">Investigation Results</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 transition-colors"
            aria-label="Close investigation viewer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {investigations.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No investigations ordered yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {investigations.map((inv, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-4 ${
                    inv.flagged
                      ? 'border-red-600 bg-red-950/30'
                      : 'border-slate-700 bg-slate-800'
                  }`}
                >
                  {/* Name row */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide truncate">
                      {inv.name}
                    </span>
                    {inv.flagged && (
                      <span
                        className="text-red-400 shrink-0"
                        aria-label="Abnormal result"
                        title="Abnormal result"
                      >
                        ⚠️
                      </span>
                    )}
                  </div>

                  {/* Value */}
                  <div
                    className={`text-2xl font-bold leading-tight ${
                      inv.flagged ? 'text-red-400' : 'text-slate-100'
                    }`}
                  >
                    {inv.value}
                  </div>

                  {/* Normal range */}
                  {inv.normal && (
                    <div className="mt-1 text-xs text-slate-500">
                      Normal: {inv.normal}
                    </div>
                  )}

                  {/* Optional image */}
                  {inv.image && (
                    <img
                      src={inv.image}
                      alt={`${inv.name} result`}
                      className="mt-3 w-full rounded object-contain max-h-40"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
