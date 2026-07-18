# Progressive Onboarding and Dashboard Reveal

## Summary

Reduce first-session information overload with non-blocking, progression-driven reveals. Keep the Token Reactor, High Score, core production statistics, and upgrade market visible from the start while introducing secondary systems as the player demonstrates familiarity.

Derive onboarding entirely from permanent gameplay progress so continued games and post-Prestige runs never repeat completed instructions. Do not add tutorial state or migrate the save format.

## Implementation Changes

- Add a compact four-step **Next Objective** panel for players who have not earned their first trophy:
  1. **Activate the Token Reactor:** Click the glowing reactor core to generate the first token.
  2. **Upgrade Manual Output:** Earn 20 tokens and buy Mechanical Keyboard.
  3. **Bring Automation Online:** Generate 50 lifetime tokens to unlock Used GPU, then spend 75 tokens to deploy it.
  4. **Chase the First Record:** Reach 1,000 tokens and secure the first High Score trophy.
- Replace the objective panel with the normal progression panels after the first trophy.
- Pulse the reactor until the first click. Highlight Mechanical Keyboard and Used GPU when each becomes affordable.
- Keep highlighted card content at constant opacity; animate only its cyan border and outer halo.
- Announce objective changes through a polite ARIA live region. Do not use blocking overlays, hover tooltips, or forced tutorial steps.
- Reveal dashboard systems progressively:
  - Manual upgrades immediately.
  - Automation after owning Mechanical Keyboard.
  - Efficiency at 5,000 lifetime tokens.
  - Abilities after reaching the 10,000 record.
  - Champion Archive and Run Telemetry after the first trophy.
  - Prestige after securing the 10 million Performance Bonus, or whenever pending Performance Rating exists.
- Within each revealed upgrade category, display every unlocked upgrade and only the next locked upgrade with the lowest threshold.
- Within abilities, display unlocked abilities and only the next upcoming locked ability.
- Apply a brief entrance animation when a new section or category appears.
- Preserve the existing three-column desktop dashboard and stacked responsive layout.

## Interfaces and Persistence

- Derive the current objective and visible dashboard systems from clicks, owned upgrades, lifetime tokens, Performance Bonuses, record index, and pending Performance Rating.
- Do not change `SaveEnvelope`, `GameProgress`, the save version, or the localStorage key `org.remarkablegames.tokenmaxxer`.
- Continued saves resume at the appropriate objective instead of restarting onboarding.
- Because lifetime statistics, records, and trophies survive Prestige, established players retain all previously revealed systems after resetting normal progress.
- Preserve all upgrade prices, production values, unlock thresholds, and progression balance.

## Test Plan

- Verify a fresh save shows the reactor, High Score, objective panel, Manual Systems, Mechanical Keyboard, and the next upcoming manual upgrade.
- Verify fresh saves hide Automation, Efficiency, abilities, archive, telemetry, and Prestige.
- Test all four objective transitions and the affordability highlights for Mechanical Keyboard and Used GPU.
- Test category and panel reveals at Mechanical Keyboard level 1, 5,000 lifetime tokens, the 10,000 record, the first trophy, and the 10 million trophy.
- Verify each category displays all unlocked entries and exactly one nearest locked entry.
- Verify advanced, imported, continued, and post-Prestige saves immediately show the systems appropriate to their permanent progress.
- Maintain 100% statement, branch, function, and line coverage.
- Require ESLint, strict TypeScript checking, the complete test suite, and the production build to pass.

## Assumptions

- Onboarding guidance never blocks clicking, purchasing, settings, saving, import/export, or footer access.
- High Score, tokens, tokens per second, tokens per click, and the Token Reactor always remain visible.
- A player who has not yet earned the first trophy sees only their current objective when resuming; completed objectives do not reappear.
