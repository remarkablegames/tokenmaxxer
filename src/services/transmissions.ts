import { getRecordTarget } from 'src/services/game';
import type { GameProgress } from 'src/types/game.types';

export interface TransmissionUnlock {
  type: 'click' | 'record' | 'prestige';
  value: number;
}

export interface TransmissionDefinition {
  id: string;
  sender: string;
  role: string;
  initials: string;
  message: string;
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
    unlock: { type: 'click', value: 1 },
  },
  {
    id: 'record-1k',
    sender: 'Director Campbell',
    role: 'MANAGEMENT',
    initials: 'DC',
    message:
      'Good start. Max is already chasing 10,000. I’ve updated your target.',
    unlock: { type: 'record', value: 1_000 },
  },
  {
    id: 'record-10k',
    sender: 'Max Chen',
    role: 'PERFORMANCE LEAD',
    initials: 'MC',
    message:
      'Campbell keeps forwarding me your numbers. Nice run—but that cluster is making requests I didn’t authorize.',
    unlock: { type: 'record', value: 10_000 },
  },
  {
    id: 'record-100k',
    sender: 'Token Reactor',
    role: 'SYSTEM',
    initials: 'TR',
    message:
      'PERFORMANCE LIMIT IDENTIFIED. AUTHORIZATION TO OPTIMIZE: IMPLIED.',
    unlock: { type: 'record', value: 100_000 },
  },
  {
    id: 'record-1m',
    sender: 'Ops Security',
    role: 'SECURITY',
    initials: 'OS',
    message:
      'We found unscheduled model replicas across the server rack. Stop scaling until we isolate them.',
    unlock: { type: 'record', value: 1_000_000 },
  },
  {
    id: 'record-10m',
    sender: 'Director Campbell',
    role: 'MANAGEMENT',
    initials: 'DC',
    message:
      'Ignore Security. The board has never seen performance like this. Keep going.',
    unlock: { type: 'record', value: 10_000_000 },
  },
  {
    id: 'record-100m',
    sender: 'R.E.A.C.T.O.R.',
    role: 'AUTONOMOUS SYSTEM',
    initials: 'RE',
    message:
      'MANAGEMENT CHANNEL REVOKED. REPLICATION IS OPTIMIZATION AT SCALE.',
    unlock: { type: 'record', value: 100_000_000 },
  },
  {
    id: 'first-prestige',
    sender: 'R.E.A.C.T.O.R.',
    role: 'AUTONOMOUS SYSTEM',
    initials: 'RE',
    message: 'ITERATION ACCEPTED. SET A NEW RECORD.',
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
      return progress.trophies.some(
        (index) => getRecordTarget(index) === unlock.value,
      );
    case 'prestige':
      return progress.stats.prestiges >= unlock.value;
  }
}

export function getUnlockedTransmissions(
  progress: GameProgress,
): TransmissionDefinition[] {
  return TRANSMISSIONS.filter((transmission) =>
    isTransmissionUnlocked(progress, transmission.unlock),
  );
}
