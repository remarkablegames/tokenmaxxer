type SoundName =
  | 'click'
  | 'critical'
  | 'purchase'
  | 'milestone'
  | 'ability'
  | 'prestige'
  | 'message';

const SOUND_FREQUENCIES: Record<SoundName, number> = {
  click: 260,
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
  oscillator.type =
    name === 'critical' || name === 'milestone' ? 'triangle' : 'sine';
  oscillator.frequency.setValueAtTime(SOUND_FREQUENCIES[name], now);
  oscillator.frequency.exponentialRampToValueAtTime(
    SOUND_FREQUENCIES[name] * 1.5,
    now + 0.08,
  );
  gain.gain.setValueAtTime(
    Math.max(0.001, volume * (name === 'message' ? 0.07 : 0.12)),
    now,
  );
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    now + (name === 'prestige' ? 0.5 : 0.16),
  );
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + (name === 'prestige' ? 0.5 : 0.16));
}

export function resetAudioForTests(): void {
  context = null;
}
