import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { env } from './config/env';
import { prisma } from './lib/prisma';
import { securityHeaders } from './middleware/securityHeaders';
import { notFound, errorHandler } from './middleware/error';
import authRoutes from './modules/auth.routes';
import employeeRoutes from './modules/employees.routes';
import promotionRoutes from './modules/promotions.routes';
import salaryRoutes from './modules/salary.routes';
import reviewRoutes from './modules/reviews.routes';
import growthRoutes from './modules/growth.routes';
import learningRoutes from './modules/learning.routes';
import metricsRoutes from './modules/metrics.routes';
import historyRoutes from './modules/history.routes';
import dashboardRoutes from './modules/dashboard.routes';
import departmentRoutes from './modules/departments.routes';

export function createApp() {
  // Fail fast on a misconfigured production deployment.
  if (env.isProd) {
    if (!process.env.CLIENT_ORIGIN) {
      throw new Error('CLIENT_ORIGIN must be set in production (the web app origin).');
    }
    try {
      new URL(env.clientOrigin);
    } catch {
      throw new Error(`CLIENT_ORIGIN is not a valid URL: ${env.clientOrigin}`);
    }
  }

  const app = express();
  app.set('trust proxy', 1); // correct req.ip behind a reverse proxy
  app.disable('x-powered-by');

  app.use(securityHeaders);
  app.use(compression()); // gzip API responses (3–10× smaller payloads)
  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json({ limit: '4mb' }));

  // Health check verifies DB connectivity so orchestrators get the truth.
  app.get('/api/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', db: 'ok', time: new Date().toISOString() });
    } catch {
      res.status(503).json({ status: 'error', db: 'down' });
    }
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/employees', employeeRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/departments', departmentRoutes);

  // Employee sub-resource routers declare their own full paths
  // (e.g. /employees/:employeeId/promotions and /promotions/:id).
  app.use('/api', promotionRoutes);
  app.use('/api', salaryRoutes);
  app.use('/api', reviewRoutes);
  app.use('/api', growthRoutes);
  app.use('/api', learningRoutes);
  app.use('/api', metricsRoutes);
  app.use('/api', historyRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
