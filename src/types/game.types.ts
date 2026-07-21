export type UpgradeCategory = 'manual' | 'automation' | 'efficiency';

export type UpgradeId =
  | 'keyboard'
  | 'templates'
  | 'worktrees'
  | 'gpu'
  | 'model'
  | 'rack'
  | 'engineer'
  | 'agentSwarm'
  | 'orbital'
  | 'contextCompaction'
  | 'overclock'
  | 'critical'
  | 'optimization';

export type AbilityId = 'surge' | 'hyperfocus';
export type BuyMode = 1 | 10 | 'max';

export interface UpgradeDefinition {
  id: UpgradeId;
  name: string;
  description: string;
  category: UpgradeCategory;
  baseCost: number;
  growth: number;
  revealAt: number;
  unlockAt: number;
  icon: string;
}

export interface AbilityDefinition {
  id: AbilityId;
  name: string;
  description: string;
  icon: string;
  unlockAt: number;
  duration: number;
  cooldown: number;
}

export interface AbilityState {
  remaining: number;
  cooldown: number;
}

export interface LifetimeStats {
  tokens: number;
  manualTokens: number;
  clicks: number;
  criticalClicks: number;
  upgradesPurchased: number;
  abilitiesUsed: number;
  prestiges: number;
  playTime: number;
  highestTps: number;
  highestTpc: number;
}

export interface Preferences {
  musicMuted: boolean;
  musicVolume: number;
  soundMuted: boolean;
  soundVolume: number;
}

export interface GameProgress {
  tokens: number;
  highScoreLevel: number;
  upgrades: Record<UpgradeId, number>;
  abilities: Record<AbilityId, AbilityState>;
  bonuses: number[];
  achievements: string[];
  prestigeLevel: number;
  pendingPrestigeLevels: number;
  stats: LifetimeStats;
}

export interface SaveEnvelope {
  version: 1;
  progress: GameProgress;
  preferences: Preferences;
  transmissions: Record<string, number>;
  savedAt?: number;
}

export interface ProductionMetrics {
  tokensPerClick: number;
  tokensPerSecond: number;
  criticalChance: number;
}

export interface PurchaseQuote {
  count: number;
  cost: number;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  test: (progress: GameProgress, metrics: ProductionMetrics) => boolean;
}
