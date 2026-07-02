import { useState, useEffect, useRef, useCallback } from 'react';
import type { PatientSim, SimPatientStatus } from '../types/simulation';

export type InterruptionSource = 'nurse' | 'family' | 'lab' | 'pharmacy' | 'consultant';

export interface Interruption {
  id: string;
  source: InterruptionSource;
  text: string;
  responses: string[];
  durationMs: number;
}

interface PoolEntry {
  source: InterruptionSource;
  text: string;
  responses?: string[];
  condition?: (flags: Record<string, boolean>, status: SimPatientStatus, completedIds: string[]) => boolean;
}

// ─── Interruption pool ────────────────────────────────────────────────────────

const POOL: PoolEntry[] = [
  // Nurse — general
  { source: 'nurse', text: 'Should I hang another litre?',
    responses: ['Yes, go ahead', 'Not yet', "What's UO?"],
    condition: f => !!f.fluidsStarted && !f.adequateFluids },
  { source: 'nurse', text: "Sats drifting — 93 now.",
    responses: ['Increase O2', 'Check position', 'Noted'] },
  { source: 'nurse', text: 'Daughter outside wants to know what\'s happening.',
    responses: ['Five minutes', 'Let her in', 'Not now'],
    condition: f => !!f.ivAccessEstablished },
  { source: 'nurse', text: 'BP cuff reading looks off — try other arm?',
    responses: ['Try other arm', 'Use manual', 'Noted'] },
  { source: 'nurse', text: 'Urine output still minimal. Bag barely changed.',
    responses: ['Noted', 'Push fluids', 'Chart it'],
    condition: (_, s) => s === 'critical' || s === 'guarded' },
  { source: 'nurse', text: "She's asking for water.",
    responses: ['Small sips OK', 'NBM for now', 'Check first'] },
  { source: 'nurse', text: "IV site's looking red — might be infiltrating.",
    responses: ['Re-site it', 'Leave for now', 'Check it'],
    condition: f => !!f.ivAccessEstablished },
  { source: 'nurse', text: 'Monitor alarming again. Threshold adjustment?',
    responses: ['Leave alarm', 'Adjust ×2', 'Silence 5 min'] },
  { source: 'nurse', text: "She's more confused. GCS feels lower.",
    responses: ['Recheck GCS', 'Expected', 'Noted'],
    condition: (_, s) => s === 'critical' || s === 'guarded' },
  { source: 'nurse', text: 'Family wants to pray with her.',
    responses: ['Give them space', 'Five minutes', 'Not now'] },
  { source: 'nurse', text: "IV's in and patent. Running well.",
    responses: ['Good', 'Noted'],
    condition: f => !!f.ivAccessEstablished },
  { source: 'nurse', text: "Cap refill's up to 4 seconds.",
    responses: ['Noted', 'Check BP again', 'Escalating'],
    condition: (_, s) => s === 'critical' },
  { source: 'nurse', text: 'She vomited — small amount. Position changed.',
    responses: ['Thanks', 'Keep NBM', 'Chart it'] },

  // Family
  { source: 'family', text: 'She forgot to say — she takes steroids for her joints.',
    responses: ['Thank you', 'Added to chart', 'Important'] },
  { source: 'family', text: 'Is she going to be alright?',
    responses: ["We're working on it", 'Too early to say', "She's in good hands"] },
  { source: 'family', text: 'She normally walks every day. This isn\'t like her.',
    responses: ['Good to know', 'Noted', 'Thank you'] },
  { source: 'family', text: 'Can I stay in the room?',
    responses: ['Yes, of course', 'Give us a moment', "We'll call you"] },
  { source: 'family', text: 'She mentioned chest pain yesterday.',
    responses: ['Possibly related', 'Tell me more', "We're checking"] },
  { source: 'family', text: "She's been eating less all week.",
    responses: ['Thanks for that', 'Noted', 'Helpful'] },
  { source: 'family', text: 'Is she in pain?',
    responses: ["We're managing it", 'She seems settled', "We're monitoring"] },

  // Lab
  { source: 'lab', text: 'Lactate critical — 5.2 mmol/L.',
    responses: ['On it', 'Noted', 'Repeating'],
    condition: f => !!f.vbgSent },
  { source: 'lab', text: 'One blood culture bottle flagged — possible contaminant.',
    responses: ['Repeat cultures', 'Discard one', 'Noted'],
    condition: f => !!f.culturesDrawn },
  { source: 'lab', text: 'CBC haemolysed — repeat needed.',
    responses: ['Repeat now', 'Hold', 'OK'] },
  { source: 'lab', text: 'K+ of 3.1 on panel.',
    responses: ['Noted', 'Replace?', 'Recheck'] },
  { source: 'lab', text: 'Creatinine elevated — 2.1 from baseline 0.8.',
    responses: ['AKI likely', 'Noted', 'Push fluids'] },

  // Pharmacy
  { source: 'pharmacy', text: 'Antibiotic drip ready to collect.',
    responses: ['Send it up', 'Two minutes', 'Thanks'],
    condition: f => !!f.antibioticsStarted },
  { source: 'pharmacy', text: 'Drug interaction flag — proceed?',
    responses: ['Proceed', 'Hold', 'What interaction?'] },
  { source: 'pharmacy', text: 'IV preparation delayed — 5 minutes.',
    responses: ['Noted', 'Hurry please', 'OK'] },
  { source: 'pharmacy', text: 'Incorrect dose entered in system — clarify?',
    responses: ['Correcting now', 'Standard dose', 'Check with me'] },

  // Consultant
  { source: 'consultant', text: "Start vasopressors if MAP stays below 65.",
    responses: ['Agreed', 'Noted', 'Preparing'],
    condition: (_, s) => s === 'critical' },
  { source: 'consultant', text: 'Got cultures yet?',
    responses: ['Drawing now', 'Done', 'Shortly'],
    condition: f => !f.culturesDrawn },
  { source: 'consultant', text: 'Echo might add something here.',
    responses: ['Will arrange', 'Noted', 'Later'] },
  { source: 'consultant', text: 'Call me after repeat lactate.',
    responses: ['Will do', 'Noted', 'Ordering repeat now'] },
  { source: 'consultant', text: 'Think about source control — that catheter.',
    responses: ['Noted', 'Removing catheter', 'Flagged'],
    condition: f => !!f.ivAccessEstablished },
];

// ─── Cooldowns (real-time ms between same source) ─────────────────────────────

const SOURCE_COOLDOWN_MS: Record<InterruptionSource, number> = {
  nurse:      18000,
  family:     30000,
  lab:        35000,
  pharmacy:   28000,
  consultant: 40000,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useInterruptionEngine(
  patient: PatientSim,
  acting: boolean,
): {
  interruption: Interruption | null;
  dismiss: () => void;
  respond: (response: string) => void;
} {
  const [interruption, setInterruption] = useState<Interruption | null>(null);

  const tickTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFiredRef    = useRef<Partial<Record<InterruptionSource, number>>>({});

  // Live state — avoids stale closures in the timer callback
  const stateRef = useRef({
    flags:        patient.flags,
    status:       patient.status,
    completedIds: patient.completedActionIds,
    acting,
  });
  useEffect(() => {
    stateRef.current = {
      flags:        patient.flags,
      status:       patient.status,
      completedIds: patient.completedActionIds,
      acting,
    };
  });

  const dismiss = useCallback(() => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    setInterruption(null);
  }, []);

  const respond = useCallback((_response: string) => {
    dismiss();
  }, [dismiss]);

  useEffect(() => {
    function fire() {
      const { flags, status, completedIds, acting: isActing } = stateRef.current;

      if (!isActing) {
        const now  = Date.now();
        const pool = POOL.filter(e => {
          if (e.condition && !e.condition(flags, status, completedIds)) return false;
          const last = lastFiredRef.current[e.source] ?? 0;
          return now - last >= SOURCE_COOLDOWN_MS[e.source];
        });

        if (pool.length > 0) {
          const entry      = pool[Math.floor(Math.random() * pool.length)];
          const durationMs = 5000 + Math.random() * 2000; // 5–7 s
          lastFiredRef.current[entry.source] = now;

          setInterruption({
            id:          `${entry.source}-${now}`,
            source:      entry.source,
            text:        entry.text,
            responses:   entry.responses ?? ['Noted', 'OK'],
            durationMs,
          });

          dismissTimerRef.current = setTimeout(() => setInterruption(null), durationMs);
        }
      }

      // Schedule next tick: 12–22 seconds
      tickTimerRef.current = setTimeout(fire, 12000 + Math.random() * 10000);
    }

    // First fire after 10–16 seconds
    tickTimerRef.current = setTimeout(fire, 10000 + Math.random() * 6000);

    return () => {
      if (tickTimerRef.current)    clearTimeout(tickTimerRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { interruption, dismiss, respond };
}
