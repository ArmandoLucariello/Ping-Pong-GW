import { buildApp } from './app';

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';

const app = buildApp({ logger: true, corsOrigin: process.env.CORS_ORIGIN });

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void app.close().then(() => process.exit(0));
  });
}

await app.listen({ port, host });
