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
    expect(TRANSMISSIONS).toHaveLength(65);
    expect(new Set(TRANSMISSIONS.map(({ id }) => id)).size).toBe(65);
    expect(new Set(TRANSMISSIONS.map(({ sender }) => sender)).size).toBe(14);
    expect(TRANSMISSIONS.every(({ priority }) => priority > 0)).toBe(true);
    expect(
      TRANSMISSIONS.find(({ id }) => id === 'cluster-purchased')?.message,
    ).toContain('delegated to a subagent');
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
    progress.stats.prestiges = 25;
    progress.stats.abilitiesUsed = 20;
    progress.stats.playTime = 600;
    progress.stats.highestTps = 100_000_000;
    progress.upgrades.keyboard = 1;
    progress.upgrades.templates = 1;
    progress.upgrades.gpu = 1;
    progress.upgrades.model = 30;
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
    progress.bonuses = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

    expect(getEligibleTransmissions(progress).map(({ id }) => id)).toEqual(
      TRANSMISSIONS.filter(({ unlock }) => unlock.type !== 'session').map(
        ({ id }) => id,
      ),
    );
  });

  it('unlocks named AI model deployments at their upgrade levels', () => {
    const progress = createInitialProgress();
    progress.upgrades.model = 9;
    expect(
      getEligibleTransmissions(progress)
        .filter(({ id }) => id.startsWith('model-'))
        .map(({ id }) => id),
    ).toEqual(['model-gopilot', 'model-talkgpt']);

    progress.upgrades.model = 30;
    expect(
      getEligibleTransmissions(progress)
        .filter(({ id }) => id.startsWith('model-'))
        .map(({ id }) => id),
    ).toEqual([
      'model-gopilot',
      'model-talkgpt',
      'model-geminai',
      'model-claudio',
      'model-deepthunk',
      'model-mythos',
    ]);
  });

  it('requires meaningful input before unlocking active-playtime chatter', () => {
    const progress = createInitialProgress();
    progress.stats.playTime = 600;
    progress.stats.clicks = 24;
    expect(
      getEligibleTransmissions(progress).filter(
        ({ unlock }) => unlock.type === 'play-time',
      ),
    ).toEqual([]);

    progress.stats.clicks = 25;
    expect(
      getEligibleTransmissions(progress)
        .filter(({ unlock }) => unlock.type === 'play-time')
        .map(({ id }) => id),
    ).toEqual(['play-time-2m']);

    progress.stats.clicks = 50;
    expect(
      getEligibleTransmissions(progress)
        .filter(({ unlock }) => unlock.type === 'play-time')
        .map(({ id }) => id),
    ).toEqual(['play-time-2m', 'play-time-5m']);

    progress.stats.clicks = 100;
    expect(
      getEligibleTransmissions(progress)
        .filter(({ unlock }) => unlock.type === 'play-time')
        .map(({ id }) => id),
    ).toEqual(['play-time-2m', 'play-time-5m', 'play-time-10m']);
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
