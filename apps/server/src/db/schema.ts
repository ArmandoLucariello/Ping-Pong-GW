import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

export const languageEnum = pgEnum('language', ['en', 'it']);
export const leagueRoleEnum = pgEnum('league_role', ['player', 'admin']);
export const matchTypeEnum = pgEnum('match_type', ['singles', 'doubles']);
export const matchStatusEnum = pgEnum('match_status', [
  'scheduled',
  'live',
  'awaiting_confirmation',
  'disputed',
  'completed',
  'cancelled',
]);
export const matchEventTypeEnum = pgEnum('match_event_type', ['point', 'undo']);

// Accounts are anonymized rather than deleted, so match history and Elo stay consistent.
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique(),
  displayName: text('display_name').notNull(),
  passwordHash: text('password_hash'),
  isSuperuser: boolean('is_superuser').notNull().default(false),
  language: languageEnum('language').notNull().default('en'),
  anonymizedAt: timestamp('anonymized_at', { withTimezone: true }),
  createdAt: createdAt(),
});

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tokenHash: text('token_hash').notNull().unique(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (table) => [index('sessions_user_id_idx').on(table.userId)],
);

export const leagues = pgTable(
  'leagues',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    pointsToWin: integer('points_to_win').notNull().default(11),
    bestOf: integer('best_of').notNull().default(1),
    createdAt: createdAt(),
  },
  (table) => [
    check('leagues_points_to_win_check', sql`${table.pointsToWin} in (11, 21)`),
    check('leagues_best_of_check', sql`${table.bestOf} in (1, 3, 5)`),
  ],
);

export const invites = pgTable('invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenHash: text('token_hash').notNull().unique(),
  leagueId: uuid('league_id')
    .notNull()
    .references(() => leagues.id),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedBy: uuid('used_by').references(() => users.id),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: createdAt(),
});

export const leagueMembers = pgTable(
  'league_members',
  {
    leagueId: uuid('league_id')
      .notNull()
      .references(() => leagues.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    role: leagueRoleEnum('role').notNull().default('player'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.leagueId, table.userId] })],
);

export const seasons = pgTable(
  'seasons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leagueId: uuid('league_id')
      .notNull()
      .references(() => leagues.id),
    name: text('name').notNull(),
    startsOn: date('starts_on').notNull(),
    endsOn: date('ends_on').notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    unique('seasons_league_id_starts_on_unique').on(table.leagueId, table.startsOn),
    check('seasons_dates_check', sql`${table.endsOn} >= ${table.startsOn}`),
  ],
);

export const playDays = pgTable(
  'play_days',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leagueId: uuid('league_id')
      .notNull()
      .references(() => leagues.id),
    playedOn: date('played_on').notNull(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: createdAt(),
  },
  (table) => [unique('play_days_league_id_played_on_unique').on(table.leagueId, table.playedOn)],
);

export const matches = pgTable(
  'matches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leagueId: uuid('league_id')
      .notNull()
      .references(() => leagues.id),
    seasonId: uuid('season_id')
      .notNull()
      .references(() => seasons.id),
    playDayId: uuid('play_day_id').references(() => playDays.id),
    type: matchTypeEnum('type').notNull(),
    status: matchStatusEnum('status').notNull().default('scheduled'),
    pointsToWin: integer('points_to_win').notNull(),
    bestOf: integer('best_of').notNull(),
    // Null means the match is self-scored by one of the players.
    refereeId: uuid('referee_id').references(() => users.id),
    firstServerSide: integer('first_server_side'),
    winnerSide: integer('winner_side'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    confirmedBy: uuid('confirmed_by').references(() => users.id),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [
    index('matches_season_id_idx').on(table.seasonId),
    index('matches_status_idx').on(table.status),
    check('matches_points_to_win_check', sql`${table.pointsToWin} in (11, 21)`),
    check('matches_best_of_check', sql`${table.bestOf} in (1, 3, 5)`),
    check('matches_first_server_side_check', sql`${table.firstServerSide} in (1, 2)`),
    check('matches_winner_side_check', sql`${table.winnerSide} in (1, 2)`),
    check(
      'matches_completed_has_winner_check',
      sql`${table.status} <> 'completed' or ${table.winnerSide} is not null`,
    ),
  ],
);

// Teams exist only within a match, so a side and a position replace a teams table.
export const matchPlayers = pgTable(
  'match_players',
  {
    matchId: uuid('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    side: integer('side').notNull(),
    position: integer('position').notNull().default(1),
  },
  (table) => [
    primaryKey({ columns: [table.matchId, table.userId] }),
    unique('match_players_match_side_position_unique').on(table.matchId, table.side, table.position),
    index('match_players_user_id_idx').on(table.userId),
    check('match_players_side_check', sql`${table.side} in (1, 2)`),
    check('match_players_position_check', sql`${table.position} in (1, 2)`),
  ],
);

// Holds the score of every game, including matches entered only as a final result.
export const matchGames = pgTable(
  'match_games',
  {
    matchId: uuid('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    gameNumber: integer('game_number').notNull(),
    side1Score: integer('side1_score').notNull(),
    side2Score: integer('side2_score').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.matchId, table.gameNumber] }),
    check('match_games_game_number_check', sql`${table.gameNumber} >= 1`),
    check('match_games_scores_check', sql`${table.side1Score} >= 0 and ${table.side2Score} >= 0`),
  ],
);

// Append-only: an undo is recorded as a new event.
export const matchEvents = pgTable(
  'match_events',
  {
    matchId: uuid('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    sequence: integer('sequence').notNull(),
    type: matchEventTypeEnum('type').notNull(),
    side: integer('side'),
    actorId: uuid('actor_id')
      .notNull()
      .references(() => users.id),
    createdAt: createdAt(),
  },
  (table) => [
    primaryKey({ columns: [table.matchId, table.sequence] }),
    check(
      'match_events_side_check',
      sql`(${table.type} = 'point' and ${table.side} is not null and ${table.side} in (1, 2)) or (${table.type} = 'undo' and ${table.side} is null)`,
    ),
  ],
);

// One row per season: a new season starts from new rows and past standings stay archived.
export const seasonRatings = pgTable(
  'season_ratings',
  {
    seasonId: uuid('season_id')
      .notNull()
      .references(() => seasons.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    matchType: matchTypeEnum('match_type').notNull(),
    rating: integer('rating').notNull().default(1000),
    matchesPlayed: integer('matches_played').notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.seasonId, table.userId, table.matchType] })],
);

export const ratingChanges = pgTable(
  'rating_changes',
  {
    matchId: uuid('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    ratingBefore: integer('rating_before').notNull(),
    ratingAfter: integer('rating_after').notNull(),
  },
  (table) => [primaryKey({ columns: [table.matchId, table.userId] })],
);

export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorId: uuid('actor_id').references(() => users.id),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    before: jsonb('before'),
    after: jsonb('after'),
    createdAt: createdAt(),
  },
  (table) => [index('audit_log_entity_idx').on(table.entityType, table.entityId)],
);
