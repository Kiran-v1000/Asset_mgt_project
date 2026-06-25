import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { httpLogger } from './middlewares/loggerMiddleware.js';
import { errorHandler, notFoundHandler } from './middlewares/errorMiddleware.js';
import apiRouter from './routes/index.js';

export const createApp = () => {
  const app = express();

  // Security headers + behind-proxy support (rate-limit needs the real IP).
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.clientUrl.split(',').map((s) => s.trim()),
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(httpLogger);

  // Throttle the auth surface specifically; general API gets a looser limit.
  app.use(
    `${env.apiPrefix}/auth`,
    rateLimit({ windowMs: env.rateLimit.windowMs, max: 40, standardHeaders: true, legacyHeaders: false }),
  );
  app.use(
    env.apiPrefix,
    rateLimit({ windowMs: env.rateLimit.windowMs, max: env.rateLimit.max, standardHeaders: true, legacyHeaders: false }),
  );

  // Health check (no auth) — used by Docker/K8s probes.
  app.get('/health', (_req, res) =>
    res.json({ status: 'ok', service: 'eams-api', time: new Date().toISOString() }),
  );

  app.use(env.apiPrefix, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
