# Tokenmaxxer Game Specification

## Summary

Build a polished, responsive browser incremental game centered on repeatedly chasing larger High Score records. The main progression should take approximately 15–20 minutes to reach the first Prestige, with endless powers-of-ten records afterward.

The implementation uses a deterministic TypeScript game engine, React dashboard, custom SVG artwork, native CSS/SVG animation, lightweight Web Audio effects, and versioned local saves. It has no backend, remote assets, runtime network requests, service worker, or animation-library dependency.

## Core Game and Balance

- Track tokens, tokens per click, tokens per second, critical chance, active bonuses, records, trophies, Usage Credits, upgrades, abilities, achievements, and lifetime statistics.
- Begin High Score targets at 1,000 and increase them by 10× indefinitely.
- Crossing a target awards its permanent trophy, triggers a celebration, advances the target, and evolves the Token Reactor.
- Preserve records and the next target through Prestige. Reset tokens, normal upgrades, and abilities while retaining trophies, Usage Credits, permanent perks, achievements, preferences, and lifetime statistics.
- Unlock Prestige after the 100,000,000 record. Records from that point add pending Usage Credits using `milestoneIndex - 2`; Prestige requires and claims an unclaimed payout.
- Pause production, ability durations, and cooldowns while the document is hidden. Do not grant closed-tab or away progress.
- Support buy-one, buy-ten, and buy-max controls with exact costs and benefits.

### Permanent Usage Credit Perks

- Seed Funding: begin future runs with `250 × 4^(level - 1)` tokens.
- Manual Calibration: +25% permanent manual output per level.
- Automation Routing: +25% permanent automated output per level.
- Cooldown Optimization: -5% permanent ability cooldown per level, capped at eight levels.

### Abilities

- Token Surge unlocks at 10,000 and grants 3× production for 20 active seconds with a 90-second cooldown.
- Hyperfocus unlocks at 100,000 and grants 5× manual output plus 30 percentage points of critical chance for 15 active seconds with a 75-second cooldown.

### Balance Acceptance

- First upgrade is affordable within 15 seconds.
- Automation begins within one minute.
- An optimized deterministic strategy reaches first Prestige in 10–15 minutes, leaving normal discovery and interaction in the intended 15–20 minute window.
- No multi-minute progression dead zones occur before first Prestige.

## Interface and Presentation

- Present a responsive AI Operations Dashboard with a prominent record panel, persistent production statistics, central reactor, categorized upgrades, abilities, trophy cabinet, achievements, lifetime statistics, and save/settings controls.
- Create all six reactor stages as custom inline SVG illustrations: Workstation, Server Core, AI Cluster, Datacenter, Planetary Processor, and Cosmic Token Reactor.
- Animate pulses, flowing cables, glows, progress bars, button feedback, floating gains, purchase flashes, trophy reveals, and celebrations with CSS keyframes, transitions, and SVG properties.
- Keep decorative animation out of React state where possible; React only triggers meaningful states such as clicks, criticals, purchases, active abilities, and milestones.
- Bound transient effects, favor transform/opacity animation, respect `prefers-reduced-motion`, retain visible focus states, and avoid screen shake.
- Use a dark navy dashboard palette with cyan, violet, amber, and trophy-gold accents.
- Stack sections on mobile with a sticky record header and use a dashboard grid on desktop.
- Include 12 achievements spanning clicks, criticals, automation, production, records, abilities, upgrade ownership, and first Prestige.
- Clearly explain Prestige payout, reset behavior, preserved progress, and permanent perks. Its primary action is `🏆 Set a New Record`.
- Use emoji only as intentional symbols, such as trophies, rather than placeholder artwork.

## Architecture, Persistence, and Audio

- Separate pure calculations and reducer-style state transitions from React rendering.
- Drive production through a delta-time loop while the page is visible.
- Use strict interfaces for game state, statistics, definitions, abilities, achievements, trophies, permanent perks, preferences, and versioned saves.
- Store the complete save envelope under the single localStorage key `org.remarkablegames.tokenmaxxer`.
- Keep progress and preferences in separate fields inside that envelope so resetting progress preserves mute and volume settings.
- Autosave every five seconds and on page lifecycle events.
- Provide manual save, JSON export, validated JSON import, and confirmation-gated reset controls.
- Reject malformed, unsupported, non-finite, negative, or incomplete imports without replacing the active save.
- Synthesize short click, critical, purchase, milestone, ability, and Prestige sounds using Web Audio. Include no music or audio files.
- Initialize audio after user interaction, fail silently when unsupported, and remember mute and volume controls.
- Do not add a service worker. Offline support covers loaded sessions and locally served or downloaded builds, not reopening a remote deployment while disconnected.

## Test Plan

- Unit-test upgrade costs, bulk purchases, production formulas, critical clicks, milestones, trophy uniqueness, reactor stages, abilities, Prestige, permanent perks, formatting, achievements, and save validation.
- Use fake timers and visibility mocks to verify production, autosaving, cooldowns, effect expiry, and hidden-tab pausing.
- Test clicking, purchases, locked upgrades, amount controls, abilities, celebrations, Prestige, perk purchases, settings, import/export, reset, and keyboard operation with Testing Library.
- Mock Web Audio, clipboard, download, and lifecycle APIs and verify graceful unsupported behavior.
- Maintain 100% statement, branch, function, and line coverage.
- Require `npm run lint`, `npm run lint:tsc`, `npm run test:ci`, and `npm run build` to pass.
