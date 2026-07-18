import { createInitialProgress } from './game';
import {
  getEligibleTransmissions,
  getSessionTransmission,
  getTransmissionsById,
  sortTransmissionsByPriority,
  TRANSMISSIONS,
} from './transmissions';

describe('narrative transmissions', () => {
  it('defines a varied, prioritized office narrative', () => {
    expect(TRANSMISSIONS).toHaveLength(45);
    expect(new Set(TRANSMISSIONS.map(({ id }) => id)).size).toBe(45);
    expect(new Set(TRANSMISSIONS.map(({ sender }) => sender)).size).toBe(13);
    expect(TRANSMISSIONS.every(({ priority }) => priority > 0)).toBe(true);
    expect(TRANSMISSIONS.map(({ unlock }) => unlock.type)).toEqual(
      expect.arrayContaining([
        'click',
        'high-score',
        'prestige',
        'critical-click',
        'lifetime-tokens',
        'upgrade',
        'ability',
        'play-time',
        'tokens-per-second',
        'ability-uses',
        'session',
      ]),
    );
  });

  it('derives permanent unlocks from every kind of game progress', () => {
    const progress = createInitialProgress();
    expect(getEligibleTransmissions(progress)).toEqual([]);

    progress.stats.clicks = 5_000;
    progress.stats.criticalClicks = 1;
    progress.stats.tokens = 500_000;
    progress.stats.prestiges = 3;
    progress.stats.abilitiesUsed = 20;
    progress.stats.playTime = 600;
    progress.stats.highestTps = 10_000;
    progress.upgrades.keyboard = 1;
    progress.upgrades.templates = 1;
    progress.upgrades.gpu = 1;
    progress.upgrades.rack = 1;
    progress.upgrades.multifinger = 1;
    progress.upgrades.compression = 1;
    progress.upgrades.critical = 1;
    progress.upgrades.overclock = 1;
    progress.upgrades.optimization = 1;
    progress.upgrades.engineer = 1;
    progress.upgrades.cluster = 1;
    progress.upgrades.orbital = 1;
    progress.abilities.surge.cooldown = 1;
    progress.abilities.hyperfocus.remaining = 1;
    progress.bonuses = [0, 1, 2, 3, 4, 5, 6, 7, 8];

    expect(getEligibleTransmissions(progress).map(({ id }) => id)).toEqual(
      TRANSMISSIONS.filter(({ unlock }) => unlock.type !== 'session').map(
        ({ id }) => id,
      ),
    );
  });

  it('selects persisted and session transmissions safely', () => {
    expect(
      getTransmissionsById(['offline-return', 'missing', 'first-click']).map(
        ({ id }) => id,
      ),
    ).toEqual(['first-click', 'offline-return']);
    expect(getSessionTransmission('idle').id).toBe('idle-review');
    expect(getSessionTransmission('offline-return').id).toBe('offline-return');
    expect(
      sortTransmissionsByPriority([TRANSMISSIONS[1], TRANSMISSIONS[0]]).map(
        ({ id }) => id,
      ),
    ).toEqual(['first-click', 'keyboard-purchased']);
  });
});
