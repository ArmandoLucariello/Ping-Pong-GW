# Ping Pong GW

## 1. Goal and context
A web application and a native Android app to manage ping pong matches, organize tournaments and track player rankings
among colleagues. iPhone users use the web application.

- The web and app are reachable from the **public internet**.
- Services and database run on a **Raspberry Pi 4 Model B (4 GB)** on a home network, published through a free tunnel service.
- Deployment is done with **Docker** (docker-compose).

## 2. Users and roles
| Role | Description | Main permissions |
|---|---|---|
| **Player** | Any registered user | Manage own profile, create quick matches, join tournaments, challenge players, confirm results |
| **Referee** | Any free user who takes the role for a specific live match (not a permanent role; a player cannot referee a match they play in, but can referee other matches of a tournament they take part in) | Start the match, score points, undo points, track serve, end the match; results entered by a referee are confirmed automatically |
| **League / Tournament admin** | Organizes the league and its tournaments | Create tournaments and days of play, set match formats, generate brackets, fix results within their league |
| **Superuser** | Technical administrator | Full data access, audit log, data correction, export, backup/restore, bug fixing |

## 3. Domain rules

### League
- A league is a group of people who can play matches and tournaments together.
- MVP: a single, fixed league. The data model supports multiple leagues for the future.

### Match format
- Points per game: configurable (default **11**, optionally 21).
- A game must be won by **2 points** (deuce/advantages).
- Best of **1 / 3 / 5** games (default **best of 1**), configurable per league, tournament or match.
- Serve changes every 2 points (every 11-point game) and every point at deuce.
- Match types: **singles** and **doubles** (team of 2 players).

### Live match and scoring
- The referee is **optional** for every match, tournament matches included.
- Any free user can take the referee role when the match starts, or take over from the current referee during the match.
- A live match can be scored in two ways:
  1. **With a referee**: the referee scores every point from their device; the result is final when the referee ends the match.
  2. **Self-scored**: one of the players scores; the opponent must **confirm** the final result.
- Live score is visible in real time to **registered, logged-in users** only (web, app, kiosk screen).
- The scorer (referee or player) can **undo** the last point.
- Disputed results are flagged and resolved by a league admin.

### Teams
- A team is 2 players playing doubles.
- Teams are **created per match**: there are no permanent teams and no team ranking.

### Day of play
- A dated session that groups the matches played on that day (casual or tournament).

### Ranking
- **Elo** rating, with separate rankings for singles and doubles.
- In doubles, ratings are kept per player, since teams only exist for a single match.
- Rankings are organized in **3-month seasons** following calendar quarters and created automatically, with archived past seasons.
  Elo ratings **reset at the start of each season**.
- Both casual and tournament matches count toward Elo, once the match is completed.

### Tournaments
- Supported formats: knockout, round-robin, groups + knockout.
- Automatic bracket generation with seeding by ranking; handling of byes and withdrawals.

## 4. Features

### MVP
- User registration and profile
- Single fixed league
- Quick match (singles / doubles), counted in the ranking
- Live scoring with serve indicator and undo
- **Referee role** for a live match (taken by any free user)
- Result confirmation by the opponent (when no referee)
- Elo ranking and leaderboard
- Seasons with Elo reset and archived standings
- Match history and basic player stats (wins/losses, streak, points for/against)
- Tournament creation with automatic bracket
- Day of play
- Superuser: data correction and audit log

### Future
- Multiple leagues
- Hall of fame
- Head-to-head comparison
- Challenges between players
- Achievements and badges
- Matchmaking (opponents with similar Elo)
- Table queue / booking
- QR code on the table to start a match quickly
- Kiosk / scoreboard mode (tablet or TV next to the table)
- Notifications via Teams/Slack
- CSV/JSON export for analysis
- Backup/restore and health page in the admin panel

## 5. Non-functional requirements
- **Real-time**: live scores pushed via WebSocket or SSE.
- **Devices**: mobile first, also desktop and tablet (kiosk).
- **Privacy / GDPR**: store only the employee data needed; define retention; users can delete their account, which anonymizes it while keeping match results.
- **Security**: the service is exposed on the internet, so authentication, closed or invite-only registration, rate limiting
  and server hardening are required. No real data goes online before authentication is in place.
- **Availability**: automatic restart after power loss; the database must survive unclean shutdowns. The Raspberry Pi is
  physically accessible only at home, so it should recover on its own and be managed remotely in normal operation.
- **Sizing**: about **10 users**.
- **Language**: English by default, Italian also available.

## 6. Architecture and tech stack
- Web frontend: browser web app (desktop, tablet, kiosk, iPhone).
- Mobile: **cross-platform native app** for Android, sharing the same backend API as the web app. No native iOS app.
- Backend: lightweight REST API + WebSocket/SSE for live scoring.
- Authentication: local accounts (email and password), backend-managed sessions, invite links created by the admin.
- The proposed stack is in [tech-stack.md](tech-stack.md); the delivery plan is in [plan.md](plan.md).

## 7. Deployment and operations
- Docker images built for **ARM64** off the Raspberry Pi and pulled from a registry.
- docker-compose with restart policies.
- **Remote administration** over the internet, independent of the application containers.
- Database on SSD/USB storage, not the SD card.
- Scheduled encrypted database **backups** stored off the Raspberry Pi, with a tested restore procedure.
- Public HTTPS address through a tunnel, with no port forwarding on the home router. It must be free of charge.
- Centralized logs and a health check endpoint.
- Android app distributed as a signed APK, outside public stores.

## 8. Open questions
- Public address: which free solution to use, to be decided during development (see [tech-stack.md](tech-stack.md)).
