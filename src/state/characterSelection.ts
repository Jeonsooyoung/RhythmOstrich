import { useSyncExternalStore } from 'react';
import { characters } from '../data/characters';
import type { CharacterId } from '../types/character';
import { isCharacterUnlocked } from './characterUnlock';

const KEY = 'rhythmostrich.character';
const listeners = new Set<() => void>();
const isCharacter = (id: unknown): id is CharacterId => characters.some(character => character.id === id);
function readSaved(): CharacterId {
  try {
    const saved = localStorage.getItem(KEY);
    if (isCharacter(saved) && isCharacterUnlocked(saved)) return saved;
  } catch { /* Storage can be unavailable in private or restricted contexts. */ }
  return 'ostrich';
}
let selected = readSaved();
export function getSelectedCharacter(): CharacterId { return selected; }
export function selectCharacter(id: CharacterId): void {
  if (!isCharacter(id) || !isCharacterUnlocked(id)) return;
  selected = id;
  try { localStorage.setItem(KEY, id); } catch { /* Keep the in-memory selection. */ }
  listeners.forEach(listener => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function useSelectedCharacter() {
  return useSyncExternalStore(subscribe, getSelectedCharacter, () => 'ostrich' as const);
}
