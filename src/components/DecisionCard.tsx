import type { Choice } from '../types/case';

interface Props {
  choice: Choice;
  onSelect: (choice: Choice) => void;
  disabled?: boolean;
  revealed?: boolean;
  selected?: boolean;
}

export default function DecisionCard({ choice, onSelect, disabled, revealed, selected }: Props) {
  const isCorrect = choice.correct;

  // Determine visual state
  const isRevealedSelected = revealed && selected;

  function cardClasses(): string {
    const base =
      'relative w-full text-left rounded-xl border px-4 py-3 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

    if (!revealed) {
      if (disabled) {
        return `${base} border-slate-700 bg-slate-800 text-slate-500 cursor-not-allowed opacity-60`;
      }
      return `${base} border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:border-slate-400 active:bg-slate-600 cursor-pointer`;
    }

    // Revealed states
    if (isRevealedSelected && isCorrect) {
      return `${base} border-green-500 bg-green-900/30 text-green-100 cursor-default`;
    }
    if (isRevealedSelected && !isCorrect) {
      return `${base} border-red-500 bg-red-900/30 text-red-100 cursor-default`;
    }
    // Revealed but not selected — dimmed
    return `${base} border-slate-700 bg-slate-800/50 text-slate-500 cursor-default opacity-50`;
  }

  return (
    <button
      className={cardClasses()}
      onClick={() => {
        if (!disabled && !revealed) onSelect(choice);
      }}
      disabled={disabled || revealed}
      aria-pressed={selected}
    >
      {/* Main choice text row */}
      <div className="flex items-start gap-3">
        {/* Icon — only show when revealed and selected */}
        {isRevealedSelected && (
          <span
            className={`mt-0.5 flex-shrink-0 text-base leading-none ${isCorrect ? 'text-green-400' : 'text-red-400'}`}
            aria-hidden="true"
          >
            {isCorrect ? '✓' : '✗'}
          </span>
        )}

        <span className="flex-1 text-sm font-medium leading-snug">{choice.text}</span>
      </div>

      {/* Feedback text — only when revealed and selected */}
      {isRevealedSelected && choice.feedback && (
        <p className={`mt-2 text-xs leading-relaxed ${isCorrect ? 'text-green-300' : 'text-red-300'}`}>
          {choice.feedback}
        </p>
      )}

      {/* Educational note — only when revealed and selected */}
      {isRevealedSelected && choice.educationalNote && (
        <p className="mt-2 text-xs italic leading-relaxed text-blue-300 bg-blue-900/20 border border-blue-800 rounded-lg px-2 py-1.5">
          {choice.educationalNote}
        </p>
      )}
    </button>
  );
}
