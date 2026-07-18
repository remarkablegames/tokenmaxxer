import type { SaveEnvelope } from 'src/types/game.types';

import { createInitialSave, parseSave, STORAGE_KEY } from './game';

export function loadSave(
  storage: Pick<Storage, 'getItem'> = localStorage,
): SaveEnvelope {
  const raw = storage.getItem(STORAGE_KEY);
  return raw === null
    ? createInitialSave()
    : (parseSave(raw) ?? createInitialSave());
}

export function saveGame(
  save: SaveEnvelope,
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(save));
}

export function exportSave(save: SaveEnvelope): string {
  return JSON.stringify(save, null, 2);
}
