import path from 'node:path';
import 'dotenv/config';

const backendRoot = path.resolve(__dirname, '..', '..');
const projectRoot = path.resolve(backendRoot, '..');
const isProduction = (process.env.NODE_ENV || 'development') === 'production';

function resolvePath(value: string | undefined, fallback: string): string {
  if (!value) {
    return fallback;
  }

  return path.isAbsolute(value) ? value : path.resolve(projectRoot, value);
}

function toNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const env = {
  appName: process.env.APP_NAME || 'GrandStay Hotel API',
  apiVersion: process.env.API_VERSION || '3.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toNumber(process.env.PORT, 5001),
  jwtSecret: process.env.JWT_SECRET || 'grandstay_secret_key_change_in_production_12345',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5001',
  databaseFile: resolvePath(
    process.env.SQLITE_DATABASE_PATH,
    path.resolve(backendRoot, 'storage', 'grandstay.sqlite')
  ),
  logsDirectory: path.resolve(backendRoot, 'logs'),
  backendRoot,
  projectRoot,
  frontendRoot: path.resolve(projectRoot, 'frontend'),
  adminName: process.env.ADMIN_NAME || 'GrandStay Admin',
  adminEmail: process.env.ADMIN_EMAIL?.trim() || (isProduction ? '' : 'admin@grandstayhotel.com'),
  adminPassword: process.env.ADMIN_PASSWORD?.trim() || (isProduction ? '' : 'Admin@12345')
} as const;
