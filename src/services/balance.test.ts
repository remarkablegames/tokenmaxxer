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

function buyBestAffordableUpgrade(progress: GameProgress): GameProgress {
  const clicksPerSecond = 2;
  const metrics = calculateMetrics(progress);
  const currentRate =
    metrics.tokensPerSecond + metrics.tokensPerClick * clicksPerSecond;
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
      next.tokensPerClick * clicksPerSecond -
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
  const step = 0.2;

  for (let elapsed = 0; elapsed <= 1_200; elapsed += step) {
    progress = tickGame(progress, step);
    if (Math.floor(elapsed * 2) !== Math.floor((elapsed - step) * 2))
      progress = clickReactor(progress, 1).progress;
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

    if (progress.recordIndex > 5)
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
    // This deterministic strategy buys the mathematically strongest option
    // immediately; normal discovery and UI interaction extend it toward 15–20m.
    expect(result.firstPrestige).toBeGreaterThanOrEqual(10 * 60);
    expect(result.firstPrestige).toBeLessThanOrEqual(15 * 60);
  });
});
