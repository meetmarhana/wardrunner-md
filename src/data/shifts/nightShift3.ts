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

export const NIGHT_SHIFT_3_PEARLS: Record<string, {
  diagnosis: string;
  pearl: string;
  keyActions: string[];
  dangerActions: string[];
  priorityReason: string;
}> = {
  'ns3-p1': {
    diagnosis: 'Severe Hypoglycaemia',
    pearl: 'If the patient cannot swallow safely, IV dextrose is the only option — never give anything by mouth to an unconscious patient. IV dextrose 50% (50 mL) acts within 2–5 minutes. Always recheck BSL 15 minutes later. Then find and treat the CAUSE — insulin dose error, renal impairment (reduced insulin clearance), missed meal, sepsis.',
    keyActions: ['Assess ABCs', 'Confirm BSL', 'IV Dextrose 50% 50mL', 'Recheck BSL at 15 min', 'Review Insulin Chart', 'Call Senior', 'Hourly BSL Monitoring'],
    dangerActions: ['Insulin administration — LETHAL in hypoglycaemia', 'Oral glucose in unconscious patient — aspiration risk'],
    priorityReason: 'Most urgent: BSL 1.8, found unresponsive. Brain damage occurs within minutes of severe hypoglycaemia.',
  },
  'ns3-p2': {
    diagnosis: 'Pulmonary Embolism (post-operative)',
    pearl: 'Post-op PE is the great mimicker — chest pain + tachycardia + hypoxaemia after recent surgery. The S1Q3T3 pattern on ECG is specific but insensitive. D-dimer is unhelpful post-op (always raised). CTPA is the diagnostic standard. Anticoagulate immediately once diagnosed unless contraindicated by haemorrhage risk.',
    keyActions: ['Assess ABCs', 'Oxygen', '12-Lead ECG', 'Troponin', 'CTPA', 'LMWH Anticoagulation', 'Respiratory Medicine Consult', 'Admit to Monitored Ward'],
    dangerActions: ['Thrombolysis without imaging — contraindicated without confirmed massive PE', 'Early mobilisation in haemodynamically unstable PE'],
    priorityReason: 'Deteriorates in 20 min. PE in a post-op patient: hypoxaemia and tachycardia must be investigated rapidly.',
  },
  'ns3-p3': {
    diagnosis: 'Post-operative Delirium',
    pearl: 'Use PINCH ME to find reversible causes: Pain, Infection, Nutrition, Constipation, Hydration, Medication, Environment. Non-pharmacological de-escalation first (orientation, low lighting, calm voice). Haloperidol 0.5mg is first-line pharmacological treatment. Avoid high-dose benzodiazepines in elderly (respiratory depression, paradoxical agitation). Physical restraints without medication or reassessment worsen outcomes.',
    keyActions: ['Assess ABCs + Vitals', 'Bedside BSL', 'Septic Screen', 'Medication Review', 'Verbal De-escalation', 'Request 1:1 Nursing', 'Haloperidol 0.5mg', 'Call Senior'],
    dangerActions: ['Physical restraints alone without medical review', 'High-dose benzodiazepines in elderly — respiratory depression'],
    priorityReason: 'Deteriorates in 30 min. Agitated delirium risks falls, line removal, self-harm, and staff injury.',
  },
  'ns3-p4': {
    diagnosis: 'Post-operative Fever — Atelectasis (Day 1)',
    pearl: 'The 5 Ws of post-operative fever: Wind (atelectasis — days 1–2), Water (UTI — days 3–5), Wound (surgical site infection — days 5–7), Walking (DVT/PE — days 5+), Wonder drugs (drug fever — any time). Day 1 fever is almost always atelectasis — treat with deep breathing exercises and mobilisation, not antibiotics. Antibiotic stewardship matters.',
    keyActions: ['Assess ABCs', 'Temperature Trend Review', 'Wound Inspection', 'Encourage Deep Breathing', 'Urine Dipstick', 'Ensure Adequate Analgesia', 'Reassure + Observe'],
    dangerActions: ['Immediate broad-spectrum antibiotics without identifying source — antibiotic stewardship violation'],
    priorityReason: 'Slowest to deteriorate (50 min). Day 1 post-op fever rarely needs antibiotics — most important lesson in this scenario.',
  },
};

export const NIGHT_SHIFT_3: ShiftScenario = {
  id: 'night-shift-3',
  name: 'Ward Calls — Intern Night',
  description: 'You are the overnight intern. Four ward calls come in simultaneously. Prioritise correctly — not everything is an emergency.',
  setting: 'General Medical & Surgical Wards',
  difficulty: 'beginner',
  teachingFocus: 'Common overnight decisions — hypoglycaemia, post-op PE, delirium, day 1 fever',
  estimatedMinutes: 18,
  optimalPatientOrder: ['ns3-p1', 'ns3-p2', 'ns3-p3', 'ns3-p4'],

  patients: [
    // ─── BED 1: HYPOGLYCAEMIA ─────────────────────────────────────────────────
    {
      id: 'ns3-p1',
      name: 'Tom Walsh',
      age: 78,
      sex: 'M',
      chiefComplaint: 'Found unresponsive in bed by night nurse. BSL 1.8 mmol/L on fingerprick. Known T2DM on insulin.',
      shortSummary: 'Unresponsive, BSL 1.8, insulin-treated diabetic',
      acuity: 1,
      bedNumber: 1,
      status: 'critical',
      vitals: { bp: '155/90', hr: 105, rr: 16, spo2: 97, temp: 36.8 },
      redFlags: ['BSL 1.8 mmol/L', 'Unresponsive (GCS 8)', 'Insulin-treated T2DM', 'Age 78'],
      nextDeteriorationAt: 12,
      deteriorationInterval: 10,
      deteriorationSteps: [
        {
          statusChange: 'critical',
          vitalsChange: { hr: 120, rr: 22 },
          eventMessage: '🚨 Tom: Hypoglycaemic seizure. BSL still 1.8. IV dextrose needed immediately.',
          isLethal: false,
        },
        {
          statusChange: 'dead',
          vitalsChange: { hr: 0 },
          eventMessage: '💀 Tom has died from prolonged hypoglycaemia. Brain damage, then cardiac arrest.',
          isLethal: true,
        },
      ],
      availableActions: [
        act('assess-abc',      'Assess ABCs',               'assessment',   '🫁', 5,  { det: 8,   triage: 15, guideline: 5,  msg: 'ABCs assessed. GCS 8, patient unresponsive but breathing. Airway maintained. IV access checked — patent.', feedback: 'Correct first step. Unresponsive patient — ensure airway, then treat the cause.', correct: true }),
        act('confirm-bsl',     'Confirm BSL',               'investigation','🔬', 3,  { det: 5,   triage: 10, guideline: 10, msg: 'BSL confirmed: 1.8 mmol/L on hospital glucometer. Severe hypoglycaemia.', feedback: 'Always confirm BSL before treatment — but do not delay. BSL 1.8 is a medical emergency.', correct: true }),
        act('iv-dextrose',     'IV Dextrose 50% 50mL',      'treatment',    '💉', 5,  { det: 20,  guideline: 25, safety: 15, status: 'stable', requires: ['confirm-bsl'], msg: 'Dextrose 50% 50mL IV pushed. Tom beginning to rouse. BSL rising.', feedback: 'Correct and fast. IV dextrose reverses hypoglycaemia within 2–5 minutes. Always have dextrose available when treating hypoglycaemia.', correct: true }),
        act('oral-glucose',    'Oral Glucose (Juice/Gel)',   'treatment',    '🍬', 5,  { det: 10,  guideline: 10, safety: -10, msg: 'Oral glucose attempted — patient unable to cooperate safely due to reduced consciousness.', sev: 'warning', feedback: 'Oral glucose is only safe if the patient can swallow reliably. Tom has GCS 8 — aspiration risk. IV dextrose is the correct route.', correct: false }),
        act('recheck-bsl',     'Recheck BSL at 15 min',     'investigation','🔬', 3,  { det: 10,  guideline: 15, requires: ['iv-dextrose'], msg: 'BSL 6.4 mmol/L. Tom now alert and oriented. Good response to dextrose.', feedback: 'Always recheck BSL 15 minutes post-treatment to confirm resolution. Rebound hypoglycaemia can occur.', correct: true }),
        act('review-insulin',  'Review Insulin Chart',      'investigation','📋', 5,  { det: 10,  guideline: 15, requires: ['recheck-bsl'], msg: 'Chart reviewed: 12 units Actrapid given 4 hours ago, but Tom\'s evening meal was missed. Dose-without-food pattern identified.', feedback: 'Root cause analysis is essential. Identifying WHY the hypoglycaemia occurred prevents recurrence. Common causes: missed meal, dose error, renal impairment.', correct: true }),
        act('call-senior',     'Call Senior',               'disposition',  '📞', 5,  { det: 10,  triage: 10, guideline: 10, requires: ['recheck-bsl'], msg: 'Senior notified. Insulin dose review and endocrine follow-up planned.', feedback: 'Significant hypoglycaemia always warrants senior review for insulin dose adjustment.', correct: true }),
        act('monitor-bsl',     'Hourly BSL + Safe to Ward', 'disposition',  '🏥', 5,  { det: 999, triage: 20, guideline: 20, time: 15, status: 'stable', msg: '✅ Tom alert, eating, BSL 7.2. Hourly BSL monitoring arranged. Insulin dose held until morning senior review.', feedback: 'Correct management. Treat, confirm response, find cause, adjust insulin. Simple — but life-saving when done promptly.', correct: true, completes: true, requires: ['review-insulin', 'call-senior'] }),
        act('give-insulin',    'Insulin Administration',    'treatment',    '⚠️', 5,  { safety: -60, guideline: -40, det: -30, status: 'critical', msg: '🚨 CRITICAL ERROR: Insulin given to a patient with BSL 1.8. Glucose is now critically low.', sev: 'danger', feedback: 'This is the most dangerous error in hypoglycaemia. Insulin lowers blood glucose further — in this context it is potentially lethal. NEVER give insulin without first knowing the glucose level.', dangerous: true }),
      ],
      completedActionIds: [],
      outcome: 'pending',
      deteriorationStepIndex: 0,
      score: { triage: 50, safety: 100, guideline: 50, time: 100 },
      eventLog: [],
    },

    // ─── BED 2: POST-OP CHEST PAIN (PE) ──────────────────────────────────────
    {
      id: 'ns3-p2',
      name: 'Diane Foster',
      age: 68,
      sex: 'F',
      chiefComplaint: 'Post-op day 2 after knee replacement. New left-sided chest pain, shortness of breath, SpO₂ dropped to 93%.',
      shortSummary: 'Post-op chest pain + SOB + SpO₂ 93%',
      acuity: 2,
      bedNumber: 2,
      status: 'deteriorating',
      vitals: { bp: '140/85', hr: 96, rr: 22, spo2: 93, temp: 37.2 },
      redFlags: ['Post-op immobility (DVT/PE risk)', 'New chest pain + SOB', 'SpO₂ 93%', 'Tachypnoea'],
      nextDeteriorationAt: 20,
      deteriorationInterval: 20,
      deteriorationSteps: [
        {
          statusChange: 'critical',
          vitalsChange: { bp: '90/58', hr: 118, spo2: 87 },
          eventMessage: '⚠️ Diane: Haemodynamic compromise. Massive PE likely. Urgent CTPA needed.',
          isLethal: false,
        },
        {
          statusChange: 'dead',
          vitalsChange: { hr: 0 },
          eventMessage: '💀 Diane has died from massive pulmonary embolism. Right heart failure and cardiac arrest.',
          isLethal: true,
        },
      ],
      availableActions: [
        act('assess-abc',       'Assess ABCs',               'assessment',   '🫁', 5,  { det: 8,   triage: 15, guideline: 5,  msg: 'ABCs assessed. SpO₂ 93% on air, HR 96, tachypnoea, anxious. Pleuritic chest pain on left.', feedback: 'Correct first step. Tachycardia + pleuritic chest pain + hypoxaemia post-op = PE until proven otherwise.', correct: true }),
        act('give-oxygen',      'Supplemental Oxygen',       'treatment',    '💨', 5,  { det: 5,   guideline: 8, msg: 'Oxygen via nasal cannula 4 L/min. SpO₂ improving to 96%. Breathlessness slightly better.', feedback: 'Oxygen corrects hypoxaemia and reduces right heart strain. Essential first treatment while investigations proceed.', correct: true }),
        act('order-ecg',        '12-Lead ECG',               'investigation','📈', 8,  { det: 10,  triage: 10, guideline: 15, msg: 'ECG shows: sinus tachycardia, S wave in I, Q wave and T-wave inversion in III (S1Q3T3). Suggestive of PE.', feedback: 'S1Q3T3 is a classic PE finding — specific but not sensitive. Sinus tachycardia is the most common ECG finding in PE.', correct: true }),
        act('order-troponin',   'Troponin + CXR',            'investigation','🔬', 8,  { det: 10,  guideline: 10, msg: 'Troponin mildly elevated (right ventricular strain pattern). CXR: oligaemia in left lower zone. No consolidation.', feedback: 'Troponin elevation in PE indicates right ventricular strain — a higher-risk PE. CXR is usually normal or shows subtle signs.', correct: true }),
        act('order-ctpa',       'CTPA',                      'investigation','🖥️', 15, { det: 20,  triage: 10, guideline: 25, requires: ['order-ecg'], status: 'stable', msg: 'CTPA confirms: bilateral PE, right lower > left. Right heart strain on CT. High-risk PE.', feedback: 'CTPA is the gold-standard for PE diagnosis. D-Dimer is unhelpful post-op (always elevated). Go straight to CTPA.', correct: true }),
        act('anticoagulate',    'LMWH Anticoagulation',      'treatment',    '💉', 8,  { det: 25,  guideline: 25, safety: 15, requires: ['order-ctpa'], msg: 'Enoxaparin 1.5 mg/kg SC given. Anticoagulation prevents thrombus extension.', feedback: 'Therapeutic anticoagulation is the cornerstone of PE treatment. LMWH is preferred over UFH for most patients.', correct: true }),
        act('resp-consult',     'Respiratory Medicine Consult','disposition', '📞', 8,  { det: 15,  triage: 10, guideline: 10, requires: ['order-ctpa'], msg: 'Resp medicine called. High-risk PE — monitoring for haemodynamic compromise.', feedback: 'Respiratory or haematology consult for high-risk PE is appropriate. They may advise on thrombolysis if haemodynamically unstable.', correct: true }),
        act('admit-monitored',  'Admit to Monitored Ward',   'disposition',  '🏥', 5,  { det: 999, triage: 20, guideline: 20, time: 15, status: 'admitted', msg: '✅ Diane admitted with telemetry monitoring, anticoagulated. Haemodynamically stable now.', feedback: 'Correctly managed. CTPA → anticoagulate → monitor. Good outcome expected.', correct: true, completes: true, requires: ['anticoagulate', 'resp-consult'] }),
        act('thrombolyse',      'Thrombolyse Without Imaging','treatment',   '🧪', 10, { safety: -40, guideline: -30, det: -20, status: 'critical', msg: '🚨 Thrombolysis given without CTPA confirmation. Post-op surgical bleeding risk is very high.', sev: 'danger', feedback: 'Thrombolysis without imaging and without proven haemodynamic instability is contraindicated — especially post-surgery. The bleeding risk outweighs the benefit. Always confirm diagnosis first.', dangerous: true }),
        act('early-mobilise',   'Full Mobilisation Now',     'treatment',    '🚶', 5,  { safety: -25, guideline: -15, det: -10, msg: '⚠️ Diane mobilised while haemodynamically compromised — dizziness and near-syncope.', sev: 'warning', feedback: 'Early mobilisation is encouraged in stable PE, but NOT if haemodynamically compromised. Assess stability first.', dangerous: true }),
      ],
      completedActionIds: [],
      outcome: 'pending',
      deteriorationStepIndex: 0,
      score: { triage: 50, safety: 100, guideline: 50, time: 100 },
      eventLog: [],
    },

    // ─── BED 3: ACUTE DELIRIUM ────────────────────────────────────────────────
    {
      id: 'ns3-p3',
      name: 'Eddie Mensah',
      age: 82,
      sex: 'M',
      chiefComplaint: 'Acutely confused and agitated. Pulling out IV lines, attempting to climb out of bed. Post-op day 3 hip replacement.',
      shortSummary: 'Acute delirium, agitated, pulling lines',
      acuity: 2,
      bedNumber: 3,
      status: 'deteriorating',
      vitals: { bp: '162/95', hr: 110, rr: 20, spo2: 95, temp: 38.1 },
      redFlags: ['Age 82 — high fall risk', 'IV lines being removed', 'Mild fever (infection?)', 'Post-op opioids'],
      nextDeteriorationAt: 30,
      deteriorationInterval: 25,
      deteriorationSteps: [
        {
          statusChange: 'critical',
          vitalsChange: { hr: 122, bp: '175/100' },
          eventMessage: '⚠️ Eddie has fallen. Suspected hip prosthesis dislocation. Delirium untreated.',
          isLethal: false,
        },
        {
          statusChange: 'dead',
          vitalsChange: { hr: 0 },
          eventMessage: '💀 Eddie has died from untreated delirium complications — aspiration, fall injury, cardiac event.',
          isLethal: true,
        },
      ],
      availableActions: [
        act('assess-abc',      'Assess ABCs + Vitals',        'assessment',   '🫁', 5,  { det: 8,   triage: 15, guideline: 5,  msg: 'ABCs intact. BP 162/95, HR 110, Temp 38.1. Eddie agitated, disoriented in time. GCS 14.', feedback: 'Correct first step. Always assess the patient medically before attributing confusion to behaviour alone.', correct: true }),
        act('check-bsl',       'Bedside BSL',                 'investigation','🔬', 3,  { det: 5,   guideline: 10, msg: 'BSL 6.8 mmol/L. Hypoglycaemia ruled out as cause.', feedback: 'Always check BSL in acute confusion — hypoglycaemia is an immediately treatable cause.', correct: true }),
        act('septic-screen',   'Septic Screen (MSU + Blood)', 'investigation','🧫', 8,  { det: 10,  guideline: 10, msg: 'MSU and blood cultures sent. Results pending. Temperature 38.1 — low-grade infection possible.', feedback: 'Infection is a common delirium precipitant (especially UTI in elderly). Use PINCH ME: Pain, Infection, Nutrition, Constipation, Hydration, Medication, Environment.', correct: true }),
        act('med-review',      'Medication Review',           'investigation','📋', 5,  { det: 8,   guideline: 10, msg: 'Medications reviewed. Patient on oxycodone 10mg QDS — opioids are a likely contributor to delirium.', feedback: 'Medications are a major reversible cause of delirium, especially opioids, anticholinergics, benzodiazepines, and steroids. Always review the drug chart.', correct: true }),
        act('de-escalate',     'Verbal De-escalation',        'treatment',    '🗣️', 5,  { det: 10,  guideline: 12, safety: 8, msg: 'Nurse speaks calmly, reorients Eddie ("You\'re in hospital, it\'s safe"). Lights on, clock visible. Eddie slightly calmer.', feedback: 'Non-pharmacological de-escalation is ALWAYS first-line in delirium. Reorientation, familiar faces, minimising noise. Medications are added only if these fail.', correct: true }),
        act('nurse-1to1',      'Request 1:1 Nursing',         'treatment',    '👩‍⚕️', 5, { det: 12,  guideline: 10, safety: 10, msg: '1:1 nurse assigned. Fall prevention — bed rails up, call bell within reach.', feedback: 'Continuous observation prevents falls and IV removal in agitated delirium. It\'s a non-pharmacological safety intervention.', correct: true }),
        act('haloperidol',     'Haloperidol 0.5mg IM',        'treatment',    '💊', 8,  { det: 20,  guideline: 18, requires: ['de-escalate', 'med-review'], msg: 'Haloperidol 0.5mg IM given. Eddie becoming calmer over 20 minutes. Caution with QT prolongation.', feedback: 'Haloperidol is first-line pharmacological treatment for delirium. Always use the lowest effective dose, especially in elderly. Check QTc before giving.', correct: true }),
        act('call-senior',     'Call Senior',                 'disposition',  '📞', 5,  { det: 10,  triage: 10, guideline: 10, requires: ['nurse-1to1'], msg: 'Senior notified. Management plan agreed: 1:1, haloperidol PRN, septic screen results to follow.', feedback: 'Senior review is appropriate for new-onset delirium in elderly post-op patients. Document clearly.', correct: true }),
        act('stabilize-deli',  'Stabilise + Handover Plan',  'disposition',  '🏥', 5,  { det: 999, triage: 20, guideline: 20, time: 10, status: 'stable', msg: '✅ Eddie calmer, 1:1 nursing in place, medications reviewed. Handover written for morning team.', feedback: 'Well managed. Find causes, de-escalate non-pharmacologically, add haloperidol if needed, ensure safety, hand over clearly.', correct: true, completes: true, requires: ['call-senior', 'haloperidol'] }),
        act('restraints-only', 'Physical Restraints (Only)', 'treatment',    '⛓️', 5,  { safety: -20, guideline: -15, det: -10, msg: '⚠️ Physical restraints applied without medical review or de-escalation attempt. Eddie more distressed.', sev: 'warning', feedback: 'Physical restraints alone are NEVER the first response to delirium. They worsen agitation, increase injury risk, and do not treat the cause. Always try de-escalation first.', dangerous: true }),
        act('high-benzo',      'Diazepam 10mg IV',            'treatment',    '💊', 5,  { safety: -30, guideline: -20, det: -10, status: 'critical', msg: '🚨 Diazepam 10mg IV — oversedation in an 82-year-old. Respiratory rate now 10, SpO₂ dropping.', sev: 'danger', feedback: 'High-dose benzodiazepines in elderly patients cause respiratory depression and paradoxical agitation. In non-alcohol withdrawal delirium, use low-dose haloperidol, not benzodiazepines.', dangerous: true }),
      ],
      completedActionIds: [],
      outcome: 'pending',
      deteriorationStepIndex: 0,
      score: { triage: 50, safety: 100, guideline: 50, time: 100 },
      eventLog: [],
    },

    // ─── BED 4: POST-OP FEVER ─────────────────────────────────────────────────
    {
      id: 'ns3-p4',
      name: 'Patricia Cho',
      age: 55,
      sex: 'F',
      chiefComplaint: 'Temperature 38.3°C on evening observations. Post-op day 1 after elective bowel resection. No pain, eating well.',
      shortSummary: 'Post-op day 1 fever, 38.3°C, otherwise well',
      acuity: 3,
      bedNumber: 4,
      status: 'stable',
      vitals: { bp: '128/78', hr: 88, rr: 18, spo2: 98, temp: 38.3 },
      redFlags: ['Post-op day 1 bowel surgery', 'Temperature 38.3°C'],
      nextDeteriorationAt: 50,
      deteriorationInterval: 40,
      deteriorationSteps: [
        {
          statusChange: 'deteriorating',
          vitalsChange: { temp: 38.3, hr: 102 },
          eventMessage: '⚠️ Patricia: Temperature now 38.8°C. Surgical site inspection needed. Deteriorating slowly.',
          isLethal: false,
        },
        {
          statusChange: 'critical',
          vitalsChange: { bp: '92/58', hr: 120 },
          eventMessage: '🚨 Patricia: Sepsis developing. Missed surgical site infection, now systemic.',
          isLethal: false,
        },
        {
          statusChange: 'dead',
          vitalsChange: { hr: 0 },
          eventMessage: '💀 Patricia has died from untreated surgical sepsis. Assessment was never completed.',
          isLethal: true,
        },
      ],
      availableActions: [
        act('assess-abc',        'Assess ABCs',                 'assessment',   '🫁', 5,  { det: 12,  triage: 15, guideline: 5,  msg: 'ABCs assessed. Patricia alert, comfortable. BP 128/78, HR 88. No haemodynamic compromise.', feedback: 'Correct. This patient is haemodynamically stable — a reassuring finding for day 1 post-op fever.', correct: true }),
        act('check-temp-trend',  'Review Temperature Chart',    'investigation','📋', 5,  { det: 10,  triage: 10, guideline: 10, msg: 'Chart reviewed: Temp 37.6 at 18:00, 38.0 at 20:00, 38.3 at 22:00. Slowly rising but not spiking.', feedback: 'Temperature trend matters. A single reading of 38.3 may be normal post-op inflammatory response. A rising trend warrants investigation.', correct: true }),
        act('wound-inspection',  'Wound Inspection',            'assessment',   '🔍', 8,  { det: 15,  triage: 5,  guideline: 12, msg: 'Wound inspected. Dry, intact, no erythema, no discharge. Bowel sounds present. No peritonism.', feedback: 'Wound inspection is essential in any post-op fever. Surgical site infection typically presents from day 5 onwards — day 1 wound changes suggest something more serious.', correct: true }),
        act('breathing-ex',      'Encourage Deep Breathing',    'treatment',    '🌬️', 5,  { det: 10,  guideline: 15, requires: ['wound-inspection'], msg: 'Chest physiotherapy and deep breathing exercises encouraged. Patricia compliant. This is the most common treatment for day 1 post-op fever.', feedback: 'Day 1 post-op fever is atelectasis (the first W) until proven otherwise. Treatment: deep breathing, early mobilisation, adequate analgesia to reduce splinting.', correct: true }),
        act('urine-dip',         'Urine Dipstick + MSU',       'investigation','🔬', 5,  { det: 10,  guideline: 8, msg: 'Urine dip: negative for nitrites and leucocytes. UTI ruled out.', feedback: 'Urine dipstick is a quick way to rule out UTI (the second W). Day 3–5 is when UTI typically presents post-op.', correct: true }),
        act('adequate-analgesia','Ensure Adequate Analgesia',   'treatment',    '💊', 5,  { det: 10,  guideline: 10, msg: 'Analgesia reviewed. Patricia has adequate pain control — this reduces diaphragmatic splinting and prevents atelectasis.', feedback: 'Pain causes splinting, which causes atelectasis, which causes fever. Adequate analgesia is both therapeutic and preventive.', correct: true }),
        act('reassure-observe',  'Reassure + Continue Monitoring','disposition','🏥', 5,  { det: 999, triage: 20, guideline: 18, time: 10, status: 'stable', msg: '✅ Patricia reassured. Day 1 post-op fever attributed to atelectasis. 4-hourly temperature monitoring arranged. No antibiotics needed.', feedback: 'Correct management. Day 1 post-op fever = atelectasis. Treat with deep breathing, analgesia, mobilisation. Do NOT automatically start antibiotics — this is an antibiotic stewardship violation.', correct: true, completes: true, requires: ['wound-inspection', 'check-temp-trend'] }),
        act('broad-abx',         'Immediate Broad-Spectrum Abx','treatment',    '💊', 8,  { safety: -15, guideline: -15, msg: 'Broad-spectrum antibiotics started without identifying an infection source. No indication on day 1 post-op.', sev: 'warning', feedback: 'Antibiotics without a confirmed infection source is an antibiotic stewardship violation. Day 1 post-op fever is almost always atelectasis — antibiotics are not indicated and select for resistant organisms.', dangerous: true }),
      ],
      completedActionIds: [],
      outcome: 'pending',
      deteriorationStepIndex: 0,
      score: { triage: 50, safety: 100, guideline: 50, time: 100 },
      eventLog: [],
    },
  ],
};
