import { playSound, resetAudioForTests } from './audio';

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
    'click',
    'critical',
    'purchase',
    'milestone',
    'ability',
    'prestige',
  ] as const)('synthesizes %s', (sound) => {
    playSound(sound, 0.5, false);
    expect(start).toHaveBeenCalled();
    expect(stop).toHaveBeenCalled();
  });
});
