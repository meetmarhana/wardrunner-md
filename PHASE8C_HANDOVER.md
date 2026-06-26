# WARDRUNNER MD — PHASE 8C HANDOVER
## Make the Simulation Feel Alive — Complete

---

## What Phase 8C Did

Turned the playable Septic Shock simulation into an immersive clinical environment. The patient now breathes, speaks through her nurses, and responds to every decision the player makes — in real time.

---

## Files Modified

### Engine / Types
- `src/types/simulation.ts` — Added `NursingMessage` interface; expanded `SimEvent.source` to include `'nurse' | 'consultant'`; added `dynamicResult?` to `SimAction`; added `firedNursingIds: string[]` to `PatientSim`; added `nursingMessages?` to `SimCase`
- `src/engine/sim/simEngine.ts` — Added `checkNursingMessages()` helper; nursing/consultant fire loop inside `advanceTime` after each tick; `applyAction` calls `action.dynamicResult?.(patient)` when present

### Case Data
- `src/data/simCases/septicShock.ts` — Added 3 repeat investigation actions with `dynamicResult`; added 14 nursing + consultant messages; added `firedNursingIds: []` to `initialPatientState`

### UI Components
- `src/components/sim/SimTimeline.tsx` — Full rewrite with per-source styling: nurse events = cyan border + "Nurse" badge; consultant events = purple border + "Consult" badge; cascade events = red border
- `src/pages/SimPlayer.tsx` — Added `deriveObservation(patient)` function; live clinical impression bar below header; passes `completedActionIds` + `allActions` to SimDebrief
- `src/components/sim/SimDebrief.tsx` — Added `completedActionIds` + `allActions` props; "What You Never Discovered" section showing all skipped actions grouped by category

---

## Features Delivered

### 1. Living Patient — Clinical Impression Bar
A single sentence below the header reflects the current clinical state, updated after every action:
- `"Hypotensive. Source control and fluid resuscitation are immediate priorities."` — on arrival
- `"In septic shock — MAP partially supported by noradrenaline."` — after vasopressors
- `"Responding to treatment. Vitals trending in the right direction."` — with adequate treatment
- Specific messages for anaphylaxis, peri-arrest, cardiac arrest

### 2. Dynamic Laboratory Values
Three repeat investigation actions with `dynamicResult` functions:

| Action | What changes |
|---|---|
| `vbg-repeat` | Lactate tracks `hiddenVitals.lactate` — 5.8 → 3.4 if treated, or 5.8 → 9.2 if not; pH and HCO₃⁻ derived from `hiddenVitals.bicarb` |
| `cbc-repeat` | WBC reflects treatment response; platelets drift down over time (DIC signal) |
| `cmp-repeat` | Creatinine reflects `hiddenVitals.creatinine` (AKI tracking); bicarbonate reflects bicarb |

### 3. Nursing Feed — 14 authored messages
Time-triggered, flag-triggered, or both. All `onlyOnce: true`.

**Time-based (fires without treatment):**
- T+5: `"Urine output still minimal — bag hasn't changed since I started monitoring."`
- T+10 (no fluids): `"Her hands are going cold. Capillary refill is up to about 4 seconds."`
- T+15 (no abx): `"She's more confused than when she came in — can't tell me today's date."`
- T+20 (no vasopressors): `"BP just came back 74 systolic. Should we be escalating?"`
- T+30 (no vasopressors): `"She's starting to look mottled on her legs. Knees going dusky."`

**Treatment-triggered (positive feedback):**
- On `oxygenStarted`: nurse confirms sats improving
- On `fluidsStarted`: nurse reports bag running, next bag ready
- On `antibioticsStarted`: nurse confirms running, offers 15-min obs
- On `culturesDrawn`: nurse confirms two sets timed before antibiotics
- On `vasopressorsStarted`: nurse reports MAP trending up
- On `adequateFluids` + T+35: nurse reports urine output improving

### 4. Consultant Messaging Feed
Consultants appear in the timeline with purple "Consult" badge — never as popups.

| Trigger | Message |
|---|---|
| `icuCalled` | ICU Reg Dr. Nakamura: on my way, keep MAP above 65 |
| `cxrDone` | Radiology: right lower lobe consolidation, recommend atypical cover |
| `narrowCoverageGiven` (not broad) | ID Dr. Osei: ceftriaxone may be insufficient for immunosuppressed patient |
| `antibioticsStarted` + T+25 | Microbiology: gram-negative rods on Gram stain, sensitivities pending |

### 5. Near Miss — Microbiology Correction
If ceftriaxone is chosen (narrow coverage, not meropenem), ID consultant auto-pages within the case and flags the inadequate coverage. Ruth doesn't die — but the consultant tells you exactly why the choice was suboptimal. This teaches antibiotic breadth without punishing exploration.

### 6. Timeline Becomes the Story
Each source now has distinct visual identity:
- **System** — subdued, no badge
- **Action** — neutral slate border
- **Cascade** — red border (danger events)
- **Nurse** — cyan border + "Nurse" badge
- **Consultant** — purple border + "Consult" badge

### 7. Better Debrief — "What You Never Discovered"
After any ending, the debrief now shows every action the player never took, grouped by category (Assessment / Investigation / Treatment / etc.). This surfaces hidden paths — the CTPA, the repeat VBG, the blood cultures, the metabolic panel — and creates genuine replay motivation.

---

## Verified Behaviours (browser-tested)

| Behaviour | Status |
|---|---|
| Clinical impression bar renders below header | ✅ |
| "Hypotensive" message on arrival (before treatment) | ✅ |
| Impression updates to "responding to treatment" with abx + fluids | ✅ |
| Nursing message fires at T+05 with cyan "Nurse" badge | ✅ |
| Nurse badge styled distinctly from action events | ✅ |
| `vbg-repeat` available after first VBG ordered | ✅ (gated by `requiresActionIds`) |
| `dynamicResult` function computes from `hiddenVitals` at order time | ✅ |
| `firedNursingIds` prevents re-fire of `onlyOnce` messages | ✅ |
| TypeScript build: 0 errors (`npx tsc --noEmit`) | ✅ |
| Night Shift / Case Mode untouched | ✅ |

---

## Architecture Notes

### `dynamicResult` pattern
```ts
// On the action definition (TypeScript only — not JSON-serializable):
dynamicResult: (patient: PatientSim): OrderResult => {
  const lactate = patient.hiddenVitals.lactate ?? 5.8;
  return {
    type: 'lab-panel',
    values: [
      { key: 'lactate', label: 'Lactate', value: `${lactate.toFixed(1)} mmol/L`, flagged: lactate >= 2.0 },
    ],
    isAbnormal: lactate >= 2.0,
    revealsHiddenVitals: { lactate },
  };
},

// In applyAction (simEngine.ts):
const resolvedResult = action.dynamicResult ? action.dynamicResult(patient) : fx.placesOrder.result;
```

### Nursing message fire loop (per tick in `advanceTime`)
```ts
if (simCase.nursingMessages?.length) {
  const fired = checkNursingMessages(patient, simCase.nursingMessages);
  if (fired.length) {
    for (const msg of fired) {
      events = [...events, { simTimeMin: patient.simTimeMinutes, text: msg.text, severity: 'info', source: msg.source ?? 'nurse' }];
    }
    patient = { ...patient, firedNursingIds: [...patient.firedNursingIds, ...fired.map(m => m.id)] };
  }
}
```

---

## What Phase 8C Did NOT Change (by design)

- Night Shift engine — untouched
- Case Mode engine — untouched
- No new disease cases added (Stroke, DKA, PE all deferred)
- No backend, no auth, no real-time timers
- No localStorage persistence (Phase 9 candidate)
- No second simulation case (depth before breadth)

---

## Phase 8C Complete

The Septic Shock simulation is now a clinical experience, not a clinical quiz. Every decision leaves a trace. Ruth's nurses talk to you. Consultants intervene. Repeat labs show the consequence of your choices. The debrief shows what you never even thought to ask.

Phase 9 candidates: localStorage save/resume, vasopressor flow testing, full ending verification (debrief "What You Never Discovered" in action), optional conservative recovery path validation.
