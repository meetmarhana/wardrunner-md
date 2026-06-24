# WardRunner MD — Release Notes v0.1

**Release date:** 2026-06-24  
**Status:** Public beta — demo-ready

---

## What's Included

### Case Mode
- 15 clinical cases across 5 specialties
- 5-step case loop: Present → Investigate → Diagnose → Treat → Disposition
- 5-axis scoring: Diagnostic, Safety, Guideline, Time, Cost
- Teaching explanations for every wrong answer
- Case Builder for educators (JSON export)

### Night Shift Mode
- **Scenario 1 — ED Night Shift** (Beginner, ~20 min)
  - 4 patients: Septic Shock, STEMI, Aortic Dissection, DKA
  - Teaching focus: classic time-critical ED presentations
- **Scenario 2 — ICU Cross-Cover** (Intermediate, ~25 min)
  - 4 patients: Hyperkalaemia + ECG changes, Post-op Septic Shock, ARDS, GI Haemorrhage
  - Teaching focus: electrolyte emergencies, vasopressors, ARDS ventilation
- **Scenario 3 — Ward Calls** (Beginner, ~18 min)
  - 4 patients: Hypoglycaemia, Post-op PE, Acute Delirium, Post-op Fever
  - Teaching focus: overnight intern decisions, escalation, when NOT to overreact

### Career & Progression
- XP-based levelling from Intern to Consultant
- Specialty unlock system
- 20+ achievements (clinical, safety, progression, mastery)
- Per-scenario best shift tracking

### Demo Readiness
- Full Home landing page with onboarding flow
- First-time 4-step onboarding modal
- Global medical disclaimer throughout
- Error boundary with friendly recovery screen
- Reset Demo Data (clears all localStorage)
- Responsive layout: laptop and tablet

---

## Known Limitations

- **No backend** — all data is in browser localStorage; clearing browser data resets everything
- **No accounts** — progress is per-browser, not per-user
- **No mobile optimisation** — Night Shift bed board needs width; works on tablet, not ideal on phone
- **No real-time timers** — time is turn-based; this is intentional for educational pacing
- **15 cases only** — scope is deliberate for v0.1; more cases via Case Builder or future phases
- **Clinical content is general** — not tailored to specific hospital protocols or the latest guideline updates
- **Not peer-reviewed** — content reflects standard medical teaching, not validated for competency assessment

---

## Ideal Demo Path

See [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md) for the full walkthrough.

Quick version (5 minutes):
1. Home → read the hero + mode cards
2. Case Mode → pick a specialty → work through Investigate and Diagnose → show wrong-answer explanation
3. Night Shift → Ward Calls → Briefing → 2–3 actions → show deterioration warning → Summary with pearls

---

## Future Roadmap

### v0.2 — Backend & Accounts
- Supabase or similar backend
- User accounts and cross-device sync
- Global leaderboards

### v0.3 — Educator Tools
- Curriculum dashboard
- Case library sharing
- Cohort tracking

### v0.4 — Content Expansion
- Scenario 4: Surgical Night (Acute Abdomen & Post-op Complications)
- 10 additional cases
- Paediatrics specialty

### v0.5 — Polish
- Mobile-first Night Shift layout
- Sound effects and ambient audio
- Real-time timer mode (optional)
- Animations and transitions

---

## Tech Notes for Deployers

- Static SPA — no server required
- Build: `npm run build` → output in `dist/`
- Deploy to Vercel, Netlify, GitHub Pages, or any static host
- No environment variables needed
- Node 18+ / npm 9+
- See `vercel.json` for Vercel-specific config
