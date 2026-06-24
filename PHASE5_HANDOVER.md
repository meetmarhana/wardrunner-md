# PHASE 5 HANDOVER — Multi-Scenario Night Shift

## Status: COMPLETE ✅

TypeScript: 0 errors. All 3 scenarios playable end-to-end.

---

## What Was Built

### 1. Scenario Selector (`src/components/ScenarioSelector.tsx`)
- Card-based UI: setting, difficulty badge, teaching focus, estimated duration, patient count
- Best grade per scenario pulled from localStorage and shown on each card
- Progress bar at the bottom: X/3 scenarios completed
- "Play Again →" vs "Start Shift →" depending on play history

### 2. Scenario 1 — ED Night Shift (updated)
- Added: `setting`, `difficulty`, `teachingFocus`, `estimatedMinutes` fields
- Existing patients and pearls unchanged
- Difficulty: beginner

### 3. Scenario 2 — ICU Cross-Cover (`src/data/shifts/nightShift2.ts`)
- Setting: Medical/Surgical ICU
- Difficulty: intermediate
- Teaching: electrolyte emergencies, vasopressors, ARDS ventilation, GI haemorrhage
- 4 patients:
  - **Margaret Liu** (Bed 1) — Hyperkalaemia + ECG changes — deteriorates at 15 min
  - **James Okafor** (Bed 2) — Post-op septic shock — deteriorates at 20 min
  - **Priya Sharma** (Bed 3) — ARDS, SpO₂ 82% — deteriorates at 28 min
  - **Carlos Reyes** (Bed 4) — Active GI haemorrhage — deteriorates at 35 min
- Optimal order: Margaret → James → Priya → Carlos
- Key teaching: calcium gluconate FIRST in hyperkalaemia; lung-protective ventilation kills ARDS mortality; crossmatch before transfusion

### 4. Scenario 3 — Ward Calls (`src/data/shifts/nightShift3.ts`)
- Setting: General Medical & Surgical Wards
- Difficulty: beginner
- Teaching: overnight intern decisions, escalation, when NOT to overreact
- 4 patients:
  - **Tom Walsh** (Bed 1) — Hypoglycaemia, BSL 1.8, unconscious — deteriorates at 12 min
  - **Diane Foster** (Bed 2) — Post-op PE, SpO₂ 93% — deteriorates at 20 min
  - **Eddie Mensah** (Bed 3) — Acute delirium, agitated — deteriorates at 30 min
  - **Patricia Cho** (Bed 4) — Post-op day 1 fever — deteriorates at 50 min
- Optimal order: Tom → Diane → Eddie → Patricia
- Key teaching: never give insulin to hypoglycaemia; Day 1 fever = atelectasis, not antibiotics; delirium: de-escalation before haloperidol

### 5. Scenario Data Architecture (`src/data/nightShift/scenarios.ts`)
- Central registry: `ALL_SCENARIOS`, `getNightShiftScenario(id)`, `getPearls(scenarioId)`
- `PearlRecord` type exported for use by ShiftSummary

### 6. Best Score Per Scenario
- `loadBestShift(scenarioId: string)` — localStorage key: `wardrunner_best_shift_${scenarioId}`
- `saveBestShift(record, scenarioId: string)` — only saves if overallScore improves
- Shown on: scenario selector card, briefing screen

### 7. Achievement Expansion
5 new achievements in `src/data/achievements.json`:
- `icu-first-save` — any save in ICU scenario
- `hyperkalemia-hero` — save Margaret Liu specifically
- `ward-call-warrior` — complete Ward Calls
- `perfect-triage-any` — triage score ≥ 90 in any scenario
- `three-shifts-cleared` — all 3 scenarios completed (checked in NightShift.tsx after saveBestShift)
- `no-death-night` — 0 deaths in any scenario

### 8. Phase System Update
NightShift.tsx now has 4 phases: `'selecting' | 'briefing' | 'playing' | 'complete'`
- "← Shifts" header button returns to selecting
- ShiftBriefing back button returns to selecting
- ShiftSummary has 3 buttons: Try Again / Choose Shift / Home

---

## Full User Flow

```
Home
  ↓ "🌙 Night Shift"
ScenarioSelector
  - 3 scenario cards + progress tracker
  ↓ Pick a scenario
ShiftBriefing
  - Patient list, rules, best record for this scenario
  ↓ "Start Night Shift"
NightShift (playing)
  - Urgency warnings, bed board, event log
  [all patients dispositioned]
ShiftSummary
  - Grade + scores + highlights + per-patient teaching pearls
  ↓ "Try Again" → playing (same scenario)
  ↓ "Choose Shift" → ScenarioSelector
  ↓ "Home" → Home
```

---

## Optimal Triage Orders

| Scenario | Order | Rationale |
|----------|-------|-----------|
| ED Night Shift | Sarah → Ray → Marcus → Amara | Sepsis 20 min → STEMI 25 → Dissection 30 → DKA 45 |
| ICU Cross-Cover | Margaret → James → Priya → Carlos | Hyperkalaemia 15 min → Septic shock 20 → ARDS 28 → GI bleed 35 |
| Ward Calls | Tom → Diane → Eddie → Patricia | Hypoglycaemia 12 min → PE 20 → Delirium 30 → Post-op fever 50 |

---

## File Inventory

| File | Status |
|------|--------|
| `src/types/shift.ts` | ✅ Updated — `ShiftScenario` extended with `setting`, `difficulty`, `teachingFocus`, `estimatedMinutes`, `ShiftPearl` |
| `src/data/shifts/nightShift1.ts` | ✅ Updated — new fields added |
| `src/data/shifts/nightShift2.ts` | ✅ New — ICU Cross-Cover |
| `src/data/shifts/nightShift3.ts` | ✅ New — Ward Calls |
| `src/data/nightShift/scenarios.ts` | ✅ New — central registry |
| `src/engine/shiftEngine.ts` | ✅ Updated — per-scenario best shift, new achievements |
| `src/components/ScenarioSelector.tsx` | ✅ New |
| `src/components/ShiftSummary.tsx` | ✅ Updated — accepts `pearls` prop, 3 buttons |
| `src/components/ShiftBriefing.tsx` | No changes needed |
| `src/pages/NightShift.tsx` | ✅ Updated — 4-phase flow, scenario state |
| `src/data/achievements.json` | ✅ Updated — 6 new achievements |

---

## What's NOT Done (Phase 6+ scope)

- Scenario 4+ (Surgery Night — Acute Abdomen & Post-op Complications)
- Real-time timer mode
- Backend / auth / leaderboards
- Profile page showing best grade per scenario
- Sound effects / music
