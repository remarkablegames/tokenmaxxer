import { createInitialSave, STORAGE_KEY } from './game';
import { exportSave, loadSave, saveGame } from './storage';

describe('save storage', () => {
  it('loads defaults, valid saves, and recovers from corrupt saves', () => {
    const initial = createInitialSave();
    expect(loadSave({ getItem: () => null })).toEqual(initial);
    expect(loadSave({ getItem: () => JSON.stringify(initial) })).toEqual(
      initial,
    );
    expect(loadSave({ getItem: () => 'bad' })).toEqual(initial);
  });

  it('saves and exports the versioned envelope', () => {
    const save = createInitialSave();
    const setItem = vi.fn();
    saveGame(save, { setItem });
    expect(setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(save));
    expect(JSON.parse(exportSave(save))).toEqual(save);
  });
});
