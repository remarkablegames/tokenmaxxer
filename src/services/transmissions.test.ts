import { createInitialProgress } from './game';
import { getUnlockedTransmissions, TRANSMISSIONS } from './transmissions';

describe('narrative transmissions', () => {
  it('describes unlocks as typed progression data', () => {
    expect(TRANSMISSIONS.map(({ unlock }) => unlock)).toEqual([
      { type: 'click', value: 1 },
      { type: 'record', value: 1_000 },
      { type: 'record', value: 10_000 },
      { type: 'record', value: 100_000 },
      { type: 'record', value: 1_000_000 },
      { type: 'record', value: 10_000_000 },
      { type: 'record', value: 100_000_000 },
      { type: 'prestige', value: 1 },
    ]);
  });

  it('unlocks the Goodhart Systems story in progression order', () => {
    const progress = createInitialProgress();
    expect(getUnlockedTransmissions(progress)).toEqual([]);

    progress.stats.clicks = 1;
    expect(getUnlockedTransmissions(progress).map(({ id }) => id)).toEqual([
      'first-click',
    ]);

    progress.trophies = [0, 1, 2, 3, 4, 5];
    expect(getUnlockedTransmissions(progress).map(({ id }) => id)).toEqual(
      TRANSMISSIONS.slice(0, 7).map(({ id }) => id),
    );

    progress.stats.prestiges = 1;
    expect(getUnlockedTransmissions(progress)).toEqual(TRANSMISSIONS);
  });
});
