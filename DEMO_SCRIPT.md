# WardRunner MD — Demo Script

**Audience:** Medical educators, investors, or colleagues seeing the app for the first time.  
**Duration:** ~10–15 minutes for a full walkthrough; ~5 minutes for the abridged version.  
**Setup:** Open the app in a browser on a laptop. Use a wide tab or full screen.

---

## Before You Start

1. Clear demo data first (Footer → "Reset Demo Data" → confirm) so onboarding fires
2. Resize to a comfortable full-screen window — the layout is optimised for laptop width
3. Have the app open at the Home page

---

## Part 1 — Home Page (~2 min)

**What to show:**
- The hero tagline: "Clinical reasoning meets RPG triage"
- The three stat chips (cases, shifts, score axes)
- The four mode cards — explain each in one sentence

**Talking points:**
> "WardRunner is a clinical reasoning game — not a quiz. Every patient has a story,
> every action has a consequence, and time is always running out."

> "There's no multiple-choice with one right answer highlighted. You decide what to
> investigate, what to diagnose, and how to treat — just like on a real ward."

**Highlight the disclaimer:**  
> "It's clearly labelled as an educational simulation. It doesn't replace guidelines —
> it makes you practice applying them."

---

## Part 2 — Onboarding (first-time only, ~1 min)

- If onboarding fires automatically, walk through all 4 steps
- Point out: "This fires once on first visit — returning users go straight to the game"
- Key message on step 4: scoring is for learning, not clinical validation

---

## Part 3 — Case Mode (~4 min)

**Best demo path:**
1. Click "Start Case Mode" → Specialties page
2. Pick **Emergency Medicine** → any case (recommend: the Sepsis case if available)
3. Step through: **Present → Investigate → Diagnose → Treat → Disposition**

**Talking points for each phase:**
- **Present:** "History and vitals are given. The patient is in front of you."
- **Investigate:** "Order the tests you actually need — but every test costs time. Over-investigating costs you points."
- **Diagnose:** "Pick your working diagnosis. Wrong answers come with an explanation — that's the learning moment."
- **Treat:** "Treatments are locked in sequence. You can't intubate before assessing the airway."
- **Disposition:** "Discharge, admit, or escalate — you justify your decision."

**At the end:** Show the score breakdown (Diagnostic / Safety / Guideline / Time / Cost).
> "The score is immediate feedback on clinical reasoning — not a grade for their CV."

---

## Part 4 — Night Shift Mode (~5 min)

**Best demo path:**
1. Home → "Night Shift"
2. Scenario Selector: pick **Ward Calls** (difficulty: beginner, ~18 min)
3. Read the Briefing — point out the urgency timeline
4. Play 2–3 rounds of actions:
   - Show a patient with a CRITICAL warning — treat them first
   - Deliberately skip them once to show the deterioration mechanic
   - Show the prerequisite lock on an action (e.g. IV access before fluids)
5. Let a patient deteriorate — show the event log entry
6. Complete the shift (or let it play out) — show the Summary with grade + teaching pearls

**Talking points:**
> "Night Shift is about triage. Time advances after every action. If you spend 15 minutes
> on a stable patient while someone crashes — that's on you."

> "The teaching pearls at the end are the educational payload. Every patient has a clinical
> lesson: here's why Tom Walsh comes first, here's why you never give insulin to a BSL of 1.8."

**Show the Scenario Selector again:**  
> "There are three scenarios — ED, ICU, and Ward Calls. Each one teaches different clinical skills."

---

## Part 5 — Career & Builder (optional, ~2 min)

- **Career:** "Structured progression from Intern to Consultant. XP-gated specialties."
- **Builder:** "Educators can build their own cases in JSON and export them. Shareable format."

---

## Limitations to Acknowledge

- **No backend** — everything is local. No leaderboards, no accounts.
- **No real-time timers** — turn-based, not a racing clock. Intentional for education.
- **Curated content only** — 15 cases, 3 Night Shift scenarios. Scope is deliberate.
- **Not a clinical reference** — disease content reflects general teaching principles, not local hospital protocols or the latest guideline update.

---

## Frequently Asked Questions

**"Is this peer-reviewed?"**  
> The clinical content is written based on standard teaching (UpToDate, NICE, Therapeutic Guidelines). It is not a peer-reviewed tool and not validated for clinical competency assessment.

**"Can we add our own cases?"**  
> Yes — the Case Builder exports JSON. A team of educators could build a curriculum and share it within their institution.

**"Does it work on mobile?"**  
> Laptop and tablet are the target. Mobile is readable but not fully optimised — Night Shift in particular benefits from screen width.

**"What's next?"**  
> Backend, accounts, and a curriculum dashboard are the next phase. The core engine is solid — what's missing is the institutional layer.

---

## Abridged 5-Minute Version

1. Home → point out tagline + modes (30 sec)
2. Open a case → step to Diagnose → show wrong answer explanation (2 min)
3. Night Shift → Briefing → 2 actions → show deterioration warning → summary pearls (2.5 min)
4. Mention limitations (30 sec)
