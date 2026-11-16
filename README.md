# Ping Pong GW

App to manage ping pong matches, tournaments and rankings. See [project-scope.md](project-scope.md),
[tech-stack.md](tech-stack.md) and [plan.md](plan.md).

Diagrams are in [docs/](docs/): [architecture](docs/architecture.md), [database](docs/database.md), [domain](docs/domain.md) and
[flows](docs/flows.md). GitHub draws them; in VS Code, install the "Markdown Preview Mermaid Support" extension and open the
preview with `Ctrl+Shift+V`.

## Development

Run every command from the project folder (`C:\playground\ping-pong-gw`) in PowerShell.

`pnpm` is used through Corepack, so commands start with `corepack pnpm`. After running `corepack enable` once from an
administrator terminal, plain `pnpm` works too.

### First setup
Needed only on a new machine or after a fresh clone.

```powershell
corepack pnpm install
Copy-Item apps/server/.env.example apps/server/.env
Copy-Item apps/client/.env.example apps/client/.env
```

### Start the app
Use two terminals and leave both open.

Terminal 1, server:
```powershell
corepack pnpm --filter @ping-pong-gw/server dev
```
Check it at http://localhost:3000/health, which shows `{"status":"ok"}`.

Terminal 2, client:
```powershell
corepack pnpm --filter @ping-pong-gw/client start
```
Press `w` to open the web app at http://localhost:8081. On Android, scan the QR code with Expo Go.

Stop either one with `Ctrl+C`. The server restarts by itself when a file in `src/` changes; restart it after editing
`.env`.

### Tests and checks
```powershell
corepack pnpm --filter @ping-pong-gw/server test
corepack pnpm -r --if-present typecheck
```

### Database
Generate a migration after changing [apps/server/src/db/schema.ts](apps/server/src/db/schema.ts):
```powershell
corepack pnpm --filter @ping-pong-gw/server db:generate
```

### Troubleshooting
| Problem | Fix |
|---|---|
| The app shows `offline` in the browser | Start the server, and check that the page address is listed in `CORS_ORIGIN` in `apps/server/.env` |
| The app shows `offline` on the phone | Set `EXPO_PUBLIC_API_URL` in `apps/client/.env` to the PC's IP (`ipconfig`), not `localhost`, and restart the client |
| `EADDRINUSE` when starting the server | Port 3000 is in use: stop the server running in another terminal |
| Certificate errors from Expo or downloads | Turn off the company VPN |
