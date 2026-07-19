import { act, fireEvent, renderHook } from '@testing-library/react';

import { useBackgroundMusic } from './useBackgroundMusic';

interface MockHowl {
  fade: ReturnType<typeof vi.fn>;
  mute: ReturnType<typeof vi.fn>;
  once: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  unload: ReturnType<typeof vi.fn>;
  volume: ReturnType<typeof vi.fn>;
}

const mocks = vi.hoisted(() => ({
  instances: [] as MockHowl[],
  options: [] as Record<string, unknown>[],
}));

vi.mock('howler', () => ({
  Howl: function Howl(options: Record<string, unknown>) {
    let volume = Number(options.volume ?? 1);
    const instance: MockHowl = {
      fade: vi.fn((_from: number, to: number) => {
        volume = to;
      }),
      mute: vi.fn(),
      once: vi.fn(),
      pause: vi.fn(),
      play: vi.fn(() => 1),
      stop: vi.fn(),
      unload: vi.fn(),
      volume: vi.fn((next?: number) => {
        if (next !== undefined) volume = next;
        return volume;
      }),
    };
    mocks.options.push(options);
    mocks.instances.push(instance);
    return instance;
  },
}));

function completeFade(instance: MockHowl): void {
  const fadeHandler = instance.once.mock.calls
    .filter(([event]) => event === 'fade')
    .at(-1)?.[1] as (() => void) | undefined;
  expect(fadeHandler).toBeDefined();
  act(() => {
    fadeHandler?.();
  });
}

describe('useBackgroundMusic', () => {
  beforeEach(() => {
    mocks.instances.length = 0;
    mocks.options.length = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates looped fallback sources only after the first interaction', () => {
    const { unmount } = renderHook(() => {
      useBackgroundMusic({ muted: false, recordIndex: 2, volume: 0.3 });
    });
    expect(mocks.instances).toHaveLength(0);

    fireEvent.pointerDown(window);

    expect(mocks.options).toHaveLength(5);
    expect(mocks.options[0]).toMatchObject({
      loop: true,
      src: [
        '/music/03-synthetic-whisper.ogg',
        '/music/03-synthetic-whisper.mp3',
      ],
      volume: 0,
    });
    expect(mocks.instances[2].volume).toHaveBeenCalledWith(0.3);
    expect(mocks.instances[2].play).toHaveBeenCalledOnce();

    unmount();
    expect(
      mocks.instances.every(({ stop }) => stop.mock.calls.length === 1),
    ).toBe(true);
    expect(
      mocks.instances.every(({ unload }) => unload.mock.calls.length === 1),
    ).toBe(true);
  });

  it('supports keyboard startup and cycles to the progression track', () => {
    const { rerender } = renderHook(
      ({ recordIndex }) => {
        useBackgroundMusic({ muted: false, recordIndex, volume: 0.3 });
      },
      { initialProps: { recordIndex: 5 } },
    );

    fireEvent.keyDown(window, { key: 'Enter' });
    expect(mocks.instances[0].play).toHaveBeenCalledOnce();

    rerender({ recordIndex: 6 });
    expect(mocks.instances[0].fade).toHaveBeenCalledWith(0.3, 0, 1_500);
    completeFade(mocks.instances[0]);
    expect(mocks.instances[0].stop).toHaveBeenCalledOnce();
    expect(mocks.instances[1].play).toHaveBeenCalledOnce();
    expect(mocks.instances[1].fade).toHaveBeenCalledWith(0, 0.3, 1_500);
  });

  it('uses the latest target when records advance during a fade', () => {
    const { rerender } = renderHook(
      ({ recordIndex, volume }) => {
        useBackgroundMusic({ muted: false, recordIndex, volume });
      },
      { initialProps: { recordIndex: 0, volume: 0.3 } },
    );
    fireEvent.pointerDown(window);

    rerender({ recordIndex: 1, volume: 0.3 });
    const staleHandler = mocks.instances[0].once.mock.calls[0][1] as () => void;
    rerender({ recordIndex: 1, volume: 0.2 });
    expect(mocks.instances[0].once).toHaveBeenCalledOnce();
    rerender({ recordIndex: 2, volume: 0.2 });
    act(staleHandler);
    expect(mocks.instances[1].play).not.toHaveBeenCalled();
    completeFade(mocks.instances[0]);
    expect(mocks.instances[2].play).toHaveBeenCalledOnce();
  });

  it('updates preferences and pauses while the page is hidden', () => {
    let hidden = false;
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
    const { rerender } = renderHook(
      ({ muted, recordIndex, volume }) => {
        useBackgroundMusic({ muted, recordIndex, volume });
      },
      { initialProps: { muted: true, recordIndex: 0, volume: 0.3 } },
    );
    fireEvent.pointerDown(window);
    expect(mocks.instances[0].mute).toHaveBeenCalledWith(true);

    rerender({ muted: false, recordIndex: 0, volume: 0.2 });
    expect(mocks.instances[0].mute).toHaveBeenLastCalledWith(false);
    expect(mocks.instances[0].volume).toHaveBeenLastCalledWith(0.2);

    hidden = true;
    fireEvent(document, new Event('visibilitychange'));
    expect(mocks.instances[0].pause).toHaveBeenCalledOnce();
    rerender({ muted: false, recordIndex: 1, volume: 0.2 });
    completeFade(mocks.instances[0]);
    expect(mocks.instances[1].pause).toHaveBeenCalledOnce();
    hidden = false;
    fireEvent(document, new Event('visibilitychange'));
    expect(mocks.instances[1].play).toHaveBeenCalledTimes(2);
  });
});
