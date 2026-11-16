# Architecture

Each diagram is marked **implemented** (matches the code today) or **planned** (target design from [tech-stack.md](../tech-stack.md)
and [plan.md](../plan.md)). Planned diagrams are a guide and change when the design does.

## Packages and dependencies
Status: **implemented**.

The pnpm monorepo has three packages. Client and server depend on `shared`, never on each other.

```mermaid
flowchart LR
    subgraph client["apps/client · @ping-pong-gw/client"]
        direction TB
        screens["src/app<br/>screens (Expo Router)"]
        components["src/components"]
        i18n["src/i18n<br/>en, it"]
        api["src/lib/api.ts"]
        screens --> components
        screens --> i18n
        components --> i18n
        screens --> api
    end

    subgraph shared["packages/shared · @ping-pong-gw/shared"]
        health["src/health.ts<br/>Zod schemas and types"]
    end

    subgraph server["apps/server · @ping-pong-gw/server"]
        direction TB
        entry["src/index.ts<br/>reads env, starts"]
        app["src/app.ts<br/>buildApp, routes"]
        schema["src/db/schema.ts<br/>Drizzle tables"]
        migrations["drizzle/<br/>SQL migrations"]
        entry --> app
        schema -.->|"db:generate"| migrations
    end

    api --> health
    app --> health
    api -- "HTTP JSON" --> app
```

| Package | Main libraries |
|---|---|
| `apps/client` | Expo, Expo Router, React Native, react-i18next, expo-localization |
| `apps/server` | Fastify, @fastify/cors, Drizzle ORM, pg; dev: drizzle-kit, PGlite, tsx, tsup |
| `packages/shared` | Zod |
| root | TypeScript, Vitest |

## Planned server modules
Status: **planned**, from Phase 2 onwards. The server is split by feature; each feature owns its routes and database access, and
the game rules stay in `shared` so the client can use them too.

```mermaid
flowchart TB
    subgraph server["apps/server/src"]
        app["app.ts<br/>plugins: cors, helmet, rate limit"]
        auth["auth/<br/>register, login, sessions, invites"]
        matches["matches/<br/>quick match, result, confirmation"]
        live["live/<br/>point events, WebSocket"]
        ranking["ranking/<br/>seasons, Elo, leaderboard"]
        admin["admin/<br/>disputes, corrections, audit log"]
        db["db/<br/>schema, connection"]
        app --> auth & matches & live & ranking & admin
        auth & matches & live & ranking & admin --> db
    end

    subgraph shared["packages/shared/src"]
        schemas["API schemas (Zod)"]
        rules["rules/<br/>scoring, serve, Elo"]
    end

    matches & live & ranking --> rules
    auth & matches & live & ranking & admin --> schemas
```

## Development setup
Status: **implemented**. How the pieces run on the development PC.

```mermaid
flowchart LR
    subgraph pc["Development PC"]
        expo["Expo dev server<br/>:8081"]
        fastify["Fastify (tsx watch)<br/>:3000"]
        vitest["Vitest"]
        pglite[("PGlite<br/>in memory")]
        vitest --> pglite
    end
    browser["Browser on the PC"] -- "app" --> expo
    browser -- "API at localhost:3000" --> fastify
    phone["Phone with Expo Go<br/>same Wi-Fi"] -- "app" --> expo
    phone -- "API at PC LAN IP:3000" --> fastify
```

- The client calls `EXPO_PUBLIC_API_URL` from `apps/client/.env`; the server accepts the origins in `CORS_ORIGIN` from
  `apps/server/.env`.
- The PC's LAN IP changes with the network, so both files must be updated after a network change.
- There is no PostgreSQL on the PC: tests apply the real migrations to PGlite.

## Deployment
Status: **planned** (Phase 1 and Phase 6). The public tunnel is still to be chosen: Tailscale Funnel is recommended, a Cloudflare
Tunnel is the alternative.

```mermaid
flowchart LR
    subgraph users["Users"]
        android["Android app (APK)"]
        web["Browser, iPhone, kiosk"]
    end

    tunnel["Public HTTPS tunnel<br/>Tailscale Funnel or Cloudflare"]

    subgraph home["Home network"]
        subgraph rpi["Raspberry Pi 4 B, 64-bit OS"]
            tailscaled["Tailscale<br/>SSH for admin"]
            subgraph compose["Docker Compose, internal network"]
                caddy["Caddy<br/>web build + reverse proxy"]
                backend["Fastify<br/>REST + WebSocket"]
                postgres[("PostgreSQL")]
            end
            ssd[("SSD volume")]
        end
    end

    admin["Admin PC"]
    registry["Image registry<br/>ARM64 images"]
    build["GitHub Actions or<br/>docker buildx"]
    backup[("Encrypted backups<br/>off-site")]
    monitor["Uptime monitor"]

    android & web --> tunnel --> caddy
    caddy --> backend --> postgres --> ssd
    admin -- "Tailscale" --> tailscaled
    build --> registry -- "docker compose pull" --> compose
    postgres -- "pg_dump" --> backup
    monitor -- "GET /health" --> tunnel
```

- No container publishes ports to the home network; the tunnel opens outbound.
- Tailscale runs on the host, outside Docker, so remote access survives a failure of the containers.
- Every user must be logged in, kiosk screens included.
