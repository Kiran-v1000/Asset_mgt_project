import morgan from 'morgan';
import { env } from '../config/env.js';

/** HTTP request logging — concise in prod, verbose in dev. */
export const httpLogger = morgan(env.isProd ? 'combined' : 'dev');
