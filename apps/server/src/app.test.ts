import { healthResponseSchema } from '@ping-pong-gw/shared';
import { afterAll, describe, expect, it } from 'vitest';
import { buildApp } from './app';

describe('GET /health', () => {
  const app = buildApp();

  afterAll(() => app.close());

  it('reports the service as healthy', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(healthResponseSchema.parse(response.json())).toEqual({ status: 'ok' });
  });
});
