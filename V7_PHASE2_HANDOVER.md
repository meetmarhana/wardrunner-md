# V7 Phase 2 — Director System Handover

## What was built

A fully data-driven **Director System** that replaces all hard-coded emotional/narrative moments in the simulation cockpit. Every tension beat, celebration, consequence, and character mood change is now authored in the case file — not scattered across UI components.

---

## Architecture

### 1. `DirectorCue` interface (`src/types/simulation.ts`)

```ts
interface DirectorCue {
  id: string;
  trigger: {
    atTime?: number;           // fire when simTimeMinutes >= this
    afterActionId?: string;    // fire after this action completed
    missedActionId?: string;   // fire only if this action NOT done
    flagSet?: string;          // fire only if patient.flags[key] is true
    flagNotSet?: string;       // fire only if patient.flags[key] is false/absent
    vitalBelow?: { key: keyof SimVitals; value: number };
    vitalAbove?: { key: keyof SimVitals; value: number };
  };
  actor: DirectorActor;        // who delivers the cue
  tone: DirectorTone;          // emotional register
  message: string;             // what they say/show
  priority: DirectorPriority;
  once: boolean;               // true = fires once per session
  cooldownSec?: number;        // minimum seconds between repeats (once:false)
  visualEffect?: VisualEffect; // CSS class applied to ScenePanel root
  sound?: DirectorSound;       // reserved for future audio
}
```

Trigger conditions **combine** — all must pass. A cue with no conditions never fires.

### 2. `useDirector` hook (`src/hooks/useDirector.ts`)

- Uses a `stateKey` string (simTime|status|completedIds|sbp|spo2|flags) as the `useEffect` dep to avoid referential-equality churn
- `firedOnce` ref (Set) — prevents re-fire of `once:true` cues across renders
- `lastFiredMs` ref (Map) — enforces `cooldownSec`
- Priority ranking: `high:3 > medium:2 > low:1` — does **not** preempt equal/higher active cue
- Auto-dismisses after: `low=5.5s`, `medium=7.5s`, `high=10s`
- Returns: `{ activeCue, characterMoods, dismissCue }`

### 3. Character mood derivation

Moods are computed from `patient.status` first, then refined by `activeCue.actor + activeCue.tone`:

| Type | States |
|------|--------|
| DoctorMood | thinking · focused · proud · concerned · alarmed |
| NurseMood | calm · attentive · worried · relieved |
| PatientMood | stable · scared · confused · distressed · improving · unconscious · dead |
| FamilyMood | anxious · hopeful · relieved · crying |

### 4. SimCockpit wiring (`src/components/sim/SimCockpit.tsx`)

```ts
const { activeCue, characterMoods, dismissCue: dismissDirectorCue } = useDirector(patient, simCase);

const SCENE_ACTORS = new Set(['doctor', 'nurse', 'patient', 'family']);
const directorInterruption = activeCue && !SCENE_ACTORS.has(activeCue.actor)
  ? { id, source, text, responses: ['Noted'], durationMs }
  : null;
const effectiveInterruption = directorInterruption ?? interruption;
```

- **Scene actors** (doctor/nurse/patient/family) → rendered as speech bubbles in ScenePanel
- **System actors** (consultant/lab/radiology/pharmacy/hospital) → converted to `Interruption` format and shown via InterruptionBubble
- Director interruptions override ambient interruptions from useInterruptionEngine

### 5. ScenePanel consumes Director (`src/components/sim/ScenePanel.tsx`)

Props added:
- `characterMoods?: CharacterMoods` — overrides default mood derivation
- `activeCue?: DirectorCue | null` — scene-actor cues rendered as speech bubbles

Visual effects applied: `director-green-glow`, `director-red-flash`, `director-pulse`, `director-soft-fade` — CSS `@keyframes` in `index.css`, applied to ScenePanel root div when `activeCue.visualEffect` is set.

Avatar upgrades:
- **DoctorAvatar**: pen in hand when `focused`, coat border changes colour by mood
- **NurseAvatar**: inverted brows + frown when `worried`, smile when `relieved`
- **FamilyAvatar**: crying (closed eyes + tear drops), hopeful (slight smile), relieved (full smile)
- Family always rendered (removed conditional `{latestFamily &&}` wrapper)

---

## Septic Shock Director Cues (20 total)

| id | Trigger | Actor | Tone | Notes |
|----|---------|-------|------|-------|
| early-handover | atTime:1 | nurse | calm | Catheter mention |
| allergy-family-clue | atTime:5, flagNotSet:allergiesChecked | family | urgent | pulse effect |
| allergy-dr-nudge | atTime:9, flagNotSet:allergiesChecked | doctor | nudge | |
| pip-tazo-allergy-known | afterActionId:pip-tazo, flagSet:penicillinAllergyKnown | nurse | urgent | redFlash+alarm |
| pip-tazo-allergy-unknown | afterActionId:pip-tazo, flagNotSet:allergiesChecked | nurse | urgent | redFlash+alarm |
| cultures-praise | afterActionId:draw-blood-cultures, flagNotSet:antibioticsStarted | doctor | praise | |
| cultures-post-abx | flagSet:antibioticsStarted, flagNotSet:culturesDrawn | lab | warn | |
| no-o2-nudge | atTime:12, flagNotSet:oxygenStarted | nurse | nudge | |
| no-iv-warning | atTime:15, flagNotSet:ivAccessEstablished | nurse | nudge | |
| no-fluids-warning | atTime:15, flagNotSet:fluidsStarted | nurse | warn | pulse |
| abx-delay-30 | atTime:30, flagNotSet:antibioticsStarted | doctor | warn | |
| ctpa-trap | afterActionId:order-ctpa | doctor | nudge | |
| saline-note | afterActionId:fluids-ns-1 | lab | warn | |
| arrest-warning | vitalBelow:sbp<55 | nurse | urgent | redFlash, once:false, cooldown:30s |
| meropenem-praise | afterActionId:antibiotics-meropenem, flagSet:allergiesChecked | doctor | praise | |
| fluid-response-praise | flagSet:adequateFluids | nurse | relief | greenGlow+successChime |
| patient-lucid | flagSet:adequateFluids | patient | relief | |
| family-relief | flagSet:adequateFluids | family | relief | |
| icu-arrival | flagSet:icuCalled | consultant | calm | phoneRing |
| family-final-thanks | atTime:50, flagSet:adequateFluids | family | relief | softFade |

---

## How to add cues for a new case

1. In the case file, import `DirectorCue` from `../../types/simulation`
2. Define `const DIRECTOR_CUES: DirectorCue[]` array
3. Add `directorCues: DIRECTOR_CUES` to the exported case object
4. All evaluation, mood derivation, and rendering is automatic

---

## Files changed in V7 Phase 2

| File | Change |
|------|--------|
| `src/types/simulation.ts` | DirectorCue interface, mood types, CharacterMoods, directorCues on SimCase |
| `src/hooks/useDirector.ts` | New hook — trigger evaluation, mood derivation, priority logic |
| `src/data/simCases/septicShock.ts` | 20 Director cues added |
| `src/index.css` | 4 visual effect keyframe animations |
| `src/components/sim/ScenePanel.tsx` | Consumes characterMoods + activeCue; avatar upgrades |
| `src/components/sim/SimCockpit.tsx` | useDirector instantiation, interruption routing, ScenePanel prop wiring |
| `V7_PHASE2_HANDOVER.md` | This file |

---

## Next steps (V7 Phase 3 ideas)

- **Sound**: wire `DirectorSound` values to `useSimAudio().play()` calls in SimCockpit
- **Flatline cue**: visual + audio for cardiac arrest ending
- **Narrative debrief**: `SimDebrief.tsx` could read `firedDirectorCues` (expose from hook) to reference key moments in the prose stanza
- **More cases**: Night Shift cases can now use the same Director system
