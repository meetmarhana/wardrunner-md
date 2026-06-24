interface Props {
  className?: string;
  compact?: boolean;
}

export default function Disclaimer({ className = '', compact = false }: Props) {
  if (compact) {
    return (
      <p className={`text-xs text-amber-300/60 ${className}`}>
        ⚠️ Educational simulation only — not medical advice or clinical guidance.
      </p>
    );
  }

  return (
    <div className={`border border-amber-600/40 bg-amber-950/30 rounded-xl px-4 py-3 ${className}`}>
      <div className="flex gap-2.5 items-start">
        <span className="text-amber-400 text-base shrink-0 mt-0.5">⚠️</span>
        <p className="text-xs text-amber-200/80 leading-relaxed">
          <span className="font-semibold text-amber-300">Educational Use Only. </span>
          WardRunner MD is an educational simulation game. It is not medical advice, clinical guidance,
          or a substitute for professional judgment, local protocols, or current guidelines.
        </p>
      </div>
    </div>
  );
}
