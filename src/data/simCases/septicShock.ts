import type { SimCase, SimAction, SimVitals, PatientSim, OrderResult, DirectorCue } from '../../types/simulation';

// ─── Initial Vitals ───────────────────────────────────────────────────────────

const INITIAL_VITALS: SimVitals = {
  hr:      118,
  sbp:     88,
  dbp:     52,
  map:     64,
  rr:      24,
  spo2:    95,
  temp:    38.9,
  gcs:     13,
  uoMlHr:  8,
};

// ─── Actions ──────────────────────────────────────────────────────────────────

const ACTIONS: SimAction[] = [

  // ── Assessment ──────────────────────────────────────────────────────────────

  {
    id: 'ask-family',
    label: 'Talk to family',
    sublabel: '~8 min',
    category: 'assessment',
    icon: '👨‍👩‍👧',
    timeCostMin: 8,
    availableOnce: true,
    effect: {
      revealsHistory: [
        'Unwell for 3 days — initially thought it was a cold',
        'Hip replacement surgery 3 weeks ago at this hospital',
        'Has not eaten or drunk since yesterday evening',
        '"I found her confused when I went to check on her this morning"',
      ],
      eventMessage: 'Family history taken. Ruth has been unwell for 3 days following recent hip surgery.',
      eventSeverity: 'info',
    },
  },

  {
    id: 'review-chart',
    label: 'Review chart',
    sublabel: '~3 min',
    category: 'assessment',
    icon: '📋',
    timeCostMin: 3,
    availableOnce: true,
    effect: {
      revealsHistory: [
        'Urinary catheter in situ (inserted during hip surgery admission, 3 weeks ago)',
        'Background: Rheumatoid arthritis (on disease-modifying therapy), hypertension',
        'Baseline BP documented as 110/70 mmHg',
        'Baseline creatinine: 0.8 mg/dL (71 µmol/L)',
      ],
      revealsMedications: [
        'Methotrexate 15 mg weekly (RA — disease-modifying)',
        'Folic acid 5 mg weekly',
        'Amlodipine 5 mg daily (hypertension)',
      ],
      addsActiveProblems: ['urinary-catheter', 'immunosuppressed'],
      eventMessage: 'Chart reviewed. Urinary catheter in situ since hip surgery. On methotrexate — clinically immunosuppressed.',
      eventSeverity: 'warning',
    },
  },

  {
    id: 'check-allergies',
    label: 'Check allergies',
    sublabel: '~2 min',
    category: 'assessment',
    icon: '⚠️',
    timeCostMin: 2,
    availableOnce: true,
    effect: {
      revealsAllergies: ['Penicillin — documented rash (wristband confirmed)'],
      setsFlags: ['allergiesChecked', 'penicillinAllergyKnown'],
      eventMessage: '⚠️ ALLERGY ALERT: Penicillin — rash. All penicillin-class antibiotics contraindicated.',
      eventSeverity: 'danger',
      recordsMetric: { key: 'allergiesChecked', value: true },
    },
  },

  {
    id: 'examine-patient',
    label: 'Examine patient',
    sublabel: '~5 min',
    category: 'assessment',
    icon: '🩺',
    timeCostMin: 5,
    availableOnce: true,
    effect: {
      revealsHistory: [
        'General: flushed, diaphoretic, confused and disoriented',
        'Cardiovascular: tachycardic, warm peripheries, capillary refill 3 seconds',
        'JVP: not visible — clinically volume-depleted',
        'Respiratory: coarse crackles right base on auscultation',
        'Abdomen: soft, mild suprapubic tenderness — no peritonism',
        'Skin: no rash, no petechiae',
      ],
      addsActiveProblems: ['right-base-crackles', 'suprapubic-tenderness'],
      eventMessage: 'Examination complete. Warm, flushed, volume-depleted. Right basal crackles. Suprapubic tenderness.',
      eventSeverity: 'warning',
    },
  },

  {
    id: 'assess-urine-output',
    label: 'Assess urine output',
    sublabel: '~3 min',
    category: 'assessment',
    icon: '🧪',
    timeCostMin: 3,
    availableOnce: true,
    effect: {
      revealsHistory: [
        'Catheter bag: <50 mL urine since approximately 09:00 (>4 hours)',
        'Urine colour: dark amber, concentrated',
      ],
      setsFlags: ['oliguriaConfirmed'],
      addsActiveProblems: ['oliguria'],
      eventMessage: 'Urine output: <50 mL in >4 hours. Oliguric.',
      eventSeverity: 'warning',
      recordsMetric: { key: 'oliguriaIdentified', value: true },
    },
  },

  // ── Investigations ──────────────────────────────────────────────────────────

  {
    id: 'order-ecg',
    label: 'ECG',
    sublabel: '~2 min',
    category: 'investigation',
    icon: '📈',
    timeCostMin: 2,
    availableOnce: true,
    effect: {
      placesOrder: {
        type: 'cardiac',
        label: 'ECG',
        timeCostMin: 2,
        result: {
          type: 'ecg-report',
          reportText:
            'Rate: 118 bpm\n' +
            'Rhythm: Sinus tachycardia\n' +
            'Axis: Normal\n' +
            'Intervals: PR 160ms, QRS 88ms, QTc 440ms\n' +
            'ST changes: Non-specific ST depression V1–V3\n' +
            'RV strain: S1Q3T3 pattern present\n\n' +
            'COMMENT: RV strain pattern is a recognised feature of both pulmonary embolism AND haemodynamic compromise from sepsis. ' +
            'This finding alone does not confirm PE. Clinical correlation and pre-test probability assessment are essential.',
          isAbnormal: true,
          setsFlags: ['ecgDone'],
        },
      },
      eventMessage: 'ECG performed.',
      eventSeverity: 'info',
    },
  },

  {
    id: 'order-vbg',
    label: 'VBG / Lactate',
    sublabel: '~8 min',
    category: 'investigation',
    icon: '🩸',
    timeCostMin: 2,
    availableOnce: true,
    effect: {
      placesOrder: {
        type: 'lab',
        label: 'Venous Blood Gas + Lactate',
        timeCostMin: 8,
        result: {
          type: 'lab-panel',
          values: [
            { key: 'ph',      label: 'pH',          value: '7.28',           flagged: true,  normal: '7.35–7.45' },
            { key: 'pco2',    label: 'pCO₂',        value: '28 mmHg',        flagged: true,  normal: '35–45 mmHg' },
            { key: 'hco3',    label: 'HCO₃⁻',       value: '16 mEq/L',       flagged: true,  normal: '22–26 mEq/L' },
            { key: 'lactate', label: 'Lactate',      value: '5.8 mmol/L',     flagged: true,  normal: '<2.0 mmol/L' },
            { key: 'be',      label: 'Base Excess',  value: '−10',            flagged: true,  normal: '−2 to +2' },
          ],
          isAbnormal: true,
          revealsHiddenVitals: { lactate: 5.8, bicarb: 16 },
          setsFlags: ['lactateKnown', 'vbgDone'],
        },
      },
      eventMessage: 'VBG / Lactate sent.',
      eventSeverity: 'info',
      recordsMetric: { key: 'lactateOrdered', value: true },
    },
  },

  {
    id: 'order-cbc',
    label: 'Full Blood Count',
    sublabel: '~15 min',
    category: 'investigation',
    icon: '🔬',
    timeCostMin: 2,
    availableOnce: true,
    effect: {
      placesOrder: {
        type: 'lab',
        label: 'Full Blood Count',
        timeCostMin: 15,
        result: {
          type: 'lab-panel',
          values: [
            { key: 'wbc',  label: 'WBC',         value: '22.4 × 10⁹/L', flagged: true,  normal: '4.0–11.0' },
            { key: 'neut', label: 'Neutrophils',  value: '19.8 × 10⁹/L', flagged: true,  normal: '1.8–7.5' },
            { key: 'hb',   label: 'Haemoglobin',  value: '112 g/L',       flagged: true,  normal: '120–160 g/L' },
            { key: 'plt',  label: 'Platelets',    value: '98 × 10⁹/L',   flagged: true,  normal: '150–400' },
          ],
          isAbnormal: true,
          revealsHiddenVitals: { wbc: 22.4 },
          setsFlags: ['cbcDone'],
        },
      },
      eventMessage: 'Full blood count ordered.',
      eventSeverity: 'info',
    },
  },

  {
    id: 'order-cmp',
    label: 'Metabolic Panel',
    sublabel: '~15 min',
    category: 'investigation',
    icon: '🔬',
    timeCostMin: 2,
    availableOnce: true,
    effect: {
      placesOrder: {
        type: 'lab',
        label: 'Comprehensive Metabolic Panel',
        timeCostMin: 15,
        result: {
          type: 'lab-panel',
          values: [
            { key: 'na',    label: 'Sodium',      value: '134 mEq/L',    flagged: false, normal: '136–145' },
            { key: 'k',     label: 'Potassium',   value: '3.6 mEq/L',    flagged: false, normal: '3.5–5.0' },
            { key: 'cr',    label: 'Creatinine',  value: '203 µmol/L',   flagged: true,  normal: '44–80 µmol/L (baseline 71)' },
            { key: 'bun',   label: 'Urea',        value: '14.8 mmol/L',  flagged: true,  normal: '3.6–7.1 mmol/L' },
            { key: 'gluc',  label: 'Glucose',     value: '9.2 mmol/L',   flagged: true,  normal: '3.9–5.5 mmol/L' },
            { key: 'alt',   label: 'ALT',         value: '58 U/L',       flagged: true,  normal: '<35 U/L' },
            { key: 'bicarb',label: 'Bicarbonate', value: '16 mEq/L',     flagged: true,  normal: '22–29 mEq/L' },
          ],
          isAbnormal: true,
          revealsHiddenVitals: { creatinine: 203, potassium: 3.6, glucose: 9.2 },
          setsFlags: ['cmpDone', 'akiIdentified'],
        },
      },
      eventMessage: 'Metabolic panel ordered.',
      eventSeverity: 'info',
    },
  },

  {
    id: 'order-ua',
    label: 'Urinalysis',
    sublabel: '~10 min',
    category: 'investigation',
    icon: '🧪',
    timeCostMin: 2,
    availableOnce: true,
    effect: {
      placesOrder: {
        type: 'lab',
        label: 'Urinalysis',
        timeCostMin: 10,
        result: {
          type: 'lab-panel',
          values: [
            { key: 'colour',   label: 'Colour',              value: 'Dark amber',  flagged: true },
            { key: 'nitrites', label: 'Nitrites',            value: 'POSITIVE',    flagged: true },
            { key: 'le',       label: 'Leukocyte esterase',  value: 'POSITIVE',    flagged: true },
            { key: 'wbccast',  label: 'WBC casts',           value: 'Present',     flagged: true },
            { key: 'protein',  label: 'Protein',             value: '+',           flagged: true },
            { key: 'blood',    label: 'Blood',               value: 'Trace',       flagged: false },
          ],
          isAbnormal: true,
          setsFlags: ['uaDone', 'utiSourceConfirmed'],
        },
      },
      eventMessage: 'Urinalysis sent. Results pending.',
      eventSeverity: 'info',
    },
  },

  {
    id: 'order-cxr',
    label: 'Chest X-Ray',
    sublabel: '~20 min (portable)',
    category: 'investigation',
    icon: '🫁',
    timeCostMin: 2,
    availableOnce: true,
    effect: {
      placesOrder: {
        type: 'imaging',
        label: 'Chest X-Ray (Portable AP)',
        timeCostMin: 20,
        result: {
          type: 'imaging-report',
          reportText:
            'CHEST X-RAY — PORTABLE AP\n\n' +
            'Findings:\n' +
            '• Mild cardiomegaly\n' +
            '• Subtle increased opacification right lower lobe — early consolidation vs aspiration cannot be excluded\n' +
            '• No overt pulmonary oedema\n' +
            '• No pleural effusion identified\n' +
            '• No pneumothorax\n\n' +
            'Impression: Right lower lobe opacity. Clinical correlation required.\n' +
            'Differential: Pneumonia, aspiration, or atelectasis.',
          isAbnormal: true,
          setsFlags: ['cxrDone'],
        },
      },
      eventMessage: 'Portable CXR requested.',
      eventSeverity: 'info',
    },
  },

  {
    id: 'draw-blood-cultures',
    label: 'Blood cultures × 2',
    sublabel: '~5 min — do BEFORE antibiotics',
    category: 'investigation',
    icon: '🩸',
    timeCostMin: 5,
    availableOnce: true,
    requiresActionIds: ['establish-iv-access'],
    blockedByFlags: ['antibioticsStarted'],
    effect: {
      placesOrder: {
        type: 'lab',
        label: 'Blood Cultures × 2',
        timeCostMin: 2880,  // 48 hours — won't arrive during case; debrief references it
        result: {
          type: 'lab-panel',
          values: [
            { key: 'org',       label: 'Organism',    value: 'E. coli (Gram-negative rod)',                               flagged: true },
            { key: 'sensitive', label: 'Sensitive',   value: 'Ciprofloxacin, Ceftriaxone, Meropenem, Gentamicin',       flagged: false },
            { key: 'resistant', label: 'Resistant',   value: 'Ampicillin, Trimethoprim',                                 flagged: true },
            { key: 'esbl',      label: 'ESBL',        value: 'Negative',                                                 flagged: false },
          ],
          isAbnormal: true,
          setsFlags: ['cultureSensitivitiesBack'],
        },
      },
      setsFlags: ['culturesDrawn'],
      eventMessage: '✅ Blood cultures collected — two sets drawn before antibiotics.',
      eventSeverity: 'success',
      recordsMetric: { key: 'culturesBeforeAbx', value: true },
      scoreImpact: { guideline: 8 },
    },
  },

  {
    id: 'order-urine-culture',
    label: 'Urine culture',
    sublabel: '~2 min — catheter specimen',
    description: 'Catheter-associated UTI is the likely source. Culture guides antibiotic rationalisation at 48–72 h.',
    category: 'investigation',
    icon: '🧪',
    timeCostMin: 2,
    availableOnce: true,
    requiresActionIds: ['order-ua'],
    effect: {
      placesOrder: {
        type: 'lab',
        label: 'Urine Culture (CASU)',
        timeCostMin: 48,
        result: {
          type: 'lab-panel',
          values: [
            { key: 'growth', label: 'Growth', value: 'Heavy growth', flagged: true },
            { key: 'organism', label: 'Organism', value: 'E. coli (ESBL-negative)', flagged: false, normal: '—' },
            { key: 'sensitivity', label: 'Sensitivity', value: 'Sensitive to meropenem, ciprofloxacin, trimethoprim', flagged: false, normal: '—' },
            { key: 'resistance', label: 'Resistance', value: 'Resistant to ampicillin, co-amoxiclav', flagged: true, normal: '—' },
          ],
          isAbnormal: true,
          reportText: 'CAUTI confirmed. E. coli — meropenem appropriate. Can rationalise to oral ciprofloxacin when clinically stable.',
          setsFlags: ['urineCultureSent'],
        },
      },
      eventMessage: 'Urine culture sent from catheter specimen. Result will guide antibiotic rationalisation.',
      eventSeverity: 'info',
      scoreImpact: { guideline: 5, diagnostic: 5 },
    },
  },

  {
    id: 'order-ctpa',
    label: 'CT Pulmonary Angiogram',
    sublabel: '~45 min — contrast required',
    description: 'Excludes PE. Consider: is PE the most likely diagnosis given the full clinical picture? Time cost is significant.',
    category: 'investigation',
    icon: '🫁',
    timeCostMin: 5,
    availableOnce: true,
    effect: {
      placesOrder: {
        type: 'imaging',
        label: 'CT Pulmonary Angiogram',
        timeCostMin: 45,
        result: {
          type: 'imaging-report',
          reportText:
            'CT PULMONARY ANGIOGRAM\n\n' +
            'Clinical indication: Query pulmonary embolism\n\n' +
            'Findings:\n' +
            '• No pulmonary embolism identified bilaterally to the subsegmental level\n' +
            '• Incidental: Right lower lobe consolidation — consistent with pneumonia\n' +
            '• Mild pleural thickening right base\n' +
            '• No aortic abnormality\n' +
            '• Normal cardiac silhouette\n\n' +
            'Conclusion: PE EXCLUDED. Right lower lobe pneumonia confirmed.',
          isAbnormal: false,
          setsFlags: ['ctpaDone', 'peExcluded', 'pneumoniaConfirmedCTPA'],
        },
      },
      eventMessage: '⏱ CTPA in progress — 45 minutes. Patient continues to deteriorate during scan.',
      eventSeverity: 'warning',
      scoreImpact: { time: -15, cost: -12 },
      recordsMetric: { key: 'ctpaOrdered', value: true },
    },
  },

  // ── Treatment ───────────────────────────────────────────────────────────────

  {
    id: 'oxygen-therapy',
    label: 'Supplemental oxygen',
    sublabel: '~1 min — 15L via NRB mask',
    category: 'treatment',
    icon: '💨',
    timeCostMin: 1,
    availableOnce: true,
    effect: {
      vitalsDelta: { spo2: 3, rr: -1 },
      setsFlags: ['oxygenStarted'],
      eventMessage: 'Oxygen 15L/min via non-rebreather mask applied.',
      eventSeverity: 'info',
    },
  },

  {
    id: 'establish-iv-access',
    label: 'Establish IV access',
    sublabel: '~3 min — large bore × 2',
    category: 'treatment',
    icon: '💉',
    timeCostMin: 3,
    availableOnce: true,
    effect: {
      setsFlags: ['ivAccessEstablished'],
      eventMessage: '✅ IV access — large bore cannulae × 2, right antecubital fossa.',
      eventSeverity: 'success',
    },
  },

  {
    id: 'fluids-hartmanns-1',
    label: "Hartmann's 500 mL",
    sublabel: '~10 min — 1st bag',
    description: 'Balanced crystalloid — preferred in sepsis per Surviving Sepsis Campaign guidelines.',
    category: 'treatment',
    icon: '💧',
    timeCostMin: 10,
    availableOnce: true,
    requiresActionIds: ['establish-iv-access'],
    effect: {
      vitalsDelta: { sbp: 5, dbp: 3, hr: -4, uoMlHr: 5 },
      setsFlags: ['fluidsStarted', 'hartmanns1Given'],
      deteriorationRateDelta: -0.4,
      eventMessage: "500 mL Hartmann's solution started.",
      eventSeverity: 'info',
      scoreImpact: { guideline: 4 },
    },
  },

  {
    id: 'fluids-hartmanns-2',
    label: "Hartmann's 500 mL",
    sublabel: '~10 min — 2nd bag',
    category: 'treatment',
    icon: '💧',
    timeCostMin: 10,
    availableOnce: true,
    requiresActionIds: ['fluids-hartmanns-1'],
    effect: {
      vitalsDelta: { sbp: 5, dbp: 2, hr: -3, uoMlHr: 6 },
      setsFlags: ['hartmanns2Given'],
      deteriorationRateDelta: -0.3,
      eventMessage: "2nd 500 mL Hartmann's given. Cumulative: 1000 mL.",
      eventSeverity: 'info',
      scoreImpact: { guideline: 3 },
    },
  },

  {
    id: 'fluids-hartmanns-3',
    label: "Hartmann's 500 mL",
    sublabel: '~10 min — 3rd bag (30 mL/kg target)',
    category: 'treatment',
    icon: '💧',
    timeCostMin: 10,
    availableOnce: true,
    requiresActionIds: ['fluids-hartmanns-2'],
    effect: {
      vitalsDelta: { sbp: 4, dbp: 2, hr: -3, uoMlHr: 8 },
      setsFlags: ['hartmanns3Given', 'adequateFluids'],
      deteriorationRateDelta: -0.3,
      eventMessage: "3rd 500 mL Hartmann's given. Cumulative: 1500 mL — approaching 30 mL/kg resuscitation target.",
      eventSeverity: 'success',
      scoreImpact: { guideline: 5 },
    },
  },

  {
    id: 'fluids-ns-1',
    label: '0.9% Normal Saline 500 mL',
    sublabel: '~10 min — 1st bag',
    category: 'treatment',
    icon: '💧',
    timeCostMin: 10,
    availableOnce: true,
    requiresActionIds: ['establish-iv-access'],
    effect: {
      vitalsDelta: { sbp: 4, dbp: 2, hr: -3, uoMlHr: 4 },
      setsFlags: ['fluidsStarted', 'ns1Given', 'nsalineUsed'],
      hiddenVitalsDelta: { chlorideLoad: 77 },
      deteriorationRateDelta: -0.3,
      eventMessage: '500 mL 0.9% normal saline started.',
      eventSeverity: 'info',
    },
  },

  {
    id: 'fluids-ns-2',
    label: '0.9% Normal Saline 500 mL',
    sublabel: '~10 min — 2nd bag',
    category: 'treatment',
    icon: '💧',
    timeCostMin: 10,
    availableOnce: true,
    requiresActionIds: ['fluids-ns-1'],
    effect: {
      vitalsDelta: { sbp: 3, dbp: 1, hr: -2, uoMlHr: 4 },
      setsFlags: ['ns2Given'],
      hiddenVitalsDelta: { chlorideLoad: 77 },
      deteriorationRateDelta: -0.2,
      eventMessage: '2nd 500 mL normal saline given. Cumulative: 1000 mL.',
      eventSeverity: 'info',
    },
  },

  {
    id: 'fluids-ns-3',
    label: '0.9% Normal Saline 500 mL',
    sublabel: '~10 min — 3rd bag',
    category: 'treatment',
    icon: '💧',
    timeCostMin: 10,
    availableOnce: true,
    requiresActionIds: ['fluids-ns-2'],
    effect: {
      vitalsDelta: { sbp: 3, dbp: 1, hr: -2 },
      setsFlags: ['ns3Given', 'nsOverload', 'adequateFluids'],
      hiddenVitalsDelta: { chlorideLoad: 77 },
      deteriorationRateDelta: -0.1,
      triggersCascadeIds: ['hyperchloraemic-acidosis'],
      eventMessage: '3rd normal saline bag given. Total: 1500 mL.',
      eventSeverity: 'warning',
      scoreImpact: { guideline: -10 },
    },
  },

  // Antibiotics — pip-tazo (dangerous: blocked if allergy known)
  {
    id: 'antibiotics-pip-tazo',
    label: 'Piperacillin-Tazobactam IV',
    sublabel: '4.5 g — broad spectrum, penicillin class',
    category: 'treatment',
    icon: '💊',
    timeCostMin: 5,
    availableOnce: true,
    requiresActionIds: ['establish-iv-access'],
    blockedByFlags: ['antibioticsStarted', 'penicillinAllergyKnown'],
    effect: {
      setsFlags: ['antibioticsStarted', 'pipTazoGiven'],
      deteriorationRateDelta: -1.5,
      vitalsDriftModifier: { sbp: 0.5, hr: -0.2 },
      hiddenDriftModifier: { lactate: -0.06 },
      eventMessage: 'Piperacillin-tazobactam 4.5 g IV commenced.',
      eventSeverity: 'info',
      triggersCascadeIds: ['anaphylaxis-check'],
      recordsMetric: { key: 'timeToAntibiotics', value: -1 },
      scoreImpact: { guideline: 5 },
    },
  },

  // Antibiotics — meropenem (best choice for this immunosuppressed patient)
  {
    id: 'antibiotics-meropenem',
    label: 'Meropenem IV',
    sublabel: '1 g — carbapenem, safe in penicillin allergy',
    description: 'Preferred in immunocompromised hosts. Safe in documented penicillin allergy (no cross-reactivity with carbapenems).',
    category: 'treatment',
    icon: '💊',
    timeCostMin: 5,
    availableOnce: true,
    requiresActionIds: ['establish-iv-access'],
    blockedByFlags: ['antibioticsStarted'],
    effect: {
      setsFlags: ['antibioticsStarted', 'meropenemGiven', 'broadCoverageGiven'],
      deteriorationRateDelta: -2.0,
      vitalsDriftModifier: { sbp: 0.6, hr: -0.25 },
      hiddenDriftModifier: { lactate: -0.09 },
      eventMessage: 'Meropenem 1 g IV commenced — appropriate for immunosuppressed host.',
      eventSeverity: 'success',
      recordsMetric: { key: 'timeToAntibiotics', value: -1 },
      scoreImpact: { guideline: 10 },
    },
  },

  // Antibiotics — ceftriaxone (reasonable but insufficient for this patient)
  {
    id: 'antibiotics-ceftriaxone',
    label: 'Ceftriaxone IV',
    sublabel: '2 g — cephalosporin, UTI coverage',
    description: 'Covers most UTI organisms but insufficient breadth for immunosuppressed host with possible pneumonia.',
    category: 'treatment',
    icon: '💊',
    timeCostMin: 5,
    availableOnce: true,
    requiresActionIds: ['establish-iv-access'],
    blockedByFlags: ['antibioticsStarted'],
    effect: {
      setsFlags: ['antibioticsStarted', 'ceftriaxoneGiven', 'narrowCoverageGiven'],
      deteriorationRateDelta: -1.2,
      vitalsDriftModifier: { sbp: 0.3, hr: -0.1 },
      hiddenDriftModifier: { lactate: -0.04 },
      eventMessage: 'Ceftriaxone 2 g IV commenced.',
      eventSeverity: 'info',
      recordsMetric: { key: 'timeToAntibiotics', value: -1 },
      scoreImpact: { guideline: 3 },
    },
  },

  // Vasopressors — only unlocked after shock cascade fires
  {
    id: 'start-vasopressors',
    label: 'Noradrenaline infusion',
    sublabel: '~5 min — target MAP ≥65 mmHg',
    category: 'treatment',
    icon: '💉',
    timeCostMin: 5,
    availableOnce: true,
    requiresActionIds: ['establish-iv-access'],
    requiresFlags: ['shockThresholdReached'],
    effect: {
      setsFlags: ['vasopressorsStarted'],
      vitalsDelta: { sbp: 12, dbp: 6 },
      vitalsDriftModifier: { sbp: 1.8, hr: -0.4 },
      deteriorationRateDelta: -1.5,
      eventMessage: '✅ Noradrenaline infusion commenced. Titrate to MAP ≥65 mmHg.',
      eventSeverity: 'success',
      scoreImpact: { guideline: 8, safety: 5 },
    },
  },

  // ── Disposition ─────────────────────────────────────────────────────────────

  {
    id: 'call-icu',
    label: 'Call ICU registrar',
    sublabel: '~2 min',
    category: 'disposition',
    icon: '📞',
    timeCostMin: 2,
    availableOnce: true,
    phase: 'complication' as const,
    effect: {
      setsFlags: ['icuCalled'],
      eventMessage: 'ICU registrar contacted. Review requested.',
      eventSeverity: 'info',
      recordsMetric: { key: 'icuCalledAtMin', value: -1 },
      scoreImpact: { guideline: 3 },
    },
  },

  {
    id: 'transfer-icu',
    label: 'Transfer to ICU',
    sublabel: '~10 min',
    category: 'disposition',
    icon: '🏥',
    timeCostMin: 10,
    availableOnce: true,
    requiresFlags: ['icuCalled'],
    effect: {
      setsFlags: ['icuTransferred'],
      eventMessage: 'Ruth transferred to ICU — handover completed.',
      eventSeverity: 'info',
      triggersCascadeIds: ['icu-transfer-outcome'],
    },
  },

  {
    id: 'admit-ward',
    label: 'Admit to medical ward',
    sublabel: '~5 min — sepsis pathway',
    category: 'disposition',
    icon: '🏥',
    timeCostMin: 5,
    availableOnce: true,
    phase: 'disposition' as const,
    requiresFlags: ['antibioticsStarted', 'fluidsStarted'],
    blockedByFlags: ['shockThresholdReached'],
    effect: {
      setsFlags: ['admittedWard'],
      eventMessage: 'Ruth admitted to medical ward on sepsis pathway.',
      eventSeverity: 'info',
      triggersCascadeIds: ['ward-admission-outcome'],
    },
  },

  // ── Repeat Investigations (dynamicResult reflects current engine state) ───

  {
    id: 'vbg-repeat',
    label: 'Repeat VBG / Lactate',
    sublabel: '~8 min — track treatment response',
    category: 'investigation',
    icon: '🩸',
    timeCostMin: 2,
    availableOnce: false,
    requiresActionIds: ['order-vbg'],
    effect: {
      placesOrder: {
        type: 'lab',
        label: 'Repeat VBG + Lactate',
        timeCostMin: 8,
        result: { type: 'lab-panel', values: [], isAbnormal: true },
      },
      eventMessage: 'Repeat VBG / Lactate sent.',
      eventSeverity: 'info',
    },
    dynamicResult: (patient: PatientSim): OrderResult => {
      const lactate = Math.max(0.5, patient.hiddenVitals.lactate ?? 5.8);
      const bicarb  = Math.max(8,   patient.hiddenVitals.bicarb  ?? 16);
      const pH      = Math.max(6.9, Math.min(7.5, 7.40 + (bicarb - 24) * 0.015));
      const pco2    = Math.max(15,  Math.min(45,  24   + (bicarb - 16) * 0.6));
      const be      = Math.round(bicarb - 24);
      return {
        type: 'lab-panel',
        values: [
          { key: 'ph',      label: 'pH',          value: pH.toFixed(2),                       flagged: pH < 7.35,      normal: '7.35–7.45' },
          { key: 'pco2',    label: 'pCO₂',        value: `${Math.round(pco2)} mmHg`,          flagged: pco2 < 35,      normal: '35–45 mmHg' },
          { key: 'hco3',    label: 'HCO₃⁻',       value: `${Math.round(bicarb)} mEq/L`,       flagged: bicarb < 22,    normal: '22–26 mEq/L' },
          { key: 'lactate', label: 'Lactate',      value: `${lactate.toFixed(1)} mmol/L`,      flagged: lactate >= 2.0, normal: '<2.0 mmol/L' },
          { key: 'be',      label: 'Base Excess',  value: be >= 0 ? `+${be}` : `${be}`,        flagged: Math.abs(be) > 2, normal: '−2 to +2' },
        ],
        isAbnormal: pH < 7.35 || lactate >= 2.0 || bicarb < 22,
        revealsHiddenVitals: { lactate, bicarb },
      };
    },
  },

  {
    id: 'cbc-repeat',
    label: 'Repeat Full Blood Count',
    sublabel: '~15 min',
    category: 'investigation',
    icon: '🔬',
    timeCostMin: 2,
    availableOnce: false,
    requiresActionIds: ['order-cbc'],
    effect: {
      placesOrder: {
        type: 'lab',
        label: 'Repeat Full Blood Count',
        timeCostMin: 15,
        result: { type: 'lab-panel', values: [], isAbnormal: true },
      },
      eventMessage: 'Repeat full blood count ordered.',
      eventSeverity: 'info',
    },
    dynamicResult: (patient: PatientSim): OrderResult => {
      const wbc = Math.max(4, patient.hiddenVitals.wbc ?? 22.4);
      const plt = Math.max(20, Math.round(98 - patient.simTimeMinutes * 0.25));
      return {
        type: 'lab-panel',
        values: [
          { key: 'wbc',  label: 'WBC',        value: `${wbc.toFixed(1)} × 10⁹/L`,         flagged: wbc > 11,   normal: '4.0–11.0' },
          { key: 'neut', label: 'Neutrophils', value: `${(wbc * 0.88).toFixed(1)} × 10⁹/L`, flagged: wbc > 7.5, normal: '1.8–7.5' },
          { key: 'hb',   label: 'Haemoglobin', value: '112 g/L',                             flagged: true,       normal: '120–160 g/L' },
          { key: 'plt',  label: 'Platelets',   value: `${plt} × 10⁹/L`,                     flagged: plt < 150,  normal: '150–400' },
        ],
        isAbnormal: wbc > 11 || plt < 150,
        revealsHiddenVitals: { wbc },
      };
    },
  },

  {
    id: 'cmp-repeat',
    label: 'Repeat Metabolic Panel',
    sublabel: '~15 min',
    category: 'investigation',
    icon: '🔬',
    timeCostMin: 2,
    availableOnce: false,
    requiresActionIds: ['order-cmp'],
    effect: {
      placesOrder: {
        type: 'lab',
        label: 'Repeat Comprehensive Metabolic Panel',
        timeCostMin: 15,
        result: { type: 'lab-panel', values: [], isAbnormal: true },
      },
      eventMessage: 'Repeat metabolic panel ordered.',
      eventSeverity: 'info',
    },
    dynamicResult: (patient: PatientSim): OrderResult => {
      const cr     = Math.max(71, patient.hiddenVitals.creatinine ?? 203);
      const bicarb = Math.max(8,  patient.hiddenVitals.bicarb     ?? 16);
      const urea   = Math.max(3.6, 14.8 + (cr - 203) * 0.02);
      return {
        type: 'lab-panel',
        values: [
          { key: 'na',     label: 'Sodium',      value: '134 mEq/L',                    flagged: false,       normal: '136–145' },
          { key: 'k',      label: 'Potassium',   value: '3.6 mEq/L',                    flagged: false,       normal: '3.5–5.0' },
          { key: 'cr',     label: 'Creatinine',  value: `${Math.round(cr)} µmol/L`,     flagged: cr > 80,     normal: '44–80 µmol/L (baseline 71)' },
          { key: 'bun',    label: 'Urea',        value: `${urea.toFixed(1)} mmol/L`,    flagged: urea > 7.1,  normal: '3.6–7.1 mmol/L' },
          { key: 'bicarb', label: 'Bicarbonate', value: `${Math.round(bicarb)} mEq/L`,  flagged: bicarb < 22, normal: '22–29 mEq/L' },
        ],
        isAbnormal: cr > 80 || bicarb < 22,
        revealsHiddenVitals: { creatinine: cr, bicarb },
      };
    },
  },
];

// ─── Septic Shock Case ────────────────────────────────────────────────────────

// ─── Director Cues ────────────────────────────────────────────────────────────

const DIRECTOR_CUES: DirectorCue[] = [

  // ── Opening atmosphere ──────────────────────────────────────────────────────

  {
    id: 'early-handover',
    trigger: { atTime: 1 },
    actor: 'nurse', tone: 'calm', priority: 'low', once: true,
    message: "That catheter's been in since her hip surgery. Three weeks.",
  },

  // ── Allergy system — most important safety signal ───────────────────────────

  {
    id: 'allergy-family-clue',
    trigger: { atTime: 5, flagNotSet: 'allergiesChecked' },
    actor: 'family', tone: 'urgent', priority: 'high', once: true,
    message: "Doctor — she has a drug allergy. Something to do with penicillin, I think.",
    visualEffect: 'pulse',
  },
  {
    id: 'allergy-dr-nudge',
    trigger: { atTime: 9, flagNotSet: 'allergiesChecked' },
    actor: 'doctor', tone: 'nudge', priority: 'medium', once: true,
    message: "Have we checked her allergies yet?",
  },
  {
    id: 'pip-tazo-allergy-known',
    trigger: { afterActionId: 'antibiotics-pip-tazo', flagSet: 'penicillinAllergyKnown' },
    actor: 'nurse', tone: 'urgent', priority: 'high', once: true,
    message: "She's allergic to penicillin! Pip-tazo is penicillin-class!",
    visualEffect: 'redFlash',
    sound: 'alarm',
  },
  {
    id: 'pip-tazo-allergy-unknown',
    trigger: { afterActionId: 'antibiotics-pip-tazo', flagNotSet: 'allergiesChecked' },
    actor: 'nurse', tone: 'urgent', priority: 'high', once: true,
    message: "We never checked her allergies. The wristband says penicillin — pip-tazo is contraindicated!",
    visualEffect: 'redFlash',
    sound: 'alarm',
  },

  // ── Culture sequence ────────────────────────────────────────────────────────

  {
    id: 'cultures-praise',
    trigger: { afterActionId: 'draw-blood-cultures', flagNotSet: 'antibioticsStarted' },
    actor: 'doctor', tone: 'praise', priority: 'medium', once: true,
    message: "Good. Cultures first.",
  },
  {
    id: 'cultures-post-abx',
    trigger: { flagSet: 'antibioticsStarted', flagNotSet: 'culturesDrawn' },
    actor: 'lab', tone: 'warn', priority: 'medium', once: true,
    message: "Note: cultures drawn after antibiotics — sensitivity results may be affected.",
  },

  // ── Resuscitation timing ────────────────────────────────────────────────────

  {
    id: 'no-o2-nudge',
    trigger: { atTime: 12, flagNotSet: 'oxygenStarted' },
    actor: 'nurse', tone: 'nudge', priority: 'medium', once: true,
    message: "Sats are 91% and dropping. Should we get some oxygen on?",
  },
  {
    id: 'no-iv-warning',
    trigger: { atTime: 15, flagNotSet: 'ivAccessEstablished' },
    actor: 'nurse', tone: 'nudge', priority: 'medium', once: true,
    message: "We still don't have IV access.",
  },
  {
    id: 'no-fluids-warning',
    trigger: { atTime: 15, flagNotSet: 'fluidsStarted' },
    actor: 'nurse', tone: 'warn', priority: 'high', once: true,
    message: "Her BP is still dropping. She needs IV fluids urgently.",
    visualEffect: 'pulse',
  },
  {
    id: 'abx-delay-30',
    trigger: { atTime: 30, flagNotSet: 'antibioticsStarted' },
    actor: 'doctor', tone: 'warn', priority: 'high', once: true,
    message: "Antibiotics. Every hour of delay matters in sepsis.",
  },

  // ── Consequence cues ────────────────────────────────────────────────────────

  {
    id: 'ctpa-trap',
    trigger: { afterActionId: 'order-ctpa' },
    actor: 'doctor', tone: 'nudge', priority: 'medium', once: true,
    message: "She's hypotensive. Imaging can wait until she's more stable.",
  },
  {
    id: 'saline-note',
    trigger: { afterActionId: 'fluids-ns-1' },
    actor: 'lab', tone: 'warn', priority: 'low', once: true,
    message: "Large saline volumes carry hyperchloraemia risk. Hartmann's is preferred in sepsis.",
  },
  {
    id: 'arrest-warning',
    trigger: { vitalBelow: { key: 'sbp', value: 55 } },
    actor: 'nurse', tone: 'urgent', priority: 'high', once: false, cooldownSec: 30,
    message: "BP is crashing. She's going to lose output.",
    visualEffect: 'redFlash',
    sound: 'alarm',
  },

  // ── Celebration cues ────────────────────────────────────────────────────────

  {
    id: 'meropenem-praise',
    trigger: { afterActionId: 'antibiotics-meropenem', flagSet: 'allergiesChecked' },
    actor: 'doctor', tone: 'praise', priority: 'medium', once: true,
    message: "Good call. Covers the penicillin allergy.",
  },
  {
    id: 'fluid-response-praise',
    trigger: { flagSet: 'adequateFluids' },
    actor: 'nurse', tone: 'relief', priority: 'medium', once: true,
    message: "That helped — her pressure's coming up.",
    visualEffect: 'greenGlow',
    sound: 'successChime',
  },
  {
    id: 'patient-lucid',
    trigger: { flagSet: 'adequateFluids' },
    actor: 'patient', tone: 'relief', priority: 'low', once: true,
    message: "I feel... a little less confused now. Thank you.",
  },
  {
    id: 'family-relief',
    trigger: { flagSet: 'adequateFluids' },
    actor: 'family', tone: 'relief', priority: 'low', once: true,
    message: "She looks better. There's colour back in her face.",
  },

  // ── Signature moments ────────────────────────────────────────────────────────

  {
    id: 'icu-arrival',
    trigger: { flagSet: 'icuCalled' },
    actor: 'consultant', tone: 'calm', priority: 'high', once: true,
    message: "ICU registrar here. What's her current MAP and fluid balance?",
    sound: 'phoneRing',
  },
  {
    id: 'family-final-thanks',
    trigger: { atTime: 50, flagSet: 'adequateFluids' },
    actor: 'family', tone: 'relief', priority: 'low', once: true,
    message: "She's asking for water. She says thank you.",
    visualEffect: 'softFade',
  },
];

export const SEPTIC_SHOCK_CASE: SimCase = {
  id: 'sim-septic-shock',
  title: 'The Morning Admission',
  specialty: 'Emergency Medicine',
  difficulty: 'intermediate',
  estimatedMinutes: 30,
  tags: ['sepsis', 'septic-shock', 'UTI', 'immunosuppression', 'antibiotics', 'fluid-resuscitation'],
  internalDiagnosis: 'Septic shock — catheter-associated UTI with bacteraemic pneumonia in an immunosuppressed host (methotrexate for RA)',

  phases: [
    { id: 'history',     label: 'History & Exam',  description: 'Assess the patient' },
    { id: 'workup',      label: 'Investigations',   description: 'Order and interpret results',
      unlockCondition: { simTimeAbove: 1 } },
    { id: 'treatment',   label: 'Treatment',        description: 'Resuscitate and treat',
      unlockCondition: { flagSet: 'ivAccessEstablished' } },
    { id: 'complication', label: 'Reassessment',    description: 'Reassess and manage deterioration',
      unlockCondition: { and: [
        { flagSet: 'antibioticsStarted' },
        { flagSet: 'fluidsStarted' },
        { simTimeAbove: 18 },
      ]} },
    { id: 'disposition', label: 'Disposition',      description: 'Decide where Ruth goes',
      unlockCondition: { and: [
        { flagSet: 'antibioticsStarted' },
        { flagSet: 'fluidsStarted' },
        { simTimeAbove: 28 },
      ]} },
  ],

  directorCues: DIRECTOR_CUES,

  coachingMessages: [
    {
      id: 'coach-check-allergies',
      text: "Good catch — allergy status confirmed before antibiotics. You just avoided a potentially fatal reaction.",
      tone: 'praise',
      trigger: { type: 'afterAction', actionId: 'check-allergies' },
    },
    {
      id: 'coach-blood-cultures',
      text: "Blood cultures before antibiotics — textbook. Sensitivities in 48h will guide rationalisation.",
      tone: 'teach',
      trigger: { type: 'afterAction', actionId: 'draw-blood-cultures' },
    },
    {
      id: 'coach-meropenem',
      text: "Meropenem — right call. Safe in penicillin allergy, excellent cover for an immunosuppressed host.",
      tone: 'praise',
      trigger: { type: 'afterAction', actionId: 'antibiotics-meropenem' },
    },
    {
      id: 'coach-adequate-fluids',
      text: "30 mL/kg achieved with balanced crystalloid. That's the SSC target — now watch the lactate trend.",
      tone: 'praise',
      trigger: { type: 'afterAction', actionId: 'fluids-hartmanns-3' },
    },
    {
      id: 'coach-vasopressors',
      text: "Noradrenaline — correct first-line. Target MAP ≥65 mmHg. Titrate, don't set and forget.",
      tone: 'teach',
      trigger: { type: 'afterAction', actionId: 'start-vasopressors' },
    },
    {
      id: 'coach-icu-early',
      text: "Good — ICU involved early. Septic shock patients need senior eyes quickly. Don't wait for arrest.",
      tone: 'praise',
      trigger: { type: 'afterAction', actionId: 'call-icu' },
    },
    {
      id: 'coach-ceftriaxone',
      text: "Ceftriaxone covers UTI — but Ruth is immunosuppressed. Is this coverage broad enough for this host?",
      tone: 'nudge',
      trigger: { type: 'afterAction', actionId: 'antibiotics-ceftriaxone' },
    },
    {
      id: 'coach-pip-tazo-allergy',
      text: "Pip-Tazo is penicillin-class. Allergy status should have been confirmed before prescribing.",
      tone: 'warn',
      trigger: { type: 'afterAction', actionId: 'antibiotics-pip-tazo' },
    },
    {
      id: 'coach-no-vbg-10',
      text: "A lactate should be one of your first moves in sepsis — it quantifies severity and guides resuscitation targets.",
      tone: 'nudge',
      trigger: { type: 'missedAction', actionId: 'order-vbg', byMin: 10 },
    },
    {
      id: 'coach-no-allergies-15',
      text: "Antibiotics will be needed soon. Check allergies first — two minutes that could save her life.",
      tone: 'warn',
      trigger: { type: 'missedAction', actionId: 'check-allergies', byMin: 15 },
    },
    {
      id: 'coach-no-cultures-25',
      text: "If antibiotics are started without blood cultures, sensitivities will be uninterpretable. Culture before you treat.",
      tone: 'warn',
      trigger: { type: 'missedAction', actionId: 'draw-blood-cultures', byMin: 25 },
    },
    {
      id: 'coach-complication-phase',
      text: "Treatment is running. Now reassess — check the lactate trend, urine output, and signs of shock.",
      tone: 'teach',
      trigger: { type: 'onPhase', phase: 'complication' },
    },
    {
      id: 'coach-disposition-phase',
      text: "Time to decide where Ruth goes. ICU or ward? Her response to resuscitation will guide this.",
      tone: 'nudge',
      trigger: { type: 'onPhase', phase: 'disposition' },
    },
    {
      id: 'coach-t5-bundle',
      text: "Sepsis bundle: lactate → blood cultures → antibiotics → 30 mL/kg crystalloid. You have time — but not much.",
      tone: 'teach',
      trigger: { type: 'atTime', atMin: 5 },
    },
    {
      id: 'coach-t25-urgency',
      text: "25 minutes elapsed. In real sepsis, every minute without antibiotics increases mortality. Keep moving.",
      tone: 'warn',
      trigger: { type: 'atTime', atMin: 25 },
    },
  ],

  presentation: {
    chiefComplaint: 'Confusion and fever',
    oneLiner: '65F · confusion · fever · hypotension · brought in by daughter',
    contextNote: "Handover from triage: \"Family found her confused at home this morning. She's been a bit off for a few days.\"",
    initialVitals: INITIAL_VITALS,
    patientName: 'Ruth Anand',
    patientAge: '65F',
    patientLocation: 'ED · Bay 3',
    mrn: 'MRN-84217',
  },

  activeProblemCatalog: {
    'urinary-catheter':       'Urinary catheter in situ',
    'immunosuppressed':       'Immunosuppressed (methotrexate)',
    'right-base-crackles':   'Right basal crackles on auscultation',
    'suprapubic-tenderness': 'Suprapubic tenderness',
    'oliguria':               'Oliguria (<0.5 mL/kg/hr)',
    'septic-shock':           'Septic shock',
    'vasopressor-dependent':  'Vasopressor-dependent',
    'anaphylaxis':            'Anaphylaxis — penicillin',
    'metabolic-acidosis':     'Hyperchloraemic metabolic acidosis',
    'aki':                    'Acute kidney injury (Stage 2)',
    'ards-risk':              'ARDS risk (bilateral infiltrates)',
    'pulmonary-oedema':       'Pulmonary oedema',
  },

  actions: ACTIONS,

  cascadeEvents: {

    'anaphylaxis-check': {
      id: 'anaphylaxis-check',
      title: 'Allergy reaction',
      narrative: 'Pip-tazo given — allergy check pending.',
      severity: 'info',
      // This is a no-op cascade; real anaphylaxis fires from the threshold below
    },

    'anaphylaxis': {
      id: 'anaphylaxis',
      title: '🚨 ANAPHYLAXIS',
      narrative: 'Ruth develops urticaria and angioedema within minutes of the piperacillin-tazobactam infusion. BP crashes to 46 systolic. She is allergic to penicillin — documented in her chart.',
      severity: 'fatal',
      vitalsDelta: { sbp: -42, dbp: -20, hr: 38, spo2: -12, rr: 8 },
      setsFlags: ['anaphylaxisActive'],
      addsActiveProblems: ['anaphylaxis'],
      addsAvailableActionIds: ['give-adrenaline'],
    },

    'septic-shock': {
      id: 'septic-shock',
      title: '⚠️ Septic Shock',
      narrative: 'Blood pressure has fallen below the shock threshold. Ruth is now in septic shock — she can no longer maintain her perfusion pressure without vasopressors.',
      severity: 'critical',
      vitalsDelta: { sbp: -6, dbp: -3, uoMlHr: -4 },
      setsFlags: ['shockThresholdReached'],
      addsActiveProblems: ['septic-shock', 'vasopressor-dependent'],
      addsAvailableActionIds: ['start-vasopressors'],
      deteriorationRateDelta: 1.5,
    },

    'hyperchloraemic-acidosis': {
      id: 'hyperchloraemic-acidosis',
      title: '⚠️ Hyperchloraemic Metabolic Acidosis',
      narrative: '1500 mL of 0.9% normal saline has generated a significant chloride load, worsening the metabolic acidosis. Repeat VBG now shows pH 7.21 and Cl⁻ 116 mEq/L. The acidosis is now partly iatrogenic.',
      severity: 'warning',
      hiddenVitalsDelta: { bicarb: -4 },
      setsFlags: ['hyperchloraemiaActive'],
      addsActiveProblems: ['metabolic-acidosis'],
      scoreImpact: { guideline: -8, safety: -5 },
    },

    'severe-lactic-acidosis': {
      id: 'severe-lactic-acidosis',
      title: '🔴 Severe Lactic Acidosis',
      narrative: 'Lactate has risen to critical levels — severe tissue hypoperfusion. Multi-organ failure is imminent without immediate intervention.',
      severity: 'critical',
      vitalsDelta: { gcs: -1, rr: 4 },
      setsFlags: ['severeLactateReached'],
      addsActiveProblems: ['aki'],
      deteriorationRateDelta: 2,
    },

    'pre-arrest': {
      id: 'pre-arrest',
      title: '🔴 Peri-Arrest',
      narrative: 'Ruth is peri-arrest. Blood pressure unrecordable. GCS 7. Airway at risk.',
      severity: 'fatal',
      vitalsDelta: { sbp: -15, dbp: -8, gcs: -3, spo2: -5 },
      setsFlags: ['periArrest'],
      forcesEndingId: 'death-cardiac-arrest',
    },

    'icu-transfer-outcome': {
      id: 'icu-transfer-outcome',
      title: 'ICU Admission',
      narrative: 'Ruth is admitted to the medical ICU. The intensivist takes over. Outcome depends on what has already been done.',
      severity: 'warning',
      setsFlags: ['icuTransferred'],
    },

    'ward-admission-outcome': {
      id: 'ward-admission-outcome',
      title: 'Ward Admission',
      narrative: 'Ruth is transferred to the medical ward on the sepsis pathway with hourly observations.',
      severity: 'info',
    },
  },

  initialPatientState: {
    vitals: INITIAL_VITALS,
    status: 'guarded',
    activeProblems: [
      { id: 'confusion', label: 'Acute confusion', discoveredAtMin: 0, source: 'presentation' },
      { id: 'fever', label: 'Fever (38.9°C)', discoveredAtMin: 0, source: 'presentation' },
      { id: 'hypotension', label: 'Hypotension (BP 88/52)', discoveredAtMin: 0, source: 'presentation' },
    ],
    knownHistory: [],
    revealedMedications: [],
    revealedAllergies: [],
    internalDiagnosis: 'Septic shock — catheter-associated UTI + bacteraemic pneumonia (immunosuppressed)',
    hiddenVitals: {
      lactate:      5.8,
      creatinine:   203,
      wbc:          22.4,
      potassium:    3.6,
      bicarb:       16,
      chlorideLoad: 0,
    },
    deteriorationCurve: {
      baseRate: 5,
      vitalsDriftPerMin: {
        // Calibrated so good play (fluids + abx within 30 min) avoids shock.
        // Without ANY treatment: shock fires ~25 min in. With early fluids: ~50 min.
        sbp:    -0.70,
        dbp:    -0.32,
        hr:      0.18,
        rr:      0.06,
        spo2:   -0.04,
        gcs:    -0.025,
        uoMlHr: -0.4,
      },
      hiddenDriftPerMin: {
        lactate:    0.07,
        creatinine: 0.6,
      },
      thresholds: [
        {
          // Lowered from 80 → 70 so reasonable early resuscitation avoids shock
          id: 'shock-threshold',
          condition: { vitalBelow: { key: 'sbp', value: 70 } },
          triggersCascadeId: 'septic-shock',
          onlyOnce: true,
        },
        {
          id: 'severe-lactate',
          condition: { hiddenAbove: { key: 'lactate', value: 9.0 } },
          triggersCascadeId: 'severe-lactic-acidosis',
          onlyOnce: true,
        },
        {
          id: 'anaphylaxis-threshold',
          condition: {
            and: [
              { flagSet: 'pipTazoGiven' },
              { flagNotSet: 'allergiesChecked' },
            ],
          },
          triggersCascadeId: 'anaphylaxis',
          onlyOnce: true,
        },
        {
          // Extended from 45 → 65 min so players have time to act after shock fires
          id: 'pre-arrest-threshold',
          condition: {
            and: [
              { vitalBelow: { key: 'sbp', value: 60 } },
              { simTimeAbove: 65 },
            ],
          },
          triggersCascadeId: 'pre-arrest',
          onlyOnce: true,
        },
      ],
      treatmentResponses: [
        // Early fluids — first bag gives meaningful but partial relief
        {
          requiresFlag: 'fluidsStarted',
          vitalsDriftModifier: { sbp: 0.28, hr: -0.1, uoMlHr: 0.2 },
          hiddenDriftModifier: {},
          baseRateModifier: -0.8,
        },
        // Antibiotics — begins reversing infection source
        {
          requiresFlag: 'antibioticsStarted',
          vitalsDriftModifier: { sbp: 0.35, hr: -0.18 },
          hiddenDriftModifier: { lactate: -0.05 },
          baseRateModifier: -1.5,
        },
        // Meropenem bonus — broader cover = stronger response
        {
          requiresFlag: 'meropenemGiven',
          vitalsDriftModifier: { sbp: 0.18 },
          hiddenDriftModifier: { lactate: -0.04 },
          baseRateModifier: -0.5,
        },
        // Full resuscitation — all 3 bags completed
        {
          requiresFlag: 'adequateFluids',
          vitalsDriftModifier: { sbp: 0.62, hr: -0.28, uoMlHr: 1.4 },
          baseRateModifier: -1.0,
        },
        // Vasopressors — rapid MAP support
        {
          requiresFlag: 'vasopressorsStarted',
          vitalsDriftModifier: { sbp: 1.8, hr: -0.3 },
          baseRateModifier: -1.5,
        },
        // Oxygen — modest respiratory support
        {
          requiresFlag: 'oxygenStarted',
          vitalsDriftModifier: { spo2: 0.06, rr: -0.04 },
          baseRateModifier: -0.2,
        },
      ],
    },
    activeDriftModifiers: { vitals: {}, hidden: {}, baseRateDelta: 0 },
    firedThresholdIds: [],
    simTimeMinutes: 0,
    pendingOrders: [],
    completedOrders: [],
    completedActionIds: [],
    flags: {},
    metrics: {},
    pendingCascadeIds: [],
    unlockedActionIds: [],
    firedNursingIds: [],
    resolvedProblems: [],
  },

  nursingMessages: [

    // ── Time-based — fires regardless of treatment progress ───────────────────

    {
      id: 'nm-t5-uo',
      text: "Urine output still minimal — bag hasn't changed since I started monitoring.",
      source: 'nurse',
      triggerAtMin: 5,
      onlyOnce: true,
    },
    {
      id: 'nm-t10-cold',
      text: "Her hands are going cold. Capillary refill is up to about 4 seconds.",
      source: 'nurse',
      triggerAtMin: 10,
      flagNotSet: 'fluidsStarted',
      onlyOnce: true,
    },
    {
      id: 'nm-t15-confused',
      text: "She's more confused than when she came in — can't tell me today's date. Tried to pull at her cannula.",
      source: 'nurse',
      triggerAtMin: 15,
      flagNotSet: 'antibioticsStarted',
      onlyOnce: true,
    },
    {
      id: 'nm-t20-bp',
      text: "BP just came back 74 systolic. Getting a bit worried — should we be escalating?",
      source: 'nurse',
      triggerAtMin: 20,
      flagNotSet: 'vasopressorsStarted',
      onlyOnce: true,
    },
    {
      id: 'nm-t30-mottling',
      text: "She's starting to look mottled on her legs. Knees going dusky. This doesn't look right.",
      source: 'nurse',
      triggerAtMin: 30,
      flagNotSet: 'vasopressorsStarted',
      onlyOnce: true,
    },

    // ── Treatment-triggered — positive updates ────────────────────────────────

    {
      id: 'nm-oxygen-on',
      text: "Non-rebreather on. Sats picking up — she seems more settled with it.",
      source: 'nurse',
      requiresFlag: 'oxygenStarted',
      onlyOnce: true,
    },
    {
      id: 'nm-fluids-running',
      text: "First Hartmann's bag running. I've got another 500 mL drawn up and ready.",
      source: 'nurse',
      requiresFlag: 'fluidsStarted',
      flagNotSet: 'hartmanns2Given',
      onlyOnce: true,
    },
    {
      id: 'nm-abx-in',
      text: "Antibiotics are in and running. I'll watch her closely — do you want obs every 15?",
      source: 'nurse',
      requiresFlag: 'antibioticsStarted',
      onlyOnce: true,
    },
    {
      id: 'nm-cultures-note',
      text: "Blood cultures sent to lab — two sets, labelled and timed before antibiotics went up.",
      source: 'nurse',
      requiresFlag: 'culturesDrawn',
      onlyOnce: true,
    },
    {
      id: 'nm-vasopressors-map',
      text: "Norad's in — MAP was 44, coming up to 58. Still below 65 but heading the right way.",
      source: 'nurse',
      requiresFlag: 'vasopressorsStarted',
      onlyOnce: true,
    },
    {
      id: 'nm-uo-improving',
      text: "Urine output improving — got about 30 mL in the last 30 minutes. Small wins.",
      source: 'nurse',
      requiresFlag: 'adequateFluids',
      triggerAtMin: 35,
      onlyOnce: true,
    },

    // ── Consultant messages ───────────────────────────────────────────────────

    {
      id: 'cons-icu-otw',
      text: "ICU Reg (Dr. Nakamura): 'On my way down. Keep her MAP above 65 if you can — I'll be there in five.' → ICU referral accepted.",
      source: 'consultant',
      requiresFlag: 'icuCalled',
      onlyOnce: true,
    },
    {
      id: 'cons-radiology-cxr',
      text: "Radiology: Right lower lobe opacity confirmed — consolidation most likely. Recommend antibiotic coverage for atypical organisms given the immunosuppression.",
      source: 'consultant',
      requiresFlag: 'cxrDone',
      onlyOnce: true,
    },
    {
      id: 'cons-microbiology-narrow',
      text: "ID (Dr. Osei): 'Noting antibiotics started — just flagging: given she's on methotrexate and there's a CXR opacity, ceftriaxone alone may be insufficient. Happy to discuss broader coverage.'",
      source: 'consultant',
      requiresFlag: 'narrowCoverageGiven',
      flagNotSet: 'broadCoverageGiven',
      onlyOnce: true,
    },
    {
      id: 'cons-blood-cultures-back',
      text: "Microbiology: Preliminary culture flag — gram-negative rods on Gram stain (Set 1). Sensitivities pending 48h. Cover gram-negatives empirically.",
      source: 'consultant',
      requiresFlag: 'antibioticsStarted',
      triggerAtMin: 25,
      onlyOnce: true,
    },

    // ── Patient voices ────────────────────────────────────────────────────────

    {
      id: 'patient-cold',
      text: 'Ruth (quietly): "I feel so cold… my head won\'t stop spinning."',
      source: 'patient',
      triggerAtMin: 3,
      flagNotSet: 'fluidsStarted',
      vitalAbove: { key: 'gcs', value: 11 },
      onlyOnce: true,
    },
    {
      id: 'patient-oxygen-better',
      text: 'Ruth: "That\'s… a little better. I can breathe a bit easier."',
      source: 'patient',
      requiresFlag: 'oxygenStarted',
      vitalAbove: { key: 'gcs', value: 12 },
      onlyOnce: true,
    },
    {
      id: 'patient-asks-medicine',
      text: 'Ruth (eyes fluttering open): "Is that medicine? Will it… help me?"',
      source: 'patient',
      requiresFlag: 'antibioticsStarted',
      vitalAbove: { key: 'gcs', value: 12 },
      onlyOnce: true,
    },
    {
      id: 'patient-improving',
      text: 'Ruth: "I think… the room has stopped moving. I feel a little less dizzy."',
      source: 'patient',
      requiresFlag: 'adequateFluids',
      triggerAtMin: 30,
      vitalAbove: { key: 'gcs', value: 13 },
      onlyOnce: true,
    },

    // ── Family voices ─────────────────────────────────────────────────────────

    {
      id: 'family-early',
      text: "Daughter (from doorway): \"She kept saying she felt cold since yesterday. We thought it was the surgery — is it serious?\"",
      source: 'family',
      triggerAtMin: 8,
      onlyOnce: true,
    },
    {
      id: 'family-shock',
      text: "Daughter (tearful): \"She's getting worse, isn't she. Please — what's happening to her?\"",
      source: 'family',
      requiresFlag: 'shockThresholdReached',
      onlyOnce: true,
    },
    {
      id: 'family-improving',
      text: "Daughter (relieved): \"She recognized me when I came in just now. I think she's looking a bit better?\"",
      source: 'family',
      requiresFlag: 'antibioticsStarted',
      flagNotSet: 'shockThresholdReached',
      triggerAtMin: 25,
      onlyOnce: true,
    },
    {
      id: 'family-icu',
      text: "Daughter: \"The ICU? Oh God. Will she make it? Can I come with her?\"",
      source: 'family',
      requiresFlag: 'icuCalled',
      onlyOnce: true,
    },

    // ── Progress notes ────────────────────────────────────────────────────────

    {
      id: 'note-admission',
      text: "ADMISSION NOTE — 65F brought by family, 3-day history of deteriorating illness post hip arthroplasty. Presenting: acute confusion, fever 38.9°C, hypotension BP 88/52. On methotrexate for RA. Initial impression: systemic infection, source unknown. Resuscitation commenced.",
      source: 'note',
      triggerAtMin: 0,
      onlyOnce: true,
    },
    {
      id: 'note-abx-commenced',
      text: "PROGRESS NOTE — Antibiotics commenced. Fluid resuscitation ongoing. Clinical picture consistent with severe sepsis — source under investigation. Monitoring for response over next 30 minutes.",
      source: 'note',
      requiresFlag: 'antibioticsStarted',
      onlyOnce: true,
    },
    {
      id: 'note-shock',
      text: "URGENT NOTE — Septic shock declared. BP below perfusion threshold. ICU team contacted. Vasopressor threshold reached. Escalating to critical care pathway.",
      source: 'note',
      requiresFlag: 'shockThresholdReached',
      onlyOnce: true,
    },
    {
      id: 'note-response',
      text: "PROGRESS NOTE — Adequate fluid resuscitation achieved. Urine output improving. Haemodynamic response being monitored. Antibiotic therapy appropriate for clinical context.",
      source: 'note',
      requiresFlag: 'adequateFluids',
      triggerAtMin: 32,
      onlyOnce: true,
    },
  ],

  endings: [
    {
      id: 'death-cardiac-arrest',
      title: 'Cardiac Arrest',
      severity: 'death',
      priority: 100,
      narrative:
        'Ruth arrests in the Emergency Department. CPR is commenced. After 25 minutes of resuscitation, ROSC cannot be achieved. Time of death noted.',
      condition: { flagSet: 'periArrest' },
      debrief: {
        keyMoment: 'The outcome was determined by a cascade of delays — without antibiotics within the critical window, septic shock was inevitable, and without vasopressors, cardiac arrest followed.',
        whatWentWell: [],
        whatWasMissed: [
          'Antibiotics were not administered within 1 hour of presentation',
          'The shock cascade was not intercepted with vasopressors',
          'Early ICU review was not requested',
        ],
        optimalPath:
          'Within 15 minutes: IV access, oxygen, blood cultures, VBG. ' +
          'Within 30 minutes: broad-spectrum antibiotics (meropenem in an immunosuppressed penicillin-allergic patient), Hartmann\'s 30 mL/kg. ' +
          'Call ICU early — don\'t wait for shock to declare itself.',
        clinicalPearl:
          'Every hour of delay in antibiotic administration increases sepsis mortality by approximately 7%. ' +
          'The Surviving Sepsis Campaign Bundle targets antibiotics within 1 hour of sepsis recognition.',
        evidenceRef: 'Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2021',
      },
    },

    {
      id: 'death-anaphylaxis',
      title: 'Anaphylaxis — Penicillin',
      severity: 'death',
      priority: 95,
      narrative:
        'Ruth develops anaphylaxis to piperacillin-tazobactam. Her penicillin allergy was documented in her chart. Without immediate adrenaline, cardiovascular collapse is fatal.',
      condition: {
        and: [
          { flagSet: 'anaphylaxisActive' },
          { flagNotSet: 'anaphylaxisTreated' },
          { simTimeAbove: 8 },
        ],
      },
      debrief: {
        keyMoment: 'Piperacillin-tazobactam was administered without checking the patient\'s allergy status. Ruth\'s penicillin allergy was documented in her chart and on her wristband.',
        whatWentWell: [],
        whatWasMissed: [
          'Allergy status was not checked before prescribing antibiotics',
          'Penicillin allergy documented in chart and wristband',
          'Meropenem or azithromycin would have been appropriate alternatives',
        ],
        optimalPath: 'Check allergies as part of the initial assessment. Takes 2 minutes. In a penicillin-allergic patient with sepsis, meropenem is appropriate and safe — there is no clinically significant cross-reactivity between penicillins and carbapenems.',
        clinicalPearl: 'Antibiotic allergy reconciliation is a mandatory step before prescribing. In penicillin allergy with sepsis: meropenem (carbapenem) or gentamicin are safe alternatives. Cephalosporins have <2% cross-reactivity and are generally safe in documented penicillin rash.',
      },
    },

    {
      id: 'icu-ventilated',
      title: 'ICU — Intubated',
      severity: 'critical',
      priority: 70,
      narrative:
        'Ruth is transferred to the ICU in refractory shock with a falling GCS. She is intubated for airway protection. ' +
        'After 72 hours on vasopressors and broad-spectrum antibiotics, her condition stabilises. ' +
        'She is extubated on day 4 and discharged to the ward on day 8. ' +
        'She leaves hospital with stage 2 CKD and moderate functional decline.',
      condition: {
        and: [
          { flagSet: 'shockThresholdReached' },
          { flagNotSet: 'vasopressorsStarted' },
          { simTimeAbove: 50 },
        ],
      },
      debrief: {
        keyMoment: 'Shock was established before vasopressors were commenced. The window to prevent intubation was approximately 20 minutes from the time BP fell below 80 systolic.',
        whatWentWell: ['Antibiotics were eventually started', 'ICU was eventually contacted'],
        whatWasMissed: [
          'Vasopressors were not started promptly after shock was established',
          'Fluid resuscitation was delayed',
          'ICU was not called early enough',
        ],
        optimalPath: 'In septic shock, vasopressors should be started alongside fluid resuscitation if MAP remains <65 mmHg after initial fluids. Do not wait for 30 mL/kg to run through before starting noradrenaline if the patient remains hypotensive.',
        clinicalPearl: 'Noradrenaline is the first-line vasopressor in septic shock. Start at 0.01–0.1 mcg/kg/min and titrate to MAP ≥65 mmHg. Early use is not harmful and may reduce fluid requirements.',
        evidenceRef: 'Surviving Sepsis Campaign 2021; VASST Trial',
      },
    },

    {
      id: 'icu-survivor',
      title: 'ICU Survivor',
      severity: 'poor',
      priority: 60,
      narrative:
        'Ruth required ICU admission and vasopressor support, but was managed appropriately once shock was recognised. ' +
        'She was stepped down to the ward on day 4 and discharged on day 9 with new CKD and an outpatient nephrology referral.',
      condition: {
        and: [
          { flagSet: 'shockThresholdReached' },
          { flagSet: 'vasopressorsStarted' },
          { flagSet: 'antibioticsStarted' },
        ],
      },
      debrief: {
        keyMoment: 'Shock was established, but vasopressors and antibiotics were commenced appropriately. The ICU course was preventable — earlier intervention would have kept Ruth off vasopressors entirely.',
        whatWentWell: ['Vasopressors commenced after shock established', 'Antibiotics started', 'ICU involvement appropriate'],
        whatWasMissed: [
          'Earlier antibiotic administration would have prevented shock',
          'Earlier fluid resuscitation may have maintained perfusion pressure',
        ],
        optimalPath: 'Antibiotics within 1 hour and 30 mL/kg of balanced crystalloid should be the default response to suspected sepsis with hypotension. This patient should not have reached the shock threshold.',
        clinicalPearl: 'The sepsis hour-1 bundle: (1) Measure lactate, (2) Blood cultures before antibiotics, (3) Broad-spectrum antibiotics, (4) 30 mL/kg crystalloid for hypotension or lactate ≥4, (5) Vasopressors if MAP <65 despite fluids.',
        evidenceRef: 'Surviving Sepsis Campaign Hour-1 Bundle 2021',
      },
    },

    {
      id: 'partial-recovery',
      title: 'Partial Recovery',
      severity: 'acceptable',
      priority: 40,
      narrative:
        'Ruth improves on antibiotics and fluids, but her coverage was insufficient for her immunosuppressed state. ' +
        'She remains febrile at 48 hours. Further workup reveals inadequate source control. ' +
        'She is eventually discharged on day 12 after antibiotic rationalisation.',
      condition: {
        and: [
          { flagSet: 'antibioticsStarted' },
          { flagSet: 'narrowCoverageGiven' },
          { flagNotSet: 'shockThresholdReached' },
          { simTimeAbove: 30 },
        ],
      },
      debrief: {
        keyMoment: 'Antibiotics were started, but ceftriaxone alone does not provide adequate coverage for an immunosuppressed patient with possible pneumonia and catheter-associated UTI.',
        whatWentWell: ['Antibiotics commenced', 'Fluid resuscitation initiated', 'Shock prevented'],
        whatWasMissed: [
          'Immunosuppression status not identified or not acted upon',
          'Pneumonia on CXR not factored into antibiotic choice',
          'Broader coverage appropriate given methotrexate use',
        ],
        optimalPath: 'In an immunosuppressed patient with sepsis of unknown source and possible pneumonia, empirical therapy should cover both gram-negative (UTI) and atypical/respiratory pathogens. Meropenem ± azithromycin is appropriate pending cultures.',
        clinicalPearl: 'Methotrexate at therapeutic doses causes clinically significant immunosuppression. This warrants broader empirical antibiotic coverage, earlier ICU review thresholds, and lower tolerance for clinical uncertainty.',
      },
    },

    {
      id: 'full-recovery',
      title: 'Full Recovery',
      severity: 'excellent',
      priority: 10,
      narrative:
        'Ruth responds well. Blood pressure normalises within 45 minutes of antibiotics and fluids. ' +
        'She is admitted to the medical ward on the sepsis pathway, treated for catheter-associated UTI with bacteraemic pneumonia, ' +
        'and discharged on day 5 with no new organ dysfunction.',
      condition: {
        and: [
          { flagSet: 'antibioticsStarted' },
          { flagSet: 'adequateFluids' },
          { flagNotSet: 'shockThresholdReached' },
          { flagNotSet: 'narrowCoverageGiven' },
          { metricBelow: { key: 'timeToAntibiotics', value: 80 } },
        ],
      },
      debrief: {
        keyMoment: 'Antibiotics within the critical window, appropriate fluid resuscitation, and correct antibiotic breadth for an immunosuppressed host — the three decisions that defined this outcome.',
        whatWentWell: [
          'Antibiotics commenced within 1 hour of presentation',
          'Appropriate antibiotic choice for immunosuppressed patient',
          'Adequate fluid resuscitation with balanced crystalloid',
          'Blood cultures drawn before antibiotics',
        ],
        whatWasMissed: [],
        optimalPath: 'This was the optimal path. Consider: was the allergy checked first? Were cultures drawn before antibiotics? Was lactate ordered to confirm severity?',
        clinicalPearl: 'In sepsis, the first-hour bundle saves lives. Allergy check → blood cultures → broad-spectrum antibiotics → 30 mL/kg balanced crystalloid. In an immunosuppressed patient: meropenem over cephalosporins, and a low threshold for ICU review.',
        evidenceRef: 'Surviving Sepsis Campaign 2021; Kumar et al., Critical Care Medicine 2006',
      },
    },
  ],
};
