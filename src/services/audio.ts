type SoundName =
  | 'click'
  | 'interface'
  | 'critical'
  | 'purchase'
  | 'milestone'
  | 'ability'
  | 'prestige'
  | 'message';

const SOUND_FREQUENCIES: Record<SoundName, number> = {
  click: 260,
  interface: 820,
  critical: 720,
  purchase: 420,
  milestone: 880,
  ability: 560,
  prestige: 320,
  message: 660,
};

let context: AudioContext | null = null;

export function playSound(
  name: SoundName,
  volume: number,
  muted: boolean,
): void {
  if (muted || volume <= 0 || typeof AudioContext === 'undefined') return;
  context ??= new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;
  const duration =
    name === 'prestige' ? 0.5 : name === 'interface' ? 0.06 : 0.16;
  oscillator.type =
    name === 'critical' || name === 'milestone' || name === 'interface'
      ? 'triangle'
      : 'sine';
  oscillator.frequency.setValueAtTime(SOUND_FREQUENCIES[name], now);
  oscillator.frequency.exponentialRampToValueAtTime(
    name === 'interface' ? 520 : SOUND_FREQUENCIES[name] * 1.5,
    now + (name === 'interface' ? 0.04 : 0.08),
  );
  gain.gain.setValueAtTime(
    Math.max(
      0.001,
      volume * (name === 'message' ? 0.07 : name === 'interface' ? 0.08 : 0.12),
    ),
    now,
  );
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

export function resetAudioForTests(): void {
  context = null;
}
