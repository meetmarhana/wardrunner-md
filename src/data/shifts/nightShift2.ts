import type { ShiftScenario, ShiftAction } from '../../types/shift';

type Opts = {
  det?: number;
  status?: ShiftAction['effect']['statusChange'];
  triage?: number; safety?: number; guideline?: number; time?: number;
  msg: string;
  sev?: ShiftAction['effect']['eventSeverity'];
  feedback: string;
  correct?: boolean;
  dangerous?: boolean;
  completes?: boolean;
  requires?: string[];
};

function act(
  id: string,
  label: string,
  category: ShiftAction['category'],
  icon: string,
  timeCost: number,
  opts: Opts,
): ShiftAction {
  return {
    id, label, category, icon, timeCost,
    oneTimeUse: true,
    requiresActionIds: opts.requires,
    effect: {
      statusChange: opts.status,
      deteriorationTimerDelta: opts.det ?? 0,
      scoreImpact: {
        triage:    opts.triage    ?? 0,
        safety:    opts.safety    ?? 0,
        guideline: opts.guideline ?? 0,
        time:      opts.time      ?? 0,
      },
      eventMessage: opts.msg,
      eventSeverity: opts.sev ?? (opts.dangerous ? 'danger' : opts.correct ? 'success' : 'info'),
      feedback: opts.feedback,
      isCorrect: opts.correct ?? false,
      isDangerous: opts.dangerous ?? false,
      completesPatient: opts.completes ?? false,
    },
  };
}

export const NIGHT_SHIFT_2_PEARLS: Record<string, {
  diagnosis: string;
  pearl: string;
  keyActions: string[];
  dangerActions: string[];
  priorityReason: string;
}> = {
  'ns2-p1': {
    diagnosis: 'Hyperkalaemia with ECG Changes',
    pearl: 'The sequence matters: Calcium gluconate FIRST (membrane stabilisation within 2 min), then shift K⁺ intracellularly (insulin/dextrose, salbutamol, bicarbonate), then remove it (dialysis, kayexalate). Calcium buys you time — without it, any manoeuvre that briefly raises K⁺ can trigger VF.',
    keyActions: ['Assess ABCs', '12-Lead ECG', 'Calcium Gluconate IV', 'Insulin + Dextrose IV', 'Salbutamol Nebuliser', 'Sodium Bicarbonate', 'Renal Consult', 'Arrange Dialysis'],
    dangerActions: ['KCl supplement — LETHAL with K⁺ 7.2', 'Fast IV saline — not therapeutic, delays treatment'],
    priorityReason: 'Most urgent: peaked T-waves + wide QRS = imminent VF. Acts in 15 min without treatment.',
  },
  'ns2-p2': {
    diagnosis: 'Post-operative Septic Shock',
    pearl: 'Post-surgical sepsis hits fast. The Surviving Sepsis Campaign bundle: blood cultures before antibiotics (but don\'t delay antibiotics > 45 min for cultures), 30 ml/kg crystalloid, vasopressors if MAP <65 despite fluids, lactate remeasurement at 2 hours. Norepinephrine is first-line vasopressor.',
    keyActions: ['Assess ABCs', 'Blood Cultures ×2', 'IV Fluids 30ml/kg', 'Broad-Spectrum Antibiotics', 'Norepinephrine Infusion', 'Urinary Catheter', 'Continue ICU Monitoring'],
    dangerActions: ['Discontinuing antibiotics without reason', 'Withholding vasopressors when fluid-refractory'],
    priorityReason: 'Deteriorates in 20 min. Post-op septic shock has high mortality without early vasopressors.',
  },
  'ns2-p3': {
    diagnosis: 'ARDS — Acute Respiratory Distress Syndrome',
    pearl: 'ARDS lung-protective ventilation: tidal volume 6 ml/kg IBW, plateau pressure <30 cmH₂O, PEEP titrated for oxygenation. High tidal volumes cause volutrauma and worsen ARDS mortality. Prone positioning for 16+ hours/day improves survival in moderate-severe ARDS (PF ratio <150).',
    keyActions: ['Assess ABCs', 'Review Ventilator Settings', 'Increase FiO₂', 'Optimize PEEP', 'Lung-Protective Ventilation (6 ml/kg IBW)', 'Call ICU Consultant', 'Prone Positioning'],
    dangerActions: ['Increasing tidal volume — volutrauma', 'Disconnecting ventilator — immediate desaturation'],
    priorityReason: 'Deteriorates in 28 min. Severe hypoxaemia (SpO₂ 82%) requires immediate ventilator optimisation.',
  },
  'ns2-p4': {
    diagnosis: 'Upper GI Haemorrhage — Peptic Ulcer Bleed',
    pearl: 'The Glasgow-Blatchford score predicts need for intervention. Resuscitate first: 2 large-bore IVs, crossmatch, pRBC if Hb <70 or haemodynamically unstable. High-dose PPI reduces re-bleed risk. Urgent endoscopy within 24h (or sooner if actively bleeding/shocked). Don\'t give NSAIDs or anticoagulants — they worsen haemorrhage.',
    keyActions: ['Assess ABCs', '2× Large Bore IV Access', 'Crossmatch + Group & Screen', 'IV Fluid Bolus', 'pRBC Transfusion', 'IV PPI Infusion', 'GI / Endoscopy Referral', 'Urgent Endoscopy'],
    dangerActions: ['NSAIDs — worsen mucosal bleeding', 'Anticoagulants — contraindicated in active GI haemorrhage'],
    priorityReason: 'Deteriorates in 35 min. Hb dropping from 7.2 → 5.8. Haemorrhagic shock if not transfused.',
  },
};

export const NIGHT_SHIFT_2: ShiftScenario = {
  id: 'night-shift-2',
  name: 'ICU Cross-Cover — Crashing Patients',
  description: 'You are the overnight cross-covering registrar. Four ICU patients are deteriorating. Stabilise them before they arrest.',
  setting: 'Medical/Surgical ICU',
  difficulty: 'intermediate',
  teachingFocus: 'Electrolyte emergencies, vasopressors, ARDS ventilation, GI haemorrhage resuscitation',
  estimatedMinutes: 25,
  optimalPatientOrder: ['ns2-p1', 'ns2-p2', 'ns2-p3', 'ns2-p4'],

  patients: [
    // ─── BED 1: HYPERKALAEMIA ────────────────────────────────────────────────
    {
      id: 'ns2-p1',
      name: 'Margaret Liu',
      age: 65,
      sex: 'F',
      chiefComplaint: 'Weakness, palpitations. Evening labs: K⁺ 7.2 mEq/L. Telemetry showing peaked T-waves.',
      shortSummary: 'K⁺ 7.2, peaked T-waves on telemetry',
      acuity: 1,
      bedNumber: 1,
      status: 'critical',
      vitals: { bp: '145/88', hr: 52, rr: 18, spo2: 97, temp: 36.5 },
      redFlags: ['K⁺ 7.2 mEq/L', 'Peaked T-waves + wide QRS', 'Bradycardia 52 bpm', 'CKD stage 4'],
      nextDeteriorationAt: 15,
      deteriorationInterval: 15,
      deteriorationSteps: [
        {
          statusChange: 'critical',
          vitalsChange: { hr: 38, bp: '95/60' },
          eventMessage: '🚨 Margaret: Wide-complex bradycardia. VF imminent without calcium gluconate.',
          isLethal: false,
        },
        {
          statusChange: 'dead',
          vitalsChange: { hr: 0 },
          eventMessage: '💀 Margaret has arrested — hyperkalaemia-induced ventricular fibrillation.',
          isLethal: true,
        },
      ],
      availableActions: [
        act('assess-abc',           'Assess ABCs',             'assessment',   '🫁', 5,  { det: 8,   triage: 15, guideline: 5,  msg: 'ABCs assessed. Bradycardic at 52, BP 145/88. Patient anxious and weak.', feedback: 'Correct first step. Bradycardia in the context of high K⁺ is a pre-arrest warning.', correct: true }),
        act('order-ecg',            '12-Lead ECG',             'investigation','📈', 8,  { det: 10,  triage: 10, guideline: 15, msg: 'ECG: peaked T-waves in precordial leads, wide QRS 140ms, borderline PR prolongation. Classic hyperkalaemia.', feedback: 'ECG is essential — peaked T-waves → wide QRS → sine wave → VF is the progression. You must act now.', correct: true }),
        act('calcium-gluconate',    'Calcium Gluconate IV',    'treatment',    '💉', 8,  { det: 20,  guideline: 25, safety: 20, requires: ['order-ecg'], status: 'stable', msg: 'Calcium gluconate 10mL 10% IV over 5 min. Membrane stabilised. QRS narrowing on telemetry.', feedback: 'Correct and FIRST. Calcium gluconate stabilises the cardiac membrane within 2 minutes — it buys time for other agents to shift K⁺.', correct: true }),
        act('sodium-bicarb',        'Sodium Bicarbonate IV',   'treatment',    '🧪', 8,  { det: 10,  guideline: 15, msg: 'NaHCO₃ 50mL 8.4% IV given. Alkalinisation shifts K⁺ intracellularly.', feedback: 'Bicarbonate shifts K⁺ into cells via ion exchange. Most useful if concurrent acidosis — adjunct, not first-line.', correct: true }),
        act('insulin-dextrose',     'Insulin + Dextrose IV',   'treatment',    '💊', 10, { det: 20,  guideline: 25, requires: ['calcium-gluconate'], msg: '10 units IV insulin + 50mL 50% dextrose. K⁺ will shift intracellularly over 15–30 min.', feedback: 'Insulin drives K⁺ into cells (most effective pharmacological shift). Always give with dextrose to prevent hypoglycaemia.', correct: true }),
        act('salbutamol-neb',       'Salbutamol Nebuliser',    'treatment',    '💨', 8,  { det: 10,  guideline: 10, msg: 'Salbutamol 10mg nebulised. Beta-2 agonism shifts K⁺ intracellularly — K⁺ drops 0.5–1 mEq/L.', feedback: 'High-dose salbutamol nebuliser is an underused adjunct for hyperkalaemia. Can shift K⁺ by ~1 mEq/L.', correct: true }),
        act('renal-consult',        'Renal Consult',           'disposition',  '📞', 8,  { det: 15,  triage: 10, guideline: 10, requires: ['insulin-dextrose'], msg: 'Renal registrar called. Reviewing Margaret for emergency haemodialysis.', feedback: 'Definitive K⁺ removal requires dialysis. Pharmacological measures are temporising — renal consult is essential.', correct: true }),
        act('arrange-dialysis',     'Arrange Emergency HD',    'disposition',  '🏥', 10, { det: 999, triage: 20, guideline: 25, time: 20, status: 'icu', msg: '✅ Margaret transferred to dialysis unit. K⁺ being removed by haemodialysis. ECG normalising.', feedback: 'Haemodialysis is the only definitive treatment for removing potassium. Well done.', correct: true, completes: true, requires: ['renal-consult'] }),
        act('give-potassium',       'KCl Supplement',          'treatment',    '⚠️', 5,  { safety: -60, guideline: -40, det: -30, status: 'critical', msg: '🚨 CRITICAL: KCl given to a patient with K⁺ 7.2. Arrhythmia triggered. Telemetry alarming.', sev: 'danger', feedback: 'This is immediately life-threatening. Never give potassium supplements to a hyperkalaemic patient. K⁺ 7.2 is already cardiac-arrest territory.', dangerous: true }),
        act('fast-iv-saline',       'Fast IV Normal Saline',   'treatment',    '💧', 8,  { safety: -10, guideline: -10, msg: 'Normal saline running. This does not meaningfully lower K⁺ and delays effective treatment.', sev: 'warning', feedback: 'IV fluids alone do not treat hyperkalaemia effectively. They dilute slightly but waste critical time. Use calcium gluconate first.', dangerous: true }),
      ],
      completedActionIds: [],
      outcome: 'pending',
      deteriorationStepIndex: 0,
      score: { triage: 50, safety: 100, guideline: 50, time: 100 },
      eventLog: [],
    },

    // ─── BED 2: SEPTIC SHOCK (POST-OP) ──────────────────────────────────────
    {
      id: 'ns2-p2',
      name: 'James Okafor',
      age: 72,
      sex: 'M',
      chiefComplaint: 'Post-op day 1 femoral bypass. Now febrile, hypotensive, oliguric. Urine output 10 mL/hr.',
      shortSummary: 'Post-op sepsis, hypotension, oliguria',
      acuity: 1,
      bedNumber: 2,
      status: 'deteriorating',
      vitals: { bp: '80/45', hr: 128, rr: 26, spo2: 93, temp: 38.9 },
      redFlags: ['MAP <55 mmHg', 'Oliguria 10 mL/hr', 'Post-surgical infection risk', 'SpO₂ 93%'],
      nextDeteriorationAt: 20,
      deteriorationInterval: 15,
      deteriorationSteps: [
        {
          statusChange: 'critical',
          vitalsChange: { bp: '65/35', hr: 145, spo2: 88 },
          eventMessage: '🚨 James: BP 65/35. Refractory septic shock. Multi-organ failure starting.',
          isLethal: false,
        },
        {
          statusChange: 'dead',
          vitalsChange: { hr: 0 },
          eventMessage: '💀 James has died from septic shock and multi-organ failure. Vasopressors were not started in time.',
          isLethal: true,
        },
      ],
      availableActions: [
        act('assess-abc',        'Assess ABCs',              'assessment',   '🫁', 5,  { det: 8,   triage: 15, guideline: 5,  msg: 'ABCs assessed. GCS 14, BP 80/45, HR 128, oliguric. Clear signs of septic shock.', feedback: 'Correct. qSOFA ≥3: altered consciousness, high RR, hypotension. This is septic shock.', correct: true }),
        act('blood-cultures',    'Blood Cultures ×2',        'investigation','🧫', 8,  { det: 10,  triage: 5,  guideline: 15, msg: 'Blood cultures drawn from two sites before antibiotics. Sent to lab.', feedback: 'Cultures before antibiotics — but never delay antibiotics more than 45 minutes to obtain cultures.', correct: true }),
        act('iv-fluids',         'IV Fluids 30 mL/kg',       'treatment',    '💧', 10, { det: 15,  guideline: 20, status: 'stable', msg: 'Crystalloid bolus running. BP responding: 93/58. MAP now 70.', feedback: 'First-line for septic shock. If MAP doesn\'t respond to fluids, vasopressors are next.', correct: true }),
        act('give-antibiotics',  'Broad-Spectrum Antibiotics','treatment',   '💊', 8,  { det: 20,  guideline: 25, msg: 'Piperacillin-tazobactam IV started. Targeting likely post-op gram-negative and anaerobic organisms.', feedback: 'Early antibiotics are the most survival-impacting intervention in sepsis. Every hour of delay = ~7% mortality increase.', correct: true }),
        act('norepinephrine',    'Norepinephrine Infusion',   'treatment',    '💉', 10, { det: 20,  guideline: 20, safety: 15, requires: ['iv-fluids'], msg: 'Norepinephrine 0.1 mcg/kg/min started. MAP now 68. Urine output improving.', feedback: 'Norepinephrine is first-line vasopressor for septic shock. Target MAP >65 mmHg.', correct: true }),
        act('urinary-catheter',  'Insert Urinary Catheter',  'treatment',    '🔬', 5,  { det: 10,  guideline: 10, msg: 'IDC inserted. Monitoring hourly urine output — currently 15 mL/hr. Fluid responsiveness being assessed.', feedback: 'Urine output monitoring is essential in shock — it reflects end-organ perfusion. Target >0.5 mL/kg/hr.', correct: true }),
        act('icu-monitor',       'Continue ICU Monitoring',  'disposition',  '🏥', 5,  { det: 999, triage: 20, guideline: 20, time: 15, status: 'icu', msg: '✅ James stabilised on norepinephrine + antibiotics. Urine output improving. ICU team reassessing.', feedback: 'Good management. Surviving Sepsis bundle: cultures → antibiotics → fluids → vasopressors → monitor.', correct: true, completes: true, requires: ['norepinephrine', 'give-antibiotics'] }),
        act('stop-antibiotics',  'Discontinue Antibiotics',  'treatment',    '❌', 5,  { safety: -40, guideline: -35, det: -20, status: 'critical', msg: '🚨 Antibiotics discontinued without clinical reason. Patient deteriorating rapidly.', sev: 'danger', feedback: 'Never stop antibiotics in an untreated septic patient without clear clinical reason. This is immediately harmful.', dangerous: true }),
      ],
      completedActionIds: [],
      outcome: 'pending',
      deteriorationStepIndex: 0,
      score: { triage: 50, safety: 100, guideline: 50, time: 100 },
      eventLog: [],
    },

    // ─── BED 3: ARDS ─────────────────────────────────────────────────────────
    {
      id: 'ns2-p3',
      name: 'Priya Sharma',
      age: 48,
      sex: 'F',
      chiefComplaint: 'SpO₂ dropped from 96% to 82% over 2 hours. ARDS protocol started 6 hours ago. Bilateral infiltrates on CXR.',
      shortSummary: 'ARDS — SpO₂ 82%, bilateral infiltrates',
      acuity: 1,
      bedNumber: 3,
      status: 'critical',
      vitals: { bp: '118/72', hr: 108, rr: 32, spo2: 82, temp: 37.8 },
      redFlags: ['SpO₂ 82% on ventilator', 'PF ratio <100 (severe ARDS)', 'Bilateral infiltrates', 'High respiratory rate'],
      nextDeteriorationAt: 28,
      deteriorationInterval: 20,
      deteriorationSteps: [
        {
          statusChange: 'critical',
          vitalsChange: { spo2: 68, hr: 130 },
          eventMessage: '🚨 Priya: SpO₂ 68%. Ventilator alarm sounding. Immediate intervention required.',
          isLethal: false,
        },
        {
          statusChange: 'dead',
          vitalsChange: { hr: 0 },
          eventMessage: '💀 Priya has died from refractory hypoxaemia. Inappropriate ventilator settings contributed.',
          isLethal: true,
        },
      ],
      availableActions: [
        act('assess-abc',        'Assess ABCs',               'assessment',   '🫁', 5,  { det: 8,   triage: 15, guideline: 5,  msg: 'ABCs assessed. Patient intubated, SpO₂ 82%, ventilator alarming. High peak pressures.', feedback: 'Correct first step. Always assess the patient AND the ventilator simultaneously in ARDS deterioration.', correct: true }),
        act('check-vent',        'Review Ventilator Settings','investigation','🖥️', 8,  { det: 10,  triage: 10, guideline: 15, msg: 'Settings reviewed: TV 10 mL/kg IBW (too high!), PEEP 5 cmH₂O (too low), FiO₂ 0.6. Classic suboptimal ARDS ventilation.', feedback: 'Tidal volume 10 ml/kg IBW causes volutrauma. ARDS target is 6 ml/kg IBW with plateau <30 cmH₂O.', correct: true }),
        act('increase-fio2',     'Increase FiO₂ to 100%',    'treatment',    '💨', 5,  { det: 5,   guideline: 10, msg: 'FiO₂ increased to 1.0. SpO₂ improving to 88%. Buying time for PEEP optimisation.', feedback: 'Immediate FiO₂ increase is correct for acute severe hypoxaemia. Then optimise PEEP and tidal volume.', correct: true }),
        act('peep-up',           'Increase PEEP',             'treatment',    '🔧', 8,  { det: 12,  guideline: 15, safety: 10, requires: ['check-vent'], msg: 'PEEP titrated from 5 to 12 cmH₂O using PEEP-FiO₂ ARDSnet table. SpO₂ improving to 91%.', feedback: 'PEEP recruits collapsed alveoli and improves oxygenation. Titrate to the ARDSnet table — higher PEEP for worse hypoxaemia.', correct: true }),
        act('lung-protective',   'Lung-Protective Ventilation','treatment',   '⚙️', 10, { det: 20,  guideline: 25, requires: ['peep-up'], msg: 'TV reduced to 6 mL/kg IBW. Plateau pressure checked: 26 cmH₂O. SpO₂ now 94%.', feedback: 'The ARMA trial: lung-protective ventilation (6 ml/kg, plateau <30) reduces ARDS mortality by 22% compared to conventional ventilation.', correct: true }),
        act('icu-consult',       'Call ICU Consultant',       'disposition',  '📞', 8,  { det: 15,  triage: 10, guideline: 10, requires: ['lung-protective'], msg: 'ICU consultant called. Reviewing Priya. Agrees with lung-protective strategy.', feedback: 'Severe ARDS needs senior review. Prone positioning decision, ECMO consideration.', correct: true }),
        act('prone-position',    'Prone Positioning',         'disposition',  '🛏️', 15, { det: 999, guideline: 25, triage: 20, time: 15, status: 'icu', msg: '✅ Priya placed in prone position. PF ratio improving. Prone ventilation protocol started.', feedback: 'PROSEVA trial: prone positioning ≥16 h/day reduces 28-day mortality in severe ARDS by 16%. Reserved for PF ratio <150.', correct: true, completes: true, requires: ['icu-consult'] }),
        act('increase-tv',       'Increase Tidal Volume',     'treatment',    '🔺', 5,  { safety: -40, guideline: -35, det: -20, status: 'critical', msg: '🚨 Tidal volume increased. Peak airway pressures spiking — volutrauma developing.', sev: 'danger', feedback: 'Increasing tidal volume causes volutrauma and directly worsens ARDS. The dead reckoning of fixing hypoxaemia by "giving more air" kills ARDS patients.', dangerous: true }),
        act('disconnect-vent',   'Disconnect Ventilator',     'treatment',    '❌', 5,  { safety: -60, guideline: -50, det: -40, status: 'critical', msg: '🚨 CRITICAL: Ventilator disconnected. SpO₂ plummeting. Immediate reconnection required.', sev: 'danger', feedback: 'Never disconnect a ventilated ARDS patient without a prepared team. Reconnect immediately and call for help.', dangerous: true }),
      ],
      completedActionIds: [],
      outcome: 'pending',
      deteriorationStepIndex: 0,
      score: { triage: 50, safety: 100, guideline: 50, time: 100 },
      eventLog: [],
    },

    // ─── BED 4: GI BLEED ─────────────────────────────────────────────────────
    {
      id: 'ns2-p4',
      name: 'Carlos Reyes',
      age: 55,
      sex: 'M',
      chiefComplaint: 'Coffee-ground vomiting. Haemoglobin dropped from 7.2 on admission to 5.8 on repeat bloods.',
      shortSummary: 'Active GI bleed, Hb 5.8, haemodynamically compromised',
      acuity: 2,
      bedNumber: 4,
      status: 'deteriorating',
      vitals: { bp: '85/52', hr: 138, rr: 24, spo2: 96, temp: 36.7 },
      redFlags: ['Hb 5.8 (falling)', 'Tachycardia 138 bpm', 'Hypotension', 'Active haematemesis'],
      nextDeteriorationAt: 35,
      deteriorationInterval: 25,
      deteriorationSteps: [
        {
          statusChange: 'critical',
          vitalsChange: { bp: '65/38', hr: 158, spo2: 92 },
          eventMessage: '⚠️ Carlos: Haemorrhagic shock. BP 65/38. Transfusion urgently needed.',
          isLethal: false,
        },
        {
          statusChange: 'dead',
          vitalsChange: { hr: 0 },
          eventMessage: '💀 Carlos has exsanguinated. Massive GI haemorrhage without transfusion.',
          isLethal: true,
        },
      ],
      availableActions: [
        act('assess-abc',        'Assess ABCs',              'assessment',   '🫁', 5,  { det: 10,  triage: 15, guideline: 5,  msg: 'ABCs assessed. Haemodynamically unstable. Active haematemesis visible. Two IV lines needed urgently.', feedback: 'Correct. In GI haemorrhage — airway first (risk of aspiration), then IV access and resuscitation.', correct: true }),
        act('large-bore-iv',     '2× Large Bore IV Access',  'treatment',    '💉', 8,  { det: 12,  guideline: 15, msg: '16G IVs in both antecubital fossae. Ready for rapid fluid/blood administration.', feedback: 'Large bore (16G+) IV access is essential — you cannot transfuse fast through a small cannula.', correct: true }),
        act('crossmatch',        'Crossmatch + Group & Screen','investigation','🔬', 8,  { det: 12,  triage: 5, guideline: 15, requires: ['large-bore-iv'], msg: 'Blood sent for crossmatch, FBC, coag, U&E. Blood bank alerted. 4 units crossmatched.', feedback: 'Crossmatch before transfusion is essential. In extremis, use O-negative uncrossmatched blood.', correct: true }),
        act('iv-fluids-bolus',   'IV Fluid Bolus',           'treatment',    '💧', 10, { det: 15,  guideline: 10, msg: '500 mL normal saline bolus. BP improved to 92/58. This is temporising — blood products are needed.', feedback: 'IV fluids buy time but are not a substitute for blood transfusion in haemorrhagic shock. Do not over-resuscitate with crystalloid.', correct: true }),
        act('blood-transfusion', 'pRBC Transfusion',         'treatment',    '🩸', 10, { det: 25,  guideline: 25, safety: 20, requires: ['crossmatch'], msg: '2 units packed red blood cells running. Hb target 70–80 g/L in GI bleed (avoid overtransfusion).', feedback: 'Transfusion threshold in GI bleed: Hb <70 in most, <80 if haemodynamically unstable or cardiovascular disease. The TRICC trial.', correct: true }),
        act('ppi-infusion',      'IV PPI Infusion',          'treatment',    '💊', 8,  { det: 10,  guideline: 15, msg: 'IV omeprazole 80mg bolus then 8 mg/hr infusion. Reduces re-bleeding risk from peptic ulcer.', feedback: 'High-dose PPI infusion reduces re-bleeding and mortality in peptic ulcer haemorrhage. Start before endoscopy.', correct: true }),
        act('gi-call',           'GI / Endoscopy Referral',  'disposition',  '📞', 8,  { det: 15,  triage: 10, guideline: 15, requires: ['blood-transfusion'], msg: 'GI registrar alerted. Urgent endoscopy being arranged. Patient needs to be resuscitated first.', feedback: 'Endoscopy is both diagnostic and therapeutic (clips, adrenaline injection). Best performed after initial resuscitation.', correct: true }),
        act('endoscopy',         'Urgent Endoscopy',         'disposition',  '🏥', 15, { det: 999, triage: 20, guideline: 25, time: 15, status: 'icu', msg: '✅ Carlos taken for urgent endoscopy. Active duodenal ulcer identified and clipped. Bleeding controlled.', feedback: 'Endoscopy within 24h (or sooner if actively shocked) is guideline standard. Haemostasis achieved in >90% of peptic ulcer bleeds.', correct: true, completes: true, requires: ['gi-call'] }),
        act('give-nsaids',       'NSAIDs',                   'treatment',    '⚠️', 5,  { safety: -30, guideline: -25, det: -15, msg: '⚠️ NSAIDs given — directly worsens gastric mucosal integrity and promotes bleeding.', sev: 'danger', feedback: 'NSAIDs inhibit prostaglandins that protect the gastric mucosa. They are contraindicated in active GI haemorrhage.', dangerous: true }),
        act('give-anticoagulants','Anticoagulants',           'treatment',    '💉', 5,  { safety: -40, guideline: -30, det: -20, status: 'critical', msg: '🚨 Anticoagulants given in active haemorrhage — bleeding rate accelerating.', sev: 'danger', feedback: 'Anticoagulants are absolutely contraindicated in active GI haemorrhage unless there is a life-threatening thrombotic event requiring urgent anticoagulation — a rare exception.', dangerous: true }),
      ],
      completedActionIds: [],
      outcome: 'pending',
      deteriorationStepIndex: 0,
      score: { triage: 50, safety: 100, guideline: 50, time: 100 },
      eventLog: [],
    },
  ],
};
