import type { Server } from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';

const app = createApp();

const server: Server = app.listen(env.port, () => {
  console.log(`\n  People Management API`);
  console.log(`  → http://localhost:${env.port}/api`);
  console.log(`  → health: http://localhost:${env.port}/api/health\n`);
});

let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${signal} received, shutting down gracefully...`);

  // Force-exit if connections don't drain in time.
  const force = setTimeout(() => {
    console.error('Forcing shutdown after 15s.');
    process.exit(1);
  }, 15_000);
  force.unref();

  server.close(async () => {
    try {
      await prisma.$disconnect();
    } finally {
      clearTimeout(force);
      process.exit(0);
    }
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
