# Tokenmaxxer Game Specification

## Summary

Build a polished, responsive browser incremental game centered on repeatedly chasing larger High Score records. The main progression should take approximately 15–20 minutes to reach the first Prestige, with endless powers-of-ten records afterward.

The implementation uses a deterministic TypeScript game engine, React dashboard, custom SVG artwork, native CSS/SVG animation, lightweight Web Audio effects, and versioned local saves. It has no backend, remote assets, runtime network requests, service worker, or animation-library dependency.

## Core Game and Balance

- Track tokens, tokens per click, tokens per second, critical chance, active bonuses, current-run records, lifetime Performance Bonuses, Benchmark Rating, upgrades, abilities, achievements, and lifetime statistics.
- Begin High Score targets at 1,000 and increase them by 10× indefinitely.
- Crossing a target awards its permanent Performance Bonus on the first lifetime clear, triggers a celebration, advances the current-run target, and evolves the Token Reactor.
- Reset the current High Score ladder to 1,000 on Prestige alongside tokens, normal upgrades, and abilities. Preserve lifetime Performance Bonuses, Benchmark Rating, achievements, preferences, and lifetime statistics.
- Unlock Prestige after the 100,000,000 record. Records from that point add pending Benchmark Rating using `milestoneIndex - 2`; Prestige requires and claims an unclaimed payout.
- Add 0.10 permanently to the Token Multiplier per Benchmark Rating point. The multiplier is automatic and cannot be spent.
- Label milestones already earned in a previous run as `RECORD RECLAIMED`; reserve `NEW HIGH SCORE` for first-time lifetime records.
- Pause production, ability durations, and cooldowns while the document is hidden. Do not grant closed-tab or away progress.
- Support buy-one, buy-ten, and buy-max controls with exact costs and benefits.

### Permanent Benchmark Rating

- Convert the full pending payout into Benchmark Rating when the player starts a new session.
- Apply the rating multiplier equally to manual and automated production.
- Display the current rating and exact production percentage persistently in the Champion Archive and Lifetime Statistics.

### Abilities

- Token Surge unlocks at 10,000 and grants 2× production for 15 active seconds with a 90-second cooldown.
- Hyperfocus unlocks at 100,000 and grants 3× manual output plus 15 percentage points of critical chance for 15 active seconds with a 75-second cooldown. It temporarily raises the normal 35% critical cap to 50%.
- Critical Prompting grants 1 percentage point of critical chance per level and displays MAX at level 30 so it cannot sell ineffective levels beyond the global cap.

### Balance Acceptance

- First upgrade is affordable within 15 seconds.
- Automation begins within one minute.
- A deterministic optimized strategy reaches first Prestige within 9–12 minutes, corresponding to an intended 15–20 minute hands-on progression window.
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
- Clearly explain Prestige payout, ladder reset behavior, preserved lifetime progress, and the automatic production multiplier. Present it to the player as a Session Reset with the primary action `Start New Session`.
- Use emoji only as intentional symbols, such as trophies, rather than placeholder artwork.

## Architecture, Persistence, and Audio

- Separate pure calculations and reducer-style state transitions from React rendering.
- Drive production through a delta-time loop while the page is visible.
- Use strict interfaces for game state, statistics, definitions, abilities, achievements, Benchmark Rating, preferences, and versioned saves.
- Store the complete save envelope under the single localStorage key `org.remarkablegames.tokenmaxxer`.
- Keep progress and preferences in separate fields inside that envelope so resetting progress preserves mute and volume settings.
- Autosave every five seconds and on page lifecycle events.
- Provide manual save, JSON export, validated JSON import, and confirmation-gated reset controls.
- Reject malformed, unsupported, non-finite, negative, or incomplete imports without replacing the active save.
- Synthesize short click, critical, purchase, milestone, ability, and Prestige sounds using Web Audio. Include no music or audio files.
- Initialize audio after user interaction, fail silently when unsupported, and remember mute and volume controls.
- Do not add a service worker. Offline support covers loaded sessions and locally served or downloaded builds, not reopening a remote deployment while disconnected.

## Test Plan

- Unit-test upgrade costs, bulk purchases, production formulas, critical clicks, milestones, Performance Bonus uniqueness, reactor stages, abilities, Prestige, Benchmark Rating, formatting, achievements, and save validation.
- Use fake timers and visibility mocks to verify production, autosaving, cooldowns, effect expiry, and hidden-tab pausing.
- Test clicking, purchases, locked upgrades, amount controls, abilities, new and reclaimed celebrations, Prestige, automatic rating payouts, settings, import/export, reset, and keyboard operation with Testing Library.
- Mock Web Audio, clipboard, download, and lifecycle APIs and verify graceful unsupported behavior.
- Maintain 100% statement, branch, function, and line coverage.
- Require `npm run lint`, `npm run lint:tsc`, `npm run test:ci`, and `npm run build` to pass.
