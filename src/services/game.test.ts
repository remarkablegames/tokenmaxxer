import type { GameProgress, SaveEnvelope } from 'src/types/game.types';

import {
  ABILITIES,
  ACHIEVEMENTS,
  activateAbility,
  calculateMetrics,
  clickReactor,
  createInitialProgress,
  createInitialSave,
  formatDuration,
  formatNumber,
  getAiModelDeployment,
  getPurchaseQuote,
  getReactorStage,
  getRecordTarget,
  getTokenMultiplier,
  getUpgradeCost,
  getUpgradeDescription,
  parseSave,
  prestige,
  purchaseUpgrade,
  tickGame,
  unlockAchievements,
  UPGRADES,
} from './game';

function richProgress(): GameProgress {
  const progress = createInitialProgress();
  progress.tokens = 1_000_000_000;
  progress.stats.tokens = 20_000_000;
  progress.prestigeLevel = 5;
  progress.upgrades = {
    keyboard: 2,
    templates: 1,
    worktrees: 1,
    gpu: 1,
    model: 1,
    rack: 1,
    engineer: 1,
    agentSwarm: 1,
    orbital: 1,
    contextCompaction: 1,
    overclock: 1,
    critical: 20,
    optimization: 10,
  };
  return progress;
}

describe('game calculations', () => {
  it('uses a distinct SVG asset for every upgrade', () => {
    expect(new Set(UPGRADES.map(({ icon }) => icon)).size).toBe(
      UPGRADES.length,
    );
    expect(UPGRADES.every(({ icon }) => icon.endsWith('.svg'))).toBe(true);
    expect(new Set(ABILITIES.map(({ icon }) => icon)).size).toBe(
      ABILITIES.length,
    );
    expect(ABILITIES.every(({ icon }) => icon.endsWith('.svg'))).toBe(true);
    expect(UPGRADES.find(({ id }) => id === 'agentSwarm')?.name).toBe(
      'Agent Swarm',
    );
    expect(UPGRADES.find(({ id }) => id === 'agentSwarm')?.description).toBe(
      '+800 tokens per second',
    );
    expect(UPGRADES.find(({ id }) => id === 'orbital')?.description).toBe(
      '+6,000 tokens per second',
    );
    expect(UPGRADES.find(({ id }) => id === 'contextCompaction')?.name).toBe(
      'Context Compaction',
    );
    expect(
      UPGRADES.find(({ id }) => id === 'contextCompaction')?.baseCost,
    ).toBe(5_000);
    expect(UPGRADES.find(({ id }) => id === 'contextCompaction')).toMatchObject(
      {
        description: '×1.15 all production',
        growth: 1.3,
      },
    );
    expect(UPGRADES.find(({ id }) => id === 'overclock')).toMatchObject({
      baseCost: 25_000,
      description: '×1.3 automation output',
      growth: 1.4,
    });
    expect(UPGRADES.find(({ id }) => id === 'critical')).toMatchObject({
      description: '+1% critical click chance',
      maxLevel: 30,
    });
    expect(UPGRADES.find(({ id }) => id === 'optimization')?.name).toBe(
      'KV Cache Optimization',
    );
  });

  it('creates initial state and record helpers', () => {
    expect(createInitialSave()).toMatchObject({
      version: 1,
      progress: { tokens: 0, highScoreLevel: 0 },
      preferences: {
        musicMuted: false,
        musicVolume: 0.2,
        soundMuted: false,
        soundVolume: 0.45,
      },
    });
    expect(getRecordTarget(2)).toBe(100_000);
    expect(getReactorStage(-1)).toBe(0);
    expect(getReactorStage(20)).toBe(5);
    expect(getTokenMultiplier(0)).toBe(1);
    expect(getTokenMultiplier(5)).toBe(1.5);
    expect(getAiModelDeployment(0)).toBeNull();
    expect(getAiModelDeployment(1)).toBe('Croak');
    expect(getAiModelDeployment(9)).toBe('Croak');
    expect(getAiModelDeployment(10)).toBe('GoPilot');
    expect(getAiModelDeployment(20)).toBe('TalkGPT');
    expect(getAiModelDeployment(30)).toBe('GeminAI');
    expect(getAiModelDeployment(40)).toBe('Claudio');
    expect(getAiModelDeployment(50)).toBe('DeepThunk');
    expect(getAiModelDeployment(60)).toBe('Babble');
    expect(getAiModelDeployment(70)).toBe('LegendOS');
    expect(getUpgradeDescription(UPGRADES[0], 1)).toBe(
      '+1 base token per click',
    );
    expect(getUpgradeDescription(UPGRADES[4], 0)).toBe('+4 tokens per second');
    expect(getUpgradeDescription(UPGRADES[4], 1)).toBe(
      'Croak active · +4 tokens per second',
    );
  });

  it('calculates combined production and capped critical chance', () => {
    const progress = richProgress();
    progress.abilities.surge.remaining = 1;
    progress.abilities.hyperfocus.remaining = 1;
    const metrics = calculateMetrics(progress);
    expect(metrics.tokensPerClick).toBeCloseTo(8 * 1.25 * 1.15 * 1.5 * 2 * 3);
    expect(metrics.tokensPerSecond).toBeCloseTo(
      6_917 * (1 + 0.3 + 0.15) * 1.5 * 2,
    );
    expect(metrics.criticalChance).toBe(0.4);

    const focused = createInitialProgress();
    focused.abilities.hyperfocus.remaining = 1;
    expect(calculateMetrics(focused)).toMatchObject({
      tokensPerClick: 3,
      criticalChance: 0.2,
    });

    focused.upgrades.critical = 30;
    expect(calculateMetrics(focused).criticalChance).toBe(0.5);
  });

  it('quotes single, bulk, max, discounted, and unaffordable upgrades', () => {
    const progress = createInitialProgress();
    const keyboard = UPGRADES[0];
    progress.tokens = 100;
    expect(getUpgradeCost(progress, keyboard, 0)).toBe(20);
    expect(getPurchaseQuote(progress, keyboard, 1)).toEqual({
      count: 1,
      cost: 20,
    });
    expect(getPurchaseQuote(progress, keyboard, 10).count).toBeGreaterThan(1);
    expect(getPurchaseQuote(progress, keyboard, 'max').count).toBeGreaterThan(
      1,
    );
    progress.tokens = 0;
    expect(getPurchaseQuote(progress, keyboard, 1)).toEqual({
      count: 0,
      cost: 0,
    });
    progress.upgrades.optimization = 20;
    expect(getUpgradeCost(progress, keyboard, 0)).toBe(10);

    const critical = UPGRADES.find(({ id }) => id === 'critical');
    if (critical === undefined) throw new Error('Missing critical upgrade');
    progress.tokens = Number.MAX_SAFE_INTEGER;
    progress.upgrades.critical = 29;
    expect(getPurchaseQuote(progress, critical, 'max').count).toBe(1);
    progress.upgrades.critical = 30;
    expect(getPurchaseQuote(progress, critical, 1)).toEqual({
      count: 0,
      cost: 0,
    });
  });

  it('processes clicks, criticals, milestones, bonuses, and rating payouts', () => {
    let progress = createInitialProgress();
    progress.tokens = 999;
    const normal = clickReactor(progress, 1);
    expect(normal.critical).toBe(false);
    expect(normal.amount).toBe(1);
    expect(normal.progress).toMatchObject({ highScoreLevel: 1, bonuses: [0] });

    progress = richProgress();
    progress.tokens = 99_999_999;
    progress.highScoreLevel = 5;
    const critical = clickReactor(progress, 0);
    expect(critical.critical).toBe(true);
    expect(critical.progress.highScoreLevel).toBe(6);
    expect(critical.progress.pendingPrestigeLevels).toBe(3);
    expect(critical.progress.stats.criticalClicks).toBe(1);

    progress.tokens = 1_100_000_000;
    progress.highScoreLevel = 0;
    progress.bonuses = [0];
    const multiple = tickGame(progress, 0);
    expect(multiple.highScoreLevel).toBe(7);
    expect(new Set(multiple.bonuses).size).toBe(multiple.bonuses.length);
  });

  it('ticks production and clamps unsafe elapsed times', () => {
    const progress = richProgress();
    const before = progress.tokens;
    const next = tickGame(progress, 2);
    expect(next.tokens).toBeGreaterThan(before);
    expect(next.stats.playTime).toBe(1);
    expect(next.stats.highestTps).toBeGreaterThan(0);
    expect(tickGame(next, -2).stats.playTime).toBe(1);
  });
});

describe('game actions', () => {
  it('purchases unlocked upgrades and rejects invalid, locked, and unaffordable buys', () => {
    const progress = createInitialProgress();
    progress.tokens = 1_000;
    progress.stats.tokens = 1_000;
    const purchased = purchaseUpgrade(progress, 'keyboard', 1);
    expect(purchased.upgrades.keyboard).toBe(1);
    expect(purchased.stats.upgradesPurchased).toBe(1);
    expect(purchaseUpgrade(progress, 'orbital', 1)).toBe(progress);
    expect(
      purchaseUpgrade({ ...progress, tokens: 0 }, 'keyboard', 1).tokens,
    ).toBe(0);
    expect(purchaseUpgrade(progress, 'missing' as 'keyboard', 1)).toBe(
      progress,
    );
  });

  it('activates unlocked abilities and enforces cooldowns', () => {
    const progress = createInitialProgress();
    expect(activateAbility(progress, 'surge')).toBe(progress);
    progress.highScoreLevel = 3;
    const active = activateAbility(progress, 'surge');
    expect(active.abilities.surge).toEqual({ remaining: 15, cooldown: 90 });
    expect(active.stats.abilitiesUsed).toBe(1);
    expect(activateAbility(active, 'surge')).toBe(active);
    expect(activateAbility(progress, 'missing' as 'surge')).toBe(progress);
    const expired = tickGame(active, 1);
    expect(expired.abilities.surge.remaining).toBe(14);
  });

  it('prestiges only with a payout, resets the ladder, and raises rating', () => {
    const progress = richProgress();
    expect(prestige(progress)).toBe(progress);
    progress.highScoreLevel = 6;
    progress.pendingPrestigeLevels = 3;
    progress.bonuses = [0, 1, 2, 3, 4, 5];
    progress.achievements = ['record'];
    const next = prestige(progress);
    expect(next.tokens).toBe(0);
    expect(next.highScoreLevel).toBe(0);
    expect(next.prestigeLevel).toBe(8);
    expect(next.pendingPrestigeLevels).toBe(0);
    expect(next.stats.prestiges).toBe(1);
    expect(next.achievements).toContain('new-era');
  });

  it('unlocks every achievement and preserves an unchanged collection', () => {
    const progress = richProgress();
    progress.stats.clicks = 100;
    progress.stats.criticalClicks = 1;
    progress.stats.tokens = 1_000_000;
    progress.stats.abilitiesUsed = 1;
    progress.stats.prestiges = 1;
    progress.bonuses = [0, 2];
    progress.abilities.hyperfocus.cooldown = 1;
    const unlocked = unlockAchievements(progress);
    expect(unlocked.achievements).toHaveLength(ACHIEVEMENTS.length);
    expect(unlockAchievements(unlocked)).toBe(unlocked);
  });
});

describe('formatting and save validation', () => {
  it('formats small, large, and duration values', () => {
    expect(formatNumber(1.25)).toBe('1.3');
    expect(formatNumber(12)).toBe('12');
    expect(formatNumber(1_200)).toBe('1.20K');
    expect(formatNumber(12_000)).toBe('12.0K');
    expect(formatNumber(120_000)).toBe('120K');
    expect(formatNumber(1e30)).toBe('1.00e+30');
    expect(formatDuration(5)).toBe('5s');
    expect(formatDuration(65)).toBe('1m 5s');
  });

  it('parses valid saves and rejects malformed or unsafe data', () => {
    const valid = createInitialSave();
    valid.transmissions = { 'first-click': 123_456 };
    expect(parseSave(JSON.stringify(valid))).toEqual(valid);
    const legacy = JSON.parse(JSON.stringify(valid)) as {
      preferences: Record<string, unknown>;
    };
    delete legacy.preferences.soundMuted;
    delete legacy.preferences.soundVolume;
    legacy.preferences.muted = false;
    legacy.preferences.volume = 0.45;
    expect(parseSave(JSON.stringify(legacy))).toBeNull();
    expect(parseSave('not json')).toBeNull();
    expect(parseSave('{}')).toBeNull();
    const cases: SaveEnvelope[] = [];
    for (const mutation of [
      (save: SaveEnvelope) => {
        save.progress.tokens = -1;
      },
      (save: SaveEnvelope) => {
        save.progress.highScoreLevel = 0.5;
      },
      (save: SaveEnvelope) => {
        save.preferences.soundVolume = 2;
      },
      (save: SaveEnvelope) => {
        save.preferences.soundMuted = 'no' as unknown as boolean;
      },
      (save: SaveEnvelope) => {
        save.preferences.musicMuted = 'no' as unknown as boolean;
      },
      (save: SaveEnvelope) => {
        save.preferences.musicVolume = 2;
      },
      (save: SaveEnvelope) => {
        save.progress.prestigeLevel = Number.NaN;
      },
      (save: SaveEnvelope) => {
        save.progress.pendingPrestigeLevels = 0.5;
      },
      (save: SaveEnvelope) => {
        save.version = 2 as 1;
      },
      (save: SaveEnvelope) => {
        delete (
          save.progress.upgrades as Partial<
            SaveEnvelope['progress']['upgrades']
          >
        ).gpu;
      },
      (save: SaveEnvelope) => {
        save.progress.abilities.surge =
          {} as SaveEnvelope['progress']['abilities']['surge'];
      },
      (save: SaveEnvelope) => {
        save.progress.abilities.surge =
          null as unknown as SaveEnvelope['progress']['abilities']['surge'];
      },
      (save: SaveEnvelope) => {
        save.progress.bonuses = [-1];
      },
      (save: SaveEnvelope) => {
        save.progress.achievements = [1 as unknown as string];
      },
      (save: SaveEnvelope) => {
        delete (save as Partial<SaveEnvelope>).transmissions;
      },
      (save: SaveEnvelope) => {
        save.transmissions =
          'first-click' as unknown as SaveEnvelope['transmissions'];
      },
      (save: SaveEnvelope) => {
        save.transmissions = [1] as unknown as SaveEnvelope['transmissions'];
      },
      (save: SaveEnvelope) => {
        save.transmissions = { 'first-click': -1 };
      },
      (save: SaveEnvelope) => {
        save.savedAt = 'yesterday' as unknown as number;
      },
    ]) {
      const save = createInitialSave();
      mutation(save);
      cases.push(save);
    }
    for (const save of cases)
      expect(parseSave(JSON.stringify(save))).toBeNull();
    expect(ABILITIES).toHaveLength(2);
  });
});
