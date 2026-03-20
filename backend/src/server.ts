import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import { env } from './config/env';
import './db/database';
import authRoutes from './routes/auth';
import bookingRoutes from './routes/bookings';
import contactRoutes from './routes/contact';
import foodRoutes from './routes/food';
import paymentRoutes from './routes/payments';
import reviewRoutes from './routes/reviews';
import roomRoutes from './routes/rooms';
import spaRoutes from './routes/spa';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { logger } from './utils/logger';

const app = express();
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 400,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again in a few minutes.'
  }
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
  origin: env.corsOrigin,
  credentials: false
}));
app.use(compression());
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

const adminEntry = path.join(env.frontendRoot, 'admin', 'index.html');
const loginEntry = path.join(env.frontendRoot, 'login', 'index.html');

app.get(['/admin', '/admin/', '/admin/login', '/admin/dashboard'], (_req, res) => {
  res.sendFile(adminEntry);
});

app.get(['/login', '/login/', '/login/register'], (_req, res) => {
  res.sendFile(loginEntry);
});

app.use(express.static(env.frontendRoot));

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    message: 'GrandStay Hotel backend is running',
    timestamp: new Date().toISOString(),
    version: env.apiVersion,
    environment: env.nodeEnv,
    database: path.relative(env.projectRoot, env.databaseFile).replace(/\\/g, '/')
  });
});

app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/spa', spaRoutes);
app.use('/api/food', foodRoutes);

app.get('/', (_req, res) => {
  res.sendFile(path.join(env.frontendRoot, 'index.html'));
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || path.extname(req.path)) {
    next();
    return;
  }

  res.sendFile(path.join(env.frontendRoot, 'index.html'));
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  logger.info(`GrandStay API running on http://localhost:${env.port}`);
  logger.info(`Serving frontend from ${env.frontendRoot}`);
  logger.info(`SQLite database: ${env.databaseFile}`);
});
