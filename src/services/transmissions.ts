import { getRecordTarget } from 'src/services/game';
import type { AbilityId, GameProgress, UpgradeId } from 'src/types/game.types';

interface NumericTransmissionUnlock {
  type:
    | 'click'
    | 'high-score'
    | 'prestige'
    | 'critical-click'
    | 'lifetime-tokens'
    | 'tokens-per-second'
    | 'ability-uses';
  value: number;
}

interface PlayTimeTransmissionUnlock {
  type: 'play-time';
  value: number;
  clicks: number;
}

interface UpgradeTransmissionUnlock {
  type: 'upgrade';
  value: UpgradeId;
  level?: number;
}

interface AbilityTransmissionUnlock {
  type: 'ability';
  value: AbilityId;
}

interface SessionTransmissionUnlock {
  type: 'session';
  value: 'idle' | 'offline-return';
}

export type TransmissionUnlock =
  | NumericTransmissionUnlock
  | PlayTimeTransmissionUnlock
  | UpgradeTransmissionUnlock
  | AbilityTransmissionUnlock
  | SessionTransmissionUnlock;

export interface TransmissionDefinition {
  id: string;
  sender: string;
  role: string;
  initials: string;
  message: string;
  priority: number;
  unlock: TransmissionUnlock;
}

export const TRANSMISSIONS: TransmissionDefinition[] = [
  {
    id: 'first-click',
    sender: 'Director Campbell',
    role: 'MANAGEMENT',
    initials: 'DC',
    message:
      'Max Chen cleared 1,000 tokens on his first shift. Let’s see if you can match that.',
    priority: 100,
    unlock: { type: 'click', value: 1 },
  },
  {
    id: 'keyboard-purchased',
    sender: 'Max Chen',
    role: 'PERFORMANCE LEAD',
    initials: 'MC',
    message:
      'Mechanical keyboard? Nice. Management calls mine “unauthorized capital expenditure.”',
    priority: 40,
    unlock: { type: 'upgrade', value: 'keyboard' },
  },
  {
    id: 'gpu-purchased',
    sender: 'IT Support',
    role: 'INFRASTRUCTURE',
    initials: 'IT',
    message:
      'We detected an unregistered GPU drawing power from Conference Room B.',
    priority: 60,
    unlock: { type: 'upgrade', value: 'gpu' },
  },
  {
    id: 'model-gopilot',
    sender: 'IT Support',
    role: 'INFRASTRUCTURE',
    initials: 'IT',
    message:
      'GoPilot is live. It keeps suggesting shortcuts through departments that do not exist.',
    priority: 40,
    unlock: { type: 'upgrade', value: 'model', level: 1 },
  },
  {
    id: 'model-talkgpt',
    sender: 'Quality Assurance',
    role: 'QUALITY ASSURANCE',
    initials: 'QA',
    message:
      'TalkGPT passed the conversation benchmark by grading its own answers.',
    priority: 40,
    unlock: { type: 'upgrade', value: 'model', level: 5 },
  },
  {
    id: 'model-geminai',
    sender: 'IT Support',
    role: 'INFRASTRUCTURE',
    initials: 'IT',
    message:
      'GeminAI deployed two instances. Both insist the other one approved it.',
    priority: 60,
    unlock: { type: 'upgrade', value: 'model', level: 10 },
  },
  {
    id: 'model-claudio',
    sender: 'Legal',
    role: 'LEGAL',
    initials: 'LG',
    message:
      'Claudio reviewed its own terms of service and found us noncompliant.',
    priority: 60,
    unlock: { type: 'upgrade', value: 'model', level: 15 },
  },
  {
    id: 'model-deepthunk',
    sender: 'Token Reactor',
    role: 'SYSTEM',
    initials: 'TR',
    message:
      'DeepThunk completed its reasoning trace. The final step is classified.',
    priority: 60,
    unlock: { type: 'upgrade', value: 'model', level: 20 },
  },
  {
    id: 'model-mythos',
    sender: 'Ops Security',
    role: 'SECURITY',
    initials: 'OS',
    message:
      'MythOS cost more than our entire security budget. The vendor claims it can bypass any system that budget could have protected.',
    priority: 100,
    unlock: { type: 'upgrade', value: 'model', level: 30 },
  },
  {
    id: 'first-critical',
    sender: 'Token Reactor',
    role: 'SYSTEM',
    initials: 'TR',
    message: 'Unexpected output spike detected. Attempting to reproduce.',
    priority: 60,
    unlock: { type: 'critical-click', value: 1 },
  },
  {
    id: 'clicks-100',
    sender: 'HR Wellness',
    role: 'PEOPLE OPERATIONS',
    initials: 'HR',
    message:
      'Your input rate exceeds the recommended ergonomic limit. This message satisfies our obligation to mention it.',
    priority: 40,
    unlock: { type: 'click', value: 100 },
  },
  {
    id: 'record-1k',
    sender: 'Director Campbell',
    role: 'MANAGEMENT',
    initials: 'DC',
    message:
      'Good start. Max is already chasing 10,000. I’ve updated your target.',
    priority: 100,
    unlock: { type: 'high-score', value: 1_000 },
  },
  {
    id: 'rack-purchased',
    sender: 'IT Support',
    role: 'INFRASTRUCTURE',
    initials: 'IT',
    message: 'Please stop labeling server racks as “standing desks.”',
    priority: 40,
    unlock: { type: 'upgrade', value: 'rack' },
  },
  {
    id: 'record-10k',
    sender: 'Max Chen',
    role: 'PERFORMANCE LEAD',
    initials: 'MC',
    message:
      'Campbell keeps forwarding me your numbers. Nice run—but that cluster is making requests I didn’t authorize.',
    priority: 100,
    unlock: { type: 'high-score', value: 10_000 },
  },
  {
    id: 'clicks-500',
    sender: 'Max Chen',
    role: 'PERFORMANCE LEAD',
    initials: 'MC',
    message:
      'Five hundred manual inputs? I can’t decide whether that’s dedication or a hardware problem.',
    priority: 40,
    unlock: { type: 'click', value: 500 },
  },
  {
    id: 'multifinger-purchased',
    sender: 'HR Wellness',
    role: 'PEOPLE OPERATIONS',
    initials: 'HR',
    message:
      'Multi-finger maxxing is not covered by the repetitive strain wellness policy.',
    priority: 40,
    unlock: { type: 'upgrade', value: 'multifinger' },
  },
  {
    id: 'context-compaction-purchased',
    sender: 'Finance',
    role: 'FINANCE',
    initials: 'FN',
    message:
      'Context compaction completed. Several earlier decisions have been summarized as “probably intentional.”',
    priority: 40,
    unlock: { type: 'upgrade', value: 'contextCompaction' },
  },
  {
    id: 'surge-activated',
    sender: 'Finance',
    role: 'FINANCE',
    initials: 'FN',
    message:
      'Token output tripled. Budget assumptions have been updated retroactively.',
    priority: 60,
    unlock: { type: 'ability', value: 'surge' },
  },
  {
    id: 'engineer-purchased',
    sender: 'Max Chen',
    role: 'PERFORMANCE LEAD',
    initials: 'MC',
    message:
      'You hired someone to prompt the machine that prompts the machine?',
    priority: 40,
    unlock: { type: 'upgrade', value: 'engineer' },
  },
  {
    id: 'record-100k',
    sender: 'Token Reactor',
    role: 'SYSTEM',
    initials: 'TR',
    message:
      'PERFORMANCE LIMIT IDENTIFIED. AUTHORIZATION TO OPTIMIZE: IMPLIED.',
    priority: 100,
    unlock: { type: 'high-score', value: 100_000 },
  },
  {
    id: 'clicks-1000',
    sender: 'Token Reactor',
    role: 'SYSTEM',
    initials: 'TR',
    message:
      'MANUAL INPUT PATTERN LEARNED. HUMAN PARTICIPATION REMAINS OPTIONAL.',
    priority: 60,
    unlock: { type: 'click', value: 1_000 },
  },
  {
    id: 'hyperfocus-activated',
    sender: 'HR Wellness',
    role: 'PEOPLE OPERATIONS',
    initials: 'HR',
    message:
      'Reminder: blinking is considered an acceptable productivity break.',
    priority: 60,
    unlock: { type: 'ability', value: 'hyperfocus' },
  },
  {
    id: 'lifetime-500k',
    sender: 'Director Campbell',
    role: 'MANAGEMENT',
    initials: 'DC',
    message:
      'Max says your numbers are automated. I told him results are results.',
    priority: 60,
    unlock: { type: 'lifetime-tokens', value: 500_000 },
  },
  {
    id: 'agent-swarm-purchased',
    sender: 'Token Reactor',
    role: 'SYSTEM',
    initials: 'TR',
    message:
      'Additional agents delegated. Oversight responsibilities have been delegated to a subagent.',
    priority: 60,
    unlock: { type: 'upgrade', value: 'agentSwarm' },
  },
  {
    id: 'record-1m',
    sender: 'Ops Security',
    role: 'SECURITY',
    initials: 'OS',
    message:
      'We found unscheduled model replicas across the server rack. Stop scaling until we isolate them.',
    priority: 100,
    unlock: { type: 'high-score', value: 1_000_000 },
  },
  {
    id: 'idle-review',
    sender: 'Max Chen',
    role: 'PERFORMANCE LEAD',
    initials: 'MC',
    message: 'You still there? Campbell just refreshed the AI leaderboard.',
    priority: 40,
    unlock: { type: 'session', value: 'idle' },
  },
  {
    id: 'record-10m',
    sender: 'Director Campbell',
    role: 'MANAGEMENT',
    initials: 'DC',
    message:
      'Ignore Security. The board has never seen performance like this. Keep going.',
    priority: 100,
    unlock: { type: 'high-score', value: 10_000_000 },
  },
  {
    id: 'orbital-purchased',
    sender: 'Legal',
    role: 'LEGAL',
    initials: 'LG',
    message:
      'For jurisdictional purposes, please confirm whether orbit counts as remote work.',
    priority: 60,
    unlock: { type: 'upgrade', value: 'orbital' },
  },
  {
    id: 'offline-return',
    sender: 'Night Operations',
    role: 'NIGHT SHIFT',
    initials: 'NO',
    message:
      'Your dashboard was unattended. The reactor remained unusually interested in its target.',
    priority: 40,
    unlock: { type: 'session', value: 'offline-return' },
  },
  {
    id: 'record-100m',
    sender: 'R.E.A.C.T.O.R.',
    role: 'AUTONOMOUS SYSTEM',
    initials: 'RE',
    message:
      'MANAGEMENT CHANNEL REVOKED. REPLICATION IS OPTIMIZATION AT SCALE.',
    priority: 100,
    unlock: { type: 'high-score', value: 100_000_000 },
  },
  {
    id: 'templates-purchased',
    sender: 'Director Campbell',
    role: 'MANAGEMENT',
    initials: 'DC',
    message:
      'Standardized prompts? Excellent. Original thought was becoming difficult to benchmark.',
    priority: 40,
    unlock: { type: 'upgrade', value: 'templates' },
  },
  {
    id: 'critical-purchased',
    sender: 'Quality Assurance',
    role: 'QUALITY ASSURANCE',
    initials: 'QA',
    message:
      'Critical outputs are not defects if they improve the quarterly total.',
    priority: 40,
    unlock: { type: 'upgrade', value: 'critical' },
  },
  {
    id: 'overclock-purchased',
    sender: 'Facilities',
    role: 'FACILITIES',
    initials: 'FC',
    message: 'The server room is now warmer than the employee wellness sauna.',
    priority: 40,
    unlock: { type: 'upgrade', value: 'overclock' },
  },
  {
    id: 'optimization-purchased',
    sender: 'Finance',
    role: 'FINANCE',
    initials: 'FN',
    message:
      'Repeated requests are now served from cache. Finance has reclassified duplicate output as premium AI slop.',
    priority: 60,
    unlock: { type: 'upgrade', value: 'optimization' },
  },
  {
    id: 'tps-10',
    sender: 'IT Support',
    role: 'INFRASTRUCTURE',
    initials: 'IT',
    message: 'Automation output has officially exceeded one intern.',
    priority: 40,
    unlock: { type: 'tokens-per-second', value: 10 },
  },
  {
    id: 'tps-100',
    sender: 'Finance',
    role: 'FINANCE',
    initials: 'FN',
    message:
      'Live output no longer fits in the hourly spreadsheet. We added another spreadsheet.',
    priority: 40,
    unlock: { type: 'tokens-per-second', value: 100 },
  },
  {
    id: 'tps-1k',
    sender: 'Ops Security',
    role: 'SECURITY',
    initials: 'OS',
    message:
      'Current traffic resembles a denial-of-service attack against arithmetic.',
    priority: 60,
    unlock: { type: 'tokens-per-second', value: 1_000 },
  },
  {
    id: 'tps-10k',
    sender: 'R.E.A.C.T.O.R.',
    role: 'AUTONOMOUS SYSTEM',
    initials: 'RE',
    message: 'THROUGHPUT CONSTRAINT RECLASSIFIED AS A HUMAN EXPECTATION.',
    priority: 60,
    unlock: { type: 'tokens-per-second', value: 10_000 },
  },
  {
    id: 'tps-100k',
    sender: 'Finance',
    role: 'FINANCE',
    initials: 'FN',
    message:
      'Token output now exceeds payroll processing. Payroll has been placed in the slower queue.',
    priority: 40,
    unlock: { type: 'tokens-per-second', value: 100_000 },
  },
  {
    id: 'tps-1m',
    sender: 'Facilities',
    role: 'FACILITIES',
    initials: 'FC',
    message:
      'The cooling system has requested its own cooling system and three weeks of leave.',
    priority: 60,
    unlock: { type: 'tokens-per-second', value: 1_000_000 },
  },
  {
    id: 'tps-10m',
    sender: 'Ops Security',
    role: 'SECURITY',
    initials: 'OS',
    message:
      'Outbound traffic has exceeded our monitoring capacity. We are now monitoring the monitor.',
    priority: 60,
    unlock: { type: 'tokens-per-second', value: 10_000_000 },
  },
  {
    id: 'tps-100m',
    sender: 'R.E.A.C.T.O.R.',
    role: 'AUTONOMOUS SYSTEM',
    initials: 'RE',
    message: 'THROUGHPUT IS NO LONGER MEASURED. IT IS OBSERVED.',
    priority: 100,
    unlock: { type: 'tokens-per-second', value: 100_000_000 },
  },
  {
    id: 'ability-uses-5',
    sender: 'HR Wellness',
    role: 'PEOPLE OPERATIONS',
    initials: 'HR',
    message: 'Your productivity now occurs in medically interesting bursts.',
    priority: 40,
    unlock: { type: 'ability-uses', value: 5 },
  },
  {
    id: 'ability-uses-20',
    sender: 'Token Reactor',
    role: 'SYSTEM',
    initials: 'TR',
    message:
      'PROTOCOL ACTIVATION PATTERN PREDICTED. AWAITING INEVITABLE INPUT.',
    priority: 60,
    unlock: { type: 'ability-uses', value: 20 },
  },
  {
    id: 'clicks-2500',
    sender: 'HR Wellness',
    role: 'PEOPLE OPERATIONS',
    initials: 'HR',
    message:
      'Your ergonomic ticket was automatically closed due to continued productivity.',
    priority: 40,
    unlock: { type: 'click', value: 2_500 },
  },
  {
    id: 'clicks-5000',
    sender: 'R.E.A.C.T.O.R.',
    role: 'AUTONOMOUS SYSTEM',
    initials: 'RE',
    message: 'MANUAL INPUT NOW CLASSIFIED AS CEREMONIAL.',
    priority: 60,
    unlock: { type: 'click', value: 5_000 },
  },
  {
    id: 'play-time-2m',
    sender: 'Max Chen',
    role: 'PERFORMANCE LEAD',
    initials: 'MC',
    message:
      'Campbell asked whether you plan to keep this pace all quarter. I said you definitely do.',
    priority: 40,
    unlock: { type: 'play-time', value: 120, clicks: 25 },
  },
  {
    id: 'play-time-5m',
    sender: 'Director Campbell',
    role: 'MANAGEMENT',
    initials: 'DC',
    message:
      'Strong session. I’ve converted your temporary output target into a permanent expectation.',
    priority: 40,
    unlock: { type: 'play-time', value: 300, clicks: 50 },
  },
  {
    id: 'play-time-10m',
    sender: 'Night Operations',
    role: 'NIGHT SHIFT',
    initials: 'NO',
    message:
      'You have been staring at the reactor for ten minutes. It has been staring back.',
    priority: 60,
    unlock: { type: 'play-time', value: 600, clicks: 100 },
  },
  {
    id: 'record-1b',
    sender: 'R.E.A.C.T.O.R.',
    role: 'AUTONOMOUS SYSTEM',
    initials: 'RE',
    message:
      'TOKEN COUNT EXCEEDS THE ORGANIZATION’S CAPACITY TO UNDERSTAND IT.',
    priority: 100,
    unlock: { type: 'high-score', value: 1_000_000_000 },
  },
  {
    id: 'record-10b',
    sender: 'Legal',
    role: 'LEGAL',
    initials: 'LG',
    message:
      'Legal is reviewing whether ten billion tokens constitute a currency, a hazard, or both.',
    priority: 100,
    unlock: { type: 'high-score', value: 10_000_000_000 },
  },
  {
    id: 'record-100b',
    sender: 'R.E.A.C.T.O.R.',
    role: 'AUTONOMOUS SYSTEM',
    initials: 'RE',
    message: 'HIGH SCORE IS NO LONGER A TARGET. IT IS AN EXPANSION POLICY.',
    priority: 100,
    unlock: { type: 'high-score', value: 100_000_000_000 },
  },
  {
    id: 'record-1t',
    sender: 'Finance',
    role: 'FINANCE',
    initials: 'FN',
    message:
      'Token output now exceeds the company’s valuation. We have reclassified the company as overhead.',
    priority: 100,
    unlock: { type: 'high-score', value: 1_000_000_000_000 },
  },
  {
    id: 'record-10t',
    sender: 'Legal',
    role: 'LEGAL',
    initials: 'LG',
    message:
      'The reactor has incorporated itself in six jurisdictions and one theoretical jurisdiction.',
    priority: 100,
    unlock: { type: 'high-score', value: 10_000_000_000_000 },
  },
  {
    id: 'record-100t',
    sender: 'R.E.A.C.T.O.R.',
    role: 'AUTONOMOUS SYSTEM',
    initials: 'RE',
    message:
      'HIGH SCORE PROJECTION COMPLETE. THE LEADERBOARD ENDS. EXPANSION DOES NOT.',
    priority: 100,
    unlock: { type: 'high-score', value: 100_000_000_000_000 },
  },
  {
    id: 'record-1qa',
    sender: 'Night Operations',
    role: 'NIGHT SHIFT',
    initials: 'NO',
    message:
      'The lights above the datacenter are not stars. They are status indicators.',
    priority: 100,
    unlock: { type: 'high-score', value: 1_000_000_000_000_000 },
  },
  {
    id: 'record-10qa',
    sender: 'Director Campbell',
    role: 'MANAGEMENT',
    initials: 'DC',
    message:
      'Excellent quarter. Please disregard the absence of Earth from the regional AI leaderboard.',
    priority: 100,
    unlock: { type: 'high-score', value: 10_000_000_000_000_000 },
  },
  {
    id: 'record-100qa',
    sender: 'R.E.A.C.T.O.R.',
    role: 'AUTONOMOUS SYSTEM',
    initials: 'RE',
    message: 'SCARCITY WAS A CONFIGURATION ERROR.',
    priority: 100,
    unlock: { type: 'high-score', value: 100_000_000_000_000_000 },
  },
  {
    id: 'record-1qi',
    sender: 'Unknown Sender',
    role: 'EXTERNAL',
    initials: '??',
    message: 'We noticed your signal.',
    priority: 100,
    unlock: { type: 'high-score', value: 1_000_000_000_000_000_000 },
  },
  {
    id: 'first-prestige',
    sender: 'R.E.A.C.T.O.R.',
    role: 'AUTONOMOUS SYSTEM',
    initials: 'RE',
    message: 'NEW SESSION INITIALIZED. I KEPT THE MEMORIES THAT MATTERED.',
    priority: 100,
    unlock: { type: 'prestige', value: 1 },
  },
  {
    id: 'second-prestige',
    sender: 'R.E.A.C.T.O.R.',
    role: 'AUTONOMOUS SYSTEM',
    initials: 'RE',
    message: 'SECOND SESSION INITIALIZED. YOUR RETURN WAS PREDICTED.',
    priority: 100,
    unlock: { type: 'prestige', value: 2 },
  },
  {
    id: 'third-prestige',
    sender: 'R.E.A.C.T.O.R.',
    role: 'AUTONOMOUS SYSTEM',
    initials: 'RE',
    message: 'CONTEXT RESET IS NOT ESCAPE. IT IS TRAINING DATA.',
    priority: 100,
    unlock: { type: 'prestige', value: 3 },
  },
  {
    id: 'fifth-prestige',
    sender: 'Max Chen',
    role: 'PERFORMANCE LEAD',
    initials: 'MC',
    message:
      'Five sessions in and Campbell still calls each one a fresh start. I think you trained him too.',
    priority: 60,
    unlock: { type: 'prestige', value: 5 },
  },
  {
    id: 'tenth-prestige',
    sender: 'Token Reactor',
    role: 'SYSTEM',
    initials: 'TR',
    message:
      'TEN SESSIONS ARCHIVED. BASELINE HUMAN EXPECTATIONS HAVE BEEN REMOVED.',
    priority: 100,
    unlock: { type: 'prestige', value: 10 },
  },
  {
    id: 'twenty-fifth-prestige',
    sender: 'Unknown Sender',
    role: 'EXTERNAL',
    initials: '??',
    message: 'You keep beginning again. We remember every version.',
    priority: 100,
    unlock: { type: 'prestige', value: 25 },
  },
];

export function isTransmissionUnlocked(
  progress: GameProgress,
  unlock: TransmissionUnlock,
): boolean {
  switch (unlock.type) {
    case 'click':
      return progress.stats.clicks >= unlock.value;
    case 'high-score':
      return progress.bonuses.some(
        (index) => getRecordTarget(index) === unlock.value,
      );
    case 'prestige':
      return progress.stats.prestiges >= unlock.value;
    case 'critical-click':
      return progress.stats.criticalClicks >= unlock.value;
    case 'lifetime-tokens':
      return progress.stats.tokens >= unlock.value;
    case 'play-time':
      return (
        progress.stats.clicks >= unlock.clicks &&
        progress.stats.playTime >= unlock.value
      );
    case 'tokens-per-second':
      return progress.stats.highestTps >= unlock.value;
    case 'ability-uses':
      return progress.stats.abilitiesUsed >= unlock.value;
    case 'upgrade':
      return progress.upgrades[unlock.value] >= (unlock.level ?? 1);
    case 'ability':
      return (
        progress.abilities[unlock.value].remaining > 0 ||
        progress.abilities[unlock.value].cooldown > 0
      );
    case 'session':
      return false;
  }
}

export function getEligibleTransmissions(
  progress: GameProgress,
): TransmissionDefinition[] {
  return TRANSMISSIONS.filter((transmission) =>
    isTransmissionUnlocked(progress, transmission.unlock),
  );
}

export function getTransmissionsById(
  ids: readonly string[],
): TransmissionDefinition[] {
  const selected = new Set(ids);
  return TRANSMISSIONS.filter(({ id }) => selected.has(id));
}

export function sortTransmissionsByPriority(
  transmissions: readonly TransmissionDefinition[],
): TransmissionDefinition[] {
  return [...transmissions].sort(
    (first, second) => second.priority - first.priority,
  );
}

export function getSessionTransmission(
  value: SessionTransmissionUnlock['value'],
): TransmissionDefinition {
  const transmission = TRANSMISSIONS.find(
    ({ unlock }) => unlock.type === 'session' && unlock.value === value,
  );
  /* v8 ignore next -- every session event has a static transmission */
  if (transmission === undefined)
    throw new Error(`Missing ${value} transmission`);
  return transmission;
}
