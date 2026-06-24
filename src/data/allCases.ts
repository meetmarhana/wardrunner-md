import type { CaseData } from '../types/case';

import acsStemi from './cases/cardiology/acs-stemi.json';
import acuteHf from './cases/cardiology/acute-hf.json';
import afibRvr from './cases/cardiology/afib-rvr.json';
import pe from './cases/cardiology/pulmonary-embolism.json';
import aorticDissection from './cases/cardiology/aortic-dissection.json';

import dka from './cases/internal-medicine/dka.json';
import hhs from './cases/internal-medicine/hhs.json';
import copdExacerbation from './cases/internal-medicine/copd-exacerbation.json';
import asthmaAcute from './cases/internal-medicine/asthma-acute.json';
import cap from './cases/internal-medicine/cap.json';
import sepsis from './cases/internal-medicine/sepsis.json';
import cirrhosisComplication from './cases/internal-medicine/cirrhosis-complication.json';
import giBleed from './cases/internal-medicine/gi-bleed.json';
import aki from './cases/internal-medicine/aki.json';
import hypertensiveEmergency from './cases/internal-medicine/hypertensive-emergency.json';

export const ALL_CASES: CaseData[] = [
  acsStemi, acuteHf, afibRvr, pe, aorticDissection,
  dka, hhs, copdExacerbation, asthmaAcute, cap,
  sepsis, cirrhosisComplication, giBleed, aki, hypertensiveEmergency,
] as unknown as CaseData[];
