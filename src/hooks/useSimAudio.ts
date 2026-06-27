import { useCallback, useRef, useState } from 'react';

export type SoundEvent = 'action' | 'lab-arrived' | 'critical' | 'message' | 'medication' | 'order-placed';

function tone(
  ac: AudioContext,
  freq: number,
  vol: number,
  type: OscillatorType,
  dur: number,
  delay = 0,
) {
  const osc  = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = type;
  osc.frequency.value = freq;
  const t = ac.currentTime + delay;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol, t + 0.01);
  gain.gain.linearRampToValueAtTime(0, t + dur);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

export function useSimAudio() {
  const [enabled, setEnabled] = useState(false);
  const acRef = useRef<AudioContext | null>(null);

  const getAc = useCallback((): AudioContext => {
    if (!acRef.current) acRef.current = new AudioContext();
    if (acRef.current.state === 'suspended') void acRef.current.resume();
    return acRef.current;
  }, []);

  const play = useCallback((event: SoundEvent) => {
    if (!enabled) return;
    const ac = getAc();
    switch (event) {
      // Soft action confirmation — quick sine blip
      case 'action':
        tone(ac, 880, 0.1, 'sine', 0.08);
        break;
      // Lab / result notification — ascending two-tone chime
      case 'lab-arrived':
        tone(ac, 660, 0.09, 'sine', 0.1);
        tone(ac, 880, 0.09, 'sine', 0.1, 0.14);
        break;
      // Critical alarm — three harsh pulses
      case 'critical':
        for (let i = 0; i < 3; i++) {
          tone(ac, 480, 0.28, 'square', 0.18, i * 0.38);
        }
        break;
      // Nurse / consultant message — soft two-note
      case 'message':
        tone(ac, 523, 0.07, 'sine', 0.09);
        tone(ac, 659, 0.07, 'sine', 0.09, 0.12);
        break;
      // Medication administered — descending confirmation
      case 'medication':
        tone(ac, 784, 0.07, 'sine', 0.1);
        tone(ac, 523, 0.07, 'sine', 0.09, 0.14);
        break;
      // Order placed — subtle click-like tone
      case 'order-placed':
        tone(ac, 440, 0.06, 'triangle', 0.06);
        break;
    }
  }, [enabled, getAc]);

  return { enabled, setEnabled, play };
}
