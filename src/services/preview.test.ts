import { createInitialSave } from './game';
import { applyPreview, parsePreviewSearch } from './preview';

describe('query preview sandbox', () => {
  it('parses supported modes and numeric token overrides', () => {
    expect(parsePreviewSearch('')).toEqual({
      mode: null,
      enabled: false,
    });
    expect(parsePreviewSearch('?preview=high-score')).toEqual({
      mode: 'high-score',
      enabled: true,
    });
    expect(parsePreviewSearch('?preview=cover')).toEqual({
      mode: 'cover',
      enabled: true,
    });
    expect(parsePreviewSearch('?preview=cover-animated')).toEqual({
      mode: 'cover-animated',
      enabled: true,
    });
    expect(parsePreviewSearch('?preview=prestige&tokens=2.5e8')).toEqual({
      mode: 'prestige',
      tokens: 250_000_000,
      enabled: true,
    });
    expect(parsePreviewSearch('?tokens=0')).toEqual({
      mode: null,
      tokens: 0,
      enabled: true,
    });
  });

  it('ignores unknown modes and invalid token values', () => {
    for (const search of [
      '?preview=unknown',
      '?tokens=',
      '?tokens=nope',
      '?tokens=-1',
      '?tokens=Infinity',
    ])
      expect(parsePreviewSearch(search)).toEqual({
        mode: null,
        enabled: false,
      });

    expect(parsePreviewSearch('?preview=high-score&tokens=-1')).toEqual({
      mode: 'high-score',
      enabled: true,
    });
  });

  it('builds an isolated deterministic prestige state', () => {
    const save = createInitialSave();
    save.savedAt = 123;
    save.preferences.soundVolume = 0.8;
    const preview = applyPreview(save, parsePreviewSearch('?preview=prestige'));

    expect(preview).not.toBe(save);
    expect(preview.savedAt).toBeUndefined();
    expect(preview.preferences.soundVolume).toBe(0.8);
    expect(preview.progress).toMatchObject({
      tokens: 100_000_000,
      highScoreLevel: 6,
      bonuses: [0, 1, 2, 3, 4, 5],
      prestigeLevel: 0,
      pendingPrestigeLevels: 3,
      stats: { tokens: 100_000_000 },
    });
  });

  it('applies token overrides last without changing lifetime tokens', () => {
    const save = createInitialSave();
    save.progress.tokens = 12;
    save.progress.stats.tokens = 34;
    expect(applyPreview(save, parsePreviewSearch(''))).toBe(save);

    const tokensOnly = applyPreview(save, parsePreviewSearch('?tokens=999'));
    expect(tokensOnly.progress.tokens).toBe(999);
    expect(tokensOnly.progress.stats.tokens).toBe(34);

    const combined = applyPreview(
      save,
      parsePreviewSearch('?preview=prestige&tokens=250000000'),
    );
    expect(combined.progress.tokens).toBe(250_000_000);
    expect(combined.progress.stats.tokens).toBe(100_000_000);
  });

  it('leaves save data untouched for the visual-only cover preview', () => {
    const save = createInitialSave();

    expect(applyPreview(save, parsePreviewSearch('?preview=cover'))).toBe(save);
    expect(
      applyPreview(save, parsePreviewSearch('?preview=cover-animated')),
    ).toBe(save);
  });
});
