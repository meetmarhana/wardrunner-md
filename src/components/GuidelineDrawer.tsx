import { useState } from 'react';
import type { GuidelineDrawerContent, Calculator } from '../types/case';

interface Props {
  content: GuidelineDrawerContent;
  isOpen: boolean;
  onClose: () => void;
}

interface CalculatorState {
  values: Record<string, string | boolean>;
  result: number | null;
  interpretation: string | null;
}

function CalculatorWidget({ calculator }: { calculator: Calculator }) {
  const initialValues: Record<string, string | boolean> = {};
  calculator.fields.forEach((f) => {
    initialValues[f.key] = f.type === 'boolean' ? false : '';
  });

  const [state, setState] = useState<CalculatorState>({
    values: initialValues,
    result: null,
    interpretation: null,
  });

  function handleChange(key: string, _type: 'number' | 'boolean', raw: string | boolean) {
    setState((prev) => ({
      ...prev,
      values: { ...prev.values, [key]: raw },
      result: null,
      interpretation: null,
    }));
  }

  function handleCalculate() {
    try {
      // Build args: convert string numbers to numbers
      const argKeys: string[] = [];
      const argValues: (number | boolean)[] = [];
      for (const field of calculator.fields) {
        argKeys.push(field.key);
        const raw = state.values[field.key];
        if (field.type === 'boolean') {
          argValues.push(raw === true ? true : false);
        } else {
          argValues.push(parseFloat(raw as string) || 0);
        }
      }

      // Safely evaluate formula using new Function
      // eslint-disable-next-line no-new-func
      const fn = new Function(...argKeys, `return (${calculator.formula});`);
      const score: number = fn(...argValues);

      // Find interpretation
      let interp: string | null = null;
      for (const entry of calculator.interpretation) {
        // range formats: ">=5", "<3", "2-4", "0"
        const range = entry.range.trim();
        const geMatch = range.match(/^>=\s*(-?\d+(?:\.\d+)?)$/);
        const gtMatch = range.match(/^>\s*(-?\d+(?:\.\d+)?)$/);
        const leMatch = range.match(/^<=\s*(-?\d+(?:\.\d+)?)$/);
        const ltMatch = range.match(/^<\s*(-?\d+(?:\.\d+)?)$/);
        const rangeMatch = range.match(/^(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)$/);
        const exactMatch = range.match(/^(-?\d+(?:\.\d+)?)$/);

        let hit = false;
        if (geMatch) hit = score >= parseFloat(geMatch[1]);
        else if (gtMatch) hit = score > parseFloat(gtMatch[1]);
        else if (leMatch) hit = score <= parseFloat(leMatch[1]);
        else if (ltMatch) hit = score < parseFloat(ltMatch[1]);
        else if (rangeMatch) hit = score >= parseFloat(rangeMatch[1]) && score <= parseFloat(rangeMatch[2]);
        else if (exactMatch) hit = score === parseFloat(exactMatch[1]);

        if (hit) {
          interp = entry.meaning;
          break;
        }
      }

      setState((prev) => ({ ...prev, result: score, interpretation: interp }));
    } catch {
      setState((prev) => ({ ...prev, result: null, interpretation: 'Error evaluating formula.' }));
    }
  }

  return (
    <div className="mt-4 rounded-lg bg-slate-800 border border-slate-700 p-4">
      <h3 className="text-sm font-semibold text-sky-400 mb-3">{calculator.name}</h3>

      <div className="space-y-2">
        {calculator.fields.map((field) => (
          <div key={field.key} className="flex items-center justify-between gap-3">
            <label className="text-xs text-slate-300 flex-1">{field.label}</label>
            {field.type === 'boolean' ? (
              <input
                type="checkbox"
                checked={state.values[field.key] as boolean}
                onChange={(e) => handleChange(field.key, 'boolean', e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-sky-500 focus:ring-sky-500"
              />
            ) : (
              <input
                type="number"
                value={state.values[field.key] as string}
                onChange={(e) => handleChange(field.key, 'number', e.target.value)}
                className="w-24 rounded bg-slate-700 border border-slate-600 text-slate-100 text-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="0"
              />
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleCalculate}
        className="mt-3 w-full rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium py-1.5 transition-colors"
      >
        Calculate
      </button>

      {state.result !== null && (
        <div className="mt-3 rounded bg-slate-700 px-3 py-2">
          <div className="text-lg font-bold text-sky-300">
            Score: {state.result}
          </div>
          {state.interpretation && (
            <div className="mt-1 text-xs text-slate-300">{state.interpretation}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function GuidelineDrawer({ content, isOpen, onClose }: Props) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed right-0 top-0 h-full w-96 bg-slate-900 border-l border-slate-700 z-50 flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label={content.title}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 shrink-0">
          <h2 className="text-base font-semibold text-slate-100 truncate pr-2">
            {content.title}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 transition-colors shrink-0"
            aria-label="Close guideline drawer"
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

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <pre className="whitespace-pre-wrap text-sm text-slate-300 font-sans leading-relaxed">
            {content.body}
          </pre>

          {content.calculators && content.calculators.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Clinical Calculators
              </h3>
              {content.calculators.map((calc, i) => (
                <CalculatorWidget key={i} calculator={calc} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
