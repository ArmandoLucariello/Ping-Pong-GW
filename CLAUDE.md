# Ping Pong GW

App to manage ping pong matches, tournaments and Elo rankings among about 10 colleagues: an Expo client (Android app and web app)
and a Fastify server with PostgreSQL, to be hosted on a Raspberry Pi 4 at home.

## Documents
| File | Content |
|---|---|
| [project-scope.md](project-scope.md) | Requirements, roles, domain rules, features |
| [tech-stack.md](tech-stack.md) | Stack, infrastructure, security, open points |
| [plan.md](plan.md) | Phases with checkboxes; tracks what is done |
| [docs/architecture.md](docs/architecture.md) | Packages, planned server modules, development setup, deployment |
| [docs/database.md](docs/database.md) | ER diagram, enums, delete rules, constraints, indexes |
| [docs/domain.md](docs/domain.md) | Shared types, game rules, match lifecycle |
| [docs/flows.md](docs/flows.md) | Sequence diagrams of the main interactions |
| [README.md](README.md) | Start commands and troubleshooting for the owner |

Read the relevant document before changing an area. Diagrams are Mermaid, marked **implemented** or **planned**.

## Working with the owner
- The owner writes in Italian and is learning TypeScript: reply in Italian, explain new concepts simply, with examples from this
  project. The `/spiega` skill explains code.
- Code, comments, commit messages and documents are in English.
- Commit or push only when asked. Never commit `.env` files.
- Ask before changing a decision recorded in the documents.

## Environment
- Windows with PowerShell. pnpm runs through Corepack: commands start with `corepack pnpm`.
- No Docker and no PostgreSQL on the PC. Tests use PGlite with the real migrations.
- The company VPN breaks TLS for Expo and downloads; the owner turns it off when needed.
- The PC's LAN IP changes with the network: `apps/client/.env` (`EXPO_PUBLIC_API_URL`) and `apps/server/.env` (`CORS_ORIGIN`)
  must follow it.

## Commands
```powershell
corepack pnpm install
corepack pnpm --filter @ping-pong-gw/server dev        # server on :3000
corepack pnpm --filter @ping-pong-gw/client start      # Expo on :8081
corepack pnpm --filter @ping-pong-gw/server test
corepack pnpm -r --if-present typecheck
corepack pnpm --filter @ping-pong-gw/server build
corepack pnpm --filter @ping-pong-gw/server db:generate
```
Run tests and typecheck before reporting a change as done.

## Structure
- `packages/shared`: Zod schemas and, from Phase 2, the game rules (scoring, serve, Elo), used by client and server.
- `apps/server`: Fastify. `src/app.ts` builds the app (testable with `inject`), `src/index.ts` starts it, `src/db/schema.ts` holds
  the Drizzle tables, `drizzle/` the generated migrations.
- `apps/client`: Expo Router. `src/app` screens, `src/components`, `src/i18n` translations, `src/lib/api.ts` API calls.

## Conventions
- Imports have no file extension (`moduleResolution: Bundler`), because Metro cannot resolve `.js` to `.ts`.
- API request and response shapes are Zod schemas in `packages/shared`; the client validates responses with them.
- Every user-facing text goes through i18next: add the key to `en.ts` and `it.ts` (typecheck fails if `it.ts` misses one).
- Database changes: edit `schema.ts`, run `db:generate`, never edit an applied migration. Name constraints
  `<table>_<column>_check` and test each one in `schema.test.ts`.
- Users are anonymized, never deleted. Live points are append-only events.
- Game rules are pure functions with unit tests.

## Keeping documents current
After a change, update the documents it affects in the same piece of work, using the `/aggiorna-docs` skill:
- schema or migration → `docs/database.md`;
- new package, module, route or deployment piece → `docs/architecture.md`, and `docs/flows.md` if an interaction changes;
- game rules or match statuses → `docs/domain.md`;
- finished plan item → tick it in `plan.md`, and move diagrams from planned to implemented;
- new command or setup step → `README.md` and this file;
- new decision → `project-scope.md` or `tech-stack.md`.
