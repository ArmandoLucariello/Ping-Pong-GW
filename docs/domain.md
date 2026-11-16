# Domain model

The rules come from [project-scope.md](../project-scope.md). The database side is in [database.md](database.md).

## Shared types today
Status: **implemented**. TypeScript has no classes in this project yet; these are the main types, shown as classes.

```mermaid
classDiagram
    direction LR
    class HealthResponse {
        <<type>>
        +ok status
    }
    class ServerStatus {
        <<enumeration>>
        checking
        online
        offline
    }
    class Language {
        <<enumeration>>
        en
        it
    }
    class Translation {
        <<type>>
        +home.server.checking
        +home.server.online
        +home.server.offline
        +language.label
        +language.en
        +language.it
    }
    note for HealthResponse "packages/shared/src/health.ts, inferred from a Zod schema"
    note for ServerStatus "apps/client/src/app/index.tsx"
    note for Translation "apps/client/src/i18n/en.ts, it.ts must match it"
```

## Game rules
Status: **planned** for Phase 2, in `packages/shared/src/rules` so client and server use the same code. The rules are pure
functions, shown as modules; state objects are immutable and each function returns a new one.

```mermaid
classDiagram
    direction LR
    class Side {
        <<enumeration>>
        1
        2
    }
    class MatchFormat {
        <<type>>
        +number pointsToWin
        +number bestOf
    }
    class GameScore {
        <<type>>
        +number side1
        +number side2
    }
    class MatchEvent {
        <<type>>
        +number sequence
        +point or undo type
        +Side side
    }
    class MatchState {
        <<type>>
        +MatchFormat format
        +Side firstServer
        +GameScore[] games
        +GameScore current
        +Side winner
    }
    class scoring {
        <<module>>
        +initialState(format, firstServer) MatchState
        +applyPoint(state, side) MatchState
        +replay(format, firstServer, events) MatchState
        +gameWinner(score, pointsToWin) Side
        +matchWinner(state) Side
        +currentServer(state) Side
    }
    class elo {
        <<module>>
        +INITIAL_RATING 1000
        +K_FACTOR 32
        +expectedScore(rating, opponentRating) number
        +ratingChange(rating, opponentRating, won) number
        +teamRating(ratings) number
    }
    MatchState *-- MatchFormat
    MatchState *-- "1..*" GameScore
    scoring ..> MatchState : creates
    scoring ..> MatchEvent : replays
    note for MatchState "winner is empty until the match is won"
    note for elo "doubles: team rating is the average of the two players"
```

| Rule | Detail |
|---|---|
| Game win | First side to `pointsToWin` with a lead of at least 2 points |
| Match win | First side to win more than half of `bestOf` games |
| Serve | Changes every 2 points; at deuce (both sides at `pointsToWin - 1` or more) it changes every point |
| Undo | An undo cancels the latest point not already cancelled; `replay` rebuilds the state from all events |
| Elo | Start at 1000, K = 32, reset each season; both doubles players get the team's change |

Open points for Phase 2:
- Serve rotation in 21-point games (the scope only fixes it for 11-point games; the traditional rule is every 5 points).
- Who serves first in later games, and the serve order between the four players in doubles.

## Match lifecycle
Status: the statuses are **implemented** in the `match_status` enum; the transitions are **planned** for Phases 3 and 4.

```mermaid
stateDiagram-v2
    [*] --> scheduled : match created
    scheduled --> live : scorer starts the match
    scheduled --> awaiting_confirmation : player enters the final result
    scheduled --> cancelled : creator or admin cancels
    live --> completed : referee ends the match
    live --> awaiting_confirmation : self-scored match ends
    live --> cancelled : admin cancels
    awaiting_confirmation --> completed : opponent confirms
    awaiting_confirmation --> disputed : opponent rejects
    disputed --> completed : league admin resolves
    disputed --> cancelled : league admin voids the match
    completed --> [*]
    cancelled --> [*]
    note right of completed : Elo is updated on entering this state
```

- A result entered by a referee is final; a result entered by a player needs the opponent's confirmation.
- A completed match must have `winner_side` (enforced by `matches_completed_has_winner_check`).
- Who can cancel a match, and when, is to be confirmed in Phase 3.
