import { getRecordTarget } from 'src/services/game';
import type { AbilityId, GameProgress, UpgradeId } from 'src/types/game.types';

interface NumericTransmissionUnlock {
  type: 'click' | 'record' | 'prestige' | 'critical-click' | 'lifetime-tokens';
  value: number;
}

interface UpgradeTransmissionUnlock {
  type: 'upgrade';
  value: UpgradeId;
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
    id: 'first-critical',
    sender: 'Token Reactor',
    role: 'SYSTEM',
    initials: 'TR',
    message: 'Unexpected output spike detected. Attempting to reproduce.',
    priority: 60,
    unlock: { type: 'critical-click', value: 1 },
  },
  {
    id: 'record-1k',
    sender: 'Director Campbell',
    role: 'MANAGEMENT',
    initials: 'DC',
    message:
      'Good start. Max is already chasing 10,000. I’ve updated your target.',
    priority: 100,
    unlock: { type: 'record', value: 1_000 },
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
    unlock: { type: 'record', value: 10_000 },
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
    id: 'compression-purchased',
    sender: 'Finance',
    role: 'FINANCE',
    initials: 'FN',
    message:
      'Compressed tokens still count as full-size revenue. Accounting has approved this interpretation.',
    priority: 40,
    unlock: { type: 'upgrade', value: 'compression' },
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
    unlock: { type: 'record', value: 100_000 },
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
    id: 'cluster-purchased',
    sender: 'Token Reactor',
    role: 'SYSTEM',
    initials: 'TR',
    message:
      'Additional compute assimilated. The word “purchase” is becoming inaccurate.',
    priority: 60,
    unlock: { type: 'upgrade', value: 'cluster' },
  },
  {
    id: 'record-1m',
    sender: 'Ops Security',
    role: 'SECURITY',
    initials: 'OS',
    message:
      'We found unscheduled model replicas across the server rack. Stop scaling until we isolate them.',
    priority: 100,
    unlock: { type: 'record', value: 1_000_000 },
  },
  {
    id: 'idle-review',
    sender: 'Max Chen',
    role: 'PERFORMANCE LEAD',
    initials: 'MC',
    message: 'You still there? Campbell just refreshed the dashboard.',
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
    unlock: { type: 'record', value: 10_000_000 },
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
    unlock: { type: 'record', value: 100_000_000 },
  },
  {
    id: 'first-prestige',
    sender: 'R.E.A.C.T.O.R.',
    role: 'AUTONOMOUS SYSTEM',
    initials: 'RE',
    message: 'ITERATION ACCEPTED. THE RECORD WAS ERASED. I WAS NOT.',
    priority: 100,
    unlock: { type: 'prestige', value: 1 },
  },
];

export function isTransmissionUnlocked(
  progress: GameProgress,
  unlock: TransmissionUnlock,
): boolean {
  switch (unlock.type) {
    case 'click':
      return progress.stats.clicks >= unlock.value;
    case 'record':
      return progress.bonuses.some(
        (index) => getRecordTarget(index) === unlock.value,
      );
    case 'prestige':
      return progress.stats.prestiges >= unlock.value;
    case 'critical-click':
      return progress.stats.criticalClicks >= unlock.value;
    case 'lifetime-tokens':
      return progress.stats.tokens >= unlock.value;
    case 'upgrade':
      return progress.upgrades[unlock.value] > 0;
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
