import { playSound, resetAudioForTests } from './audio';

const howler = vi.hoisted(() => ({
  Howl: vi.fn(),
  play: vi.fn(),
  unload: vi.fn(),
  volume: vi.fn(),
}));

vi.mock('howler', () => ({ Howl: howler.Howl }));

const setValueAtTime = vi.fn();
const exponentialRampToValueAtTime = vi.fn();
const connect = vi.fn();
const start = vi.fn();
const stop = vi.fn();

class MockAudioContext {
  currentTime = 1;
  destination = {};
  createOscillator() {
    return {
      type: '',
      frequency: { setValueAtTime, exponentialRampToValueAtTime },
      connect,
      start,
      stop,
    };
  }
  createGain() {
    return { gain: { setValueAtTime, exponentialRampToValueAtTime }, connect };
  }
}

describe('audio effects', () => {
  beforeEach(() => {
    howler.Howl.mockImplementation(function MockHowl() {
      return {
        play: howler.play,
        unload: howler.unload,
        volume: howler.volume,
      };
    });
    vi.stubGlobal('AudioContext', MockAudioContext);
    resetAudioForTests();
    vi.clearAllMocks();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('does nothing when muted, silent, or unsupported', () => {
    playSound('click', 1, true);
    playSound('click', 0, false);
    vi.stubGlobal('AudioContext', undefined);
    playSound('click', 1, false);
    expect(start).not.toHaveBeenCalled();
  });

  it.each([
    ['high-score', 'HIT-Noisy-Hit_HY_PC-002'],
    ['token-surge', 'INTERFACE-Zap-Select_HY_PC-006'],
    ['hyperfocus', 'MOVEMENT-Whoosh-Sweep_HY_PC-001'],
  ] as const)('plays the %s asset with OGG fallback to MP3', (sound, file) => {
    playSound(sound, 0.5, false);
    expect(howler.Howl).toHaveBeenCalledWith(
      expect.objectContaining({
        src: [`/sounds/${file}.ogg`, `/sounds/${file}.mp3`],
        volume: 0.5,
      }),
    );
    expect(howler.play).toHaveBeenCalledOnce();

    playSound(sound, 0.25, false);
    expect(howler.Howl).toHaveBeenCalledOnce();
    expect(howler.volume).toHaveBeenCalledWith(0.25);
    expect(howler.play).toHaveBeenCalledTimes(2);
    resetAudioForTests();
    expect(howler.unload).toHaveBeenCalledOnce();
  });

  it('falls back to synthesized audio when an asset cannot play', () => {
    playSound('high-score', 0.5, false);
    const options = howler.Howl.mock.calls[0]?.[0] as {
      onloaderror: () => void;
      onplayerror: () => void;
    };
    start.mockClear();
    options.onloaderror();
    options.onplayerror();
    expect(start).toHaveBeenCalledTimes(2);
  });

  it.each([
    'click',
    'interface',
    'critical',
    'purchase',
    'milestone',
    'ability',
    'prestige',
    'message',
  ] as const)('synthesizes %s', (sound) => {
    playSound(sound, 0.5, false);
    expect(start).toHaveBeenCalled();
    expect(stop).toHaveBeenCalled();
  });

  it('keeps interface feedback short and quiet', () => {
    playSound('interface', 0.5, false);
    expect(setValueAtTime).toHaveBeenCalledWith(820, 1);
    expect(exponentialRampToValueAtTime).toHaveBeenCalledWith(520, 1.04);
    expect(setValueAtTime).toHaveBeenCalledWith(0.04, 1);
    expect(stop).toHaveBeenCalledWith(1.06);
  });
});
