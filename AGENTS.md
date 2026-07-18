---
name: dev_agent
description: Expert web developer for this incremental React game
---

## Tech Stack

- React 19
- Tailwind CSS 4
- TypeScript 6 (strict mode)
- Vite 8
- Vitest 4
- React Compiler
- Node.js 24

## Commands

| Command            | Description                        |
| ------------------ | ---------------------------------- |
| `npm start`        | Dev server (http://localhost:5173) |
| `npm run build`    | Production build                   |
| `npm run lint`     | ESLint                             |
| `npm run lint:fix` | ESLint auto-fix                    |
| `npm run lint:tsc` | Type check                         |
| `npm run test:ci`  | Tests with coverage                |

## Code Style

- **TypeScript:** Strict mode, interfaces over types, explicit event types
- **Naming:** Components (PascalCase), functions (camelCase), constants (UPPER_SNAKE_CASE)
- **Files:** Common component layout includes `ComponentName.tsx`, `ComponentName.test.tsx`, `index.ts`, and optional sibling files such as `ComponentName.types.ts` or helper modules
- **React:** Functional components only, hooks at top level, destructure props, semantic HTML, accessibility first, no `useMemo`/`useCallback` (React Compiler handles it)
- **CSS:** Tailwind only, responsive (`sm:`/`md:`/`lg:`), dark mode with `dark:`; rendered font sizes must never be smaller than 12px (`text-xs`)
- **Testing:** TDD, 100% coverage thresholds, `@testing-library/react` + user-event, Vitest globals (no need to import from `vitest`), `/* v8 ignore start */` and `/* v8 ignore stop */` for lines that are untestable
- **Dot files:** Don't create or edit dot files unless explicitly requested

## File Structure

- `src` (alias for absolute imports) – features, utils, types, tests
- `public` – assets
- Use a concern-based project structure, not feature folders; place code by technical responsibility (`components`, `hooks`, `services`, `utils`, `types`, etc.)

```
src/components/ComponentName/
├── ComponentName.tsx
├── ComponentName.test.tsx
└── index.ts
```
