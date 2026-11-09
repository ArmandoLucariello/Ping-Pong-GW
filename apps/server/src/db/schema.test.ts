import { fileURLToPath } from 'node:url';

import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { leagues, matchEvents, matches, matchPlayers, seasonRatings, seasons, users } from './schema';

const client = new PGlite();
const db = drizzle({ client });

async function expectConstraint(query: PromiseLike<unknown>, constraint: string) {
  const error = await Promise.resolve(query).then(
    () => undefined,
    (e: { cause?: { constraint?: string } }) => e,
  );
  expect(error?.cause?.constraint).toBe(constraint);
}

describe('database schema', () => {
  let userId: string;
  let otherUserId: string;
  let leagueId: string;
  let seasonId: string;
  let matchId: string;

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: fileURLToPath(new URL('../../drizzle', import.meta.url)) });

    const [user, otherUser] = await db
      .insert(users)
      .values([
        { email: 'a@example.com', displayName: 'A' },
        { email: 'b@example.com', displayName: 'B' },
      ])
      .returning();
    userId = user!.id;
    otherUserId = otherUser!.id;

    const [league] = await db.insert(leagues).values({ name: 'Office' }).returning();
    leagueId = league!.id;

    const [season] = await db
      .insert(seasons)
      .values({ leagueId, name: 'Q1', startsOn: '2027-01-01', endsOn: '2027-03-31' })
      .returning();
    seasonId = season!.id;

    const [match] = await db
      .insert(matches)
      .values({ leagueId, seasonId, type: 'singles', pointsToWin: 11, bestOf: 1, createdBy: userId })
      .returning();
    matchId = match!.id;
  }, 60_000);

  afterAll(() => client.close());

  it('defaults a league to 11 points, best of 1', async () => {
    const [league] = await db.insert(leagues).values({ name: 'Defaults' }).returning();

    expect(league).toMatchObject({ pointsToWin: 11, bestOf: 1 });
  });

  it('starts a season rating from 1000', async () => {
    const [rating] = await db.insert(seasonRatings).values({ seasonId, userId, matchType: 'singles' }).returning();

    expect(rating?.rating).toBe(1000);
  });

  it('rejects an unsupported match format', async () => {
    await expectConstraint(
      db.insert(matches).values({ leagueId, seasonId, type: 'singles', pointsToWin: 15, bestOf: 1, createdBy: userId }),
      'matches_points_to_win_check',
    );
  });

  it('rejects a completed match without a winner', async () => {
    await expectConstraint(
      db
        .insert(matches)
        .values({ leagueId, seasonId, type: 'singles', status: 'completed', pointsToWin: 11, bestOf: 1, createdBy: userId }),
      'matches_completed_has_winner_check',
    );
  });

  it('rejects two players in the same side and position', async () => {
    await db.insert(matchPlayers).values({ matchId, userId, side: 1 });

    await expectConstraint(
      db.insert(matchPlayers).values({ matchId, userId: otherUserId, side: 1 }),
      'match_players_match_side_position_unique',
    );
  });

  it('requires a side on points and none on undos', async () => {
    await expectConstraint(
      db.insert(matchEvents).values({ matchId, sequence: 1, type: 'point', actorId: userId }),
      'match_events_side_check',
    );
    await expectConstraint(
      db.insert(matchEvents).values({ matchId, sequence: 1, type: 'undo', side: 1, actorId: userId }),
      'match_events_side_check',
    );
  });

  it('rejects a repeated event sequence', async () => {
    await db.insert(matchEvents).values({ matchId, sequence: 1, type: 'point', side: 1, actorId: userId });

    await expectConstraint(
      db.insert(matchEvents).values({ matchId, sequence: 1, type: 'undo', actorId: userId }),
      'match_events_match_id_sequence_pk',
    );
  });
});
