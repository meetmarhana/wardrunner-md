# WardRunner MD — Phase 3 Handover
**Date:** 2026-06-24  
**Status:** COMPLETE ✅  
**Build:** Clean, zero errors, HMR active on port 5173

---

## What Was Built (Phase 3)

**Night Shift Mode** — a fully playable multi-patient triage game.

### Core gameplay verified:
- 4 patients arrive simultaneously (STEMI, Sepsis, DKA, Aortic Dissection)
- Player switches between beds and takes clinical actions
- Time advances after each action (+timeCost minutes)
- Neglecting patients causes real deterioration → death
- Correct sequencing (prerequisites) required (e.g. ECG before Cath Lab)
- End-of-shift summary: outcomes, scores, XP, achievements

---

## New Files

| File | Purpose |
|---|---|
| `src/types/shift.ts` | All Night Shift types: ShiftPatient, ShiftAction, ShiftState, ShiftResult, etc. |
| `src/engine/shiftEngine.ts` | Shift engine: initShiftState, applyShiftAction, deterioration loop, computeShiftResult |
| `src/data/shifts/nightShift1.ts` | First scenario: 4-patient ED Night Shift with full action trees |
| `src/pages/NightShift.tsx` | Full UI: bed board, patient detail, action grid, event log, shift summary |

### Modified files:
- `src/App.tsx` — added `'night-shift'` page type + NightShift route
- `src/pages/Home.tsx` — added 🌙 Night Shift button (red, between Start Playing and How to Play)
- `src/data/achievements.json` — added 5 Night Shift achievements

---

## Architecture

### Turn-based time system
Time is NOT real-time. It advances by `action.timeCost` minutes after each action. This means:
- Player takes `Assess ABCs` (5 min) → clock ticks +5
- While they were assessing Ray, Sarah's `nextDeteriorationAt: 20` approaches
- If clock reaches 20 before the player acts on Sarah → Sarah deteriorates

### Deterioration loop (`applyShiftAction`)
After EVERY action, `applyDeteriorationUpTo(patient, newTime)` runs on ALL patients. It loops through their `deteriorationSteps[]` applying each step whose time threshold has been crossed. This means a long neglect period can skip multiple steps.

### Prerequisite system
Actions have `requiresActionIds?: string[]`. `getAvailableActions()` filters these out until the prerequisites are done. Example:
```
heparin-bolus   requires: ['order-ecg']
call-cardiology requires: ['order-ecg']  
cath-lab        requires: ['call-cardiology']
```

### Scoring
Each patient starts at `{ triage: 50, safety: 100, guideline: 50, time: 100 }`.
- Correct actions add triage/guideline points
- Dangerous actions subtract safety/guideline points
- All capped 0–100

Shift score = average across all 4 patients.

### XP integration
On shift complete, `computeShiftResult()` returns `xpEarned`. `NightShift.tsx` calls `loadProfile → update totalXP + level → saveProfile → onShiftComplete(updated)`. Profile persists correctly.

---

## The 4 Patients (Night Shift 1)

| Bed | Patient | Diagnosis | First deterioration | Key danger |
|---|---|---|---|---|
| 1 | Ray Mitchell, 58M | STEMI | 25 min | Delay to cath lab; giving antibiotics |
| 2 | Sarah Chen, 45F | Septic Shock | 20 min | Delay antibiotics; aspirin/insulin confusion; admitting to ward not ICU |
| 3 | Amara Okafor, 22F | DKA | 45 min | Heparin (dangerous); subcutaneous insulin (wrong route) |
| 4 | Marcus Webb, 52M | Aortic Dissection | 30 min | Thrombolysis (lethal -60 safety); heparin; aspirin; activating cath lab instead of OR |

**Optimal play order:** Sarah (fastest deterioration) → Ray → Marcus → Amara

---

## Night Shift Achievements

| ID | Title | Condition |
|---|---|---|
| `night-shift-first` | First Night Shift | Complete any Night Shift |
| `night-shift-no-deaths` | Zero Death Shift | No patient deaths |
| `night-shift-perfect` | No Patient Left Behind | All 4 saved |
| `night-shift-triage-master` | Triage Master | Avg triage score ≥80 |
| `night-shift-code-blue` | Code Blue Survivor | Save a patient who already deteriorated |

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Header: ← Home | 🌙 Night Shift — ED | TIME 19:xx | 0/4   │
├──────────────┬────────────────────────────────┬─────────────┤
│  BED BOARD   │    PATIENT DETAIL PANEL        │ EVENT LOG   │
│  w-56        │    flex-1                      │ w-72        │
│              │                                │             │
│  [Bed 1 ▶]   │  Name | Acuity | Status       │ 19:00 ───   │
│  [Bed 2]     │  Age/Sex/Chief Complaint       │ 🏥 shift... │
│  [Bed 3]     │  Vitals row                    │             │
│  [Bed 4]     │  Red flags                     │ 19:05 ───   │
│              │  [Feedback banner]             │ [Bed 1]...  │
│              │  Completed actions             │             │
│              │  ── Assessment ──              │ Live Scores │
│              │  [action btns]                 │ Ray    ████ │
│              │  ── Investigation ──           │ Sarah  ████ │
│              │  [action btns]                 │ Amara  ████ │
│              │  etc.                          │ Marcus ████ │
└──────────────┴────────────────────────────────┴─────────────┘
```

---

## What's Left for Phase 4 (Ideas)

- **More Night Shift scenarios** — Paediatric ED, ICU overnight, Surgical ward
- **Waiting room queue** — patients arrive over time, player must open beds
- **Consult system** — "Call Radiology" delays but improves accuracy
- **Shift difficulty levels** — Intern / Resident / Attending
- **Real-time mode** — optional countdown timer per patient (not turn-based)
- **Multiplayer co-op** (if backend ever added) — two players, different beds
- **Night Shift achievements gallery** — separate tab in AchievementGallery
- **More scenarios** — Cardiac arrest (ACLS), Trauma Bay, Paediatrics

---

## Dev Commands
```bash
cd wardrunner-md
npm run dev    # port 5173
npm run build  # verify zero errors before shipping
```
