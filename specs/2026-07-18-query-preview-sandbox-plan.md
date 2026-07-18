# Query Preview Sandbox Plan

Status: Implemented

## Goal

Provide URL-based developer controls for testing advanced Tokenmaxxer states
without modifying the player's real local save.

## Query Parameters

### Prestige Preview

`?preview=prestige` creates a deterministic, prestige-ready session and opens
the Set a New Record modal.

The fixture contains:

- 100 million current and lifetime tokens
- Six completed High Score milestones
- Performance Bonuses for milestones zero through five
- Three pending Performance Rating points
- Zero existing Performance Rating

### High Score Preview

`?preview=high-score` opens the High Score celebration using the currently
loaded game state.

### Token Override

`?tokens=<number>` overrides only the current token balance. It does not alter
lifetime token statistics or unlock conditions based on lifetime production.

Values must be finite and non-negative. Decimal and scientific notation are
accepted. Invalid values are ignored.

### Combined Parameters

Preview state is prepared first, then the token override is applied:

```text
?preview=prestige&tokens=250000000
```

Unknown preview names and invalid token values do not activate preview mode
unless another recognized parameter is present.

## Sandbox Behavior

Any recognized preview or valid token override enables Preview Mode.

While Preview Mode is active:

- The loaded save is copied before preview changes are applied.
- The saved timestamp is removed to prevent offline-return behavior.
- Automatic five-second saving is disabled.
- Page-hide saving is disabled.
- Manual Save is disabled and labeled `Saving Disabled`.
- Export, import, and reset remain available but affect only the temporary
  in-memory session.
- An amber `PREVIEW MODE` badge remains visible in the header.

Removing the query string and reloading restores the untouched local save.

## Structure

- Keep query parsing and fixture construction in `src/services/preview.ts`.
- Parse the query once when the App initializes.
- Apply preview state immediately after loading the real save.
- Use the parsed configuration to select initial modal state and persistence
  behavior.
- Document supported URLs in the README.

## Testing

Unit tests cover:

- Empty, valid, combined, unknown, and invalid queries
- Decimal, zero, and scientific-notation token values
- Deterministic prestige fixture construction
- Current-token-only overrides
- Preservation of preferences and removal of the saved timestamp
- Returning the original save when Preview Mode is inactive

App tests cover:

- Preview Mode visibility
- High Score celebration preview
- Prestige modal initialization
- Token override ordering
- Prestige confirmation and High Score reset
- Disabled manual saving
- Suppressed automatic and page-hide persistence

Completion requires passing TypeScript, ESLint, the full test suite with 100%
coverage, and the production build.
