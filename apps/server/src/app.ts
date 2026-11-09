import cors from '@fastify/cors';
import Fastify, { type FastifyServerOptions } from 'fastify';
import type { HealthResponse } from '@ping-pong-gw/shared';

type AppOptions = FastifyServerOptions & {
  corsOrigin?: string;
};

export function buildApp({ corsOrigin, ...fastifyOptions }: AppOptions = {}) {
  const app = Fastify(fastifyOptions);

  if (corsOrigin) {
    app.register(cors, { origin: corsOrigin.split(',') });
  }

  app.get('/health', async (): Promise<HealthResponse> => ({ status: 'ok' }));

  return app;
}
