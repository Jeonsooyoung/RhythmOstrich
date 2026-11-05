import { useSyncExternalStore } from 'react';
import type { CharacterId } from '../types/character';

const KEY = 'rhythmostrich.unlockedCharacters';
const restricted: readonly CharacterId[] = ['duolingo', 'phoenix', 'kingfisher', 'fire-chicken', 'peacock'];
const listeners = new Set<() => void>();
const empty: readonly CharacterId[] = [];
function readUnlocked(): readonly CharacterId[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (Array.isArray(value)) return restricted.filter(id => value.includes(id));
  } catch { /* Retain the default locks if storage is unavailable. */ }
  return empty;
}
let unlocked = readUnlocked();
export function canToggleCharacterLock(id: CharacterId): boolean {
  return restricted.includes(id);
}
export function isCharacterUnlocked(id: CharacterId): boolean {
  return !restricted.includes(id) || unlocked.includes(id);
}
export function unlockCharacter(id: CharacterId): void {
  if (isCharacterUnlocked(id)) return;
  unlocked = [...unlocked, id];
  try { localStorage.setItem(KEY, JSON.stringify(unlocked)); } catch { /* Keep in memory. */ }
  listeners.forEach(listener => listener());
}
export function lockCharacter(id: CharacterId): void {
  if (!restricted.includes(id) || !unlocked.includes(id)) return;
  unlocked = unlocked.filter(characterId => characterId !== id);
  try { localStorage.setItem(KEY, JSON.stringify(unlocked)); } catch { /* Keep in memory. */ }
  listeners.forEach(listener => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function useCharacterUnlocks() {
  return useSyncExternalStore(subscribe, () => unlocked, () => empty);
}
