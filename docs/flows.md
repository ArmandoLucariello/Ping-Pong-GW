# Flows

Sequence diagrams of the main interactions. Each is marked **implemented** or **planned**. In planned flows the endpoint paths are
proposals, to be fixed when the feature is built.

## Server health check
Status: **implemented** in [index.tsx](../apps/client/src/app/index.tsx), [api.ts](../apps/client/src/lib/api.ts) and
[app.ts](../apps/server/src/app.ts).

```mermaid
sequenceDiagram
    participant S as HomeScreen
    participant A as lib/api.ts
    participant F as Fastify
    S->>S: status = checking
    S->>A: fetchHealth()
    A->>F: GET /health
    Note over A,F: on the web the browser also checks CORS_ORIGIN
    alt server reachable
        F-->>A: 200 with status ok
        A->>A: healthResponseSchema.parse()
        A-->>S: HealthResponse
        S->>S: status = online
    else unreachable or unexpected answer
        A-->>S: error
        S->>S: status = offline
    end
```

## Invite and registration
Status: **planned** for Phase 2. Registration is possible only through an invite.

```mermaid
sequenceDiagram
    actor Admin as League admin
    participant C as Client
    participant API as Server
    participant DB as PostgreSQL
    actor U as New user
    Admin->>C: create invite
    C->>API: POST /invites
    API->>API: generate a random token
    API->>DB: insert invites with token_hash and expires_at
    API-->>C: invite link containing the token
    Admin-->>U: shares the link
    U->>C: opens the link, enters name, email and password
    C->>API: POST /auth/register
    API->>DB: find the invite by token hash
    alt invite exists, unused and not expired
        API->>DB: in one transaction insert users and league_members, mark the invite used, insert sessions
        API-->>C: session token
    else invite not valid
        API-->>C: 400 invite not valid
    end
```

## Login
Status: **planned** for Phase 2. How the session token travels (cookie on the web, header in the app) is decided with this feature.

```mermaid
sequenceDiagram
    actor U as User
    participant C as Client
    participant API as Server
    participant DB as PostgreSQL
    U->>C: email and password
    C->>API: POST /auth/login
    Note over API: rate limited
    API->>DB: find the user by email
    API->>API: verify the password hash
    alt credentials valid
        API->>DB: insert sessions with token_hash and expires_at
        API-->>C: session token
    else wrong email or password
        API-->>C: 401 with the same message in both cases
    end
    C->>API: later requests carry the session token
    API->>DB: find the session by token hash, check expires_at
```

## Live match with a referee
Status: **planned** for Phase 4.

```mermaid
sequenceDiagram
    actor R as Referee
    participant RC as Referee client
    participant API as Server
    participant DB as PostgreSQL
    participant V as Viewers over WebSocket
    V->>API: subscribe to the match, logged in only
    R->>RC: take the referee role and start
    RC->>API: POST /matches/{id}/start
    API->>DB: set referee_id, status live, started_at
    API-->>V: match state
    loop every point
        R->>RC: tap the side that scored
        RC->>API: POST /matches/{id}/events with a point and its side
        API->>API: check that the caller is the referee
        API->>DB: insert match_events with the next sequence
        API->>API: replay the events into the score
        API-->>RC: new state, server and score
        API-->>V: new state
    end
    opt the referee makes a mistake
        RC->>API: POST /matches/{id}/events with an undo
        API->>DB: insert an undo event
        API-->>V: corrected state
    end
    opt another user takes over
        RC->>API: POST /matches/{id}/referee
        API->>DB: update referee_id
    end
    RC->>API: POST /matches/{id}/finish
    API->>DB: save match_games and winner_side, status completed, update ratings
    API-->>V: final result
```

- `match_events` has the primary key `(match_id, sequence)`: if two devices send a point at the same moment, one insert fails and
  that client reloads the state.
- After a connection drop, clients reconnect and reload the full state before applying new updates.

## Self-scored match and confirmation
Status: **planned** for Phases 3 and 4. The same confirmation applies to a final result entered without live scoring.

```mermaid
sequenceDiagram
    actor P as Scoring player
    actor O as Opponent
    actor A as League admin
    participant API as Server
    participant DB as PostgreSQL
    P->>API: score the points, then finish the match
    API->>DB: status awaiting_confirmation
    API-->>O: result to confirm
    alt opponent confirms
        O->>API: POST /matches/{id}/confirm
        API->>DB: confirmed_by, confirmed_at, status completed, update ratings
    else opponent rejects
        O->>API: POST /matches/{id}/dispute
        API->>DB: status disputed
        API-->>A: dispute to resolve
        A->>API: fix the result or void the match
        API->>DB: status completed or cancelled, write audit_log
    end
```

## Rating update
Status: **planned** for Phase 3. Runs inside the transaction that marks a match completed.

```mermaid
sequenceDiagram
    participant API as Server
    participant E as shared Elo rules
    participant DB as PostgreSQL
    API->>DB: begin transaction
    API->>DB: read season_ratings of every player for the match season and type
    Note over API,DB: a missing row starts at 1000
    API->>E: team ratings and change per player
    E-->>API: new ratings
    API->>DB: update season_ratings, matches_played plus 1
    API->>DB: insert rating_changes with the rating before and after
    API->>DB: set the match completed
    API->>DB: commit
```

- The season of a match is the calendar quarter it is played in. The season row is created automatically when the first match of
  the quarter needs it.

## Deployment
Status: **planned** for Phase 1.

```mermaid
sequenceDiagram
    actor Dev as Developer
    participant B as Build machine
    participant Reg as Image registry
    participant Pi as Raspberry Pi
    Dev->>B: push to GitHub or run docker buildx
    B->>B: build ARM64 images
    B->>Reg: push images
    Dev->>Pi: SSH over Tailscale
    Pi->>Reg: docker compose pull
    Pi->>Pi: docker compose up -d
    Pi->>Pi: run database migrations
    Dev->>Pi: check GET /health
```
