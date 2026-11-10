import { useSyncExternalStore } from 'react';
import type { HeadAngles } from '../mediapipe/motionExtractor';

// Shared across screens in this app session; a reload requires calibration again.
let calibration: Readonly<HeadAngles> | null = null;
const listeners = new Set<() => void>();

export function setHeadCalibration(angles: HeadAngles) {
  if (![angles.yaw, angles.pitch, angles.roll].every(Number.isFinite)) return;
  calibration = Object.freeze({ yaw: angles.yaw, pitch: angles.pitch, roll: angles.roll });
  listeners.forEach(listener => listener());
}

export function getHeadCalibration() { return calibration; }

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function useHeadCalibration() {
  return useSyncExternalStore(subscribe, getHeadCalibration, () => null);
}
