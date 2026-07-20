import { Howl } from 'howler';

type SynthSoundName =
  | 'click'
  | 'interface'
  | 'critical'
  | 'purchase'
  | 'milestone'
  | 'ability'
  | 'prestige'
  | 'message';

type AssetSoundName = 'high-score' | 'token-surge' | 'hyperfocus';
type SoundName = SynthSoundName | AssetSoundName;

interface AssetSoundDefinition {
  fallback: SynthSoundName;
  sources: [string, string];
}

const SOUND_FREQUENCIES: Record<SynthSoundName, number> = {
  click: 260,
  interface: 820,
  critical: 720,
  purchase: 420,
  milestone: 880,
  ability: 560,
  prestige: 320,
  message: 660,
};

const SOUND_ASSETS: Record<AssetSoundName, AssetSoundDefinition> = {
  'high-score': {
    fallback: 'milestone',
    sources: [
      '/sounds/HIT-Noisy-Hit_HY_PC-002.ogg',
      '/sounds/HIT-Noisy-Hit_HY_PC-002.mp3',
    ],
  },
  'token-surge': {
    fallback: 'ability',
    sources: [
      '/sounds/INTERFACE-Zap-Select_HY_PC-006.ogg',
      '/sounds/INTERFACE-Zap-Select_HY_PC-006.mp3',
    ],
  },
  hyperfocus: {
    fallback: 'ability',
    sources: [
      '/sounds/MOVEMENT-Whoosh-Sweep_HY_PC-001.ogg',
      '/sounds/MOVEMENT-Whoosh-Sweep_HY_PC-001.mp3',
    ],
  },
};

let context: AudioContext | null = null;
let assetSounds: Partial<Record<AssetSoundName, Howl>> = {};
let assetVolumes: Record<AssetSoundName, number> = {
  'high-score': 0,
  'token-surge': 0,
  hyperfocus: 0,
};

function isAssetSound(name: SoundName): name is AssetSoundName {
  return name in SOUND_ASSETS;
}

function playSynthesizedSound(name: SynthSoundName, volume: number): void {
  if (typeof AudioContext === 'undefined') return;
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

export function playSound(
  name: SoundName,
  volume: number,
  muted: boolean,
): void {
  if (muted || volume <= 0) return;
  if (!isAssetSound(name)) {
    playSynthesizedSound(name, volume);
    return;
  }

  assetVolumes[name] = volume;
  const definition = SOUND_ASSETS[name];
  const playFallback = () => {
    playSynthesizedSound(definition.fallback, assetVolumes[name]);
  };
  const sound =
    assetSounds[name] ??
    new Howl({
      src: definition.sources,
      volume,
      onloaderror: playFallback,
      onplayerror: playFallback,
    });
  assetSounds[name] = sound;
  sound.volume(volume);
  sound.play();
}

export function resetAudioForTests(): void {
  Object.values(assetSounds).forEach((sound) => {
    sound.unload();
  });
  assetSounds = {};
  assetVolumes = { 'high-score': 0, 'token-surge': 0, hyperfocus: 0 };
  context = null;
}
