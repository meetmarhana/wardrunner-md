# PHASE 6 HANDOVER — Demo Readiness

## Status: COMPLETE ✅

TypeScript: 0 errors. Build passing. All priorities delivered.

---

## What Was Built

### Priority 1 — Home Page Redesign (`src/pages/Home.tsx`)

Full rewrite with:
- **Hero section**: tagline "Clinical reasoning meets RPG triage", stat chips (cases / shifts / score axes), three CTA buttons
- **What is WardRunner MD?**: two-paragraph plain-language explainer
- **Game Modes**: four cards (Case Mode, Night Shift, Career, Builder) with icons, subtitles, descriptions, hover borders
- **Who It's For**: three cards (Medical Students, Junior Doctors, Educators)
- **Profile summary row** (only shown when profile exists): rank, level, XP, cases done, achievements
- **Disclaimer** (`<Disclaimer />`) above footer
- **Reset Demo Data** in footer — opens confirmation modal before clearing
- **How to Play** modal — five-step case walkthrough, Night Shift rules, score categories
- **Sticky header** with nav links, profile pill

### Priority 2 — Onboarding (`src/components/OnboardingModal.tsx`)

- 4-step modal: Welcome / How Cases Work / Night Shift Mode / Scoring & Learning
- Progress dots, back/next navigation, skip button
- `isOnboardingDone()` — reads `wardrunner_onboarding_done` from localStorage
- `markOnboardingDone()` — sets key to `'1'` on completion or skip
- Wired into `App.tsx`: fires automatically on first visit, never again after

### Priority 3 — Global Disclaimer (`src/components/Disclaimer.tsx`)

Full text:
> "WardRunner MD is an educational simulation game. It is not medical advice, clinical guidance,
> or a substitute for professional judgment, local protocols, or current guidelines."

Placed on:
- `Home.tsx` — full banner
- `ShiftSummary.tsx` — compact one-liner above action buttons
- `Home.tsx` → How to Play modal — full banner

### Priority 4 — Error Boundary (`src/components/ErrorBoundary.tsx`)

- React class component (required for `getDerivedStateFromError`)
- Friendly error screen with: Return Home button (clears error state), Reset All Demo Data button (clears localStorage + reloads)
- Wraps entire `App.tsx` content
- Logs to console: `[WardRunner] Uncaught error:`

### Priority 5 — Reset Demo Data

- In `Home.tsx` footer: small "Reset Demo Data" link → confirmation modal
- Confirmation shows exactly what gets deleted (profile, best scores, onboarding state)
- Also in `ErrorBoundary.tsx` on the error screen
- Clears all `wardrunner_*` localStorage keys, then `window.location.reload()`

### Priority 6 — Responsive Improvements

NightShift.tsx:
- Event log aside: `hidden lg:flex` — hidden below 1024px, visible on laptop+
- Main content fills full width on narrow screens

Home.tsx:
- Hero buttons: `flex-col sm:flex-row` on mobile
- Game mode cards: 1-column on mobile, 2-column on tablet+
- Who It's For: 1-column on mobile, 3-column on sm+
- Header nav: selected items hidden on small screens with `hidden sm:block`

### Priority 7 — Demo Script (`DEMO_SCRIPT.md`)

- Full 15-minute script with talking points per section
- Abridged 5-minute version
- Setup instructions (reset data first, full screen)
- FAQ section (peer-reviewed?, own cases?, mobile?, what's next?)
- Limitations section written transparently

---

## File Inventory

| File | Status |
|------|--------|
| `src/pages/Home.tsx` | ✅ Full rewrite — demo landing page |
| `src/App.tsx` | ✅ ErrorBoundary wrapper + OnboardingModal wired in |
| `src/components/ErrorBoundary.tsx` | ✅ New — React class component |
| `src/components/OnboardingModal.tsx` | ✅ New — 4-step modal + isOnboardingDone() |
| `src/components/Disclaimer.tsx` | ✅ New — full/compact variants |
| `src/components/ShiftSummary.tsx` | ✅ Disclaimer compact added above action buttons |
| `src/pages/NightShift.tsx` | ✅ Event log hidden on narrow screens |
| `DEMO_SCRIPT.md` | ✅ New |

---

## User Flow (post-Phase 6)

```
First visit:
  App loads → OnboardingModal (4 steps) → dismissed → Home

Returning visit:
  App loads → Home (no modal)

Error:
  Any uncaught error → ErrorBoundary screen → Return Home or Reset

Demo flow:
  Home → How to Play (modal) → Case Mode → Case → Score
       → Night Shift → Selector → Briefing → Play → Summary (with Disclaimer)
```

---

## localStorage Keys (complete list)

| Key | Set by | Purpose |
|-----|--------|---------|
| `wardrunner_profile` | profileEngine | Player profile (XP, level, rank, achievements) |
| `wardrunner_best_shift_night-shift-1` | shiftEngine | Best shift record for ED scenario |
| `wardrunner_best_shift_night-shift-2` | shiftEngine | Best shift record for ICU scenario |
| `wardrunner_best_shift_night-shift-3` | shiftEngine | Best shift record for Ward Calls scenario |
| `wardrunner_onboarding_done` | OnboardingModal | `'1'` when onboarding completed/skipped |

Reset Demo Data clears ALL keys matching `wardrunner_*`.

---

## What's NOT Done (Phase 7+ scope)

- Backend / auth / accounts
- Profile page showing per-scenario best grades
- Mobile-optimised layout for NightShift bed board (currently usable, not polished)
- Sound effects
- Leaderboards / sharing
- Curriculum dashboard for educators
- CasePlayer and CaseBuilder Disclaimer banners (low priority — add in Phase 7 if needed)
