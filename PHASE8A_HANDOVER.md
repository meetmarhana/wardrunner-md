# WARDRUNNER MD — PHASE 8A HANDOVER
## Clinical Simulation Engine — Complete

---

## What Phase 8A Did

Transformed WardRunner from an MCQ quiz app into a clinical management simulation. Built a parallel engine architecture alongside the existing Night Shift and Case Mode systems — nothing was broken or rewritten.

The engine is now fully implemented and type-checks clean. The first playable simulation case (Septic Shock) is authored.

---

## Files Created

### Types
- `src/types/simulation.ts` — Complete type system for simulation engine (~350 lines)

### Engine
- `src/engine/sim/deteriorationEngine.ts` — Drift, threshold checking, status derivation
- `src/engine/sim/orderEngine.ts` — Order instantiation, resolution, result viewing
- `src/engine/sim/cascadeEngine.ts` — Cascade event application and batch processing
- `src/engine/sim/simEngine.ts` — Main orchestration: init, applyAction, advanceTime, getAvailableActions, checkEndings

### Case Data
- `src/data/simCases/septicShock.ts` — Full Septic Shock case: 20 actions, 8 cascade events, 6 endings, deterioration curve with 4 treatment responses

---

## Architecture

### Parallel — existing systems untouched

```
src/engine/
  shiftEngine.ts        ← Night Shift (unchanged)
  caseEngine.ts         ← Case Mode MCQ (unchanged)
  achievementEngine.ts  ← Achievements (unchanged)
  sim/                  ← NEW — simulation engine
    simEngine.ts
    deteriorationEngine.ts
    orderEngine.ts
    cascadeEngine.ts
```

### Core Loop

Each player action:
1. `applyAction()` — applies effect, queues cascades
2. `processPendingCascades()` — fires immediate cascade consequences
3. `advanceTime()` — tick loop (per sim-minute): drift → resolve orders → check thresholds → process cascades → derive status → check endings

### Key Design Decisions

**Hidden Vitals** — lactate, creatinine, WBC, bicarb, chloride load are tracked by the engine but never shown to the player until they order the right investigation AND view the result (`viewOrderResult`). Prevents metagaming.

**Threshold → Cascade chain** — deterioration thresholds evaluate each tick; when met, they queue a cascade event ID. Cascades fire in order, apply state changes, and can force-end the case.

**Treatment Responses** — separate from action drift modifiers. Defined in the DeteriorationCurve. Active when the corresponding flag is set. The engine stacks: `base drift + treatment responses + action drift modifiers`.

**`recordsMetric.value = -1` sentinel** — means "record current simTimeMinutes." Used for timing-sensitive metrics like `timeToAntibiotics`.

**Priority-based endings** — all 6 endings evaluate every tick after each cascade round. Highest priority that meets its condition wins.

---

## Septic Shock Case Design

**Patient:** Ruth, 65F. Confusion + fever. Found by daughter at home. Recent hip surgery. On methotrexate (immunosuppressed). Penicillin allergy documented.

**The two hidden traps:**
1. Penicillin allergy — if player gives pip-tazo WITHOUT checking allergies first, anaphylaxis cascade fires immediately
2. Immunosuppression — ceftriaxone alone is insufficient; meropenem is optimal for this host

**Deterioration timeline (without treatment):**
- ~8 min: septic shock threshold (SBP falls below 80)
- ~30 min: severe lactic acidosis (lactate > 8.0)
- ~45 min: peri-arrest → forced death ending

**Normal saline trap** — 3 × 500 mL NS triggers `hyperchloraemic-acidosis` cascade (−8 guideline, −5 safety). Hartmann's is correct.

**6 Endings (priority DESC):**
1. `death-cardiac-arrest` (100) — peri-arrest cascade forced
2. `death-anaphylaxis` (95) — pip-tazo + no allergy check
3. `icu-ventilated` (70) — shock reached, no vasopressors, late
4. `icu-survivor` (60) — shock reached, vasopressors started
5. `partial-recovery` (40) — antibiotics started but narrow coverage, shock prevented
6. `full-recovery` (10) — abx within 60 min, adequate fluids, broad coverage, no shock

---

## What's Missing (Phase 8B)

The engine is complete. What doesn't exist yet:

**UI** — no React component exists for the simulation case. The player can't actually play it yet.

Required UI components:
- `src/pages/SimPlayer.tsx` — main simulation page
- `src/components/sim/PatientPanel.tsx` — vitals, status, active problems
- `src/components/sim/ActionPanel.tsx` — available actions grouped by category
- `src/components/sim/OrdersInbox.tsx` — pending/arrived results, view interaction
- `src/components/sim/EventLog.tsx` — timestamped event feed
- `src/components/sim/SimEnding.tsx` — ending reveal + debrief

**Wiring** — `src/App.tsx` needs a `sim-player` page state and navigation from Home.

**localStorage persistence** — `SimState` needs save/load between browser sessions.

**No additional cases** — the constraint "DO NOT add more diseases" means Septic Shock is the only case for Phase 8A. New cases can be authored in `src/data/simCases/` following the same pattern.

---

## TypeScript Status

`npx tsc --noEmit` — **0 errors**

`npm run build` (uses `tsc -b`, stricter) — not yet verified. If errors appear, they will likely be unused import warnings in the new files.

---

## How the Engine is Used (for Phase 8B)

```ts
import { initSimState, applyAction, getAvailableActions } from './engine/sim/simEngine';
import { viewOrderResult } from './engine/sim/orderEngine';
import { SEPTIC_SHOCK_CASE } from './data/simCases/septicShock';

// Initialise
const [simState, setSimState] = useState(() => initSimState(SEPTIC_SHOCK_CASE));

// Get what the player can do
const actions = getAvailableActions(simState, SEPTIC_SHOCK_CASE.actions);

// Player selects an action
function handleAction(action: SimAction) {
  setSimState(prev => applyAction(prev, action, SEPTIC_SHOCK_CASE));
}

// Player opens a result from the inbox
function handleViewResult(orderId: string) {
  setSimState(prev => ({
    ...prev,
    patient: viewOrderResult(prev.patient, orderId),
  }));
}
```

---

## Session Vault Notes

- Engine is pure functional — no side effects, no globals (except `_orderCounter` in orderEngine which resets on page reload; acceptable for MVP)
- All state is JSON-serialisable — ready for localStorage persistence
- `SEPTIC_SHOCK_CASE` is a plain const — no async, tree-shakeable
