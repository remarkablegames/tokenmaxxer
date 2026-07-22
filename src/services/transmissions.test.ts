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
    expect(TRANSMISSIONS).toHaveLength(116);
    expect(new Set(TRANSMISSIONS.map(({ id }) => id)).size).toBe(116);
    expect(new Set(TRANSMISSIONS.map(({ sender }) => sender)).size).toBe(14);
    expect(TRANSMISSIONS.every(({ priority }) => priority > 0)).toBe(true);
    expect(
      TRANSMISSIONS.find(({ id }) => id === 'agent-swarm-purchased')?.message,
    ).toContain('delegated to a subagent');
    expect(
      TRANSMISSIONS.find(({ id }) => id === 'context-compaction-purchased')
        ?.message,
    ).toBe(
      'Context compaction completed. Several earlier decisions have been summarized as “probably intentional.”',
    );
    expect(
      TRANSMISSIONS.find(({ id }) => id === 'optimization-purchased')?.message,
    ).toContain('premium AI slop');
    expect(
      TRANSMISSIONS.find(({ id }) => id === 'templates-purchased')?.message,
    ).toBe(
      'Skill installed. Verbosity increased by 25%. Usefulness remains within benchmark variance.',
    );
    expect(
      TRANSMISSIONS.find(({ id }) => id === 'worktrees-purchased')?.message,
    ).toBe(
      'Parallel worktrees online. Every branch can now fix its own merge conflicts.',
    );
    expect(
      TRANSMISSIONS.find(({ id }) => id === 'model-croak-social'),
    ).toMatchObject({ sender: 'Biz Comms', role: 'PR & BRAND' });
    expect(
      TRANSMISSIONS.find(({ id }) => id === 'fomo-token-cache')?.message,
    ).toContain('Unused token cache');
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
        'rebuild',
        'reclaimed-high-score',
      ]),
    );
  });

  it('announces major production market reveals at their progression thresholds', () => {
    const progress = createInitialProgress();
    const reveals = [
      ['reveal-automation-fleet', 50],
      ['reveal-ai-model', 100],
      ['reveal-parallel-worktrees', 1_000],
      ['reveal-efficiency-lab', 5_000],
      ['reveal-agent-swarm', 100_000],
      ['reveal-orbital-datacenter', 1_000_000],
    ] as const;

    for (const [id, threshold] of reveals) {
      progress.stats.tokens = threshold - 1;
      expect(
        getEligibleTransmissions(progress).map(({ id }) => id),
      ).not.toContain(id);

      progress.stats.tokens = threshold;
      expect(getEligibleTransmissions(progress).map(({ id }) => id)).toContain(
        id,
      );
    }

    expect(
      TRANSMISSIONS.find(({ id }) => id === 'reveal-efficiency-lab')?.message,
    ).toBe(
      'The Frontier Research Lab is now accepting production workloads. Legal has reclassified “experimental” as “early access.”',
    );
    expect(
      TRANSMISSIONS.find(({ id }) => id === 'reveal-ai-model')?.message,
    ).toBe(
      'Model licensing options have been added. API usage is billed separately, including requests made to check the bill.',
    );
  });

  it('derives permanent unlocks from every kind of game progress', () => {
    const progress = createInitialProgress();
    expect(getEligibleTransmissions(progress)).toEqual([]);

    progress.stats.clicks = 50_000;
    progress.stats.criticalClicks = 1;
    progress.stats.tokens = 3_000_000_000;
    progress.stats.prestiges = 100;
    progress.stats.abilitiesUsed = 100;
    progress.stats.playTime = 1_200;
    progress.stats.highestTps = 1_000_000_000_000;
    progress.upgrades.keyboard = 1;
    progress.upgrades.templates = 1;
    progress.upgrades.gpu = 1;
    progress.upgrades.model = 85;
    progress.upgrades.rack = 1;
    progress.upgrades.worktrees = 1;
    progress.upgrades.contextCompaction = 1;
    progress.upgrades.critical = 1;
    progress.upgrades.overclock = 1;
    progress.upgrades.optimization = 1;
    progress.upgrades.engineer = 1;
    progress.upgrades.agentSwarm = 1;
    progress.upgrades.orbital = 1;
    progress.abilities.surge.cooldown = 1;
    progress.abilities.hyperfocus.remaining = 1;
    progress.highScoreLevel = 22;
    progress.bonuses = Array.from({ length: 22 }, (_, index) => index);

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
    ).toEqual(['model-croak', 'model-croak-social']);

    progress.upgrades.model = 85;
    expect(
      getEligibleTransmissions(progress)
        .filter(({ id }) => id.startsWith('model-'))
        .map(({ id }) => id),
    ).toEqual([
      'model-croak',
      'model-croak-social',
      'model-gopilot',
      'model-gopilot-licensing',
      'model-talkgpt',
      'model-talkgpt-citations',
      'model-geminai',
      'model-geminai-merger',
      'model-claudio',
      'model-claudio-policy',
      'model-deepthunk',
      'model-deepthunk-training',
      'model-babble',
      'model-babble-access',
      'model-gimme-k05',
      'model-gimme-k05-attention',
      'model-legendos',
      'model-legendos-firewall',
    ]);
  });

  it('spaces model follow-ups within their ten-level bands', () => {
    const progress = createInitialProgress();

    const modelTransmissionIds = (): string[] =>
      getEligibleTransmissions(progress)
        .filter(({ id }) => id.startsWith('model-'))
        .map(({ id }) => id);

    progress.upgrades.model = 4;
    expect(modelTransmissionIds()).toEqual(['model-croak']);
    progress.upgrades.model = 5;
    expect(modelTransmissionIds()).toEqual([
      'model-croak',
      'model-croak-social',
    ]);

    progress.upgrades.model = 14;
    expect(modelTransmissionIds()).not.toContain('model-gopilot-licensing');
    progress.upgrades.model = 15;
    expect(modelTransmissionIds()).toContain('model-gopilot-licensing');

    progress.upgrades.model = 54;
    expect(modelTransmissionIds()).not.toContain('model-deepthunk-training');
    progress.upgrades.model = 55;
    expect(modelTransmissionIds()).toContain('model-deepthunk-training');

    progress.upgrades.model = 64;
    expect(modelTransmissionIds()).not.toContain('model-babble-access');
    progress.upgrades.model = 65;
    expect(modelTransmissionIds()).toContain('model-babble-access');

    progress.upgrades.model = 74;
    expect(modelTransmissionIds()).not.toContain('model-gimme-k05-attention');
    progress.upgrades.model = 75;
    expect(modelTransmissionIds()).toContain('model-gimme-k05-attention');

    progress.upgrades.model = 84;
    expect(modelTransmissionIds()).not.toContain('model-legendos-firewall');
    progress.upgrades.model = 85;
    expect(modelTransmissionIds()).toContain('model-legendos-firewall');
  });

  it('paces engagement satire across distinct progression triggers', () => {
    const engagementIds = new Set([
      'fomo-comparison',
      'fomo-adoption',
      'fomo-token-cache',
      'fomo-muted',
      'addiction-blink',
      'addiction-reopened',
      'addiction-streak',
      'addiction-rest',
      'ai-delusion-roles',
      'ai-delusion-admin',
      'ai-delusion-special',
      'ai-delusion-denial',
    ]);
    const engagement = TRANSMISSIONS.filter(({ id }) => engagementIds.has(id));

    expect(engagement).toHaveLength(12);
    expect(
      new Set(engagement.map(({ unlock }) => JSON.stringify(unlock))).size,
    ).toBe(12);
    expect(engagement.map(({ unlock }) => unlock)).toEqual([
      { type: 'click', value: 1_500 },
      { type: 'lifetime-tokens', value: 2_000_000 },
      { type: 'tokens-per-second', value: 30_000 },
      { type: 'play-time', value: 900, clicks: 150 },
      { type: 'play-time', value: 1_200, clicks: 200 },
      { type: 'click', value: 7_500 },
      { type: 'ability-uses', value: 35 },
      { type: 'prestige', value: 7 },
      { type: 'upgrade', value: 'model', level: 28 },
      { type: 'upgrade', value: 'model', level: 48 },
      { type: 'upgrade', value: 'model', level: 68 },
      { type: 'lifetime-tokens', value: 3_000_000_000 },
    ]);
  });

  it('continues narrative rewards throughout the extended endgame', () => {
    const progress = createInitialProgress();
    progress.upgrades.model = 85;
    progress.stats.highestTps = 1_000_000_000_000;
    progress.stats.clicks = 50_000;
    progress.stats.abilitiesUsed = 100;
    progress.stats.prestiges = 100;
    progress.bonuses = Array.from({ length: 22 }, (_, index) => index);

    const eligibleIds = getEligibleTransmissions(progress).map(({ id }) => id);
    expect(eligibleIds).toEqual(
      expect.arrayContaining([
        'model-legendos-firewall',
        'record-1sp',
        'tps-1t',
        'clicks-50000',
        'ability-uses-100',
        'hundredth-prestige',
      ]),
    );
  });

  it('unlocks new narrative beats while rebuilding after a prestige', () => {
    const progress = createInitialProgress();
    progress.stats.prestiges = 1;

    const newSessionIds = (): string[] =>
      getEligibleTransmissions(progress)
        .filter(({ id }) => id.startsWith('new-session-'))
        .map(({ id }) => id);

    expect(newSessionIds()).toEqual([]);

    progress.upgrades.gpu = 1;
    expect(newSessionIds()).toEqual(['new-session-automation']);

    progress.highScoreLevel = 3;
    expect(newSessionIds()).toEqual([
      'new-session-automation',
      'new-session-100k',
    ]);

    progress.stats.prestiges = 2;
    progress.upgrades.model = 1;
    expect(newSessionIds()).toEqual([
      'new-session-automation',
      'new-session-100k',
      'new-session-model',
    ]);

    progress.stats.prestiges = 3;
    progress.highScoreLevel = 6;
    expect(newSessionIds()).toEqual([
      'new-session-automation',
      'new-session-100k',
      'new-session-model',
      'new-session-100m',
    ]);
  });

  it('delays the first critical message until 200 total clicks', () => {
    const progress = createInitialProgress();
    progress.stats.criticalClicks = 1;
    progress.stats.clicks = 199;
    expect(
      getEligibleTransmissions(progress).map(({ id }) => id),
    ).not.toContain('first-critical');

    progress.stats.clicks = 200;
    expect(getEligibleTransmissions(progress).map(({ id }) => id)).toContain(
      'first-critical',
    );
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
      sortTransmissionsByPriority(
        getTransmissionsById(['keyboard-purchased', 'first-click']),
      ).map(({ id }) => id),
    ).toEqual(['first-click', 'keyboard-purchased']);
  });
});
