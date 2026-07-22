import type { GameProgress, UpgradeDefinition } from 'src/types/game.types';

import {
  ABILITIES,
  activateAbility,
  calculateMetrics,
  clickReactor,
  createInitialProgress,
  getPurchaseQuote,
  purchaseUpgrade,
  tickGame,
  UPGRADES,
} from './game';

interface BalanceResult {
  firstUpgrade: number;
  firstAutomation: number;
  firstPrestige: number;
}

const ACTIVE_CLICKS_PER_SECOND = 3;

function buyBestAffordableUpgrade(progress: GameProgress): GameProgress {
  const metrics = calculateMetrics(progress);
  const currentRate =
    metrics.tokensPerSecond + metrics.tokensPerClick * ACTIVE_CLICKS_PER_SECOND;
  let best: { definition: UpgradeDefinition; payback: number } | null = null;

  for (const definition of UPGRADES) {
    if (progress.stats.tokens < definition.unlockAt) continue;
    const quote = getPurchaseQuote(progress, definition, 1);
    if (quote.count === 0) continue;
    const projected = {
      ...progress,
      upgrades: {
        ...progress.upgrades,
        [definition.id]: progress.upgrades[definition.id] + 1,
      },
    };
    const next = calculateMetrics(projected);
    const gain =
      next.tokensPerSecond +
      next.tokensPerClick * ACTIVE_CLICKS_PER_SECOND -
      currentRate;
    const payback = gain > 0 ? quote.cost / gain : Number.POSITIVE_INFINITY;
    if (best === null || payback < best.payback) best = { definition, payback };
  }

  return best === null
    ? progress
    : purchaseUpgrade(progress, best.definition.id, 1);
}

function simulateActivePlayer(): BalanceResult {
  let progress = createInitialProgress();
  let firstUpgrade = -1;
  let firstAutomation = -1;
  let pendingClicks = 0;
  const step = 0.2;

  for (let elapsed = 0; elapsed <= 3_000; elapsed += step) {
    progress = tickGame(progress, step);
    pendingClicks += ACTIVE_CLICKS_PER_SECOND * step;
    while (pendingClicks >= 1) {
      const deterministicRoll = ((progress.stats.clicks * 37) % 100) / 100;
      progress = clickReactor(progress, deterministicRoll).progress;
      pendingClicks -= 1;
    }
    for (const ability of ABILITIES)
      progress = activateAbility(progress, ability.id);

    let purchased = true;
    while (purchased) {
      const before = progress.stats.upgradesPurchased;
      progress = buyBestAffordableUpgrade(progress);
      purchased = progress.stats.upgradesPurchased > before;
      if (purchased && firstUpgrade < 0) firstUpgrade = elapsed;
      if (purchased && firstAutomation < 0 && progress.upgrades.gpu > 0)
        firstAutomation = elapsed;
    }

    if (progress.highScoreLevel > 5)
      return { firstUpgrade, firstAutomation, firstPrestige: elapsed };
  }

  return {
    firstUpgrade,
    firstAutomation,
    firstPrestige: Number.POSITIVE_INFINITY,
  };
}

describe('progression balance', () => {
  it('meets the active-play pacing targets', () => {
    const result = simulateActivePlayer();
    expect(result.firstUpgrade).toBeLessThanOrEqual(15);
    expect(result.firstAutomation).toBeLessThanOrEqual(60);
    // Additive efficiency stacking prevents two multiplier upgrades from
    // dominating the midgame and intentionally creates a longer first run.
    expect(result.firstPrestige).toBeGreaterThanOrEqual(45 * 60);
    expect(result.firstPrestige).toBeLessThanOrEqual(50 * 60);
  });
});
