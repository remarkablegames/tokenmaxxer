import type { ChangeEvent } from 'react';
import type { Preferences } from 'src/types/game.types';

interface AudioSettingsProps {
  onEffectsVolumeChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onMusicVolumeChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onToggleEffects: () => void;
  onToggleMusic: () => void;
  preferences: Preferences;
}

const TOGGLE_CLASS =
  'min-w-18 cursor-pointer rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-xs font-extrabold text-cyan-300';

export function AudioSettings({
  onEffectsVolumeChange,
  onMusicVolumeChange,
  onToggleEffects,
  onToggleMusic,
  preferences,
}: AudioSettingsProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <label className="flex items-center justify-between gap-4">
          <span>
            <strong className="block">Music</strong>
            <small className="text-slate-500">
              Progression-driven operations soundtrack
            </small>
          </span>
          <button
            aria-label="Toggle music"
            aria-pressed={!preferences.musicMuted}
            className={TOGGLE_CLASS}
            onClick={onToggleMusic}
            type="button"
          >
            {preferences.musicMuted ? 'MUTED' : 'ON'}
          </button>
        </label>
        <label className="block">
          <span className="mb-2 flex justify-between">
            <strong>Music Volume</strong>
            <span>{Math.round(preferences.musicVolume * 100)}%</span>
          </span>
          <input
            aria-label="Music volume"
            className="w-full accent-cyan-400"
            max="1"
            min="0"
            onChange={onMusicVolumeChange}
            step="0.05"
            type="range"
            value={preferences.musicVolume}
          />
        </label>
      </div>
      <div className="space-y-4 border-t border-white/8 pt-5">
        <label className="flex items-center justify-between gap-4">
          <span>
            <strong className="block">Sound Effects</strong>
            <small className="text-slate-500">
              Synthesized locally in your browser
            </small>
          </span>
          <button
            aria-label="Toggle sound effects"
            aria-pressed={!preferences.muted}
            className={TOGGLE_CLASS}
            onClick={onToggleEffects}
            type="button"
          >
            {preferences.muted ? 'MUTED' : 'ON'}
          </button>
        </label>
        <label className="block">
          <span className="mb-2 flex justify-between">
            <strong>Effects Volume</strong>
            <span>{Math.round(preferences.volume * 100)}%</span>
          </span>
          <input
            aria-label="Effects volume"
            className="w-full accent-cyan-400"
            max="1"
            min="0"
            onChange={onEffectsVolumeChange}
            step="0.05"
            type="range"
            value={preferences.volume}
          />
        </label>
      </div>
    </div>
  );
}
