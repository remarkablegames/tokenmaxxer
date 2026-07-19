import { createInitialProgress } from 'src/services/game';
import type { SaveEnvelope } from 'src/types/game.types';

interface PreviewConfig {
  mode: 'high-score' | 'prestige' | null;
  tokens?: number;
  enabled: boolean;
}

export function parsePreviewSearch(search: string): PreviewConfig {
  const parameters = new URLSearchParams(search);
  const requestedMode = parameters.get('preview');
  const mode =
    requestedMode === 'high-score' || requestedMode === 'prestige'
      ? requestedMode
      : null;
  const requestedTokens = parameters.get('tokens');
  const parsedTokens =
    requestedTokens === null || requestedTokens.trim() === ''
      ? undefined
      : Number(requestedTokens);
  const tokens =
    parsedTokens !== undefined &&
    Number.isFinite(parsedTokens) &&
    parsedTokens >= 0
      ? parsedTokens
      : undefined;

  return {
    mode,
    ...(tokens === undefined ? {} : { tokens }),
    enabled: mode !== null || tokens !== undefined,
  };
}

export function applyPreview(
  save: SaveEnvelope,
  config: PreviewConfig,
): SaveEnvelope {
  if (!config.enabled) return save;

  let progress = save.progress;
  if (config.mode === 'prestige') {
    const prepared = createInitialProgress();
    progress = {
      ...prepared,
      tokens: 100_000_000,
      recordIndex: 6,
      bonuses: [0, 1, 2, 3, 4, 5],
      pendingPrestigeLevels: 3,
      stats: { ...prepared.stats, tokens: 100_000_000 },
    };
  }
  if (config.tokens !== undefined)
    progress = { ...progress, tokens: config.tokens };

  const preview: SaveEnvelope = { ...save, progress };
  delete preview.savedAt;
  return preview;
}
