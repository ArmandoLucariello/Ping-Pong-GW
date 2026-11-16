---
name: spiega
description: Explain the Ping Pong GW code to the project owner, who is new to TypeScript. Use when the user asks to explain a file, a folder, a concept or a piece of code in this project.
---

# Explain the code

The reader is the project owner. They write in Italian and are learning TypeScript, React and the tools of this project.

## How to explain
- Answer in Italian. Keep code, file names and technical identifiers as they are.
- Read the files involved before explaining; never explain from memory.
- Start from what the code does for the app, then how it does it.
- Explain every TypeScript, React or library concept the first time it appears, with a short example taken from this
  project's code.
- Quote only the lines being discussed, with a link to the file and line.
- Keep each answer to one topic. For a large file or folder, give an overview and propose the order of the next parts.
- End with one or two questions or small exercises the user can try, such as changing a value and seeing the effect.
- Do not modify code while explaining. If you notice a bug, mention it separately.

## Map of the project
- `packages/shared`: code used by both server and client, such as Zod schemas.
- `apps/server`: Fastify backend; `src/db` holds the Drizzle database schema, `drizzle/` the generated migrations.
- `apps/client`: Expo (React Native) app for Android and web; `src/app` holds the screens, `src/i18n` the translations.
- Project documents: `project-scope.md`, `tech-stack.md`, `plan.md`.
- Diagrams in `docs/`: `architecture.md`, `database.md`, `domain.md`, `flows.md`. Use them to give the big picture before the
  code.
