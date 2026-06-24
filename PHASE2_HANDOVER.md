# WardRunner MD — Phase 2 Handover
**Date:** 2026-06-24  
**Status:** COMPLETE ✅  
**Build:** Clean, zero errors, HMR active on port 5173

---

## What Was Built (Phase 2)

Transformed WardRunner from an educational prototype into an RPG-style game. All 5 Phase 2 priorities delivered:

### 1. Player Profile System
- `src/types/profile.ts` — `PlayerProfile`, `Rank`, `Achievement`, `LevelConfig` types
- `src/engine/profileEngine.ts` — `LEVEL_CONFIG` (7 levels: Medical Student → Professor), XP engine, localStorage persistence (`wardrunner_profile` key)
- `src/pages/Profile.tsx` — Profile page: rank card, XP bar, stats grid, recent cases, achievements preview, unlocked specialties
- XP formula: base by grade (A=150, B=100, C=60, D=30, F=10) + guideline bonus (+30 if ≥80) + time bonus (+20 if ≥80) + no-harm bonus (+50)
- 7 levels with XP thresholds: 0 / 200 / 600 / 1400 / 2800 / 5000 / 9000

### 2. Achievement System
- `src/data/achievements.json` — 20 achievement definitions including secret achievements
- `src/engine/achievementEngine.ts` — `checkAchievements()` post-case hook, unlock logic for all 20
- `src/components/AchievementToast.tsx` — Stacked toast notifications, 4s auto-dismiss
- `src/pages/AchievementGallery.tsx` — Category tabs, 3-state cards (unlocked/locked/secret+locked), progress bar

### 3. Career Mode
- `src/pages/Career.tsx` — Career timeline (7 levels), specialty unlock cards with case counts from ALL_CASES, career stats, motivational quotes by rank

### 4. Case Builder
- `src/pages/CaseBuilder.tsx` — 5-step wizard: Metadata → Patient → Disease Map → Nodes Builder → Review/Export
- Downloads `{id}.json` matching the `CaseData` schema exactly — can be dropped into `src/data/cases/` and added to `allCases.ts`

### 5. Internal Medicine Expansion (10 new cases)
All in `src/data/cases/internal-medicine/`:
- `dka.json` — Diabetic Ketoacidosis
- `hhs.json` — Hyperosmolar Hyperglycaemic State
- `copd-exacerbation.json` — COPD Exacerbation
- `asthma-acute.json` — Acute Severe Asthma
- `cap.json` — Community-Acquired Pneumonia
- `sepsis.json` — Sepsis / Septic Shock
- `cirrhosis-complication.json` — Cirrhosis with Acute Decompensation / SBP
- `gi-bleed.json` — Upper GI Bleed
- `aki.json` — Acute Kidney Injury
- `hypertensive-emergency.json` — Hypertensive Emergency

---

## Critical Architecture Decisions

### Neutral data module to prevent circular imports
`src/data/allCases.ts` is the canonical source for all 15 cases. Both `App.tsx` and `Specialties.tsx` import from it. Do NOT import ALL_CASES from App.tsx — that was the circular dependency that caused a blank page.

### Rolldown / Vite 8 — `import type` enforcement
All type-only imports MUST use `import type { ... }`. Value imports of TypeScript-only types cause `MISSING_EXPORT` build errors. This affected: PatientPanel, DecisionCard, GuidelineDrawer, InvestigationViewer, CaseSummary, AchievementToast, AchievementGallery. All fixed.

### Vitals type
`Vitals.bp` is a string `"165/100"` — NOT separate `sbp`/`dbp` fields. Parse with: `Number(vitals.bp.split('/')[0])`.

### Case JSON sex field
Must be `"M"` or `"F"` — not `"male"` / `"female"`.

### Specialty gating
- Cardiology: unlocked at Level 1 (always available)
- Internal Medicine: Level 3 (Resident)
- Emergency: Level 4 (Senior Resident)  
- ICU: Level 5 (Chief Resident)
- Surgery: Level 6 (Attending)
- Advanced Cases: Level 7 (Professor)

---

## App Navigation (7 pages)
```
type Page = 'home' | 'specialties' | 'play' | 'profile' | 'achievements' | 'career' | 'builder'
```

From Home: Start Playing → specialties, Career button → career, Case Builder → builder, Profile badge → profile  
From Profile: View Achievements → achievements

---

## File Structure (complete)
```
wardrunner-md/
  src/
    types/
      case.ts          — CaseData, GameState, Choice, CaseNode, etc.
      profile.ts       — PlayerProfile, Achievement, LevelConfig, Rank
    engine/
      caseEngine.ts    — initGameState, applyChoice, computeFinalGrade, getCurrentNode
      profileEngine.ts — LEVEL_CONFIG, loadProfile, saveProfile, computeXPFromGame, addCaseRecord
      achievementEngine.ts — ALL_ACHIEVEMENTS, checkAchievements, getAchievement
    data/
      allCases.ts      — neutral module: ALL_CASES (15 cases)
      achievements.json — 20 achievement definitions
      cases/
        cardiology/    — 5 cases (acs-stemi, acute-hf, afib-rvr, pulmonary-embolism, aortic-dissection)
        internal-medicine/ — 10 cases (dka, hhs, copd-exacerbation, asthma-acute, cap, sepsis, cirrhosis-complication, gi-bleed, aki, hypertensive-emergency)
    components/
      PatientPanel.tsx
      DecisionCard.tsx
      GuidelineDrawer.tsx
      InvestigationViewer.tsx
      CaseSummary.tsx
      LevelUpNotification.tsx
      AchievementToast.tsx
    pages/
      Home.tsx
      Specialties.tsx
      CasePlayer.tsx
      Profile.tsx
      AchievementGallery.tsx
      Career.tsx
      CaseBuilder.tsx
    App.tsx
    main.tsx
    index.css
```

---

## What's Left for Phase 3 (Ideas)

- **Leaderboard** — local high-scores, best grade per case
- **Streak tracking** — consecutive correct choices, current streak counter
- **Case Builder import** — drag-and-drop JSON import on top of the export
- **Sounds/haptics** — correct/incorrect audio feedback
- **More specialties** — Neurology, Gastroenterology, Paediatrics
- **Consultant system** — "Call a specialist" with XP cost trade-off
- **Mobile responsive** — currently desktop-optimised; sidebar collapses needed

---

## Dev Commands
```bash
cd wardrunner-md
npm run dev    # port 5173
npm run build  # type-check + bundle
```
