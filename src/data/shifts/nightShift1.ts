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

export const NIGHT_SHIFT_1_PEARLS: Record<string, {
  diagnosis: string;
  pearl: string;
  keyActions: string[];
  dangerActions: string[];
  priorityReason: string;
}> = {
  'ns1-p1': {
    diagnosis: 'STEMI — ST-Elevation Myocardial Infarction',
    pearl: 'Door-to-balloon time target is 90 minutes. Every minute of delay costs viable myocardium. ECG is the diagnostic test — confirm before anticoagulating.',
    keyActions: ['Assess ABCs', 'Order 12-Lead ECG', 'Aspirin 300mg', 'Heparin bolus', 'Call Cardiology', 'Activate Cath Lab'],
    dangerActions: ['Antibiotics (not indicated)', 'Thrombolysis without ruling out dissection'],
    priorityReason: 'Acuity P1, cardiogenic shock in progress, deteriorates in 25 min.',
  },
  'ns1-p2': {
    diagnosis: 'Septic Shock',
    pearl: 'Each hour of antibiotic delay increases mortality by ~7%. The Sepsis-6 bundle (lactate, cultures, O₂, fluids, antibiotics, urine output) should start within 1 hour. Cultures BEFORE antibiotics — but don\'t delay abx more than 45 minutes to get them.',
    keyActions: ['Assess ABCs', 'High-flow O₂', 'Blood cultures ×2', 'IV fluids 30ml/kg', 'Broad-spectrum antibiotics', 'Serum lactate', 'Call ICU', 'Admit ICU'],
    dangerActions: ['Aspirin (not indicated)', 'Insulin (DKA confusion)', 'Ward admission (too low a level of care)'],
    priorityReason: 'Most urgent — deteriorates in just 20 min. Septic shock needs immediate intervention.',
  },
  'ns1-p3': {
    diagnosis: 'Diabetic Ketoacidosis (DKA)',
    pearl: 'The DKA triad: hyperglycaemia + ketones + acidosis. Fluid resuscitation BEFORE insulin. Monitor potassium carefully — insulin drives K⁺ intracellularly and can cause fatal hypokalaemia. Most DKA manages on a medical ward, not ICU.',
    keyActions: ['Assess ABCs', 'Glucose + VBG + U&E', 'Normal saline bolus', 'Fixed-rate insulin infusion', 'Potassium monitoring', 'Admit ward'],
    dangerActions: ['Heparin IV (dangerous, not indicated)', 'Subcutaneous insulin (wrong route in acute DKA)'],
    priorityReason: 'Slowest deterioration (45 min) — manage last in this scenario.',
  },
  'ns1-p4': {
    diagnosis: 'Type A Aortic Dissection',
    pearl: 'STEMI and dissection look similar — both present with severe chest pain. BP asymmetry and tearing/ripping character point to dissection. Thrombolysis in dissection is LETHAL. Type A (ascending) = emergency surgery. Never anticoagulate.',
    keyActions: ['Assess ABCs', 'CT Chest/Abdomen/Pelvis', 'IV Morphine', 'IV labetalol (rate/BP control)', 'Call Cardiothoracic Surgery', 'Emergency OR'],
    dangerActions: ['Thrombolysis — LETHAL (-60 safety)', 'Heparin — worsens dissection', 'Aspirin — antiplatelet contraindicated', 'Cath Lab — wrong pathway'],
    priorityReason: 'Acuity P1, deteriorates in 30 min. Surgical emergency — OR is the only cure.',
  },
};

export const NIGHT_SHIFT_1: ShiftScenario = {
  id: 'night-shift-1',
  name: 'ED Night Shift — Triage Under Pressure',
  description: 'Four patients arrive simultaneously. Triage, stabilize, and disposition each before they deteriorate.',
  setting: 'Emergency Department',
  difficulty: 'beginner',
  teachingFocus: 'STEMI, Septic Shock, DKA, Aortic Dissection — classic time-critical presentations',
  estimatedMinutes: 20,
  optimalPatientOrder: ['ns1-p2', 'ns1-p1', 'ns1-p4', 'ns1-p3'], // Sarah → Ray → Marcus → Amara

  patients: [
    // ─── BED 1: STEMI ────────────────────────────────────────────────────────
    {
      id: 'ns1-p1',
      name: 'Ray Mitchell',
      age: 58,
      sex: 'M',
      chiefComplaint: 'Crushing chest pain radiating to left arm for 30 minutes',
      shortSummary: 'Crushing chest pain, diaphoretic',
      acuity: 1,
      bedNumber: 1,
      status: 'deteriorating',
      vitals: { bp: '95/60', hr: 112, rr: 22, spo2: 94, temp: 36.8 },
      redFlags: ['ST-elevation risk', 'Hypotensive', 'Diaphoretic', 'Radiation to left arm'],
      nextDeteriorationAt: 25,
      deteriorationInterval: 20,
      deteriorationSteps: [
        {
          statusChange: 'critical',
          vitalsChange: { bp: '80/50', hr: 130, spo2: 88 },
          eventMessage: '⚠️ Ray is in cardiogenic shock. BP crashing.',
          isLethal: false,
        },
        {
          statusChange: 'dead',
          vitalsChange: { hr: 0 },
          eventMessage: '💀 Ray has arrested. Untreated STEMI → cardiac death.',
          isLethal: true,
        },
      ],
      availableActions: [
        act('assess-abc',    'Assess ABCs',          'assessment',   '🫁', 5,  { det: 10,  triage: 15, guideline: 5,  msg: 'ABCs assessed. Airway patent, breathing laboured, BP 95/60.',   feedback: 'Correct first step. Patient has low BP and laboured breathing — high acuity.', correct: true }),
        act('order-ecg',     'Order 12-Lead ECG',    'investigation','📈', 8,  { det: 15,  triage: 10, guideline: 20, msg: '12-lead ECG shows 4mm ST-elevation in II, III, aVF, V4-V6. STEMI confirmed.', feedback: 'ECG confirmed STEMI. This is time-critical — cath lab activation needed now.', correct: true }),
        act('give-oxygen',   'High-Flow Oxygen',     'treatment',    '💨', 5,  { det: 5,   guideline: 5,  msg: 'Oxygen started. SpO₂ improving.',  feedback: 'Oxygen appropriate given SpO₂ 94%. Aim SpO₂ 94–98%.', correct: true }),
        act('give-aspirin',  'Aspirin 300mg PO',     'treatment',    '💊', 5,  { det: 10,  guideline: 15, msg: 'Aspirin 300mg given. Platelet aggregation inhibited.', feedback: 'Aspirin is first-line in STEMI. Dual antiplatelet therapy is a guideline requirement.', correct: true }),
        act('give-heparin',  'Heparin Bolus IV',     'treatment',    '💉', 5,  { det: 10,  guideline: 15, requires: ['order-ecg'], msg: 'IV Heparin initiated. Anticoagulation established.', feedback: 'Heparin anticoagulation is guideline-recommended in STEMI prior to PCI.', correct: true }),
        act('give-morphine', 'Morphine 4mg IV',      'treatment',    '🩹', 5,  { det: 5,   guideline: 5,  msg: 'Morphine given. Pain relief improving.', feedback: 'Pain control is appropriate. Some guidelines prefer fentanyl due to morphine/P2Y12 interaction.', correct: true }),
        act('call-cardiology','Call Cardiology',     'disposition',  '📞', 8,  { det: 15,  triage: 10, guideline: 10, requires: ['order-ecg'], msg: 'Cardiology team alerted. Cath lab being prepared.', feedback: 'Cardiology activation is essential. Door-to-balloon time target is 90 minutes.', correct: true }),
        act('cath-lab',      'Activate Cath Lab',    'disposition',  '🏥', 10, { det: 999, triage: 20, guideline: 25, time: 20, status: 'cath-lab', msg: '✅ Ray transferred to Cath Lab. Primary PCI underway.', feedback: 'Primary PCI is the gold-standard treatment for STEMI. Well done.', correct: true, completes: true, requires: ['call-cardiology'] }),
        act('thrombolysis',  'Thrombolyse (tPA)',    'treatment',    '🧪', 10, { det: 10,  guideline: -15, safety: -5, requires: ['order-ecg'], msg: 'tPA administered. Thrombolysis initiated.', feedback: 'Thrombolysis is second-line when PCI is unavailable. In a PCI-capable centre, primary PCI is preferred.', correct: false }),
        act('give-antibiotics','Antibiotics IV',     'treatment',    '💊', 8,  { safety: -20, guideline: -10, msg: '⚠️ Antibiotics started — not indicated.', sev: 'warning', feedback: 'Antibiotics are not indicated in STEMI. This wastes critical time and risks harm.', dangerous: true }),
      ],
      completedActionIds: [],
      outcome: 'pending',
      deteriorationStepIndex: 0,
      score: { triage: 50, safety: 100, guideline: 50, time: 100 },
      eventLog: [],
    },

    // ─── BED 2: SEPSIS ───────────────────────────────────────────────────────
    {
      id: 'ns1-p2',
      name: 'Sarah Chen',
      age: 45,
      sex: 'F',
      chiefComplaint: 'Fever, confusion, and hypotension. Transferred from GP with suspected infection.',
      shortSummary: 'Fever + hypotension + confusion',
      acuity: 2,
      bedNumber: 2,
      status: 'deteriorating',
      vitals: { bp: '82/50', hr: 132, rr: 28, spo2: 91, temp: 39.4 },
      redFlags: ['MAP <65 mmHg', 'Suspected infection source', 'GCS 13', 'Tachycardia >130'],
      nextDeteriorationAt: 20,
      deteriorationInterval: 15,
      deteriorationSteps: [
        {
          statusChange: 'critical',
          vitalsChange: { bp: '70/40', hr: 145, spo2: 86 },
          eventMessage: '⚠️ Sarah in septic shock. Lactate likely >4. ICU escalation urgent.',
          isLethal: false,
        },
        {
          statusChange: 'dead',
          vitalsChange: { hr: 0 },
          eventMessage: '💀 Sarah has died from untreated septic shock and multi-organ failure.',
          isLethal: true,
        },
      ],
      availableActions: [
        act('assess-abc',      'Assess ABCs',            'assessment',   '🫁', 5,  { det: 8,  triage: 15, guideline: 5,  msg: 'ABCs assessed. GCS 13, breathing fast, BP 82/50.', feedback: 'Correct first step — sepsis is a time-critical diagnosis. qSOFA ≥2 present.', correct: true }),
        act('give-oxygen',     'High-Flow Oxygen',       'treatment',    '💨', 5,  { det: 5,  guideline: 10, msg: 'High-flow O₂ started. SpO₂ improving to 95%.', feedback: 'Oxygen is appropriate. Target SpO₂ >94% in sepsis.', correct: true }),
        act('blood-cultures',  'Blood Cultures ×2',      'investigation','🧫', 8,  { det: 10, triage: 5, guideline: 15, msg: 'Blood cultures drawn from 2 sites. Awaiting lab results.', feedback: 'Cultures before antibiotics is guideline-essential — but do not delay antibiotics by more than 45 minutes.', correct: true }),
        act('iv-fluids',       'IV Fluid Bolus 30ml/kg', 'treatment',    '💧', 10, { det: 15, guideline: 20, status: 'stable', msg: 'IV fluid resuscitation started. BP responding: 95/65.', feedback: 'IV fluid bolus (30ml/kg crystalloid) is the Sepsis-6 bundle cornerstone.', correct: true }),
        act('give-antibiotics','Broad-Spectrum Abx',     'treatment',    '💊', 8,  { det: 20, guideline: 25, msg: 'Piperacillin-tazobactam started IV. Targeting likely gram-negatives.', feedback: 'Early antibiotics are the most time-sensitive intervention in sepsis. Each hour of delay increases mortality by ~7%.', correct: true }),
        act('order-lactate',   'Serum Lactate',          'investigation','🔬', 8,  { det: 5,  guideline: 10, msg: 'Lactate returns: 4.2 mmol/L. High — confirms septic shock.', feedback: 'Lactate ≥4 mmol/L meets septic shock criteria and guides ICU escalation.', correct: true }),
        act('call-icu',        'Call ICU Registrar',     'disposition',  '📞', 8,  { det: 15, triage: 10, guideline: 10, requires: ['iv-fluids', 'give-antibiotics'], msg: 'ICU consulted. Accepting Sarah for vasopressor support.', feedback: 'ICU admission is appropriate. Noradrenaline will be needed to maintain MAP >65.', correct: true }),
        act('admit-icu',       'Admit to ICU',           'disposition',  '🏥', 5,  { det: 999, triage: 20, guideline: 20, time: 15, status: 'icu', msg: '✅ Sarah admitted to ICU. Vasopressors started. Good outcome expected.', feedback: 'Septic shock requires ICU-level care with vasopressors and close monitoring.', correct: true, completes: true, requires: ['call-icu'] }),
        act('give-aspirin',    'Aspirin 300mg',          'treatment',    '💊', 5,  { safety: -15, guideline: -10, msg: '⚠️ Aspirin given — not indicated for sepsis.', sev: 'warning', feedback: 'Aspirin is not indicated in sepsis and may increase bleeding risk.', dangerous: true }),
        act('give-insulin',    'Insulin Infusion',       'treatment',    '💉', 5,  { safety: -20, guideline: -15, msg: '⚠️ Insulin started — glucose is not elevated.', sev: 'danger', feedback: 'Insulin without documented hyperglycaemia risks hypoglycaemia. This is a confusion with DKA in Bed 3.', dangerous: true }),
        act('admit-ward',      'Admit to Medical Ward',  'disposition',  '🏥', 5,  { safety: -25, triage: -10, guideline: -20, status: 'admitted', msg: '⚠️ Sarah sent to ward — inadequate level of care for septic shock.', sev: 'danger', feedback: 'Septic shock requires ICU admission. Ward-level care will not provide the vasopressor support needed.', dangerous: true, completes: true }),
      ],
      completedActionIds: [],
      outcome: 'pending',
      deteriorationStepIndex: 0,
      score: { triage: 50, safety: 100, guideline: 50, time: 100 },
      eventLog: [],
    },

    // ─── BED 3: DKA ──────────────────────────────────────────────────────────
    {
      id: 'ns1-p3',
      name: 'Amara Okafor',
      age: 22,
      sex: 'F',
      chiefComplaint: 'Confusion, vomiting, fruity-smelling breath. Known T1DM, missed insulin 2 days.',
      shortSummary: 'Confusion + vomiting + fruity breath',
      acuity: 2,
      bedNumber: 3,
      status: 'stable',
      vitals: { bp: '108/72', hr: 118, rr: 30, spo2: 99, temp: 37.0 },
      redFlags: ['Kussmaul breathing', 'GCS 13', 'Known T1DM', 'Missed insulin ×2 days'],
      nextDeteriorationAt: 45,
      deteriorationInterval: 30,
      deteriorationSteps: [
        {
          statusChange: 'deteriorating',
          vitalsChange: { bp: '90/60', hr: 135, rr: 36 },
          eventMessage: '⚠️ Amara worsening — severe dehydration and acidosis. GCS dropping.',
          isLethal: false,
        },
        {
          statusChange: 'critical',
          vitalsChange: { bp: '75/45', hr: 150 },
          eventMessage: '🚨 Amara in severe DKA with circulatory compromise.',
          isLethal: false,
        },
        {
          statusChange: 'dead',
          vitalsChange: { hr: 0 },
          eventMessage: '💀 Amara has died from severe DKA complications — cerebral oedema.',
          isLethal: true,
        },
      ],
      availableActions: [
        act('assess-abc',      'Assess ABCs',               'assessment',   '🫁', 5,  { det: 10, triage: 15, guideline: 5,  msg: 'ABCs assessed. GCS 13, Kussmaul breathing, ketone breath noted.', feedback: 'Correct. Kussmaul breathing (deep, rapid) is the compensatory response to metabolic acidosis in DKA.', correct: true }),
        act('order-glucose',   'BSL + VBG + U&E',           'investigation','🔬', 8,  { det: 15, triage: 10, guideline: 20, msg: 'Results: Glucose 28.4, pH 7.18, HCO₃ 10, Ketones 4+, K⁺ 5.8 mEq/L.', feedback: 'Glucose 28.4, pH 7.18 = severe DKA. Note: K⁺ is high now but will drop with insulin — monitor closely.', correct: true }),
        act('iv-fluids-ns',    'Normal Saline 1L Bolus',    'treatment',    '💧', 10, { det: 20, guideline: 20, msg: '1L normal saline running. BP improving to 115/75.', feedback: 'Fluid resuscitation with 0.9% NaCl is the first priority in DKA — before insulin.', correct: true }),
        act('start-insulin',   'Fixed-Rate Insulin Infusion','treatment',   '💉', 10, { det: 20, guideline: 25, requires: ['order-glucose', 'iv-fluids-ns'], msg: 'FRIII (0.1 units/kg/hr) started. Glucose and ketones will clear over 4-8 hours.', feedback: 'Correct. FRIII after initial fluid bolus. Do not start insulin until K⁺ >3.5 and fluids are running.', correct: true }),
        act('monitor-k',       'Potassium Monitoring',      'investigation','📊', 5,  { det: 10, guideline: 15, requires: ['start-insulin'], msg: 'Repeat K⁺: 4.2 mEq/L. Potassium replacement protocol initiated.', feedback: 'Critical: insulin drives K⁺ intracellularly. Failure to monitor potassium in DKA causes fatal hypokalaemia.', correct: true }),
        act('call-ward',       'Call Medical Ward',         'disposition',  '📞', 5,  { det: 10, triage: 10, guideline: 10, requires: ['start-insulin'], msg: 'Medical ward notified. Accepting Amara for DKA protocol monitoring.', feedback: 'Most DKA patients are managed on a medical ward with hourly monitoring. ICU for severe cases.', correct: true }),
        act('admit-ward',      'Admit to Medical Ward',     'disposition',  '🏥', 5,  { det: 999, triage: 20, guideline: 20, time: 15, status: 'admitted', msg: '✅ Amara admitted. DKA protocol continues with hourly bloods. Good prognosis.', feedback: 'Well managed. Standard DKA care: fluids → insulin → potassium monitoring → gradual glucose normalisation.', correct: true, completes: true, requires: ['call-ward'] }),
        act('give-heparin',    'Heparin IV',                'treatment',    '💉', 5,  { safety: -30, guideline: -20, msg: '⚠️ Heparin given — dangerous in DKA without thrombosis indication.', sev: 'danger', feedback: 'Heparin is not indicated in DKA and risks bleeding. This appears to be confusion with STEMI in Bed 1.', dangerous: true }),
        act('give-antibiotics','Antibiotics IV',            'treatment',    '💊', 8,  { safety: -10, guideline: -5, msg: 'Antibiotics started — no clear infection source identified.', sev: 'warning', feedback: 'Antibiotics are not routinely indicated in DKA unless an infection trigger is confirmed on investigation.', dangerous: false }),
        act('give-insulin-sc', 'Subcutaneous Insulin',      'treatment',    '💉', 5,  { safety: -20, guideline: -20, msg: '⚠️ SC insulin given — wrong route for acute DKA.', sev: 'danger', feedback: 'Subcutaneous insulin has unpredictable absorption in DKA due to poor perfusion. Always use IV infusion in acute DKA.', dangerous: true }),
      ],
      completedActionIds: [],
      outcome: 'pending',
      deteriorationStepIndex: 0,
      score: { triage: 50, safety: 100, guideline: 50, time: 100 },
      eventLog: [],
    },

    // ─── BED 4: AORTIC DISSECTION ────────────────────────────────────────────
    {
      id: 'ns1-p4',
      name: 'Marcus Webb',
      age: 52,
      sex: 'M',
      chiefComplaint: 'Sudden onset tearing chest pain radiating to the back. History of hypertension.',
      shortSummary: 'Tearing chest → back pain, HTN history',
      acuity: 1,
      bedNumber: 4,
      status: 'deteriorating',
      vitals: { bp: '165/95', hr: 94, rr: 20, spo2: 97, temp: 36.9 },
      redFlags: ['BP asymmetry: R 165 vs L 135', 'Tearing character', 'Hypertension history', 'Pulse deficit'],
      nextDeteriorationAt: 30,
      deteriorationInterval: 20,
      deteriorationSteps: [
        {
          statusChange: 'critical',
          vitalsChange: { bp: '80/50', hr: 120, spo2: 92 },
          eventMessage: '🚨 Marcus developing haemopericardium — tamponade imminent.',
          isLethal: false,
        },
        {
          statusChange: 'dead',
          vitalsChange: { hr: 0 },
          eventMessage: '💀 Marcus has died from aortic rupture and cardiac tamponade.',
          isLethal: true,
        },
      ],
      availableActions: [
        act('assess-abc',    'Assess ABCs',               'assessment',   '🫁', 5,  { det: 10, triage: 15, guideline: 5,  msg: 'ABCs assessed. BP asymmetry noted: R arm 165/95, L arm 135/80. Pulse deficit present.', feedback: 'BP asymmetry (>20 mmHg between arms) is a classic sign of aortic dissection. Highly suspicious.', correct: true }),
        act('order-ct',      'CT Chest/Abdomen/Pelvis',   'investigation','🖥️', 15, { det: 20, triage: 10, guideline: 25, status: 'stable', msg: 'CT confirms Type A aortic dissection — intimal flap in ascending aorta. Surgical emergency.', feedback: 'CT angiography is the definitive diagnostic test. Type A (ascending) = emergency surgery. Type B = medical management.', correct: true }),
        act('give-analgesia','IV Morphine — Analgesia',   'treatment',    '🩹', 5,  { det: 5,  guideline: 10, msg: 'Morphine 5mg IV given. Pain partially controlled.', feedback: 'Pain control is essential — pain drives sympathetic activation which worsens dissection.', correct: true }),
        act('iv-beta-blocker','IV Labetalol — Rate/BP control','treatment','💊', 8,  { det: 15, guideline: 20, requires: ['order-ct'], status: 'stable', msg: 'Labetalol infusion started. HR 70, BP 130/80. Dissection propagation risk reduced.', feedback: 'Beta-blockade is the cornerstone of aortic dissection management — target HR <60, SBP 100–120 mmHg.', correct: true }),
        act('call-surgery',  'Call Cardiothoracic Surgery','disposition',  '📞', 8,  { det: 15, triage: 10, guideline: 15, requires: ['order-ct'], msg: 'Cardiothoracic team alerted. Emergency OR being prepared for Type A repair.', feedback: 'Type A dissection has ~1-2% mortality per hour untreated. Immediate surgical referral is mandatory.', correct: true }),
        act('send-or',       'Emergency OR',              'disposition',  '🏥', 10, { det: 999, triage: 20, guideline: 25, time: 15, status: 'or', msg: '✅ Marcus transferred to emergency OR. Type A repair underway.', feedback: 'Emergency surgical repair is the only definitive treatment for Type A dissection. Mortality without surgery is near 100% at 48 hours.', correct: true, completes: true, requires: ['call-surgery'] }),
        act('give-thrombolysis','Thrombolyse (tPA)',      'treatment',    '⚠️', 8,  { safety: -60, guideline: -40, det: -30, status: 'critical', msg: '🚨 CRITICAL ERROR: tPA given to aortic dissection. Haemopericardium developing rapidly.', sev: 'danger', feedback: 'Thrombolysis in aortic dissection is CONTRAINDICATED and LETHAL. It lyses the clot stabilising the dissection, causing catastrophic haemorrhage. This is the most dangerous error in this scenario.', dangerous: true }),
        act('give-heparin',  'Heparin IV Bolus',          'treatment',    '💉', 5,  { safety: -35, guideline: -25, det: -15, msg: '⚠️ Heparin given — anticoagulation in aortic dissection is dangerous.', sev: 'danger', feedback: 'Heparin anticoagulation worsens dissection by preventing thrombus formation in the false lumen. It risks haemopericardium and cardiac tamponade.', dangerous: true }),
        act('give-aspirin',  'Aspirin 300mg',             'treatment',    '💊', 5,  { safety: -20, guideline: -15, msg: '⚠️ Aspirin given — antiplatelet therapy contraindicated in dissection.', sev: 'warning', feedback: 'Aspirin inhibits platelet function and increases bleeding risk in aortic dissection. Contraindicated.', dangerous: true }),
        act('cath-lab',      'Activate Cath Lab',         'disposition',  '🏥', 10, { safety: -25, guideline: -25, triage: -10, msg: '⚠️ Cath lab activated — wrong pathway for aortic dissection.', sev: 'danger', feedback: 'This is not a STEMI. Coronary angiography is not indicated for aortic dissection and delays definitive surgical care. The correct pathway is emergency OR, not cath lab.', dangerous: true }),
      ],
      completedActionIds: [],
      outcome: 'pending',
      deteriorationStepIndex: 0,
      score: { triage: 50, safety: 100, guideline: 50, time: 100 },
      eventLog: [],
    },
  ],
};
