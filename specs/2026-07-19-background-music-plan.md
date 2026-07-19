# Howler Background Music Plan

## Summary

Add a looped, progression-driven soundtrack using Howler. Music begins on the first pointer or keyboard interaction, advances with the High Score index, cycles through five tracks, and uses sequential 1.5-second fade-out and fade-in transitions.

## Soundtrack Behavior

- Play tracks in this order:
  1. `03-synthetic-whisper`
  2. `10-space-echoes`
  3. `04-secret-dissonance`
  4. `08-sentinel-cloud`
  5. `14-theres-someone-here`
- Load `.ogg` first with `.mp3` as the fallback and loop every track.
- Defer music creation and playback until the first `pointerdown` or `keydown` so playback complies with browser autoplay policies.
- Select the active track using `highScoreLevel % 5`, including resumed saves, imports, resets, and new sessions.
- If progression skips multiple records, transition once to the final derived track.
- Fade the current track to silence over 1.5 seconds, stop it, start the next track at zero volume, and fade it in over 1.5 seconds.
- Guard asynchronous fade callbacks so rapid progression always converges on the latest target without starting stale tracks.
- Pause music while the document is hidden and resume the same active track when it becomes visible.
- Stop and unload all Howls and remove interaction and visibility listeners during cleanup.

## Preferences and Settings

- Add independent `musicMuted` and `musicVolume` preferences while retaining the existing sound-effect preferences.
- Default music to enabled at 30% volume.
- Keep save version `1`, but require the new music preference fields; saves without them are invalid and recover through the existing fresh-save fallback.
- Present separate Music and Sound Effects sections in Settings, each with its own persisted mute control and volume slider.
- Apply preference changes immediately during playback and transitions.

## Testing and Acceptance Criteria

- Verify deferred Howler initialization, ordered `.ogg`/`.mp3` sources, looping, and the default level.
- Verify first-interaction playback, cyclic High Score selection, resumed progression, reset behavior, and multi-record jumps.
- Verify sequential fades, stale-transition protection, mute and volume updates, hidden-tab pause/resume, and resource cleanup.
- Verify the required save fields and separate Settings controls.
- Require TypeScript, ESLint, production build, and the complete test suite to pass with 100% coverage.

## Assumptions

- “First click” includes pointer interaction anywhere on the page; keyboard interaction is supported for accessibility.
- Muting silences music without resetting its playback position.
- Music progression and playback position are not stored separately because the active track is derived from `highScoreLevel`.
