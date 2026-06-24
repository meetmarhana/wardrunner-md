# WardRunner MD

> **Clinical reasoning meets RPG triage.**

WardRunner MD is an educational simulation game for medical students, junior doctors, and clinical educators. Work through real patient scenarios, make diagnostic and treatment decisions under time pressure, and learn from your mistakes through immediate teaching feedback.

**This is not medical advice. See [Disclaimer](#disclaimer).**

---

## Screenshots

_Screenshots live in [`docs/screenshots/`](docs/screenshots/). See that folder's README for the full list._

---

## Features

- **15 curated clinical cases** across 5 specialties (Emergency Medicine, Cardiology, Respiratory, Endocrinology, and more)
- **3 Night Shift scenarios** — ED, ICU Cross-Cover, Ward Calls — each teaching a distinct set of clinical skills
- **Turn-based triage engine** — time advances per action; neglected patients deteriorate
- **Urgency system** — CRITICAL / URGENT / STABLE badges computed live per patient
- **Triage score** — rewards treating the most unstable patient first
- **5-axis scoring** — Diagnostic, Safety, Guideline, Time, Cost
- **Career progression** — XP, levels, ranks from Intern to Consultant
- **Achievements** — 20+ unlockable achievements across clinical, progression, and mastery categories
- **Case Builder** — create and export custom cases as shareable JSON
- **First-time onboarding** — 4-step walkthrough modal
- **Error boundary** — friendly recovery screen if anything crashes
- **Local-first** — zero backend, zero auth, all data in localStorage

---

## Game Modes

| Mode | Description |
|------|-------------|
| **Case Mode** | Individual patient presentations — investigate, diagnose, treat, disposition |
| **Night Shift** | Multi-patient triage across 3 scenarios; turn-based deterioration engine |
| **Career** | Structured XP progression from Intern to Consultant |
| **Case Builder** | Build and export custom clinical cases in JSON |

---

## Who It's For

- **Medical students** — practice clinical reasoning without patient risk
- **Junior doctors** — reinforce on-call decision-making
- **Educators** — build and distribute custom cases for your curriculum

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Bundler | Vite 8 (Rolldown) |
| Language | TypeScript 6 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite` plugin) |
| State | React `useState` / `useReducer` — local, no external store |
| Persistence | `localStorage` — no backend |
| Linter | Oxlint |

**Node.js:** 18+ recommended (tested on Node 20 LTS)  
**npm:** 9+

---

## Running Locally

```bash
# 1. Clone the repository
git clone <repo-url>
cd wardrunner-md

# 2. Install dependencies
npm install

# 3. Start development server (http://localhost:5173)
npm run dev
```

The app runs entirely in the browser. No API keys, no environment variables, no backend.

---

## Building

```bash
# Type-check + bundle
npm run build

# Preview the production build locally
npm run preview
```

Output goes to `dist/`. The build is a fully static SPA — no server-side rendering required.

---

## Deploying

### Vercel (recommended)

1. Push to GitHub
2. Import the repo in Vercel
3. Settings are auto-detected from `vercel.json`:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Deploy

### Netlify

1. Push to GitHub
2. Import in Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Netlify's `_redirects` file is not needed — the app uses state-based routing, not URL paths

### Manual / Any Static Host

Copy the contents of `dist/` to any static file host (S3, GitHub Pages, Cloudflare Pages, etc.).

No server-side configuration is required — there is only one URL: `/`.

---

## Project Structure

```
wardrunner-md/
├── src/
│   ├── components/       # Shared UI components
│   ├── data/             # Case data, scenario data, achievements
│   │   ├── cases/        # One file per specialty
│   │   ├── shifts/       # nightShift1.ts, nightShift2.ts, nightShift3.ts
│   │   └── nightShift/   # scenarios.ts — central scenario registry
│   ├── engine/           # Game logic (shiftEngine, profileEngine, achievementEngine)
│   ├── pages/            # Top-level page components
│   └── types/            # TypeScript interfaces
├── docs/
│   └── screenshots/      # App screenshots
├── DEMO_SCRIPT.md        # Walkthrough script for demos
├── RELEASE_NOTES_v0.1.md # v0.1 release notes
├── vercel.json           # Vercel deployment config
└── README.md
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server at `http://localhost:5173` |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run Oxlint |

---

## Disclaimer

WardRunner MD is an educational simulation game. It is **not** medical advice, clinical guidance, or a substitute for professional judgment, local protocols, or current guidelines.

Clinical content reflects general teaching principles and is not validated for clinical competency assessment. Always refer to your local guidelines and a qualified clinician for real clinical decisions.

---

## Roadmap

| Priority | Feature |
|----------|---------|
| High | Backend + accounts (Supabase or PlanetScale) |
| High | Per-scenario profile stats and history |
| Medium | Curriculum dashboard for educators |
| Medium | Scenario 4 — Surgical Night |
| Medium | Mobile-optimised Night Shift layout |
| Low | Sound effects and ambient audio |
| Low | Leaderboards and score sharing |
| Low | Real-time timer mode (optional toggle) |

---

## Phase Handovers

Development was documented in phase handover files:

- [`PHASE4_HANDOVER.md`](PHASE4_HANDOVER.md) — Night Shift polish (triage score, grade, deterioration warnings)
- [`PHASE5_HANDOVER.md`](PHASE5_HANDOVER.md) — Multi-scenario Night Shift (3 scenarios, per-scenario bests, achievements)
- [`PHASE6_HANDOVER.md`](PHASE6_HANDOVER.md) — Demo readiness (Home redesign, onboarding, error boundary, disclaimer)
- [`PHASE7_HANDOVER.md`](PHASE7_HANDOVER.md) — Deploy prep (README, Vercel config, release notes, smoke test)
