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
  getPerkCost,
  getPurchaseQuote,
  getReactorStage,
  getRecordTarget,
  getSeedTokens,
  getUpgradeCost,
  getUpgradeDescription,
  parseSave,
  PERKS,
  prestige,
  purchasePerk,
  purchaseUpgrade,
  tickGame,
  unlockAchievements,
  UPGRADES,
} from './game';

function richProgress(): GameProgress {
  const progress = createInitialProgress({
    seedFunding: 1,
    manualCalibration: 2,
    automationRouting: 2,
    cooldownOptimization: 2,
  });
  progress.tokens = 1_000_000_000;
  progress.stats.tokens = 20_000_000;
  progress.upgrades = {
    keyboard: 2,
    templates: 1,
    multifinger: 1,
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
    expect(UPGRADES.find(({ id }) => id === 'contextCompaction')?.name).toBe(
      'Context Compaction',
    );
  });

  it('creates initial state and record helpers', () => {
    expect(createInitialSave()).toMatchObject({
      version: 1,
      progress: { tokens: 0, recordIndex: 0 },
      preferences: { muted: false, volume: 0.45 },
    });
    expect(getRecordTarget(2)).toBe(100_000);
    expect(getReactorStage(-1)).toBe(0);
    expect(getReactorStage(20)).toBe(5);
    expect(getSeedTokens(0)).toBe(0);
    expect(getSeedTokens(2)).toBe(1_000);
    expect(getAiModelDeployment(0)).toBeNull();
    expect(getAiModelDeployment(1)).toBe('GoPilot');
    expect(getAiModelDeployment(5)).toBe('TalkGPT');
    expect(getAiModelDeployment(10)).toBe('GeminAI');
    expect(getAiModelDeployment(15)).toBe('Claudio');
    expect(getAiModelDeployment(20)).toBe('DeepThunk');
    expect(getAiModelDeployment(30)).toBe('MythOS');
    expect(getUpgradeDescription(UPGRADES[0], 1)).toBe(
      '+1 base token per click',
    );
    expect(getUpgradeDescription(UPGRADES[4], 0)).toBe('+4 tokens per second');
    expect(getUpgradeDescription(UPGRADES[4], 1)).toBe(
      'GoPilot active · +4 tokens per second',
    );
  });

  it('calculates combined production and capped critical chance', () => {
    const progress = richProgress();
    progress.abilities.surge.remaining = 1;
    progress.abilities.hyperfocus.remaining = 1;
    const metrics = calculateMetrics(progress);
    expect(metrics.tokensPerClick).toBeCloseTo(8 * 1.25 * 1.2 * 1.5 * 3 * 5);
    expect(metrics.tokensPerSecond).toBeCloseTo(9_017 * 1.35 * 1.2 * 1.5 * 3);
    expect(metrics.criticalChance).toBe(0.35);
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
  });

  it('processes clicks, criticals, milestones, bonuses, and credit payouts', () => {
    let progress = createInitialProgress();
    progress.tokens = 999;
    const normal = clickReactor(progress, 1);
    expect(normal.critical).toBe(false);
    expect(normal.amount).toBe(1);
    expect(normal.progress).toMatchObject({ recordIndex: 1, bonuses: [0] });

    progress = richProgress();
    progress.tokens = 99_999_999;
    progress.recordIndex = 5;
    const critical = clickReactor(progress, 0);
    expect(critical.critical).toBe(true);
    expect(critical.progress.recordIndex).toBe(6);
    expect(critical.progress.pendingCredits).toBe(3);
    expect(critical.progress.stats.criticalClicks).toBe(1);

    progress.tokens = 1_100_000_000;
    progress.recordIndex = 0;
    progress.bonuses = [0];
    const multiple = tickGame(progress, 0);
    expect(multiple.recordIndex).toBe(7);
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

  it('activates unlocked abilities with permanent cooldown reductions', () => {
    const progress = createInitialProgress();
    expect(activateAbility(progress, 'surge')).toBe(progress);
    progress.recordIndex = 3;
    progress.perks.cooldownOptimization = 2;
    const active = activateAbility(progress, 'surge');
    expect(active.abilities.surge).toEqual({ remaining: 20, cooldown: 81 });
    expect(active.stats.abilitiesUsed).toBe(1);
    expect(activateAbility(active, 'surge')).toBe(active);
    expect(activateAbility(progress, 'missing' as 'surge')).toBe(progress);
    const expired = tickGame(active, 1);
    expect(expired.abilities.surge.remaining).toBe(19);
  });

  it('prestiges only with a payout and preserves permanent progress', () => {
    const progress = richProgress();
    expect(prestige(progress)).toBe(progress);
    progress.recordIndex = 6;
    progress.pendingCredits = 3;
    progress.bonuses = [0, 1, 2, 3, 4, 5];
    progress.achievements = ['record'];
    const next = prestige(progress);
    expect(next.tokens).toBe(250);
    expect(next.recordIndex).toBe(6);
    expect(next.usageCredits).toBe(3);
    expect(next.pendingCredits).toBe(0);
    expect(next.stats.prestiges).toBe(1);
    expect(next.achievements).toContain('new-era');
  });

  it('purchases permanent perks and enforces cost and level limits', () => {
    const progress = createInitialProgress();
    progress.usageCredits = 100;
    expect(getPerkCost(PERKS[0], 2)).toBe(3);
    const bought = purchasePerk(progress, 'manualCalibration');
    expect(bought.perks.manualCalibration).toBe(1);
    expect(bought.usageCredits).toBe(98);
    expect(
      purchasePerk({ ...progress, usageCredits: 0 }, 'seedFunding'),
    ).toEqual({ ...progress, usageCredits: 0 });
    progress.perks.cooldownOptimization = 8;
    expect(purchasePerk(progress, 'cooldownOptimization')).toBe(progress);
    expect(purchasePerk(progress, 'missing' as 'seedFunding')).toBe(progress);
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
    expect(parseSave('not json')).toBeNull();
    expect(parseSave('{}')).toBeNull();
    const cases: SaveEnvelope[] = [];
    for (const mutation of [
      (save: SaveEnvelope) => {
        save.progress.tokens = -1;
      },
      (save: SaveEnvelope) => {
        save.progress.recordIndex = 0.5;
      },
      (save: SaveEnvelope) => {
        save.preferences.volume = 2;
      },
      (save: SaveEnvelope) => {
        save.progress.usageCredits = Number.NaN;
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
