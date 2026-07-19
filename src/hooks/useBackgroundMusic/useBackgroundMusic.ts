import { Howl } from 'howler';
import { useEffect, useRef, useState } from 'react';

interface UseBackgroundMusicOptions {
  muted: boolean;
  recordIndex: number;
  volume: number;
}

const MUSIC_TRACKS = [
  '03-synthetic-whisper',
  '10-space-echoes',
  '04-secret-dissonance',
  '08-sentinel-cloud',
  '14-theres-someone-here',
] as const;
const MUSIC_FADE_DURATION = 1_500;

class BackgroundMusicController {
  private activeIndex = 0;
  private fadeGeneration = 0;
  private howls: Howl[] = [];
  private started = false;
  private targetIndex = 0;
  private visible = true;
  private volume = 0.3;

  start({ muted, recordIndex, volume }: UseBackgroundMusicOptions): void {
    this.activeIndex = recordIndex % MUSIC_TRACKS.length;
    this.targetIndex = this.activeIndex;
    this.volume = volume;
    this.howls = MUSIC_TRACKS.map(
      (track) =>
        new Howl({
          loop: true,
          src: [
            `${import.meta.env.BASE_URL}music/${track}.ogg`,
            `${import.meta.env.BASE_URL}music/${track}.mp3`,
          ],
          volume: 0,
        }),
    );
    this.started = true;
    this.howls.forEach((howl) => {
      howl.mute(muted);
    });
    const active = this.howls[this.activeIndex];
    active.volume(volume);
    active.play();
  }

  sync({ muted, recordIndex, volume }: UseBackgroundMusicOptions): void {
    const targetIndex = recordIndex % MUSIC_TRACKS.length;
    if (!this.started) {
      this.activeIndex = targetIndex;
      this.targetIndex = targetIndex;
    }
    this.volume = volume;
    if (!this.started) return;
    this.howls.forEach((howl) => {
      howl.mute(muted);
    });
    if (targetIndex !== this.targetIndex) {
      this.transitionTo(targetIndex);
      return;
    }
    if (this.targetIndex === this.activeIndex)
      this.howls[this.activeIndex].volume(volume);
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    if (!this.started) return;
    const active = this.howls[this.activeIndex];
    if (visible) {
      active.volume(this.volume);
      active.play();
      return;
    }
    active.pause();
  }

  destroy(): void {
    this.fadeGeneration += 1;
    this.howls.forEach((howl) => {
      howl.stop();
      howl.unload();
    });
    this.howls = [];
    this.started = false;
  }

  private transitionTo(targetIndex: number): void {
    this.fadeGeneration += 1;
    this.targetIndex = targetIndex;
    const generation = this.fadeGeneration;
    const current = this.howls[this.activeIndex];
    current.fade(current.volume(), 0, MUSIC_FADE_DURATION);
    current.once('fade', () => {
      if (generation !== this.fadeGeneration) return;
      current.stop();
      this.activeIndex = targetIndex;
      const next = this.howls[targetIndex];
      next.volume(0);
      next.play();
      next.fade(0, this.volume, MUSIC_FADE_DURATION);
      if (!this.visible) next.pause();
    });
  }
}

export function useBackgroundMusic({
  muted,
  recordIndex,
  volume,
}: UseBackgroundMusicOptions): void {
  const [controller] = useState(() => new BackgroundMusicController());
  const latestOptions = useRef({ muted, recordIndex, volume });

  useEffect(() => {
    latestOptions.current = { muted, recordIndex, volume };
  }, [muted, recordIndex, volume]);

  useEffect(() => {
    const removeStartListeners = () => {
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
    };
    const start = () => {
      removeStartListeners();
      controller.start(latestOptions.current);
    };
    const handleVisibility = () => {
      controller.setVisible(!document.hidden);
    };
    window.addEventListener('pointerdown', start);
    window.addEventListener('keydown', start);
    document.addEventListener('visibilitychange', handleVisibility);
    handleVisibility();
    return () => {
      removeStartListeners();
      document.removeEventListener('visibilitychange', handleVisibility);
      controller.destroy();
    };
  }, [controller]);

  useEffect(() => {
    controller.sync({ muted, recordIndex, volume });
  }, [controller, muted, recordIndex, volume]);
}
