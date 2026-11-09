# Ping Pong GW - Plan (draft)

Status: **draft**, aligned with [tech-stack.md](tech-stack.md); only the public address is still open. Scope is in [project-scope.md](project-scope.md).

## Phase 0 - Decisions and checks
- [x] Confirm the tech stack
- [x] Decide authentication: local accounts, backend sessions, invite links
- [x] Choose hosting: Raspberry Pi 4 B (4 GB) at home
- [x] Choose the Android build method: EAS Build
- [x] Decide the default match format (11 points, best of 1) and Elo reset (each season)
- [x] Decide the season length: 3 months
- [x] Verify the Raspberry Pi access and 64-bit OS
- [x] Check that an SSD is connected
- [x] Confirm the remote administration tool: Tailscale

## Phase 1 - Foundations
- [ ] Monorepo with client, server and shared packages
- [ ] Install Tailscale on site, configure SSH with keys and test access after a reboot from outside the home network, before any other change
- [ ] Raspberry Pi setup: Docker, storage for the database, hardware watchdog
- [ ] ARM64 image build and registry, deployment by remote pull
- [ ] External uptime monitoring with alerts
- [ ] Docker Compose on ARM64 with Caddy, backend and PostgreSQL
- [ ] Raspberry Pi hardening: SSH keys, firewall, automatic updates, no ports published
- [ ] First deployment of an empty app to the Raspberry Pi, reachable over Tailscale
- [ ] Android test build on a real device; web app checked on an iPhone
- [ ] Database schema and migrations
- [ ] English/Italian translation setup

## Phase 2 - Users and rules
- [ ] Authentication: local accounts, backend sessions, invite links
- [ ] Rate limiting and security headers
- [ ] Profiles and roles
- [ ] Single fixed league
- [ ] Shared rules with tests: game and match win, deuce, serve rotation, Elo

## Phase 3 - Matches and ranking
- [ ] Quick match, singles and doubles, with per-match teams
- [ ] Final result entry and opponent confirmation
- [ ] Elo update and leaderboard
- [ ] Seasons: Elo reset and archived standings
- [ ] Match history and player stats
- [ ] Day of play

## Phase 4 - Live scoring and referee
- [ ] Point events, undo and serve indicator
- [ ] WebSocket updates for logged-in users, with reconnection
- [ ] Referee role: take the role at start, take over during the match
- [ ] Self-scored matches with opponent confirmation
- [ ] Disputed results handled by the league admin

## Phase 5 - Tournaments
- [ ] Tournament creation and registration
- [ ] Formats: knockout, round-robin, groups + knockout
- [ ] Automatic bracket with ranking seeds, byes and withdrawals
- [ ] Tournament matches linked to live scoring

## Phase 6 - Administration and release
- [ ] Superuser data correction and audit log
- [ ] Scheduled encrypted off-site backups and a tested restore
- [ ] Choose the free public address (Tailscale Funnel recommended) and test live scoring through it
- [ ] Security review before opening to users
- [ ] Logs and health check
- [ ] GDPR: retention and account deletion
- [ ] Android APK distribution and web app access for iPhone users
- [ ] Trial period and fixes

## After the MVP
See the "Future" list in [project-scope.md](project-scope.md).
