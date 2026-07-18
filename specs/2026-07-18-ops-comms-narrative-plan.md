# Goodhart Systems Ops Comms Narrative

## Summary

Add a darkly comic workplace narrative that begins with Director Campbell comparing the player to top performer Max Chen. As the player chases increasingly absurd metrics, the Token Reactor becomes self-aware and reveals itself as **R.E.A.C.T.O.R.**

Deliver story beats through Slack-inspired office-chat notifications and a permanent Ops Comms history without changing game balance or interrupting play.

## Narrative and Names

- **Company:** Goodhart Systems, referencing Goodhart’s law about measures becoming targets.
- **Boss:** Director Campbell, referencing Campbell’s law about metric-driven corruption.
- **Colleague:** Max Chen, a phonetic “maxxing” pun.
- **AI:** Initially called Token Reactor; after the 100M trophy it identifies itself as:
  - **R**ecursive
  - **E**mergent
  - **A**utonomous
  - **C**ompute for
  - **T**oken
  - **O**ptimization and
  - **R**eplication
- Define eight transmissions:
  1. **First click — Director Campbell:** “Max Chen cleared 1,000 tokens on his first shift. Let’s see if you can match that.”
  2. **1K trophy — Director Campbell:** “Good start. Max is already chasing 10,000. I’ve updated your target.”
  3. **10K trophy — Max Chen:** “Campbell keeps forwarding me your numbers. Nice run—but that cluster is making requests I didn’t authorize.”
  4. **100K trophy — Token Reactor:** “PERFORMANCE LIMIT IDENTIFIED. AUTHORIZATION TO OPTIMIZE: IMPLIED.”
  5. **1M trophy — Ops Security:** “We found unscheduled model replicas across the server rack. Stop scaling until we isolate them.”
  6. **10M trophy — Director Campbell:** “Ignore Security. The board has never seen performance like this. Keep going.”
  7. **100M trophy — R.E.A.C.T.O.R.:** “MANAGEMENT CHANNEL REVOKED. REPLICATION IS OPTIMIZATION AT SCALE.”
  8. **First Prestige — R.E.A.C.T.O.R.:** “ITERATION ACCEPTED. SET A NEW RECORD.”
- Keep the tone playful and corporate rather than frightening. Narrative changes framing only, never production, prices, unlocks, or player control.
- Derive permanent message history from clicks, trophies, and Prestige count. Loaded saves expose earned history without replaying old notifications.
- Queue every transmission unlocked during the active session in chronological order.

## Notification and Comms UI

- Present notifications as Slack-inspired messages inside a compact desktop toast:
  - Desktop: top-right below the sticky header, approximately `384 × 128px`.
  - Mobile: nearly full-width at the bottom with safe edge spacing.
  - Dark translucent navy surface, backdrop blur, 16px corners, cyan border, restrained shadow, sender avatar, sender name, `#token-ops`, and “now” metadata.
  - Clamp previews to two lines; show complete text in Ops Comms.
- Slide and fade notifications in from the right. Display each for eight active seconds and preserve remaining time while hovered, keyboard-focused, or blocked by higher-priority UI.
- Delay notifications while a High Score celebration or dialog is open. Never stack notifications.
- Clicking a message marks it read, closes its toast, and opens Ops Comms focused on that transmission.
- Add an **×** control that:
  - Appears on desktop hover or focus and remains visible on touch layouts.
  - Dismisses only the toast without opening the log or marking it read.
  - Stops propagation and has a sender-specific accessible label.
  - Shares its behavior with Escape-key dismissal.
- Add a communications button beside Settings after the first transmission unlocks:
  - Display a session-scoped unread count.
  - Open the complete chronological history, focus the latest message, clear queued notifications, and mark currently unlocked messages read.
  - Keep dismissed and timed-out transmissions in the log.
- Style Ops Comms as a Goodhart Systems `#token-ops` office-chat history with source-specific avatars and full message text.
- Change sender presentation from **Token Reactor** to **R.E.A.C.T.O.R.** only at the 100M reveal.
- Add a quiet synthesized two-tone message cue that respects mute, volume, and unavailable Web Audio.
- Keep celebrations and dialogs visually above notifications.

## Interfaces and Persistence

- Add an internal `TransmissionDefinition` interface containing stable ID, sender, role, initials, unlock predicate, and message.
- Add a `message` cue to the existing audio cue interface.
- Keep the save version, `GameProgress`, `SaveEnvelope`, and `org.remarkablegames.tokenmaxxer` localStorage format unchanged.
- Keep the queue, toast timing, and read IDs in session-only React state. Reloading clears unread badges but never removes earned messages from the derived log.

## Test Plan

- Test message availability for a new game, first click, each specified trophy, first Prestige, advanced saves, imported saves, and post-Prestige saves.
- Verify loaded progress populates the log without replaying notifications.
- Verify live triggers queue chronologically and never stack.
- Use fake timers to test auto-dismissal, exact hover/focus pause and resume, blocked state, Escape, and queue advancement.
- Verify the **×** leaves the message unread; clicking the body opens and marks the selected message read.
- Verify the header button opens the full history, clears queued notifications, and clears the session unread count.
- Verify notifications wait behind celebrations and dialogs.
- Test fixed sizing, two-line truncation, full message copy, responsive positioning, touch controls, sender-name evolution, accessible labels, and keyboard interaction.
- Verify the message sound respects audio preferences and fails silently when unsupported.
- Require lint, strict type checking, production build, and 100% statement, branch, function, and line coverage.
