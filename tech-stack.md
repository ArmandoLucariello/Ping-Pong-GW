# Ping Pong GW - Tech stack proposal

Status: **confirmed, except for how the service is published on the internet** (to be decided during development). Requirements come from
[project-scope.md](project-scope.md).

## Drivers
- Web app for browsers and iPhones, cross-platform native app for Android.
- About 10 users, on a **Raspberry Pi 4 Model B (4 GB)** on a home network, reachable from the **public internet**.
- Live scoring in real time.
- English and Italian interface.
- Deployment with Docker on ARM64.
- Small codebase that is cheap to maintain.

## Summary
| Area | Choice | Why |
|---|---|---|
| Language | **TypeScript** everywhere | One language across app, web and backend |
| Repository | **pnpm monorepo** (`apps/client`, `apps/server`, `packages/shared`) | The rules and API types are written once |
| Android and web client | **Expo (React Native)** with **Expo Router** (confirmed) | One codebase for Android and web |
| iOS | **Web app in Safari** (confirmed) | No Apple Developer account needed |
| Client data | **TanStack Query** | Cache and refetch for REST data |
| Translations | **i18next** + **expo-localization** | English default, Italian available |
| Backend | **Node.js LTS** + **Fastify** | Light on the Raspberry Pi, built-in logging and validation |
| Real-time | **@fastify/websocket** | Runs inside the backend, no extra service |
| Validation | **Zod** in `packages/shared` | Same schemas on client and server |
| Database | **PostgreSQL** via **Drizzle ORM** (confirmed) | Robust and well suited to data analysis |
| Internet access / TLS | **Cloudflare Tunnel** or **Tailscale Funnel**, to be decided (see Points to resolve) | No inbound ports on the home router, public HTTPS |
| Internal web server | **Caddy** | Serves the web build and proxies the API |
| Deployment | **Docker Compose**, ARM64 images | Required by the scope, `restart: unless-stopped` |
| Tests | **Vitest** for shared rules and backend, **Jest** for the client | Scoring and Elo rules need the most coverage |
| Authentication | **Local accounts** (email and password), **sessions managed by the backend**, **invite links** created by the admin | Simple for about 10 users, no external dependencies; required before real data goes online |

## Key decisions

### Client: Expo instead of Flutter
Both meet the cross-platform requirement. Expo is preferred for two reasons:
- The client can share TypeScript code with the backend: scoring rules, serve rotation, Elo and API types.
- The web version is a regular web app, exported as a single-page app (`web.output: "single"`) that Caddy serves as static files.
  iPhone users rely on this version, so it has to work well on mobile Safari, live scoring included.

Flutter would add Dart as a second language and duplicate those rules.

### Database: PostgreSQL
- Runs as a dedicated container with data on a Docker volume stored on SSD or USB storage, not the SD card.
- Reachable only from the backend, on the internal Docker network. Its port is never published.
- Memory settings sized for the 4 GB of the Raspberry Pi (suggested starting point: `shared_buffers` at 256-512 MB).
- Backups with `pg_dump`.

### Live scoring
- The referee or scoring player sends each point through REST, so every point is validated and stored.
- The server pushes the updated score over WebSocket to everyone following the match.
- Points are stored as an event list. Undo, the audit log and rebuilding a match all come from the same data.
- Clients reconnect automatically and reload the current state after a connection drop.

### Elo
The calculation lives in `packages/shared`. In doubles, each team's strength is the average of its two players' ratings, and both
players receive the rating change. Initial rating and K-factor are to be set during implementation (suggested: 1000 and 32).

### Mobile distribution
- **Android**: signed APK downloaded from the website and installed directly. Built with Expo's cloud service (EAS Build, confirmed), which uploads
  the source code to Expo's servers.
- **iOS**: no app to distribute; users open the website and can add it to the home screen.

## Infrastructure
```
Android app ---------------+
                           +--> Cloudflare (HTTPS) <-- tunnel -- cloudflared --> Caddy --> Fastify (REST + WebSocket) --> PostgreSQL on SSD
Browser / iPhone / kiosk --+
```
- The tunnel is opened outbound from the Raspberry Pi, so the home router needs no port forwarding and a changing home IP is not a problem.
- No container publishes ports on the host: `cloudflared`, Caddy, backend and database talk on the internal Docker network.
- The Raspberry Pi runs a 64-bit OS, as required for ARM64 images, and has an SSD connected (both confirmed).
- The public URL is configuration, not code. Changing it later requires a new Android build.
- Live scores and all data require a logged-in user, kiosk screens included.
- Scheduled backups stored off the Raspberry Pi and encrypted.
- `/health` endpoint used by the Docker health check.

## Remote operation
The Raspberry Pi is physically accessible only at home. Initial setup is done on site; in normal operation it is managed over the
internet, and a mistake that cuts access can only be fixed by going back to it.

- **Administration**: **Tailscale** installed on the host (confirmed), with SSH available only over its private network. It needs no
  open ports and does not depend on Docker, so access survives a failure of `cloudflared` or the application containers.
- **Deployment**: ARM64 images built off the Raspberry Pi (GitHub Actions or a development machine with `docker buildx`), pushed to
  a registry and pulled with `docker compose pull && docker compose up -d`.
- **Self-recovery**: hardware watchdog enabled, `restart: unless-stopped` on containers, Docker and Tailscale started at boot.
- **Updates**: automatic security updates only; kernel, firmware and major OS upgrades done by hand and with a fresh backup.
- **Network and firewall changes**: applied with a timed automatic rollback, to avoid locking out remote access.
- **Monitoring**: external uptime check on `/health` with an alert, since nobody is near the device to notice a failure.
- **Disaster recovery**: off-site backups and a documented rebuild procedure, in case the SD card or SSD fails.

## Internet exposure

### Security baseline
- Authentication in place **before** any real data goes online.
- Registration closed or by invitation: only about 10 people need access.
- WebSocket connections authenticated like REST calls.
- Rate limiting on login and API (`@fastify/rate-limit`), security headers (`@fastify/helmet`).
- Superuser functions protected with stronger access controls.
- SSH with keys only, no password login, reachable only through the private remote access described below; firewall enabled.
- Automatic security updates for the OS, regular updates for images and dependencies.
- Secrets kept out of the repository and images.

## Points to resolve

### 1. Publishing on the internet at no cost (to decide during development; blocking for going online)
The project has no budget for a domain. A stable Cloudflare Tunnel needs a domain whose DNS is managed by Cloudflare, so it is not
free on its own. During development no public address is needed, because the service can be reached over Tailscale.

| Option | Cost | Assessment |
|---|---|---|
| **Tailscale Funnel** | Free, available on all plans | **Recommended**: stable `<machine>.<tailnet>.ts.net` address, no domain, uses the Tailscale already planned. It is in beta, with non-configurable bandwidth limits and only ports 443, 8443 and 10000; live scoring over WebSocket must be tested |
| Named Cloudflare Tunnel with a free domain | Free if a free domain service that allows Cloudflare DNS is available (e.g. `eu.org`, with manual approval) | Valid if a free domain is obtained. Cloudflare can see the decrypted traffic, passwords included |
| Named Cloudflare Tunnel with a paid domain | Domain renewal fee | Most standard option, but not free |
| Cloudflare Quick Tunnel | Free | Not suitable: the address changes each time, no uptime guarantee, intended for testing |

With Funnel, the `cloudflared` container is not needed and Caddy publishes its port on `127.0.0.1` only.

The Tailscale account also becomes a single dependency for both administration and public access.

### 2. Other checks
- Reliability of the home connection and power: the service is down whenever either one is, and a hang may need someone on site.
  A smart plug or small UPS would reduce that risk.
