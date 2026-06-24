# PHASE 7 HANDOVER — Deploy Readiness

## Status: COMPLETE ✅

Build: passing. TypeScript: 0 errors. `npm run build` → `dist/` clean.

---

## What Was Built

### Priority 1 — README Upgrade (`README.md`)

Full rewrite replacing the default Vite template README. Sections:
- Product description + tagline
- Screenshots placeholder (links to `docs/screenshots/`)
- Features (bullet list)
- Game modes (table)
- Who It's For
- Tech stack table (React 19, Vite 8, TypeScript 6, Tailwind CSS v4)
- Node/npm version requirements (Node 18+, npm 9+)
- How to run locally
- How to build + preview
- How to deploy (Vercel, Netlify, manual static)
- Project structure tree
- Available scripts table
- Disclaimer
- Roadmap
- Phase handover file index

### Priority 2 — Environment Sanity

All four commands verified:
- `npm install` — installs cleanly
- `npm run dev` — Vite dev server at `http://localhost:5173`
- `npm run build` — TypeScript clean + Vite bundle → `dist/`
- `npm run preview` — serves production build locally

**Node:** 18+ recommended (tested Node 20 LTS)  
**npm:** 9+  
**package.json version:** bumped from `0.0.0` → `0.1.0`

### Priority 3 — Deploy Prep (`vercel.json`)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Note: The app uses state-based routing (no react-router / URL path changes). The `rewrites` rule is a safety net — all traffic lands on `/index.html` regardless. No Netlify `_redirects` file needed; Netlify auto-detects from `vercel.json` or you set build dir to `dist` in the UI.

### Priority 4 — Screenshots Folder (`docs/screenshots/README.md`)

Placeholder README created listing 9 recommended screenshots with filenames and capture instructions.

### Priority 5 — Release Notes (`RELEASE_NOTES_v0.1.md`)

Includes:
- What's in v0.1 (Case Mode, Night Shift x3, Career, Builder, demo readiness)
- Known limitations (no backend, no mobile, no peer-review, etc.)
- Ideal demo path (references `DEMO_SCRIPT.md`)
- Future roadmap (v0.2 → v0.5)
- Tech notes for deployers

### Priority 6 — Pre-existing Build Errors Fixed

`tsc -b` is stricter than `npx tsc --noEmit` (respects `noUnusedLocals: true` in `tsconfig.app.json`). Fixed all errors that were silently ignored:

| File | Fix |
|------|-----|
| `src/App.tsx` | Removed unused `levelConfig` variable |
| `src/components/CaseSummary.tsx` | Removed `import React`; fixed `computeFinalGrade(gameState)` → `computeFinalGrade(gameState.scores)` |
| `src/components/DecisionCard.tsx` | Removed `import React`; removed unused `isRevealedUnselected` |
| `src/components/GuidelineDrawer.tsx` | Removed `import React`; renamed unused `type` param to `_type` |
| `src/components/InvestigationViewer.tsx` | Removed `import React` |
| `src/components/PatientPanel.tsx` | Removed `import React` |
| `src/engine/achievementEngine.ts` | Fixed `caseSeverity` → `severity`; removed non-existent `icuTransferTriggered` / `recoveredFromCritical` properties; rewrote achievement logic using actual `GameState` fields |
| `src/engine/profileEngine.ts` | Fixed `severityHistory` / `currentSeverity` → `gameState.severity` |
| `src/pages/CasePlayer.tsx` | Removed unused `units` variable (unit symbols are inlined in the JSX) |
| `src/types/shift.ts` | Added `temp?: number` to `DeteriorationStep.vitalsChange` (needed by nightShift3.ts patient data) |
| `src/data/shifts/nightShift3.ts` | Fixed by the `shift.ts` type addition above |

---

## Build Output

```
dist/index.html                   0.46 kB │ gzip:   0.29 kB
dist/assets/index-*.css          67.43 kB │ gzip:  10.92 kB
dist/assets/index-*.js          858.72 kB │ gzip: 253.83 kB
```

**Chunk size warning:** The JS bundle exceeds 500 kB. This is expected for v0.1 — all case data is bundled statically. Not a blocker for demo deployment. Future fix: dynamic `import()` per specialty or lazy-load Night Shift scenarios.

---

## Deployment Instructions

### Vercel (recommended)
1. Push repo to GitHub
2. Import in Vercel dashboard
3. Auto-detected framework: Vite
4. Build command: `npm run build` (from `vercel.json`)
5. Output directory: `dist` (from `vercel.json`)
6. Deploy — live in ~60 seconds

### Netlify
1. Push to GitHub
2. New site → import from Git
3. Build command: `npm run build`
4. Publish directory: `dist`
5. No redirects file needed (state-based routing)

### Manual
```bash
npm run build
# Copy dist/ to any static host
```

---

## File Inventory

| File | Status |
|------|--------|
| `README.md` | ✅ Full rewrite |
| `vercel.json` | ✅ New — Vercel/Netlify deploy config |
| `docs/screenshots/README.md` | ✅ New — screenshot guide |
| `RELEASE_NOTES_v0.1.md` | ✅ New |
| `PHASE7_HANDOVER.md` | ✅ This file |
| `package.json` | ✅ Version bumped to 0.1.0 |
| Multiple source files | ✅ Pre-existing TS build errors fixed |

---

## What's NOT Done (Phase 8+ scope)

- Actual screenshots (manual capture needed)
- Code-splitting / dynamic imports (reduces JS bundle size)
- CI/CD pipeline (GitHub Actions for auto-deploy on push)
- Custom domain setup
- Backend / accounts (Supabase)
- Mobile layout for Night Shift bed board
