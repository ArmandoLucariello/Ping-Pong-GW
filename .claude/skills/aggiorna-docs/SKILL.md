---
name: aggiorna-docs
description: Bring the Ping Pong GW documentation, Mermaid diagrams and CLAUDE.md in line with the code and decisions. Use after a feature, a database schema change, a finished plan item or a new decision, or when the user asks to update the docs or diagrams.
---

# Update the documentation

The documents are a guide for the owner and for future work, so they must match the code. Document what exists and what has been
decided; never invent a decision.

## 1. Find what changed
- Run `git status --short` and `git diff HEAD --stat` for uncommitted work.
- Find the last commit that touched the documents with `git log -1 --format=%H -- docs CLAUDE.md README.md plan.md`, then list the
  code changes since then with `git diff <that commit> --stat -- apps packages`.
- Also consider decisions taken in this conversation that are not yet written down.

## 2. Map changes to documents
| Change | Documents to check |
|---|---|
| `apps/server/src/db/schema.ts` or `apps/server/drizzle/` | `docs/database.md`: ER diagram, enums, delete rules, constraints, indexes |
| New package, folder, module, route, dependency | `docs/architecture.md`; `docs/flows.md` if an interaction changes |
| Game rules, Elo, match statuses | `docs/domain.md` |
| New or changed endpoint or WebSocket message | `docs/flows.md` |
| Docker, Caddy, tunnel, Raspberry Pi setup | `docs/architecture.md` deployment, `tech-stack.md` |
| Plan item finished | `plan.md` checkbox; status of the related diagrams |
| New command, script, env variable, setup step | `README.md`, `CLAUDE.md` commands, `.env.example` |
| New decision or changed requirement | `project-scope.md`, `tech-stack.md`, open points in `docs/domain.md` |
| New convention or folder | `CLAUDE.md`; the project map in `.claude/skills/spiega/SKILL.md` |

## 3. Update
- Read the code before writing; never describe it from memory.
- Change only the affected parts and keep each document's structure.
- Diagrams use database names in `docs/database.md` and code names elsewhere. Every table, column, enum value and constraint in
  `schema.ts` appears in `docs/database.md`, and nothing else does.
- Mark each diagram **implemented** when it matches the code, **planned** when it is a target. When a planned feature is built,
  redraw its diagram from the code and change the status.
- Remove open points once they are decided.
- Documents are in English, in plain words.

## 4. Mermaid rules
- In `erDiagram` attribute comments, and in all labels, do not use double quotes inside the text.
- Quote flowchart labels that contain spaces or symbols: `node["Caddy :443"]`; use `<br/>` for line breaks.
- Do not use `end` as a node id, and avoid semicolons in sequence messages.
- Write endpoint paths with braces, `/matches/{id}`, not `:id`.

## 5. Check
- Compare the tables in the ER diagram with `pgTable(` in `schema.ts`, and the constraint table with every `check(` and
  `unique(`.
- Check that relative links between documents point to existing files.
- If the Mermaid CLI is available, render the diagrams to confirm they parse. Otherwise review the syntax by hand and say so.
- Do not commit. Report to the user, in Italian, which documents changed and why, and any part of the docs you could not verify.
