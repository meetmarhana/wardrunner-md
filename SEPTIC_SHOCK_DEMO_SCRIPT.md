# Septic Shock — Demo Script
## WardRunner · Phase 8E

> **Use this script when showing WardRunner to anyone for the first time.**
> Runtime: ~8 minutes for a full demo run. ~3 minutes for a focused pitch.

---

## Before You Start

1. Open the sim and press **Home** to reach the title screen
2. Hard-refresh to clear any prior run state
3. Keep this script on a second monitor or phone

---

## The Pitch (30 seconds, before you click anything)

> "This is a clinical decision-making sim. You're the doctor. The patient is deteriorating in real time — well, turn-based time — and every action you take costs minutes. There's no right answer displayed anywhere. You either know the medicine, or you don't."

Click **Start Simulation**.

---

## Act 1 — First Impressions (T+0 to T+5)

The case opens with the patient panel visible on the left. Point out:

- **Vitals panel** — HR 118, BP 88/52, Temp 38.9, GCS 13. "She's sick."
- **Clinical impression bar** — reads *"Hypotensive. Source control and fluid resuscitation are immediate priorities."* It updates automatically as the patient changes.
- **Active Problems** — Fever, Hypotension. Discovered passively at admission.
- **T+0 badge** in the top bar — every action costs real time.

> Say: "The question is: what do you do first?"

---

## Act 2 — The Allergy Trap (T+2)

Click **Check Allergies** (2 min).

- The allergy panel on the left turns red: **⚠ Penicillin — documented rash**
- The timeline fires a `danger` event

> Say: "This is the first decision point that kills people in the real world. Pip-tazo is the obvious antibiotic for a UTI. She's allergic to penicillin. If you prescribe pip-tazo without checking, you get anaphylaxis in about 8 minutes. The allergy is in her chart AND on her wristband."

Show the **Antibiotics** action panel — `Pip-tazo` is now greyed out / blocked. `Meropenem` is the correct choice.

---

## Act 3 — The CT Trap (T+5)

Click the **Investigate** filter in the action panel. Show the **CT Pulmonary Angiogram** action.

> Say: "Lots of juniors think about PE when they see tachycardia and hypotension. CTPA takes 45 minutes. While she's in the scanner, she goes into septic shock. This is a teaching moment built into the sim — the machine lets you order it, but it punishes you."

Don't order it. Click away.

---

## Act 4 — The Resuscitation Bundle (T+5 to T+30)

Now demonstrate the optimal play:

1. **Establish IV Access** (3 min) — unlocks all treatment actions
2. **Hartmann's 500 mL** (10 min, first bag) — nursing message fires: *"First Hartmann's bag running. I've got another 500 mL drawn up and ready."*
3. **Draw Blood Cultures** (5 min) — the metric `culturesBeforeAbx` is now tracked
4. **Meropenem 1 g IV** (5 min) — green success event fires; drift reverses

Point to the **Timeline** as each action fires. Show the nurse messages appearing in cyan. Show the progress note that fires when meropenem is given.

> Say: "The nurse feeds you information you'd get from any competent nurse in a real ED. She's tracking fluid bags, checking capillary refill, telling you the daughter is anxious outside. The world has memory."

5. **Hartmann's 500 mL** (2nd bag, 10 min)
6. **Hartmann's 500 mL** (3rd bag — 30 mL/kg complete, 10 min)

Show the active problems panel update as `adequateFluids` completes.

---

## Act 5 — ICU Disposition (T+35+)

Click **Call ICU** — the ICU registrar message appears in the consultant feed (purple).

Click **Transfer to ICU** or **Admit to Ward** depending on the clinical picture.

> If the patient is improving (SBP now trending up), admit to ward — full recovery ending fires.

---

## Act 6 — Debrief (the money shot)

When the ending fires, point out the debrief screens in order:

### Outcome card
- Title ("Full Recovery") with colour-coded severity
- Narrative describing what happened at 48 hours

### Performance panel
- Five score bars: Safety / Guideline / Time / Resource / Diagnostic
- Numbers are driven by what actually happened in the run

### **"This Run" panel** ← new in Phase 8E
- Time to antibiotics: 22 min (or whatever the actual number is)
- ✓ Allergy checked / ✗ CTPA ordered / ✓ Cultures before antibiotics
- This is the player's personal record for the run — changes every playthrough

### Replay Goals
- 8 goals listed: "Antibiotics within 45 min", "No CTPA", "All goals achieved" etc.
- Goals not yet achieved are shown greyed out with detail text
- > Say: "This is why people replay. They want a clean sheet."

### Case Journal (collapsible)
- Scroll down — shows every progress note, consultant entry, patient voice, nursing note with timestamps
- "This is the medical record of the case. It's auto-generated from what happened in your run."

### What You Never Discovered
- Shows every action the player didn't take — grouped by category
- > Say: "Every run, you make tradeoffs. This tells you what the other paths were."

---

## Alternate Paths (optional, to demonstrate depth)

> **"What if you give pip-tazo without checking allergies?"**
- Order pip-tazo → anaphylaxis cascade fires → if you don't give adrenaline within 8 minutes → death
- Debrief: "Penicillin Allergy — Rash. Documentation existed. This was preventable."

> **"What if you delay antibiotics?"**
- Skip antibiotics until T+60 → patient drifts into septic shock at ~T+50
- Vasopressors needed, ICU transfer, organ dysfunction
- Debrief ends with ICU Survivor or ICU Intubated

> **"What if you use saline instead of Hartmann's?"**
- Three bags of normal saline → hidden `chlorideLoad` builds → lactic acidosis worsens
- Score penalty on Guideline

---

## Key Demo Points to Land

| Point | What to say |
|---|---|
| Time pressure | "Every action costs real minutes. You feel the clock." |
| Allergy trap | "The sim lets you kill the patient with a single misstep." |
| Nursing feed | "The world gives you information like a real ward does — you have to listen." |
| Personalized debrief | "Your run, your numbers. Not a generic score." |
| Replay goals | "The reason to play again is visible immediately." |
| Depth | "This is one case. One patient. The depth comes from the decisions." |

---

## Common Questions

**"Is this for med students or consultants?"**
> "Both. Med students learn the bundle. Consultants rediscover how easy it is to forget the allergy. The teaching moment is different at every level."

**"Does the patient actually die?"**
> "Yes. Two death endings. Anaphylaxis if you prescribe pip-tazo without checking allergies. Cardiac arrest if antibiotics are delayed past the critical window."

**"How many cases are there?"**
> "One complete case right now. We're building depth, not breadth. This one case has 6 distinct endings, 28 dynamic events, and a different debrief for every run."

---

*End of demo script.*
