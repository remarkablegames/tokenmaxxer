import type {
  AbilityDefinition,
  AbilityId,
  AchievementDefinition,
  BuyMode,
  GameProgress,
  Preferences,
  ProductionMetrics,
  PurchaseQuote,
  SaveEnvelope,
  UpgradeDefinition,
  UpgradeId,
} from 'src/types/game.types';

export const STORAGE_KEY = 'org.remarkablegames.tokenmaxxer';
const CRITICAL_MULTIPLIER = 5;
const PRESTIGE_UNLOCK_HIGH_SCORE_LEVEL = 5;
const TOKEN_MULTIPLIER_PER_PRESTIGE_LEVEL = 0.1;

export const UPGRADES: UpgradeDefinition[] = [
  {
    id: 'keyboard',
    name: 'Mechanical Keyboard',
    description: '+1 base token per click',
    category: 'manual',
    baseCost: 20,
    growth: 1.15,
    revealAt: 0,
    unlockAt: 0,
    icon: 'icons/upgrades/keyboard.svg',
  },
  {
    id: 'templates',
    name: 'Skill Templates',
    description: '×1.25 manual output',
    category: 'manual',
    baseCost: 200,
    growth: 1.17,
    revealAt: 200,
    unlockAt: 250,
    icon: 'icons/upgrades/templates.svg',
  },
  {
    id: 'worktrees',
    name: 'Parallel Worktrees',
    description: '+5 base tokens per click',
    category: 'manual',
    baseCost: 2_000,
    growth: 1.19,
    revealAt: 1_000,
    unlockAt: 10_000,
    icon: 'icons/upgrades/worktrees.svg',
  },
  {
    id: 'gpu',
    name: 'Used GPU',
    description: '+1 token per second',
    category: 'automation',
    baseCost: 75,
    growth: 1.14,
    revealAt: 0,
    unlockAt: 50,
    icon: 'icons/upgrades/gpu.svg',
  },
  {
    id: 'model',
    name: 'AI Model',
    description: '+4 tokens per second',
    category: 'automation',
    baseCost: 350,
    growth: 1.12,
    revealAt: 100,
    unlockAt: 250,
    icon: 'icons/upgrades/model.svg',
  },
  {
    id: 'rack',
    name: 'Server Rack',
    description: '+12 tokens per second',
    category: 'automation',
    baseCost: 1_000,
    growth: 1.15,
    revealAt: 250,
    unlockAt: 1_000,
    icon: 'icons/upgrades/rack.svg',
  },
  {
    id: 'engineer',
    name: 'Prompt Engineer',
    description: '+100 tokens per second',
    category: 'automation',
    baseCost: 10_000,
    growth: 1.16,
    revealAt: 10_000,
    unlockAt: 50_000,
    icon: 'icons/upgrades/engineer.svg',
  },
  {
    id: 'agentSwarm',
    name: 'Agent Swarm',
    description: '+900 tokens per second',
    category: 'automation',
    baseCost: 100_000,
    growth: 1.17,
    revealAt: 100_000,
    unlockAt: 500_000,
    icon: 'icons/upgrades/agent-swarm.svg',
  },
  {
    id: 'orbital',
    name: 'Orbital Datacenter',
    description: '+8,000 tokens per second',
    category: 'automation',
    baseCost: 1_000_000,
    growth: 1.18,
    revealAt: 1_000_000,
    unlockAt: 10_000_000,
    icon: 'icons/upgrades/orbital.svg',
  },
  {
    id: 'contextCompaction',
    name: 'Context Compaction',
    description: '×1.2 all production',
    category: 'efficiency',
    baseCost: 5_000,
    growth: 1.2,
    revealAt: 5_000,
    unlockAt: 5_000,
    icon: 'icons/upgrades/context-compaction.svg',
  },
  {
    id: 'overclock',
    name: 'Overclocking',
    description: '×1.35 automation output',
    category: 'efficiency',
    baseCost: 25_000,
    growth: 1.2,
    revealAt: 25_000,
    unlockAt: 100_000,
    icon: 'icons/upgrades/overclock.svg',
  },
  {
    id: 'critical',
    name: 'Critical Prompting',
    description: '+2% critical click chance',
    category: 'efficiency',
    baseCost: 7_500,
    growth: 1.19,
    revealAt: 5_000,
    unlockAt: 25_000,
    icon: 'icons/upgrades/critical.svg',
  },
  {
    id: 'optimization',
    name: 'KV Cache Optimization',
    description: '6% lower upgrade costs',
    category: 'efficiency',
    baseCost: 100_000,
    growth: 1.2,
    revealAt: 100_000,
    unlockAt: 1_000_000,
    icon: 'icons/upgrades/optimization.svg',
  },
];

export const ABILITIES: AbilityDefinition[] = [
  {
    id: 'surge',
    name: 'Token Surge',
    description: '2× all production',
    icon: 'icons/abilities/token-surge.svg',
    unlockAt: 10_000,
    duration: 15,
    cooldown: 90,
  },
  {
    id: 'hyperfocus',
    name: 'Hyperfocus',
    description: '3× clicks and +15% critical chance',
    icon: 'icons/abilities/hyperfocus.svg',
    unlockAt: 100_000,
    duration: 15,
    cooldown: 75,
  },
];

const EMPTY_UPGRADES: Record<UpgradeId, number> = {
  keyboard: 0,
  templates: 0,
  worktrees: 0,
  gpu: 0,
  model: 0,
  rack: 0,
  engineer: 0,
  agentSwarm: 0,
  orbital: 0,
  contextCompaction: 0,
  overclock: 0,
  critical: 0,
  optimization: 0,
};

export function getRecordTarget(index: number): number {
  return 1_000 * 10 ** index;
}

export function getReactorStage(highScoreLevel: number): number {
  return Math.min(5, Math.max(0, highScoreLevel));
}

export function getAiModelDeployment(level: number): string | null {
  if (level >= 70) return 'LegendOS';
  if (level >= 60) return 'Babble';
  if (level >= 50) return 'DeepThunk';
  if (level >= 40) return 'Claudio';
  if (level >= 30) return 'GeminAI';
  if (level >= 20) return 'TalkGPT';
  if (level >= 10) return 'GoPilot';
  if (level >= 1) return 'Croak';
  return null;
}

export function getUpgradeDescription(
  upgrade: UpgradeDefinition,
  level: number,
): string {
  const deployment =
    upgrade.id === 'model' ? getAiModelDeployment(level) : null;
  return deployment === null
    ? upgrade.description
    : `${deployment} active · ${upgrade.description}`;
}

export function createInitialProgress(): GameProgress {
  return {
    tokens: 0,
    highScoreLevel: 0,
    upgrades: { ...EMPTY_UPGRADES },
    abilities: {
      surge: { remaining: 0, cooldown: 0 },
      hyperfocus: { remaining: 0, cooldown: 0 },
    },
    bonuses: [],
    achievements: [],
    prestigeLevel: 0,
    pendingPrestigeLevels: 0,
    stats: {
      tokens: 0,
      manualTokens: 0,
      clicks: 0,
      criticalClicks: 0,
      upgradesPurchased: 0,
      abilitiesUsed: 0,
      prestiges: 0,
      playTime: 0,
      highestTps: 0,
      highestTpc: 1,
    },
  };
}

export function createInitialSave(): SaveEnvelope {
  return {
    version: 1,
    progress: createInitialProgress(),
    preferences: {
      musicMuted: false,
      musicVolume: 0.2,
      soundMuted: false,
      soundVolume: 0.45,
    },
    transmissions: {},
  };
}

export function calculateMetrics(progress: GameProgress): ProductionMetrics {
  const u = progress.upgrades;
  const manualBase = 1 + u.keyboard + u.worktrees * 5;
  const manualMultiplier =
    (1 + u.templates * 0.25) * (1 + u.contextCompaction * 0.2);
  const automationBase =
    u.gpu +
    u.model * 4 +
    u.rack * 12 +
    u.engineer * 100 +
    u.agentSwarm * 900 +
    u.orbital * 8_000;
  const automationMultiplier =
    (1 + u.overclock * 0.35) * (1 + u.contextCompaction * 0.2);
  const tokenMultiplier = getTokenMultiplier(progress.prestigeLevel);
  const surge = progress.abilities.surge.remaining > 0 ? 2 : 1;
  const hyperfocus = progress.abilities.hyperfocus.remaining > 0 ? 3 : 1;
  return {
    tokensPerClick:
      manualBase * manualMultiplier * tokenMultiplier * surge * hyperfocus,
    tokensPerSecond:
      automationBase * automationMultiplier * tokenMultiplier * surge,
    criticalChance: Math.min(
      0.35,
      0.05 +
        u.critical * 0.02 +
        (progress.abilities.hyperfocus.remaining > 0 ? 0.15 : 0),
    ),
  };
}

export function getTokenMultiplier(prestigeLevel: number): number {
  return 1 + prestigeLevel * TOKEN_MULTIPLIER_PER_PRESTIGE_LEVEL;
}

export function getUpgradeCost(
  progress: GameProgress,
  upgrade: UpgradeDefinition,
  level: number,
): number {
  const discount = Math.max(0.5, 1 - progress.upgrades.optimization * 0.06);
  return Math.ceil(upgrade.baseCost * upgrade.growth ** level * discount);
}

export function getPurchaseQuote(
  progress: GameProgress,
  upgrade: UpgradeDefinition,
  mode: BuyMode,
): PurchaseQuote {
  const limit = mode === 'max' ? 10_000 : mode;
  let cost = 0;
  let count = 0;
  while (count < limit) {
    const next = getUpgradeCost(
      progress,
      upgrade,
      progress.upgrades[upgrade.id] + count,
    );
    if (cost + next > progress.tokens) break;
    cost += next;
    count += 1;
  }
  return { count, cost };
}

function processMilestones(progress: GameProgress): GameProgress {
  let next = progress;
  while (next.tokens >= getRecordTarget(next.highScoreLevel)) {
    const index = next.highScoreLevel;
    next = {
      ...next,
      highScoreLevel: index + 1,
      bonuses: next.bonuses.includes(index)
        ? next.bonuses
        : [...next.bonuses, index],
      pendingPrestigeLevels:
        next.pendingPrestigeLevels +
        (index >= PRESTIGE_UNLOCK_HIGH_SCORE_LEVEL ? index - 2 : 0),
    };
  }
  return next;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first-input',
    name: 'First Input',
    description: 'Click the reactor',
    test: (p) => p.stats.clicks >= 1,
  },
  {
    id: 'rapid-fire',
    name: 'Rapid Fire',
    description: 'Click 100 times',
    test: (p) => p.stats.clicks >= 100,
  },
  {
    id: 'critical-path',
    name: 'Critical Path',
    description: 'Land a critical click',
    test: (p) => p.stats.criticalClicks >= 1,
  },
  {
    id: 'automation',
    name: 'Automation Online',
    description: 'Own an automated producer',
    test: (p) =>
      p.upgrades.gpu +
        p.upgrades.rack +
        p.upgrades.engineer +
        p.upgrades.agentSwarm +
        p.upgrades.orbital >
      0,
  },
  {
    id: 'throughput',
    name: 'Serious Throughput',
    description: 'Reach 100 TPS',
    test: (_p, m) => m.tokensPerSecond >= 100,
  },
  {
    id: 'million',
    name: 'Token Millionaire',
    description: 'Generate 1 million lifetime tokens',
    test: (p) => p.stats.tokens >= 1_000_000,
  },
  {
    id: 'record',
    name: 'Record Breaker',
    description: 'Secure a High Score milestone',
    test: (p) => p.bonuses.length >= 1,
  },
  {
    id: 'six-figures',
    name: 'Six Figures',
    description: 'Secure the 100K milestone',
    test: (p) => p.bonuses.includes(2),
  },
  {
    id: 'surging',
    name: 'Surging',
    description: 'Activate Token Surge',
    test: (p) => p.stats.abilitiesUsed >= 1,
  },
  {
    id: 'focused',
    name: 'Locked In',
    description: 'Activate Hyperfocus',
    test: (p) =>
      p.abilities.hyperfocus.remaining > 0 ||
      p.abilities.hyperfocus.cooldown > 0,
  },
  {
    id: 'full-stack',
    name: 'Full Stack',
    description: 'Own every automation producer',
    test: (p) =>
      ['gpu', 'rack', 'engineer', 'agentSwarm', 'orbital'].every(
        (id) => p.upgrades[id as UpgradeId] > 0,
      ),
  },
  {
    id: 'new-era',
    name: 'New Era',
    description: 'Start new session',
    test: (p) => p.stats.prestiges >= 1,
  },
];

export function unlockAchievements(progress: GameProgress): GameProgress {
  const metrics = calculateMetrics(progress);
  const unlocked = ACHIEVEMENTS.filter((a) => a.test(progress, metrics)).map(
    (a) => a.id,
  );
  const achievements = [...new Set([...progress.achievements, ...unlocked])];
  return achievements.length === progress.achievements.length
    ? progress
    : { ...progress, achievements };
}

function finalize(progress: GameProgress): GameProgress {
  return unlockAchievements(processMilestones(progress));
}

export function clickReactor(
  progress: GameProgress,
  roll = Math.random(),
): { progress: GameProgress; amount: number; critical: boolean } {
  const metrics = calculateMetrics(progress);
  const critical = roll < metrics.criticalChance;
  const amount = metrics.tokensPerClick * (critical ? CRITICAL_MULTIPLIER : 1);
  const next = finalize({
    ...progress,
    tokens: progress.tokens + amount,
    stats: {
      ...progress.stats,
      tokens: progress.stats.tokens + amount,
      manualTokens: progress.stats.manualTokens + amount,
      clicks: progress.stats.clicks + 1,
      criticalClicks: progress.stats.criticalClicks + (critical ? 1 : 0),
      highestTpc: Math.max(progress.stats.highestTpc, amount),
    },
  });
  return { progress: next, amount, critical };
}

export function tickGame(
  progress: GameProgress,
  seconds: number,
): GameProgress {
  const safeSeconds = Math.max(0, Math.min(seconds, 1));
  const metrics = calculateMetrics(progress);
  const amount = metrics.tokensPerSecond * safeSeconds;
  const abilities = Object.fromEntries(
    Object.entries(progress.abilities).map(([id, state]) => [
      id,
      {
        remaining: Math.max(0, state.remaining - safeSeconds),
        cooldown: Math.max(0, state.cooldown - safeSeconds),
      },
    ]),
  ) as GameProgress['abilities'];
  return finalize({
    ...progress,
    tokens: progress.tokens + amount,
    abilities,
    stats: {
      ...progress.stats,
      tokens: progress.stats.tokens + amount,
      playTime: progress.stats.playTime + safeSeconds,
      highestTps: Math.max(progress.stats.highestTps, metrics.tokensPerSecond),
      highestTpc: Math.max(progress.stats.highestTpc, metrics.tokensPerClick),
    },
  });
}

export function purchaseUpgrade(
  progress: GameProgress,
  id: UpgradeId,
  mode: BuyMode,
): GameProgress {
  const upgrade = UPGRADES.find((item) => item.id === id);
  if (!upgrade || progress.stats.tokens < upgrade.unlockAt) return progress;
  const quote = getPurchaseQuote(progress, upgrade, mode);
  if (quote.count === 0) return progress;
  return finalize({
    ...progress,
    tokens: progress.tokens - quote.cost,
    upgrades: {
      ...progress.upgrades,
      [id]: progress.upgrades[id] + quote.count,
    },
    stats: {
      ...progress.stats,
      upgradesPurchased: progress.stats.upgradesPurchased + quote.count,
    },
  });
}

export function activateAbility(
  progress: GameProgress,
  id: AbilityId,
): GameProgress {
  const definition = ABILITIES.find((ability) => ability.id === id);
  const state = progress.abilities[id];
  if (
    !definition ||
    progress.highScoreLevel === 0 ||
    getRecordTarget(progress.highScoreLevel - 1) < definition.unlockAt ||
    state.cooldown > 0
  )
    return progress;
  return unlockAchievements({
    ...progress,
    abilities: {
      ...progress.abilities,
      [id]: {
        remaining: definition.duration,
        cooldown: definition.cooldown,
      },
    },
    stats: {
      ...progress.stats,
      abilitiesUsed: progress.stats.abilitiesUsed + 1,
    },
  });
}

export function prestige(progress: GameProgress): GameProgress {
  if (
    progress.highScoreLevel <= PRESTIGE_UNLOCK_HIGH_SCORE_LEVEL ||
    progress.pendingPrestigeLevels <= 0
  )
    return progress;
  const fresh = createInitialProgress();
  return unlockAchievements({
    ...fresh,
    highScoreLevel: 0,
    bonuses: [...progress.bonuses],
    achievements: [...progress.achievements],
    prestigeLevel: progress.prestigeLevel + progress.pendingPrestigeLevels,
    stats: { ...progress.stats, prestiges: progress.stats.prestiges + 1 },
  });
}

export function formatNumber(value: number): string {
  if (value < 1_000)
    return value < 10 && value % 1 !== 0
      ? value.toFixed(1)
      : Math.floor(value).toLocaleString('en-US');
  const suffixes = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp'];
  const tier = Math.floor(Math.log10(value) / 3);
  if (tier > suffixes.length) return value.toExponential(2);
  const scaled = value / 1_000 ** tier;
  return `${scaled >= 100 ? scaled.toFixed(0) : scaled >= 10 ? scaled.toFixed(1) : scaled.toFixed(2)}${suffixes[tier - 1]}`;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return minutes > 0
    ? `${String(minutes)}m ${String(remaining)}s`
    : `${String(remaining)}s`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function parseSave(raw: string): SaveEnvelope | null {
  try {
    const data: unknown = JSON.parse(raw);
    if (
      !isRecord(data) ||
      data.version !== 1 ||
      !isRecord(data.progress) ||
      !isRecord(data.preferences)
    )
      return null;
    const progress = data.progress as unknown as GameProgress;
    const preferences = data.preferences as unknown as Preferences;
    if (
      !Number.isFinite(progress.tokens) ||
      progress.tokens < 0 ||
      !Number.isInteger(progress.highScoreLevel) ||
      progress.highScoreLevel < 0 ||
      !isRecord(progress.upgrades) ||
      !isRecord(progress.abilities) ||
      !Array.isArray(progress.bonuses) ||
      !Array.isArray(progress.achievements) ||
      !isRecord(progress.stats) ||
      typeof preferences.soundMuted !== 'boolean' ||
      typeof preferences.soundVolume !== 'number' ||
      !Number.isFinite(preferences.soundVolume) ||
      preferences.soundVolume < 0 ||
      preferences.soundVolume > 1 ||
      typeof preferences.musicMuted !== 'boolean' ||
      typeof preferences.musicVolume !== 'number' ||
      !Number.isFinite(preferences.musicVolume) ||
      preferences.musicVolume < 0 ||
      preferences.musicVolume > 1
    )
      return null;
    if (
      data.savedAt !== undefined &&
      (typeof data.savedAt !== 'number' || !Number.isFinite(data.savedAt))
    )
      return null;

    const abilityValues = ABILITIES.flatMap((ability) => {
      const state: unknown = progress.abilities[ability.id];
      return isRecord(state) ? [state.remaining, state.cooldown] : [undefined];
    });
    const numericValues = [
      ...UPGRADES.map((upgrade) => progress.upgrades[upgrade.id]),
      ...abilityValues,
      progress.prestigeLevel,
      progress.pendingPrestigeLevels,
      progress.stats.tokens,
      progress.stats.manualTokens,
      progress.stats.clicks,
      progress.stats.criticalClicks,
      progress.stats.upgradesPurchased,
      progress.stats.abilitiesUsed,
      progress.stats.prestiges,
      progress.stats.playTime,
      progress.stats.highestTps,
      progress.stats.highestTpc,
    ];
    if (
      numericValues.some(
        (value) =>
          typeof value !== 'number' || !Number.isFinite(value) || value < 0,
      )
    )
      return null;
    if (
      !Number.isInteger(progress.prestigeLevel) ||
      !Number.isInteger(progress.pendingPrestigeLevels) ||
      progress.bonuses.some((value) => !Number.isInteger(value) || value < 0) ||
      progress.achievements.some((value) => typeof value !== 'string')
    )
      return null;
    if (
      !isRecord(data.transmissions) ||
      Array.isArray(data.transmissions) ||
      Object.values(data.transmissions).some(
        (value) =>
          typeof value !== 'number' || !Number.isFinite(value) || value < 0,
      )
    )
      return null;
    return {
      ...(data as unknown as SaveEnvelope),
      transmissions: data.transmissions as Record<string, number>,
    };
  } catch {
    return null;
  }
}
