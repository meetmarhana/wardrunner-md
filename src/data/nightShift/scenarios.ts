import type { ShiftScenario } from '../../types/shift';
import { NIGHT_SHIFT_1, NIGHT_SHIFT_1_PEARLS } from '../shifts/nightShift1';
import { NIGHT_SHIFT_2, NIGHT_SHIFT_2_PEARLS } from '../shifts/nightShift2';
import { NIGHT_SHIFT_3, NIGHT_SHIFT_3_PEARLS } from '../shifts/nightShift3';

export type PearlRecord = Record<string, {
  diagnosis: string;
  pearl: string;
  keyActions: string[];
  dangerActions: string[];
  priorityReason: string;
}>;

export const ALL_SCENARIOS: ShiftScenario[] = [
  NIGHT_SHIFT_1,
  NIGHT_SHIFT_2,
  NIGHT_SHIFT_3,
];

const ALL_PEARLS: Record<string, PearlRecord> = {
  'night-shift-1': NIGHT_SHIFT_1_PEARLS,
  'night-shift-2': NIGHT_SHIFT_2_PEARLS,
  'night-shift-3': NIGHT_SHIFT_3_PEARLS,
};

export function getNightShiftScenario(id: string): ShiftScenario | undefined {
  return ALL_SCENARIOS.find(s => s.id === id);
}

export function getPearls(scenarioId: string): PearlRecord {
  return ALL_PEARLS[scenarioId] ?? {};
}
