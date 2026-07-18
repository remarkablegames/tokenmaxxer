import { createInitialProgress } from './game';
import { getUnlockedTransmissions, TRANSMISSIONS } from './transmissions';

describe('narrative transmissions', () => {
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
