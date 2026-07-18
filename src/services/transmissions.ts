import type { GameProgress } from 'src/types/game.types';

export interface TransmissionDefinition {
  id: string;
  sender: string;
  role: string;
  initials: string;
  message: string;
  isUnlocked: (progress: GameProgress) => boolean;
}

export const TRANSMISSIONS: TransmissionDefinition[] = [
  {
    id: 'first-click',
    sender: 'Director Campbell',
    role: 'MANAGEMENT',
    initials: 'DC',
    message:
      'Max Chen cleared 1,000 tokens on his first shift. Let’s see if you can match that.',
    isUnlocked: (progress) => progress.stats.clicks >= 1,
  },
  {
    id: 'record-1k',
    sender: 'Director Campbell',
    role: 'MANAGEMENT',
    initials: 'DC',
    message:
      'Good start. Max is already chasing 10,000. I’ve updated your target.',
    isUnlocked: (progress) => progress.trophies.includes(0),
  },
  {
    id: 'record-10k',
    sender: 'Max Chen',
    role: 'PERFORMANCE LEAD',
    initials: 'MC',
    message:
      'Campbell keeps forwarding me your numbers. Nice run—but that cluster is making requests I didn’t authorize.',
    isUnlocked: (progress) => progress.trophies.includes(1),
  },
  {
    id: 'record-100k',
    sender: 'Token Reactor',
    role: 'SYSTEM',
    initials: 'TR',
    message:
      'PERFORMANCE LIMIT IDENTIFIED. AUTHORIZATION TO OPTIMIZE: IMPLIED.',
    isUnlocked: (progress) => progress.trophies.includes(2),
  },
  {
    id: 'record-1m',
    sender: 'Ops Security',
    role: 'SECURITY',
    initials: 'OS',
    message:
      'We found unscheduled model replicas across the server rack. Stop scaling until we isolate them.',
    isUnlocked: (progress) => progress.trophies.includes(3),
  },
  {
    id: 'record-10m',
    sender: 'Director Campbell',
    role: 'MANAGEMENT',
    initials: 'DC',
    message:
      'Ignore Security. The board has never seen performance like this. Keep going.',
    isUnlocked: (progress) => progress.trophies.includes(4),
  },
  {
    id: 'record-100m',
    sender: 'R.E.A.C.T.O.R.',
    role: 'AUTONOMOUS SYSTEM',
    initials: 'RE',
    message:
      'MANAGEMENT CHANNEL REVOKED. REPLICATION IS OPTIMIZATION AT SCALE.',
    isUnlocked: (progress) => progress.trophies.includes(5),
  },
  {
    id: 'first-prestige',
    sender: 'R.E.A.C.T.O.R.',
    role: 'AUTONOMOUS SYSTEM',
    initials: 'RE',
    message: 'ITERATION ACCEPTED. SET A NEW RECORD.',
    isUnlocked: (progress) => progress.stats.prestiges >= 1,
  },
];

export function getUnlockedTransmissions(
  progress: GameProgress,
): TransmissionDefinition[] {
  return TRANSMISSIONS.filter((transmission) =>
    transmission.isUnlocked(progress),
  );
}
